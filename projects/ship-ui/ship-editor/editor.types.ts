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

export interface LogicalPosition {
  blockIndex: number;
  itemIndex?: number;
  inlineIndex: number;
  offset: number;
}

export interface LogicalSelection {
  start: LogicalPosition;
  end: LogicalPosition;
  isCollapsed: boolean;
}

export interface TransactionResult {
  doc: ASTDocument;
  selectionShift?: LogicalSelection;
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
