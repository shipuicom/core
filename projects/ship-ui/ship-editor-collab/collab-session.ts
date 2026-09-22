import { effect, EffectRef, inject, Injectable, Injector, Signal, signal } from '@angular/core';
import { generateUniqueId } from '@ship-ui/core';
import { CollabMessage, CollabPresence, CollabTransport } from './collab-protocol';

/**
 * The op algebra a session rebases with. `transform(op, against, side)`
 * rewrites `op` — authored without knowledge of the concurrent `against` —
 * so that it applies after it; `null` means the op has nothing left to do.
 * The property the session relies on is TP1: both orders converge. Ties are
 * broken by `side`, and the two peers of a pair always pick opposite sides.
 */
export interface CollabAlgebra<Op> {
  transform(op: Op, against: Op, side: 'left' | 'right'): Op | null;
}

/**
 * What a session needs from the thing being edited. The editor binds its
 * engine to this; a spreadsheet binds the composer. `version` bumps once
 * per local transaction and `lastTransaction()` describes it; when the
 * transaction does not account for a version jump (a multi-step edit, a
 * load), the optional `diff` of two snapshots stands in.
 */
export interface CollabDocument<Op, Doc, Sel> {
  readonly version: Signal<number>;
  readonly selection: Signal<Sel | null>;
  snapshot(): Doc;
  lastTransaction(): { baseVersion: number; op: Op } | null;
  diff?(before: Doc, after: Doc): Op | null;
  /** Apply an op from a peer: no history entry, no re-broadcast. */
  applyRemote(op: Op): void;
  /** Replace the whole document (a late joiner's snapshot). */
  load(doc: Doc): void;
}

export interface ShipCollabSessionOptions<Op, Doc, Sel> {
  transport: CollabTransport<Op, Doc, Sel>;
  /** Stable identity for this window/session; generated when omitted. */
  clientId?: string;
  /** Shown on this peer's remote cursor in other windows. */
  presence?: { name: string; color: string };
  /** Milliseconds between presence broadcasts (default 100). */
  presenceThrottleMs?: number;
}

const PEER_STALE_MS = 10_000;
const SENT_OP_CAP = 128;

/**
 * The op-agnostic collaboration session: sequence numbers, per-peer
 * high-water marks, the sent-op buffer and its rebase ladder, join /
 * snapshot / leave, presence. It knows nothing about what an op is — a
 * {@link CollabAlgebra} transforms them and a {@link CollabDocument} applies
 * them. `ShipEditorCollab` binds it to the editor engine with `EditorOp`;
 * `ShipSheetCollab` (in `@ship-ui/core/ship-spreadsheet`) binds it to the
 * spreadsheet composer with `SheetOp[]` transactions. Transports and the
 * wire protocol are shared; only the algebra and the document differ.
 *
 * Local transactions are broadcast; incoming ops are rebased over any local
 * ops the sender had not yet seen (exact for two peers; multi-peer setups
 * should relay through a server that assigns a total order) and applied via
 * `document.applyRemote`.
 */
@Injectable()
export abstract class ShipCollabSession<Op, Doc, Sel> {
  #injector = inject(Injector);

  readonly clientId = generateUniqueId();
  readonly peers = signal<ReadonlyMap<string, CollabPresence<Sel>>>(new Map());
  readonly connected = signal(false);

  #document: CollabDocument<Op, Doc, Sel> | null = null;
  #algebra: CollabAlgebra<Op> | null = null;
  #transport: CollabTransport<Op, Doc, Sel> | null = null;
  #unsubscribe: (() => void) | null = null;
  #effects: EffectRef[] = [];
  #presenceInfo = { name: 'Anonymous', color: '#888888' };
  #presenceThrottleMs = 100;
  #presenceTimer: ReturnType<typeof setTimeout> | null = null;
  #lastPresenceAt = 0;
  // Closing a window skips Angular's destroy hooks, so announce the leave on
  // pagehide as well. Bound once so detach() can remove it.
  #onPageHide = () => this.#send({ type: 'leave', clientId: this.clientId });

  // Send-side bookkeeping.
  #applyingRemote = false;
  #seq = 0;
  #sentOps: { seq: number; op: Op }[] = [];
  #seen: Record<string, number> = {};
  #lastVersion = -1;
  #lastDoc: Doc | null = null;

  /** Wire a document and its algebra into a session over `options.transport`. */
  attachDocument(document: CollabDocument<Op, Doc, Sel>, algebra: CollabAlgebra<Op>, options: ShipCollabSessionOptions<Op, Doc, Sel>): void {
    this.detach();
    this.#document = document;
    this.#algebra = algebra;
    this.#transport = options.transport;
    if (options.presence) this.#presenceInfo = options.presence;
    if (options.presenceThrottleMs !== undefined) this.#presenceThrottleMs = options.presenceThrottleMs;
    if (options.clientId) (this as { clientId: string }).clientId = options.clientId;

    this.connected.set(options.transport.connected());
    this.#lastVersion = document.version();
    this.#lastDoc = document.snapshot();

    this.#unsubscribe = options.transport.subscribe((message) => this.#receive(message));

    // Reactive wiring needs a live Angular environment (effect scheduling).
    // Headless usage — tests, custom drivers — calls flushLocal() instead.
    try {
      this.#effects.push(
        effect(
          () => {
            const version = document.version();
            this.#onVersionChange(version);
          },
          { injector: this.#injector }
        ),
        effect(
          () => {
            document.selection();
            this.#schedulePresence();
          },
          { injector: this.#injector }
        )
      );
    } catch {
      this.#effects = [];
    }

    if (typeof window !== 'undefined') window.addEventListener('pagehide', this.#onPageHide);

    this.#send({ type: 'join', clientId: this.clientId });
    this.#broadcastPresence();
  }

  detach(): void {
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', this.#onPageHide);
    if (this.#transport) this.#send({ type: 'leave', clientId: this.clientId });
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    for (const ref of this.#effects) ref.destroy();
    this.#effects = [];
    if (this.#presenceTimer) clearTimeout(this.#presenceTimer);
    this.#presenceTimer = null;
    this.#document = null;
    this.#algebra = null;
    this.#transport = null;
    this.#sentOps = [];
    this.#seen = {};
    this.connected.set(false);
    this.peers.set(new Map());
  }

  ngOnDestroy(): void {
    this.detach();
  }

  /**
   * Broadcast any unbroadcast local change now. Only needed when the service
   * runs without Angular's effect scheduler (tests, non-Angular drivers) —
   * inside an app the version effect calls this automatically.
   */
  flushLocal(): void {
    if (this.#document) this.#onVersionChange(this.#document.version());
  }

  // ── Send side ───────────────────────────────────────────────────────────

  #onVersionChange(version: number): void {
    const document = this.#document;
    if (!document || version === this.#lastVersion) return;

    const newDoc = document.snapshot();
    if (this.#applyingRemote) {
      // Remote applies bump the version too — track, never re-broadcast.
      this.#lastVersion = version;
      this.#lastDoc = newDoc;
      return;
    }

    const tx = document.lastTransaction();
    // Trust the transaction only when it accounts for the whole jump; a
    // multi-step edit surfaces just its last transaction, and a load records
    // none — diffing the snapshots covers both where the document can.
    const op: Op | null =
      version === this.#lastVersion + 1 && tx && tx.baseVersion === this.#lastVersion
        ? tx.op
        : this.#lastDoc !== null && document.diff
          ? document.diff(this.#lastDoc, newDoc)
          : null;

    this.#lastVersion = version;
    this.#lastDoc = newDoc;
    if (op === null) return;

    const seq = ++this.#seq;
    this.#sentOps.push({ seq, op });
    if (this.#sentOps.length > SENT_OP_CAP) this.#sentOps.splice(0, this.#sentOps.length - SENT_OP_CAP);

    this.#send({
      type: 'op',
      clientId: this.clientId,
      seq,
      seen: { ...this.#seen },
      op,
      presence: this.#presence(),
    });
    this.#lastPresenceAt = Date.now();
  }

  // ── Receive side ────────────────────────────────────────────────────────

  #receive(message: CollabMessage<Op, Doc, Sel>): void {
    const document = this.#document;
    if (!document) return;
    if ('clientId' in message && message.clientId === this.clientId) return;

    switch (message.type) {
      case 'op': {
        // A local edit may still be waiting for its (async, coalesced)
        // version effect. Broadcast it before applying the remote op —
        // otherwise the remote bookkeeping swallows it unsent and the
        // peers diverge.
        this.flushLocal();
        this.#seen[message.clientId] = Math.max(this.#seen[message.clientId] ?? 0, message.seq);
        this.#applyIncomingOp(message);
        if (message.presence) this.#trackPeer(message.presence);
        break;
      }
      case 'presence':
        this.#trackPeer(message.presence);
        break;
      case 'join': {
        this.flushLocal();
        // Any established peer answers; the joiner takes the first snapshot.
        this.#send({
          type: 'snapshot',
          toClientId: message.clientId,
          clientId: this.clientId,
          doc: document.snapshot(),
          seen: { ...this.#seen, [this.clientId]: this.#seq },
        });
        this.#broadcastPresence();
        break;
      }
      case 'snapshot': {
        this.flushLocal();
        if (message.toClientId !== this.clientId || this.#seq > 0 || this.#seen[message.clientId]) return;
        this.#applyingRemote = true;
        try {
          document.load(message.doc);
        } finally {
          this.#applyingRemote = false;
        }
        this.#lastVersion = document.version();
        this.#lastDoc = document.snapshot();
        this.#seen = { ...message.seen };
        delete this.#seen[this.clientId];
        break;
      }
      case 'leave': {
        const next = new Map(this.peers());
        next.delete(message.clientId);
        this.peers.set(next);
        break;
      }
    }
  }

  #applyIncomingOp(message: Extract<CollabMessage<Op, Doc, Sel>, { type: 'op' }>): void {
    const document = this.#document!;
    const algebra = this.#algebra!;
    const senderSawMine = message.seen[this.clientId] ?? 0;
    const missed = this.#sentOps.filter((sent) => sent.seq > senderSawMine);

    // Deterministic tie-break both peers agree on: the lexicographically
    // smaller clientId plays 'left' (mirrors the rebase fuzz's convention).
    const incomingSide = message.clientId < this.clientId ? 'left' : 'right';
    const localSide = incomingSide === 'left' ? 'right' : 'left';

    // Rebase the incoming op over the local ops its sender had not seen,
    // and carry the sent-op buffer into the incoming op's timeline so
    // future rebases against it stay correct — one ladder does both.
    let rebased: Op | null = message.op;
    for (const sent of missed) {
      if (rebased === null) break;
      const transformed: Op | null = algebra.transform(sent.op, rebased, localSide);
      rebased = algebra.transform(rebased, sent.op, incomingSide);
      if (transformed !== null) sent.op = transformed;
    }

    if (rebased === null) return;

    this.#applyingRemote = true;
    try {
      document.applyRemote(rebased);
    } finally {
      this.#applyingRemote = false;
    }
    this.#lastVersion = document.version();
    this.#lastDoc = document.snapshot();
  }

  // ── Presence ────────────────────────────────────────────────────────────

  #presence(): CollabPresence<Sel> {
    const document = this.#document!;
    return {
      clientId: this.clientId,
      name: this.#presenceInfo.name,
      color: this.#presenceInfo.color,
      selection: document.selection(),
      version: document.version(),
    };
  }

  #schedulePresence(): void {
    if (!this.#transport || this.#presenceTimer) return;
    const wait = Math.max(0, this.#presenceThrottleMs - (Date.now() - this.#lastPresenceAt));
    this.#presenceTimer = setTimeout(() => {
      this.#presenceTimer = null;
      this.#broadcastPresence();
    }, wait);
  }

  #broadcastPresence(): void {
    if (!this.#document || !this.#transport) return;
    this.#lastPresenceAt = Date.now();
    this.#send({ type: 'presence', presence: this.#presence() });
  }

  #trackPeer(presence: CollabPresence<Sel>): void {
    const next = new Map(this.peers());
    next.set(presence.clientId, presence);
    for (const [id, peer] of next) {
      if (id !== presence.clientId && Date.now() - ((peer as CollabPresence<Sel> & { at?: number }).at ?? Date.now()) > PEER_STALE_MS) {
        next.delete(id);
      }
    }
    (presence as CollabPresence<Sel> & { at?: number }).at = Date.now();
    this.peers.set(next);
  }

  #send(message: CollabMessage<Op, Doc, Sel>): void {
    this.#transport?.send(message);
  }
}
