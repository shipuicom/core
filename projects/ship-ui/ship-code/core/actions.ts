// ---------------------------------------------------------------------------
// ShipCode — Action Registry
// ---------------------------------------------------------------------------
//
// The extension surface: named actions over an immutable (document, selection)
// context. Keymaps bind keys to action names; anything — the component, a
// consumer, a future command palette — dispatches by name. Handlers are pure:
// they receive a context and return the next one (or null for "not
// applicable", leaving the context untouched).

import { CodeDocument } from './document';
import { applyMotionAll } from './flat-multi';
import {
  FlatSelection,
  flatMoveDocEnd,
  flatMoveDocStart,
  flatMoveDown,
  flatMoveLeft,
  flatMoveLineEnd,
  flatMoveLineStart,
  flatMoveRight,
  flatMoveUp,
  flatMoveWordLeft,
  flatMoveWordRight,
  flatSelectAll,
  flatSelectLine,
  flatSelectWord,
  primaryFlat,
} from './flat-motion';

export interface ActionContext {
  readonly doc: CodeDocument;
  readonly selection: FlatSelection;
}

/** A pure action: context in, next context out. Null means "not applicable". */
export type ActionHandler = (ctx: ActionContext) => ActionContext | null;

const REGISTRY = new Map<string, ActionHandler>();

/** Register (or override) a named action. */
export function registerAction(name: string, handler: ActionHandler): void {
  REGISTRY.set(name, handler);
}

/**
 * Dispatch an action by name. Returns the next context, or `false` when no
 * handler is registered (or the handler reported "not applicable").
 */
export function dispatchAction(name: string, ctx: ActionContext): ActionContext | false {
  const handler = REGISTRY.get(name);
  if (!handler) return false;
  return handler(ctx) ?? false;
}

/** Is an action name registered? */
export function hasAction(name: string): boolean {
  return REGISTRY.has(name);
}

// ---------------------------------------------------------------------------
// Built-in actions: the caret and selection motions from the flat model.
// Registered at module load — importing the registry gives a working set.
// ---------------------------------------------------------------------------

type Motion = (doc: CodeDocument, pos: number, goal?: number) => { head: number; goalColumn?: number };

// Every cursor moves, not just the primary: a registry dispatch must behave
// exactly like the keyboard path, which routes through `applyMotionAll` —
// anything else silently collapses a live multi-cursor to one caret.
const motion =
  (move: Motion, collapseEdge?: 'from' | 'to'): ActionHandler =>
  ({ doc, selection }) => ({
    doc,
    selection: applyMotionAll(selection, (pos, goal) => move(doc, pos, goal), false, collapseEdge),
  });

registerAction('code.caret.moveLeft', motion(flatMoveLeft, 'from'));
registerAction('code.caret.moveRight', motion(flatMoveRight, 'to'));
registerAction('code.caret.moveUp', motion(flatMoveUp));
registerAction('code.caret.moveDown', motion(flatMoveDown));
registerAction('code.caret.moveWordLeft', motion(flatMoveWordLeft));
registerAction('code.caret.moveWordRight', motion(flatMoveWordRight));
registerAction('code.caret.moveLineStart', motion(flatMoveLineStart));
registerAction('code.caret.moveLineEnd', motion(flatMoveLineEnd));
registerAction('code.caret.moveDocStart', motion(() => flatMoveDocStart()));
registerAction('code.caret.moveDocEnd', motion((doc) => flatMoveDocEnd(doc)));

registerAction('code.selection.selectAll', ({ doc }) => ({ doc, selection: { ranges: [flatSelectAll(doc)] } }));
registerAction('code.selection.selectWord', ({ doc, selection }) => ({
  doc,
  selection: { ranges: [flatSelectWord(doc, primaryFlat(selection).head)] },
}));
registerAction('code.selection.selectLine', ({ doc, selection }) => ({
  doc,
  selection: { ranges: [flatSelectLine(doc, primaryFlat(selection).head)] },
}));
