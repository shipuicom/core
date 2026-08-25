import { effect, EffectRef, inject, Injectable, Injector, signal } from '@angular/core';
import { generateUniqueId } from '@ship-ui/core';
import {
  ASTDocument,
  diffDocuments,
  EditorEngineService,
  EditorOp,
  rebaseOp,
  transformOp,
} from '@ship-ui/core/ship-editor';
import { CollabMessage, CollabPresence, CollabTransport } from './collab-protocol';

export interface ShipEditorCollabOptions {
  transport: CollabTransport;
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
 * Wires one `sh-editor` into a collaboration session over a
 * {@link CollabTransport}.
 *
 * Local transactions are broadcast as {@link EditorOp}s; incoming ops are
 * rebased over any local ops the sender had not yet seen (`transformOp` is
 * TP1-convergent, so two peers reach the same document regardless of
 * delivery order) and applied via `engine.applyRemoteOperation`, which maps
 * the local caret and keeps remote edits out of the local undo history.
 *
 * Provide it on the component that owns the editor and `attach` after the
 * editor exists. The built-in `BroadcastChannelTransport` gives exact
 * convergence for two same-origin peers; multi-peer production setups
 * should use a server-relay transport that assigns a total order.
 */
@Injectable()
export class ShipEditorCollab {
  #injector = inject(Injector);

  readonly clientId = generateUniqueId();
  readonly peers = signal<ReadonlyMap<string, CollabPresence>>(new Map());
  readonly connected = signal(false);

  #engine: EditorEngineService | null = null;
  #transport: CollabTransport | null = null;
  #unsubscribe: (() => void) | null = null;
  #effects: EffectRef[] = [];
  #presenceInfo = { name: 'Anonymous', color: '#888888' };
  #presenceThrottleMs = 100;
  #presenceTimer: ReturnType<typeof setTimeout> | null = null;
  #lastPresenceAt = 0;

  // Send-side bookkeeping.
  #applyingRemote = false;
  #seq = 0;
  #sentOps: { seq: number; op: EditorOp }[] = [];
  #seen: Record<string, number> = {};
  #lastVersion = -1;
  #lastDoc: ASTDocument | null = null;

  attach(engine: EditorEngineService, options: ShipEditorCollabOptions): void {
    this.detach();
    this.#engine = engine;
    this.#transport = options.transport;
    if (options.presence) this.#presenceInfo = options.presence;
    if (options.presenceThrottleMs !== undefined) this.#presenceThrottleMs = options.presenceThrottleMs;
    if (options.clientId) (this as { clientId: string }).clientId = options.clientId;

    this.connected.set(options.transport.connected());
    this.#lastVersion = engine.version();
    this.#lastDoc = engine.document();

    this.#unsubscribe = options.transport.subscribe((message) => this.#receive(message));

    // Reactive wiring needs a live Angular environment (effect scheduling).
    // Headless usage — tests, custom drivers — calls flushLocal() instead.
    try {
      this.#effects.push(
        effect(
          () => {
            const version = engine.version();
            this.#onVersionChange(version);
          },
          { injector: this.#injector },
        ),
        effect(
          () => {
            engine.selection.live();
            this.#schedulePresence();
          },
          { injector: this.#injector },
        ),
      );
    } catch {
      this.#effects = [];
    }

    this.#send({ type: 'join', clientId: this.clientId });
    this.#broadcastPresence();
  }

  detach(): void {
    if (this.#transport) this.#send({ type: 'leave', clientId: this.clientId });
    this.#unsubscribe?.();
    this.#unsubscribe = null;
    for (const ref of this.#effects) ref.destroy();
    this.#effects = [];
    if (this.#presenceTimer) clearTimeout(this.#presenceTimer);
    this.#presenceTimer = null;
    this.#engine = null;
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
    if (this.#engine) this.#onVersionChange(this.#engine.version());
  }

  // ── Send side ───────────────────────────────────────────────────────────

  #onVersionChange(version: number): void {
    const engine = this.#engine;
    if (!engine || version === this.#lastVersion) return;

    const newDoc = engine.document();
    if (this.#applyingRemote) {
      // Remote applies bump the version too — track, never re-broadcast.
      this.#lastVersion = version;
      this.#lastDoc = newDoc;
      return;
    }

    const tx = engine.lastTransaction();
    // Trust the transaction only when it accounts for the whole jump; a
    // multi-cursor group surfaces just its last transaction, and load()
    // records none — diffing the snapshots covers both.
    const op: EditorOp | null =
      version === this.#lastVersion + 1 && tx && tx.baseVersion === this.#lastVersion
        ? tx.op
        : this.#lastDoc
          ? diffDocuments(this.#lastDoc, newDoc)
          : null;

    this.#lastVersion = version;
    this.#lastDoc = newDoc;
    if (!op) return;

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

  #receive(message: CollabMessage): void {
    const engine = this.#engine;
    if (!engine) return;
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
          doc: engine.document(),
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
          engine.load(message.doc);
        } finally {
          this.#applyingRemote = false;
        }
        this.#lastVersion = engine.version();
        this.#lastDoc = engine.document();
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

  #applyIncomingOp(message: Extract<CollabMessage, { type: 'op' }>): void {
    const engine = this.#engine!;
    const senderSawMine = message.seen[this.clientId] ?? 0;
    const missed = this.#sentOps.filter((sent) => sent.seq > senderSawMine);

    // Deterministic tie-break both peers agree on: the lexicographically
    // smaller clientId plays 'left' (mirrors the rebase fuzz's convention).
    const incomingSide = message.clientId < this.clientId ? 'left' : 'right';
    const localSide = incomingSide === 'left' ? 'right' : 'left';

    const rebased = missed.length
      ? rebaseOp(
          message.op,
          missed.map((sent) => sent.op),
          incomingSide,
        )
      : message.op;

    // Keep the sent-op buffer in the incoming op's timeline so future
    // rebases against it stay correct.
    let against: EditorOp | null = message.op;
    for (const sent of missed) {
      if (!against) break;
      const transformed: EditorOp | null = transformOp(sent.op, against, localSide);
      against = transformOp(against, sent.op, incomingSide);
      if (transformed) sent.op = transformed;
    }

    if (!rebased) return;

    this.#applyingRemote = true;
    try {
      engine.applyRemoteOperation(rebased);
    } finally {
      this.#applyingRemote = false;
    }
    this.#lastVersion = engine.version();
    this.#lastDoc = engine.document();
  }

  // ── Presence ────────────────────────────────────────────────────────────

  #presence(): CollabPresence {
    const engine = this.#engine!;
    return {
      clientId: this.clientId,
      name: this.#presenceInfo.name,
      color: this.#presenceInfo.color,
      selection: engine.selection.live(),
      version: engine.version(),
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
    if (!this.#engine || !this.#transport) return;
    this.#lastPresenceAt = Date.now();
    this.#send({ type: 'presence', presence: this.#presence() });
  }

  #trackPeer(presence: CollabPresence): void {
    const next = new Map(this.peers());
    next.set(presence.clientId, presence);
    for (const [id, peer] of next) {
      if (id !== presence.clientId && Date.now() - ((peer as CollabPresence & { at?: number }).at ?? Date.now()) > PEER_STALE_MS) {
        next.delete(id);
      }
    }
    (presence as CollabPresence & { at?: number }).at = Date.now();
    this.peers.set(next);
  }

  #send(message: CollabMessage): void {
    this.#transport?.send(message);
  }
}
