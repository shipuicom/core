import { Injectable } from '@angular/core';
import {
  ASTDocument,
  diffDocuments,
  EditorEngineService,
  EditorOp,
  LogicalSelection,
  transformOp,
} from '@ship-ui/core/ship-editor';
import { CollabTransport } from './collab-protocol';
import { CollabAlgebra, CollabDocument, ShipCollabSession } from './collab-session';

export interface ShipEditorCollabOptions {
  transport: CollabTransport;
  /** Stable identity for this window/session; generated when omitted. */
  clientId?: string;
  /** Shown on this peer's remote cursor in other windows. */
  presence?: { name: string; color: string };
  /** Milliseconds between presence broadcasts (default 100). */
  presenceThrottleMs?: number;
}

/** The editor's op algebra: `transformOp` is TP1-convergent over block and inline splices. */
export const EDITOR_COLLAB_ALGEBRA: CollabAlgebra<EditorOp> = {
  transform: (op, against, side) => transformOp(op, against, side),
};

/** The editor engine seen as a collab document. */
export function editorCollabDocument(engine: EditorEngineService): CollabDocument<EditorOp, ASTDocument, LogicalSelection> {
  return {
    version: engine.version,
    selection: engine.selection.live,
    snapshot: () => engine.document(),
    lastTransaction: () => {
      const tx = engine.lastTransaction();
      return tx ? { baseVersion: tx.baseVersion, op: tx.op } : null;
    },
    diff: diffDocuments,
    applyRemote: (op) => engine.applyRemoteOperation(op),
    load: (doc) => engine.load(doc),
  };
}

/**
 * Wires one `sh-editor` into a collaboration session over a
 * {@link CollabTransport}: the generic {@link ShipCollabSession} bound to
 * the editor engine and its `transformOp` algebra.
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
export class ShipEditorCollab extends ShipCollabSession<EditorOp, ASTDocument, LogicalSelection> {
  attach(engine: EditorEngineService, options: ShipEditorCollabOptions): void {
    this.attachDocument(editorCollabDocument(engine), EDITOR_COLLAB_ALGEBRA, options);
  }
}
