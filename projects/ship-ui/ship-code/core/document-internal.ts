// Internal: not exported from public-api. The document's line tree, for this package's own modules and specs.

import type { CodeDocument } from './document';
import type { LineNode } from './line-tree';

interface TreeDocument {
  readonly root: LineNode;
}

export const wrapTree = (root: LineNode): CodeDocument => ({ root }) as TreeDocument as unknown as CodeDocument;
export const treeOf = (doc: CodeDocument): LineNode => (doc as unknown as TreeDocument).root;
