export * from './ship-editor';
export * from './sh-editor-toolbar';
export * from './sh-editor-sheet';
export * from './sh-editor-floating-toolbar';
export * from './sh-editor-contextual-toolbar';
export * from './sh-editor-action.directive';
export * from './editor-behaviors';
export * from './sh-editor-component-block';
export * from './standard-behaviors';
export * from './editor.types';
export * from './editor-engine.service';
export * from './editor-sanitize';
// Op algebra + flat-position tools, exported for collaborative-editing
// integrations (custom transports rebase remote ops with these).
export {
  applyOp,
  invertOp,
  transformOp,
  rebaseOp,
  diffDocuments,
  type EditorOp,
  type EditorTransaction,
  type BlockSplice,
  type InlineSplice,
} from './editor-transactions';
export { StepMap, stepMapFromOp, diffFlat, posToLogical, logicalToPos, nodeSize, docSize } from './editor-flat-positions';
