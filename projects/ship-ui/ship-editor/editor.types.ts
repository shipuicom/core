export interface ASTMark {
  type: string;
  attrs?: Record<string, any>;
}

export interface ASTInlineNode {
  type: 'text';
  text: string;
  marks?: ASTMark[];
}

export interface ASTBlockNode {
  type: string;
  attrs?: Record<string, any>;
  content: (ASTBlockNode | ASTInlineNode)[];
}

export type ASTDocument = ASTBlockNode[];

/**
 * Tree-shaped position: block → item → inline run → offset. The DOM genuinely
 * has this shape, so it survives as the boundary type where DOM nodes are
 * mapped to and from document positions.
 */
export interface LogicalPosition {
  blockIndex: number;
  itemIndex?: number;
  inlineIndex: number;
  offset: number;
}

/**
 * A selection as two flat character positions in the document's position space
 * (the space `logicalToPos`/`posToLogical` define, where a text block costs
 * 2 + its length and a void block costs 1). `from <= to`; collapsed when equal.
 */
export interface LogicalSelection {
  from: number;
  to: number;
}

/**
 * Tree-shaped selection, kept only for the mutation primitives that still
 * navigate the nested AST. Shrinks away as they move onto the columnar
 * document.
 */
export interface TreeSelection {
  start: LogicalPosition;
  end: LogicalPosition;
  isCollapsed: boolean;
}

export interface TransactionResult {
  doc: ASTDocument;
  selectionShift?: TreeSelection;
}

export type BlockCategory = 'void' | 'container' | 'text';

export interface BlockBehaviorManifest {
  readonly type: string;
  readonly category: BlockCategory;

  readonly enterPhysics: {
    readonly strategy: 'split-self' | 'breakout' | 'newline' | 'insert-default-below';
    readonly defaultSplitTarget?: string;
  };

  readonly backspacePhysics: {
    readonly fallbackType?: string;
  };
}
