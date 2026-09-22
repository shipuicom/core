import { Signal } from '@angular/core';
import { ASTDocument, EditorOp, LogicalSelection } from '@ship-ui/core/ship-editor';

/**
 * A peer's identity and live cursor, broadcast alongside document ops. The
 * selection is whatever the document being edited calls one — an editor's
 * `LogicalSelection` by default, a spreadsheet's range list for a sheet.
 */
export interface CollabPresence<Sel = LogicalSelection> {
  clientId: string;
  name: string;
  color: string;
  selection: Sel | null;
  /** The peer's engine version when this presence was captured. */
  version: number;
}

/**
 * Wire protocol between collaborating peers. Every message is plain JSON —
 * safe for `postMessage`, WebSockets, or any other transport. The type
 * parameters name the op, snapshot and selection shapes; the defaults are
 * the editor's, and a spreadsheet session uses `SheetOp[]` transactions,
 * `SheetJSON` snapshots and `SheetSelection` — same envelope, same
 * transports, same relay endpoint shape.
 */
export type CollabMessage<Op = EditorOp, Doc = ASTDocument, Sel = LogicalSelection> =
  | {
      type: 'op';
      clientId: string;
      /** Sender's monotonically increasing op counter. */
      seq: number;
      /**
       * Per-peer high-water marks: the highest `seq` of each peer the sender
       * had applied when it generated this op. The receiver rebases the op
       * over any of its own ops the sender had not yet seen.
       */
      seen: Record<string, number>;
      op: Op;
      presence?: CollabPresence<Sel>;
    }
  | { type: 'presence'; presence: CollabPresence<Sel> }
  | { type: 'join'; clientId: string }
  | { type: 'snapshot'; toClientId: string; clientId: string; doc: Doc; seen: Record<string, number> }
  | { type: 'leave'; clientId: string };

/**
 * Delivery contract for {@link ShipEditorCollab}. Implementations must
 * deliver messages in order per sender; they need not provide a total order
 * across senders — the collab service rebases concurrent ops (exact for two
 * peers; production multi-peer setups should relay through a server that
 * assigns a total order).
 */
export interface CollabTransport<Op = EditorOp, Doc = ASTDocument, Sel = LogicalSelection> {
  send(message: CollabMessage<Op, Doc, Sel>): void;
  /** Register a receive callback; returns an unsubscribe function. */
  subscribe(callback: (message: CollabMessage<Op, Doc, Sel>) => void): () => void;
  readonly connected: Signal<boolean>;
  destroy?(): void;
}
