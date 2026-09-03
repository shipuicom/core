import { Signal } from '@angular/core';
import { ASTDocument, EditorOp, LogicalSelection } from '@ship-ui/core/ship-editor';

/** A peer's identity and live cursor, broadcast alongside document ops. */
export interface CollabPresence {
  clientId: string;
  name: string;
  color: string;
  selection: LogicalSelection | null;
  /** The peer's engine version when this presence was captured. */
  version: number;
}

/**
 * Wire protocol between collaborating editors. Every message is plain JSON —
 * safe for `postMessage`, WebSockets, or any other transport.
 */
export type CollabMessage =
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
      op: EditorOp;
      presence?: CollabPresence;
    }
  | { type: 'presence'; presence: CollabPresence }
  | { type: 'join'; clientId: string }
  | { type: 'snapshot'; toClientId: string; clientId: string; doc: ASTDocument; seen: Record<string, number> }
  | { type: 'leave'; clientId: string };

/**
 * Delivery contract for {@link ShipEditorCollab}. Implementations must
 * deliver messages in order per sender; they need not provide a total order
 * across senders — the collab service rebases concurrent ops (exact for two
 * peers; production multi-peer setups should relay through a server that
 * assigns a total order).
 */
export interface CollabTransport {
  send(message: CollabMessage): void;
  /** Register a receive callback; returns an unsubscribe function. */
  subscribe(callback: (message: CollabMessage) => void): () => void;
  readonly connected: Signal<boolean>;
  destroy?(): void;
}
