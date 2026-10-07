// ---------------------------------------------------------------------------
// ShipCode — Line Tree (internal: not exported from public-api)
// ---------------------------------------------------------------------------
//
// A persistent B+tree over the document's lines. Leaves hold line strings;
// every node caches how many lines and how many characters (newlines excluded)
// it holds, so line → offset and offset → line are a single O(log n) descent,
// and a splice copies only the root-to-leaf path it touches. Untouched
// subtrees are shared between document versions, which makes a version cheap
// to keep (undo, rebase) and makes "did this region change" an identity check.
//
// All leaves sit at the same depth. A splice returns the replacement for the
// node it was given as a list of same-height nodes (empty, one, or several
// after a split); the parent folds that list into its children and rebalances
// the neighbourhood, so overflow propagates up and the root grows or shrinks
// by one level at a time.

/** Lines a leaf holds when built from scratch, and the bounds a splice keeps it within. */
const LEAF_TARGET = 32;
const LEAF_MAX = 64;
const LEAF_MIN = 16;
/** Children per branch. */
const BRANCH_TARGET = 16;
const BRANCH_MAX = 32;
const BRANCH_MIN = 8;

export interface Leaf {
  readonly leaf: true;
  readonly lines: readonly string[];
  readonly lineCount: number;
  readonly chars: number;
}

export interface Branch {
  readonly leaf: false;
  readonly children: readonly LineNode[];
  readonly lineCount: number;
  readonly chars: number;
}

export type LineNode = Leaf | Branch;

function makeLeaf(lines: readonly string[]): Leaf {
  let chars = 0;
  for (const line of lines) chars += line.length;
  return { leaf: true, lines, lineCount: lines.length, chars };
}

function makeBranch(children: readonly LineNode[]): Branch {
  let lineCount = 0;
  let chars = 0;
  for (const child of children) {
    lineCount += child.lineCount;
    chars += child.chars;
  }
  return { leaf: false, children, lineCount, chars };
}

const size = (node: LineNode) => (node.leaf ? node.lines.length : node.children.length);
const max = (node: LineNode) => (node.leaf ? LEAF_MAX : BRANCH_MAX);
const min = (node: LineNode) => (node.leaf ? LEAF_MIN : BRANCH_MIN);

/** Cut an over-full list into near-equal chunks no bigger than `limit`. */
function chunk<T>(items: readonly T[], target: number, limit: number): T[][] {
  if (items.length <= limit) return [items as T[]];
  const count = Math.ceil(items.length / target);
  const out: T[][] = [];
  for (let i = 0; i < count; i++) out.push(items.slice(Math.floor((i * items.length) / count), Math.floor(((i + 1) * items.length) / count)));
  return out;
}

/** Same-height nodes from the contents of one (possibly over-full) node. */
function fromContents(leaf: boolean, contents: readonly (string | LineNode)[]): LineNode[] {
  if (contents.length === 0) return [];
  return leaf
    ? chunk(contents as string[], LEAF_TARGET, LEAF_MAX).map(makeLeaf)
    : chunk(contents as LineNode[], BRANCH_TARGET, BRANCH_MAX).map(makeBranch);
}

const contentsOf = (node: LineNode): readonly (string | LineNode)[] => (node.leaf ? node.lines : node.children);

// ---------------------------------------------------------------------------
// Build and read
// ---------------------------------------------------------------------------

/** A balanced tree over `lines` (at least one line; a document always has one). */
export function buildTree(lines: readonly string[]): LineNode {
  let level: LineNode[] = fromContents(true, lines.length ? lines : ['']);
  while (level.length > 1) level = fromContents(false, level);
  return level[0]!;
}

// ---------------------------------------------------------------------------
// Finger: the last leaf a read descended to
// ---------------------------------------------------------------------------
//
// Reads cluster: a caret move reads the line it is on and its neighbours, a render reads a window of lines. The
// leaf found by the last descent is remembered with where it starts, so a read inside it skips the descent. Trees
// are immutable, so the finger is valid for as long as it is used with the same root.

interface Finger {
  root: LineNode;
  leaf: Leaf;
  /** Index of the leaf's first line. */
  line: number;
  /** Characters (newlines excluded) before the leaf. */
  chars: number;
}

let finger: Finger | null = null;

function fingerByLine(root: LineNode, index: number): Finger {
  const f = finger;
  if (f && f.root === root && index >= f.line && index < f.line + f.leaf.lineCount) return f;
  let node = root;
  let i = index;
  let line = 0;
  let chars = 0;
  while (!node.leaf) {
    const children = node.children;
    let k = 0;
    for (; k < children.length - 1; k++) {
      const child = children[k]!;
      if (i < child.lineCount) break;
      i -= child.lineCount;
      line += child.lineCount;
      chars += child.chars;
    }
    node = children[k]!;
  }
  return (finger = { root, leaf: node, line, chars });
}

function fingerByOffset(root: LineNode, pos: number): Finger {
  const f = finger;
  if (f && f.root === root) {
    const start = f.chars + f.line;
    // The leaf's span is its characters plus one newline slot per line; the last leaf also owns everything past it.
    const end = start + f.leaf.chars + f.leaf.lineCount;
    if (pos >= start && (pos < end || f.line + f.leaf.lineCount === root.lineCount)) return f;
  }
  let node = root;
  let rest = pos;
  let line = 0;
  let chars = 0;
  while (!node.leaf) {
    const children = node.children;
    let k = 0;
    for (; k < children.length - 1; k++) {
      const child = children[k]!;
      const span = child.chars + child.lineCount;
      if (rest < span) break;
      rest -= span;
      line += child.lineCount;
      chars += child.chars;
    }
    node = children[k]!;
  }
  return (finger = { root, leaf: node, line, chars });
}

/** Text of line `index` (0-based, must be in range). */
export function lineAt(root: LineNode, index: number): string {
  const f = fingerByLine(root, index);
  return f.leaf.lines[index - f.line]!;
}

/** The leaf holding line `index`: which leaves two versions share is the tree's structural sharing. */
export function leafOf(root: LineNode, index: number): Leaf {
  return fingerByLine(root, index).leaf;
}

/** Characters (newlines excluded) in lines [0, line). */
export function charsBefore(root: LineNode, line: number): number {
  if (line >= root.lineCount) return root.chars;
  const f = fingerByLine(root, line);
  let chars = f.chars;
  const lines = f.leaf.lines;
  for (let k = 0; k < line - f.line; k++) chars += lines[k]!.length;
  return chars;
}

/**
 * The line containing flat offset `pos`, where each line spans its characters plus one newline slot. Returns the
 * line and the flat offset of its first character. `pos` past the end lands on the last line.
 */
export function lineAtOffset(root: LineNode, pos: number): { line: number; start: number } {
  const f = fingerByOffset(root, pos);
  const lines = f.leaf.lines;
  let start = f.chars + f.line;
  let rest = pos - start;
  let k = 0;
  for (; k < lines.length - 1; k++) {
    const span = lines[k]!.length + 1;
    if (rest < span) break;
    rest -= span;
    start += span;
  }
  return { line: f.line + k, start };
}

/** Lines [from, to) as an array. */
export function sliceLines(root: LineNode, from: number, to: number): string[] {
  const out: string[] = [];
  const walk = (node: LineNode, offset: number) => {
    if (offset >= to || offset + node.lineCount <= from) return;
    if (node.leaf) {
      const a = Math.max(0, from - offset);
      const b = Math.min(node.lines.length, to - offset);
      for (let i = a; i < b; i++) out.push(node.lines[i]!);
      return;
    }
    let at = offset;
    for (const child of node.children) {
      walk(child, at);
      at += child.lineCount;
    }
  };
  walk(root, 0);
  return out;
}

/** The whole text, lines joined by '\n'. */
export function treeText(root: LineNode): string {
  return sliceLines(root, 0, root.lineCount).join('\n');
}

// ---------------------------------------------------------------------------
// Splice
// ---------------------------------------------------------------------------

/**
 * Replace `deleteCount` lines starting at `start` with `insert`. Persistent: `root` is untouched, and the result
 * shares every subtree the splice did not reach. The result always holds at least one line.
 */
export function spliceTree(root: LineNode, start: number, deleteCount: number, insert: readonly string[]): LineNode {
  const from = Math.max(0, Math.min(start, root.lineCount));
  const count = Math.max(0, Math.min(deleteCount, root.lineCount - from));
  if (count === 0 && insert.length === 0) return root;
  let level = spliceNode(root, from, count, insert);
  if (level.length === 0) return buildTree(['']);
  while (level.length > 1) level = fromContents(false, level);
  let top = level[0]!;
  // A root with a single child is one level too tall.
  while (!top.leaf && top.children.length === 1) top = top.children[0]!;
  return top;
}

function spliceNode(node: LineNode, start: number, deleteCount: number, insert: readonly string[]): LineNode[] {
  if (node.leaf) {
    const lines = node.lines.slice(0, start).concat(insert as string[], node.lines.slice(start + deleteCount));
    return fromContents(true, lines);
  }

  // The children the splice reaches: the one holding `start` through the one holding its last deleted line (an
  // insert-only splice reaches just the child it lands in; at a child boundary it extends the previous child).
  const children = node.children;
  let first = 0;
  let firstOffset = 0;
  while (first < children.length - 1 && start >= firstOffset + children[first]!.lineCount && !(start === firstOffset + children[first]!.lineCount && deleteCount === 0)) {
    firstOffset += children[first]!.lineCount;
    first++;
  }
  const end = start + deleteCount;
  let last = first;
  let lastOffset = firstOffset;
  while (last < children.length - 1 && end > lastOffset + children[last]!.lineCount) {
    lastOffset += children[last]!.lineCount;
    last++;
  }

  let replaced: LineNode[];
  if (first === last) {
    replaced = spliceNode(children[first]!, start - firstOffset, deleteCount, insert);
  } else {
    // Delete the tail of `first` and insert there, drop the children in between, delete the head of `last`.
    const head = spliceNode(children[first]!, start - firstOffset, children[first]!.lineCount - (start - firstOffset), insert);
    const tail = spliceNode(children[last]!, 0, end - lastOffset, []);
    replaced = head.concat(tail);
  }

  const next = children.slice(0, first).concat(replaced, children.slice(last + 1));
  return fromContents(false, rebalance(next, first, first + replaced.length));
}

/**
 * Merge under-full nodes in `nodes[lo - 1 .. hi]` (the replaced span and its two neighbours) into a neighbour,
 * re-splitting anything that comes out over-full. Everything outside the span is passed through by identity.
 */
function rebalance(nodes: LineNode[], lo: number, hi: number): LineNode[] {
  const a = Math.max(0, lo - 1);
  const b = Math.min(nodes.length, hi + 1);
  const span = nodes.slice(a, b);
  if (span.length <= 1 || span.every((n) => size(n) >= min(n) && size(n) <= max(n))) return nodes;
  const out: LineNode[] = [];
  let pending: LineNode | null = null;
  for (const node of span) {
    if (!pending) {
      pending = node;
      continue;
    }
    if (size(pending) < min(pending) || size(node) < min(node)) {
      const merged = fromContents(node.leaf, contentsOf(pending).concat(contentsOf(node)));
      out.push(...merged.slice(0, -1));
      pending = merged[merged.length - 1]!;
    } else {
      out.push(pending);
      pending = node;
    }
  }
  if (pending) out.push(pending);
  return nodes.slice(0, a).concat(out, nodes.slice(b));
}

// ---------------------------------------------------------------------------
// Invariants (specs)
// ---------------------------------------------------------------------------

/** Throws when the tree breaks an invariant: cached counts, equal leaf depth, node size bounds. */
export function checkTree(root: LineNode): void {
  let leafDepth = -1;
  const visit = (node: LineNode, depth: number, isRoot: boolean) => {
    if (node.leaf) {
      if (leafDepth === -1) leafDepth = depth;
      if (depth !== leafDepth) throw new Error(`leaf at depth ${depth}, expected ${leafDepth}`);
      if (node.lines.length > LEAF_MAX) throw new Error(`leaf over-full: ${node.lines.length}`);
      if (node.lines.length === 0) throw new Error('empty leaf');
      const chars = node.lines.reduce((sum, l) => sum + l.length, 0);
      if (chars !== node.chars || node.lineCount !== node.lines.length) throw new Error('leaf counts stale');
      return;
    }
    if (node.children.length > BRANCH_MAX) throw new Error(`branch over-full: ${node.children.length}`);
    if (node.children.length < (isRoot ? 2 : 1)) throw new Error(`branch with ${node.children.length} children`);
    let lines = 0;
    let chars = 0;
    for (const child of node.children) {
      visit(child, depth + 1, false);
      lines += child.lineCount;
      chars += child.chars;
    }
    if (lines !== node.lineCount || chars !== node.chars) throw new Error('branch counts stale');
  };
  visit(root, 0, true);
}

/** Depth of the leaves (a single leaf is 0). */
export function treeHeight(root: LineNode): number {
  let h = 0;
  let node = root;
  while (!node.leaf) {
    node = node.children[0]!;
    h++;
  }
  return h;
}
