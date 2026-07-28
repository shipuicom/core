import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark } from './editor.types';

/**
 * A columnar document model: one row per block, each field in its own column
 * rather than repeated per node.
 *
 * Three things make it worth the shape:
 *
 * - **Memory.** A 1000-block document holding 235 KB of text costs ~844 KB as a
 *   nested AST and ~255 KB here, because 4999 inline node objects collapse into
 *   1000 strings plus range triples.
 * - **Reads.** Position maths is O(1)/O(log n) against O(document), and scans
 *   walk contiguous typed arrays instead of chasing pointers.
 * - **Writes.** Mutating in place with an O(log n) size index beats rebuilding a
 *   nested tree, provided the columns are never wholesale copied per edit.
 *
 * The model is deliberately **mutable**. Undo in this engine is already op-based
 * (`EditorTransaction` stores an `EditorOp` and inverts it), so it never needed
 * document identity, and change detection can hang off `version`, which ticks on
 * every mutation. Copying every column per keystroke costs ~50x more than the
 * edit itself, which is the whole reason this is not a persistent structure.
 */

/** Row shape, mirroring the void/text/container distinction the position maths makes. */
export const enum RowKind {
  Void = 0,
  Text = 1,
  Container = 2,
}

/**
 * What the document needs from a size index, so the implementations below can be
 * compared without the model caring which is in use.
 */
export interface RowSizeIndex {
  reset(sizes: ArrayLike<number>, length: number): void;
  add(row: number, delta: number): void;
  insert(row: number, size: number): void;
  /** Insert several rows at once. Batched so a rebuilding index rebuilds once. */
  insertMany(row: number, sizes: number[]): void;
  remove(row: number): void;
  /** Remove several rows at once, for the same reason. */
  removeMany(row: number, count: number): void;
  prefix(row: number): number;
  findRow(pos: number): number;
}

/**
 * Fenwick (binary-indexed) tree over row sizes.
 *
 * Replaces a materialised prefix-sum column: that column is cumulative, so any
 * length change invalidates its whole suffix. Here a size change is O(log n) —
 * but an insert shifts every subsequent index, so it forces a full rebuild.
 */
class SizeIndex implements RowSizeIndex {
  /** Mirror of the row sizes, kept so insert/remove can rebuild the tree. */
  #mirror: number[] = [];
  #tree: Int32Array;
  #length: number;
  #logN: number;

  constructor(sizes: ArrayLike<number>, length: number) {
    this.#tree = new Int32Array(length + 1);
    this.#length = length;
    this.#logN = 31 - Math.clz32(length || 1);
    this.reset(sizes, length);
  }

  /** O(n) build: seed then propagate, rather than n inserts of O(log n) each. */
  #seed(sizes: ArrayLike<number>, length: number) {
    for (let i = 0; i < length; i++) this.#tree[i + 1] = sizes[i];
    for (let i = 1; i <= length; i++) {
      const parent = i + (i & -i);
      if (parent <= length) this.#tree[parent] += this.#tree[i];
    }
  }

  /** Rebuild against a new row count. Needed after an insert or removal, which shifts indices. */
  reset(sizes: ArrayLike<number>, length: number) {
    this.#mirror = Array.from({ length }, (_, i) => sizes[i]);
    this.#length = length;
    if (this.#tree.length < length + 1) this.#tree = new Int32Array(length + 1);
    else this.#tree.fill(0, 0, length + 1);
    this.#seed(sizes, length);
    this.#logN = 31 - Math.clz32(length || 1);
  }

  /** O(log n): adjust row `i`'s size by `delta`. */
  add(i: number, delta: number) {
    if (delta === 0) return;
    this.#mirror[i] += delta;
    for (let k = i + 1; k <= this.#length; k += k & -k) this.#tree[k] += delta;
  }

  /** O(n): an insertion shifts every subsequent index, so the tree is rebuilt. */
  insert(row: number, size: number) {
    this.#mirror.splice(row, 0, size);
    this.reset(this.#mirror, this.#mirror.length);
  }

  /**
   * O(n) for the whole batch rather than per row.
   *
   * Inserting m rows one at a time meant m full rebuilds — pasting 2000 blocks
   * into a 1000-block document took 43.8 ms that way, against 0.009 ms for the
   * nested tree.
   */
  insertMany(row: number, sizes: number[]) {
    if (!sizes.length) return;
    this.#mirror.splice(row, 0, ...sizes);
    this.reset(this.#mirror, this.#mirror.length);
  }

  /** O(n), for the same reason. */
  remove(row: number) {
    this.#mirror.splice(row, 1);
    this.reset(this.#mirror, this.#mirror.length);
  }

  /** O(n) for the whole batch, not per row. */
  removeMany(row: number, count: number) {
    if (count <= 0) return;
    this.#mirror.splice(row, count);
    this.reset(this.#mirror, this.#mirror.length);
  }

  /** O(log n): total size of rows [0, i). */
  prefix(i: number): number {
    let sum = 0;
    for (let k = i; k > 0; k -= k & -k) sum += this.#tree[k];
    return sum;
  }

  /** O(log n) binary lifting: the largest row index whose start is <= pos. */
  findRow(pos: number): number {
    let index = 0;
    let rest = pos;
    for (let step = 1 << this.#logN; step > 0; step >>= 1) {
      const next = index + step;
      if (next <= this.#length && this.#tree[next] <= rest) {
        index = next;
        rest -= this.#tree[next];
      }
    }
    return index;
  }
}

/**
 * Two-level size index: rows grouped into chunks, with a Fenwick tree over the
 * chunk totals.
 *
 * A flat Fenwick has to be rebuilt whenever a row is inserted, because every
 * subsequent index shifts. Here an insert only splices one chunk's local array
 * and adjusts that chunk's total — the rows in every other chunk keep their
 * positions, so the tree above only sees one value change.
 *
 * The trade is query cost: resolving a position means descending the Fenwick to
 * a chunk and then scanning inside it, so `CHUNK` bounds how much of that scan
 * we are willing to pay to keep inserts cheap.
 */
const CHUNK = 32;

class ChunkedSizeIndex implements RowSizeIndex {
  /** Row sizes, per chunk. */
  #chunks: number[][] = [];
  /** Sum of each chunk, mirrored into the Fenwick. */
  #totals: number[] = [];
  /** Cumulative row counts, so a row index resolves to a chunk by binary search. */
  #rowStart: Int32Array = new Int32Array(1);
  /** Fenwick over chunk totals. */
  #tree: Int32Array = new Int32Array(1);
  #chunkCount = 0;
  #logC = 0;

  constructor(sizes: ArrayLike<number>, length: number) {
    this.reset(sizes, length);
  }

  reset(sizes: ArrayLike<number>, length: number) {
    this.#chunks = [];
    this.#totals = [];
    for (let i = 0; i < length; i += CHUNK) {
      const chunk: number[] = [];
      let sum = 0;
      for (let k = i; k < Math.min(i + CHUNK, length); k++) {
        chunk.push(sizes[k]);
        sum += sizes[k];
      }
      this.#chunks.push(chunk);
      this.#totals.push(sum);
    }
    if (!this.#chunks.length) {
      this.#chunks.push([]);
      this.#totals.push(0);
    }
    this.#rebuildChunkIndex();
  }

  /** O(chunks): only runs when the chunk *count* changes, which is rare. */
  #rebuildChunkIndex() {
    this.#chunkCount = this.#chunks.length;
    this.#rowStart = new Int32Array(this.#chunkCount + 1);
    for (let c = 0; c < this.#chunkCount; c++) this.#rowStart[c + 1] = this.#rowStart[c] + this.#chunks[c].length;

    this.#tree = new Int32Array(this.#chunkCount + 1);
    for (let c = 0; c < this.#chunkCount; c++) this.#tree[c + 1] = this.#totals[c];
    for (let c = 1; c <= this.#chunkCount; c++) {
      const parent = c + (c & -c);
      if (parent <= this.#chunkCount) this.#tree[parent] += this.#tree[c];
    }
    this.#logC = 31 - Math.clz32(this.#chunkCount || 1);
  }

  /** Shift the cumulative row counts after a chunk's length changed. */
  #shiftRowStart(fromChunk: number, delta: number) {
    for (let c = fromChunk + 1; c <= this.#chunkCount; c++) this.#rowStart[c] += delta;
  }

  #treeAdd(chunk: number, delta: number) {
    for (let k = chunk + 1; k <= this.#chunkCount; k += k & -k) this.#tree[k] += delta;
  }

  #treePrefix(chunk: number): number {
    let sum = 0;
    for (let k = chunk; k > 0; k -= k & -k) sum += this.#tree[k];
    return sum;
  }

  /** Chunk containing a row, by binary search over cumulative counts. */
  #chunkOf(row: number): number {
    let lo = 0;
    let hi = this.#chunkCount - 1;
    let found = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.#rowStart[mid] <= row) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    return found;
  }

  /** O(log chunks): adjust one row's size. */
  add(row: number, delta: number) {
    if (delta === 0) return;
    const c = this.#chunkOf(row);
    this.#chunks[c][row - this.#rowStart[c]] += delta;
    this.#totals[c] += delta;
    this.#treeAdd(c, delta);
  }

  /** O(CHUNK + log chunks): insert a row without disturbing any other chunk. */
  insert(row: number, size: number) {
    const c = this.#chunkOf(row);
    this.#chunks[c].splice(row - this.#rowStart[c], 0, size);
    this.#totals[c] += size;

    if (this.#chunks[c].length > CHUNK * 2) {
      // Split keeps the in-chunk scan bounded; costs a chunk-index rebuild.
      const moved = this.#chunks[c].splice(CHUNK);
      let movedTotal = 0;
      for (const v of moved) movedTotal += v;
      this.#totals[c] -= movedTotal;
      this.#chunks.splice(c + 1, 0, moved);
      this.#totals.splice(c + 1, 0, movedTotal);
      this.#rebuildChunkIndex();
      return;
    }

    this.#shiftRowStart(c, 1);
    this.#treeAdd(c, size);
  }

  insertMany(row: number, sizes: number[]) {
    for (let i = 0; i < sizes.length; i++) this.insert(row + i, sizes[i]);
  }

  removeMany(row: number, count: number) {
    for (let i = 0; i < count; i++) this.remove(row);
  }

  /** O(CHUNK + log chunks): remove a row. */
  remove(row: number) {
    const c = this.#chunkOf(row);
    const local = row - this.#rowStart[c];
    const size = this.#chunks[c][local];
    this.#chunks[c].splice(local, 1);
    this.#totals[c] -= size;
    this.#shiftRowStart(c, -1);
    this.#treeAdd(c, -size);
  }

  /** O(log chunks + CHUNK): total size of rows [0, row). */
  prefix(row: number): number {
    const c = this.#chunkOf(row);
    let sum = this.#treePrefix(c);
    const local = row - this.#rowStart[c];
    const chunk = this.#chunks[c];
    for (let i = 0; i < local && i < chunk.length; i++) sum += chunk[i];
    return sum;
  }

  /** O(log chunks + CHUNK): the row containing a position. */
  findRow(pos: number): number {
    let chunkIndex = 0;
    let rest = pos;
    for (let step = 1 << this.#logC; step > 0; step >>= 1) {
      const next = chunkIndex + step;
      if (next <= this.#chunkCount && this.#tree[next] <= rest) {
        chunkIndex = next;
        rest -= this.#tree[next];
      }
    }
    const c = Math.min(chunkIndex, this.#chunkCount - 1);
    const chunk = this.#chunks[c];
    const base = this.#rowStart[c];
    for (let i = 0; i < chunk.length; i++) {
      if (rest < chunk[i]) return base + i;
      rest -= chunk[i];
    }
    return Math.max(0, base + chunk.length - 1);
  }
}

/** Size of a row in the units the position maths uses. */
function rowSize(kind: RowKind, text: string): number {
  if (kind === RowKind.Void) return 1;
  if (kind === RowKind.Text) return 2 + text.length;
  return 2;
}

function markKey(mark: ASTMark): string {
  return mark.attrs ? `${mark.type} ${JSON.stringify(mark.attrs)}` : mark.type;
}

/** A block as the columnar model accepts it, for inserts. */
export interface ColumnarRowInput {
  type: string;
  kind?: RowKind;
  text?: string;
  attrs?: Record<string, unknown>;
  /** Mark ranges over this row's own text. */
  marks?: { start: number; end: number; mark: ASTMark }[];
  depth?: number;
  parent?: number;
}

export class ColumnarDocument {
  /** Interned block type names. */
  readonly types: string[] = [];
  /** Interned marks; ids in `markRuns` index into this. */
  readonly markDefs: ASTMark[] = [];

  #typeIds = new Map<string, number>();
  #markIds = new Map<string, number>();

  // Columns, over-allocated so a structural edit is a memmove inside the
  // existing buffer rather than a fresh allocation per column.
  #type: Int32Array;
  #kind: Uint8Array;
  #parent: Int32Array;
  #depth: Uint8Array;
  #text: string[] = [];
  #rows = 0;

  /** Flat `[row, start, end, markId]` quads, kept ordered by row. */
  #markRuns: number[] = [];
  #attrs = new Map<number, Record<string, unknown>>();

  #sizes: RowSizeIndex;

  /** Ticks on every mutation. Change detection hangs off this, not object identity. */
  version = 0;

  /**
   * `index` selects the size-index strategy. `'chunked'` keeps row insertion off
   * the O(n) rebuild path at some cost to query speed; `'flat'` is the plain
   * Fenwick, fastest for reads and per-keystroke size updates.
   */
  constructor(capacity = 16, index: 'flat' | 'chunked' = 'flat') {
    const cap = Math.max(16, capacity);
    this.#type = new Int32Array(cap);
    this.#kind = new Uint8Array(cap);
    this.#parent = new Int32Array(cap);
    this.#depth = new Uint8Array(cap);
    this.#sizes = index === 'chunked' ? new ChunkedSizeIndex([], 0) : new SizeIndex([], 0);
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  get rows(): number {
    return this.#rows;
  }

  /** Total document size, in the units the position maths uses. */
  get size(): number {
    return this.#sizes.prefix(this.#rows);
  }

  typeOf(row: number): string {
    return this.types[this.#type[row]];
  }
  kindOf(row: number): RowKind {
    return this.#kind[row] as RowKind;
  }
  parentOf(row: number): number {
    return this.#parent[row];
  }
  depthOf(row: number): number {
    return this.#depth[row];
  }
  textOf(row: number): string {
    return this.#text[row];
  }
  attrsOf(row: number): Record<string, unknown> | undefined {
    return this.#attrs.get(row);
  }

  /**
   * Row index of the `n`-th top-level block.
   *
   * Rows and block indices only coincide in flat documents: a container occupies
   * a row of its own *plus* a row per descendant, so anything addressed by
   * top-level block index has to be translated before it can index a column.
   */
  rowOfTopLevel(index: number): number {
    let seen = 0;
    for (let row = 0; row < this.#rows; row++) {
      if (this.#parent[row] !== -1) continue;
      if (seen === index) return row;
      seen++;
    }
    return this.#rows;
  }

  /** Rows occupied by the `n`-th top-level block, including its descendants. */
  rowSpanOfTopLevel(index: number): number {
    const start = this.rowOfTopLevel(index);
    if (start >= this.#rows) return 0;
    let end = start + 1;
    while (end < this.#rows && this.#parent[end] !== -1) end++;
    return end - start;
  }

  /** O(log n): document position at which a row begins. */
  startOf(row: number): number {
    return this.#sizes.prefix(row);
  }

  /**
   * O(log n). A void row has no interior, so its position is its start —
   * matching `logicalToPos`, which returns before stepping past the opening
   * token.
   */
  rowToPos(row: number, offset: number): number {
    const start = this.#sizes.prefix(row);
    return this.#kind[row] === RowKind.Void ? start : start + 1 + offset;
  }

  /** O(log n): the row containing a document position. */
  posToRow(pos: number): number {
    const row = this.#sizes.findRow(pos);
    return Math.min(row, Math.max(0, this.#rows - 1));
  }

  /** Marks covering a character offset in a row, bounded by that row's runs. */
  marksAt(row: number, offset: number): ASTMark[] {
    const out: ASTMark[] = [];
    const [from, to] = this.#rowRunRange(row);
    for (let quad = from; quad < to; quad++) {
      const i = quad * 4;
      if (this.#markRuns[i + 1] <= offset && offset < this.#markRuns[i + 2]) {
        out.push(this.markDefs[this.#markRuns[i + 3]]);
      }
    }
    return out;
  }

  /** The raw `[row, start, end, markId]` quads. Exposed for serialisation and tests. */
  get markRuns(): readonly number[] {
    return this.#markRuns;
  }

  /**
   * Quad index range `[from, to)` of a row's mark runs — the public face of the
   * binary search, so readers outside the class stay bounded by the row's runs
   * rather than scanning every run in the document.
   */
  runRangeOf(row: number): [number, number] {
    return this.#rowRunRange(row);
  }

  // -------------------------------------------------------------------------
  // Interning
  // -------------------------------------------------------------------------

  typeId(name: string): number {
    let id = this.#typeIds.get(name);
    if (id === undefined) {
      id = this.types.length;
      this.types.push(name);
      this.#typeIds.set(name, id);
    }
    return id;
  }

  markId(mark: ASTMark): number {
    const key = markKey(mark);
    let id = this.#markIds.get(key);
    if (id === undefined) {
      id = this.markDefs.length;
      this.markDefs.push(mark.attrs ? { type: mark.type, attrs: { ...mark.attrs } } : { type: mark.type });
      this.#markIds.set(key, id);
    }
    return id;
  }

  // -------------------------------------------------------------------------
  // Writes — mutating, each bumps `version`
  // -------------------------------------------------------------------------

  /**
   * Insert text into a row. O(log n) plus the string splice: the size index
   * absorbs the length change without touching any other row.
   */
  insertText(row: number, offset: number, text: string): void {
    if (!text) return;
    const current = this.#text[row];
    this.#text[row] = current.slice(0, offset) + text + current.slice(offset);
    this.#shiftRunsWithin(row, offset, text.length);
    this.#sizes.add(row, text.length);
    this.version++;
  }

  /** Delete a span of text from a row, trimming any mark runs it overlaps. */
  deleteText(row: number, offset: number, length: number): void {
    if (length <= 0) return;
    const current = this.#text[row];
    const end = Math.min(offset + length, current.length);
    const removed = end - offset;
    if (removed <= 0) return;

    this.#text[row] = current.slice(0, offset) + current.slice(end);
    this.#trimRunsWithin(row, offset, removed);
    this.#sizes.add(row, -removed);
    this.version++;
  }

  /**
   * Insert rows at `at`.
   *
   * Unavoidably O(n): every subsequent row index shifts, which the size index
   * cannot absorb — it has to be rebuilt. The columns themselves move inside
   * their existing buffers when capacity allows, so the cost is a memmove rather
   * than an allocation per column.
   */
  insertRows(at: number, inputs: ColumnarRowInput[]): void {
    const count = inputs.length;
    if (count === 0) return;

    this.#ensureCapacity(this.#rows + count);
    const tail = this.#rows - at;

    if (tail > 0) {
      this.#type.copyWithin(at + count, at, at + tail);
      this.#kind.copyWithin(at + count, at, at + tail);
      this.#parent.copyWithin(at + count, at, at + tail);
      this.#depth.copyWithin(at + count, at, at + tail);
    }

    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      const input = inputs[i];
      const row = at + i;
      const kind = input.kind ?? RowKind.Text;
      this.#type[row] = this.typeId(input.type);
      this.#kind[row] = kind;
      this.#parent[row] = input.parent ?? -1;
      this.#depth[row] = input.depth ?? 0;
      texts.push(input.text ?? '');
    }
    this.#text.splice(at, 0, ...texts);

    // Where the shifted runs begin — computed before the shift, so the new rows'
    // runs can be spliced straight into place.
    const [insertAtQuad] = this.#rowRunRange(at);
    this.#rows += count;
    this.#shiftRowKeys(at, count);

    // Mark runs for the new rows, now that their indices are final. Shifting
    // preserves relative order, so these only need placing at the boundary —
    // re-sorting the whole array here cost more than everything else combined.
    const fresh: number[] = [];
    for (let i = 0; i < count; i++) {
      const input = inputs[i];
      if (input.attrs) this.#attrs.set(at + i, { ...input.attrs });
      for (const run of [...(input.marks ?? [])].sort((a, b) => a.start - b.start)) {
        fresh.push(at + i, run.start, run.end, this.markId(run.mark));
      }
    }
    if (fresh.length) this.#markRuns.splice(insertAtQuad * 4, 0, ...fresh);

    // Batched: a rebuilding index rebuilds once for the whole insert, not once
    // per row.
    const inserted: number[] = new Array(count);
    for (let i = 0; i < count; i++) inserted[i] = rowSize(this.#kind[at + i] as RowKind, this.#text[at + i]);
    this.#sizes.insertMany(at, inserted);
    this.version++;
  }

  /** Remove `count` rows starting at `at`, along with their marks and attributes. */
  removeRows(at: number, count: number): void {
    if (count <= 0 || at >= this.#rows) return;
    const actual = Math.min(count, this.#rows - at);
    const tail = this.#rows - (at + actual);

    if (tail > 0) {
      this.#type.copyWithin(at, at + actual, at + actual + tail);
      this.#kind.copyWithin(at, at + actual, at + actual + tail);
      this.#parent.copyWithin(at, at + actual, at + actual + tail);
      this.#depth.copyWithin(at, at + actual, at + actual + tail);
    }
    this.#text.splice(at, actual);

    // Drop the removed rows' runs as one contiguous slice, then shift only the
    // row keys that follow — rather than rebuilding the whole run array.
    const [from] = this.#rowRunRange(at);
    const [, to] = this.#rowRunRange(at + actual - 1);
    if (to > from) this.#markRuns.splice(from * 4, (to - from) * 4);
    for (let quad = from; quad * 4 < this.#markRuns.length; quad++) {
      this.#markRuns[quad * 4] -= actual;
    }
    this.#rows -= actual;

    // Parent pointers still reference pre-removal indices. A parent past the
    // removed range shifts down with its row; a parent inside it is gone, so
    // the child becomes a root rather than pointing at an unrelated row.
    for (let row = 0; row < this.#rows; row++) {
      if (this.#parent[row] >= at + actual) this.#parent[row] -= actual;
      else if (this.#parent[row] >= at) this.#parent[row] = -1;
    }

    const attrs = new Map<number, Record<string, unknown>>();
    for (const [row, value] of this.#attrs) {
      if (row >= at && row < at + actual) continue;
      attrs.set(row >= at + actual ? row - actual : row, value);
    }
    this.#attrs = attrs;

    this.#sizes.removeMany(at, actual);
    this.version++;
  }

  /**
   * Replace a row's mark runs wholesale, in place — no full-array rebuild.
   *
   * Ranges carrying the same mark are merged when they overlap or touch, and
   * empty ranges are dropped, so callers can layer additions over existing
   * coverage without the row accumulating duplicate runs — an insert into a
   * marked run plus an explicit range for the inserted text is one run.
   */
  setMarks(row: number, runs: { start: number; end: number; mark: ASTMark }[]): void {
    const [from, to] = this.#rowRunRange(row);

    const byId = new Map<number, { start: number; end: number }[]>();
    for (const run of runs) {
      if (run.end <= run.start) continue;
      const id = this.markId(run.mark);
      let list = byId.get(id);
      if (!list) byId.set(id, (list = []));
      list.push({ start: run.start, end: run.end });
    }
    const merged: { start: number; end: number; id: number }[] = [];
    for (const [id, list] of byId) {
      list.sort((a, b) => a.start - b.start);
      let current = list[0];
      for (let i = 1; i < list.length; i++) {
        const next = list[i];
        if (next.start <= current.end) current.end = Math.max(current.end, next.end);
        else {
          merged.push({ start: current.start, end: current.end, id });
          current = next;
        }
      }
      merged.push({ start: current.start, end: current.end, id });
    }
    merged.sort((a, b) => a.start - b.start);

    const replacement: number[] = [];
    for (const run of merged) replacement.push(row, run.start, run.end, run.id);
    this.#markRuns.splice(from * 4, (to - from) * 4, ...replacement);
    this.version++;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  #ensureCapacity(needed: number) {
    if (needed <= this.#type.length) return;
    let cap = this.#type.length || 16;
    while (cap < needed) cap *= 2;

    const type = new Int32Array(cap);
    type.set(this.#type.subarray(0, this.#rows));
    const kind = new Uint8Array(cap);
    kind.set(this.#kind.subarray(0, this.#rows));
    const parent = new Int32Array(cap);
    parent.set(this.#parent.subarray(0, this.#rows));
    const depth = new Uint8Array(cap);
    depth.set(this.#depth.subarray(0, this.#rows));

    this.#type = type;
    this.#kind = kind;
    this.#parent = parent;
    this.#depth = depth;
  }

  /** Shift run and attr row keys, and parent pointers, after an insertion. */
  #shiftRowKeys(at: number, count: number) {
    for (let i = 0; i < this.#markRuns.length; i += 4) {
      if (this.#markRuns[i] >= at) this.#markRuns[i] += count;
    }
    const attrs = new Map<number, Record<string, unknown>>();
    for (const [row, value] of this.#attrs) attrs.set(row >= at ? row + count : row, value);
    this.#attrs = attrs;

    for (let row = 0; row < this.#rows; row++) {
      if (this.#parent[row] >= at && row >= at + count) this.#parent[row] += count;
    }
  }

  /**
   * The `[from, to)` quad range belonging to a row.
   *
   * Runs are kept sorted by row, so this is two binary searches rather than a
   * scan of every run in the document — the difference between a text edit
   * costing O(runs in row) and O(runs in document). Getting this wrong made an
   * insert 7x slower than the nested tree.
   */
  #rowRunRange(row: number): [number, number] {
    const quads = this.#markRuns.length >> 2;
    let lo = 0;
    let hi = quads;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#markRuns[mid * 4] < row) lo = mid + 1;
      else hi = mid;
    }
    const from = lo;
    hi = quads;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.#markRuns[mid * 4] <= row) lo = mid + 1;
      else hi = mid;
    }
    return [from, lo];
  }

  /** Move mark boundaries at or after `offset` in `row` by `delta`. */
  #shiftRunsWithin(row: number, offset: number, delta: number) {
    const [from, to] = this.#rowRunRange(row);
    for (let quad = from; quad < to; quad++) {
      const i = quad * 4;
      if (this.#markRuns[i + 1] >= offset) this.#markRuns[i + 1] += delta;
      // An insert at the very end of a run extends it; inside or before, shifts.
      if (this.#markRuns[i + 2] >= offset) this.#markRuns[i + 2] += delta;
    }
  }

  /** Contract mark boundaries around a deletion, dropping runs it swallows. */
  #trimRunsWithin(row: number, offset: number, length: number) {
    const [from, to] = this.#rowRunRange(row);
    if (from === to) return;

    const end = offset + length;
    const clamp = (p: number) => (p <= offset ? p : p >= end ? p - length : offset);
    const survivors: number[] = [];

    for (let quad = from; quad < to; quad++) {
      const i = quad * 4;
      const start = clamp(this.#markRuns[i + 1]);
      const stop = clamp(this.#markRuns[i + 2]);
      if (stop > start) survivors.push(row, start, stop, this.#markRuns[i + 3]);
    }

    // Splice only this row's slice; the rest of the array is untouched.
    this.#markRuns.splice(from * 4, (to - from) * 4, ...survivors);
  }

  #rebuildSizes() {
    const sizes = new Int32Array(this.#rows);
    for (let row = 0; row < this.#rows; row++) sizes[row] = rowSize(this.#kind[row] as RowKind, this.#text[row]);
    this.#sizes.reset(sizes, this.#rows);
  }

  /** Used by the converters to push a fully-formed row without re-sorting per row. */
  _pushRow(typeName: string, kind: RowKind, text: string, parent: number, depth: number, attrs?: Record<string, unknown>) {
    this.#ensureCapacity(this.#rows + 1);
    const row = this.#rows;
    this.#type[row] = this.typeId(typeName);
    this.#kind[row] = kind;
    this.#parent[row] = parent;
    this.#depth[row] = depth;
    this.#text.push(text);
    if (attrs) this.#attrs.set(row, { ...attrs });
    this.#rows++;
    return row;
  }

  _setRowText(row: number, text: string) {
    this.#text[row] = text;
  }

  _pushRun(row: number, start: number, end: number, markId: number) {
    this.#markRuns.push(row, start, end, markId);
  }

  _finalise() {
    this.#rebuildSizes();
  }
}

/** Mirrors the void/text/container distinction used by the position maths. */
function kindOf(block: ASTBlockNode): RowKind {
  const content = block.content as unknown[] | undefined;
  if (!content || content.length === 0) return RowKind.Void;
  return typeof (content[0] as ASTInlineNode)?.text === 'string' ? RowKind.Text : RowKind.Container;
}

/**
 * Build the columnar form of a nested document.
 *
 * Rows are emitted in document order — a parent always precedes its children —
 * so a forward scan of the columns visits the tree in the order a recursive walk
 * would.
 */
export function toColumnar(doc: ASTDocument, index: 'flat' | 'chunked' = 'flat'): ColumnarDocument {
  const cd = new ColumnarDocument(Math.max(16, doc.length * 2), index);

  const emit = (block: ASTBlockNode, parent: number, depth: number): void => {
    const kind = kindOf(block);
    const row = cd._pushRow(block.type, kind, '', parent, depth, block.attrs);

    if (kind === RowKind.Text) {
      let text = '';
      const runs: [number, number, ASTMark][] = [];
      for (const node of block.content as ASTInlineNode[]) {
        const start = text.length;
        text += node.text ?? '';
        const end = text.length;
        for (const mark of node.marks ?? []) runs.push([start, end, mark]);
      }
      cd._setRowText(row, text);
      for (const [start, end, mark] of runs) cd._pushRun(row, start, end, cd.markId(mark));
      return;
    }

    if (kind === RowKind.Container) {
      for (const child of block.content as ASTBlockNode[]) emit(child, row, depth + 1);
    }
  };

  for (const block of doc) emit(block, -1, 0);
  cd._finalise();
  return cd;
}

/**
 * Rebuild the nested document from the columnar form.
 *
 * Runs are re-split at every mark boundary, so a segment covered by two
 * overlapping marks correctly carries both. Adjacent segments sharing the same
 * marks are merged, which means a document that arrived with redundant adjacent
 * runs comes back normalised rather than byte-identical.
 */
export function fromColumnar(cd: ColumnarDocument): ASTDocument {
  const rows = cd.rows;
  const blocks: ASTBlockNode[] = new Array(rows);
  const childrenOf = new Map<number, ASTBlockNode[]>();

  const runsByRow = new Map<number, number[]>();
  const runs = cd.markRuns;
  for (let i = 0; i < runs.length; i += 4) {
    const row = runs[i];
    let list = runsByRow.get(row);
    if (!list) runsByRow.set(row, (list = []));
    list.push(runs[i + 1], runs[i + 2], runs[i + 3]);
  }

  for (let row = 0; row < rows; row++) {
    const kind = cd.kindOf(row);
    const block: ASTBlockNode = { type: cd.typeOf(row), content: [] };
    const attrs = cd.attrsOf(row);
    if (attrs) block.attrs = { ...attrs };

    if (kind === RowKind.Text) block.content = rebuildInline(cd, cd.textOf(row), runsByRow.get(row));
    else if (kind === RowKind.Container) childrenOf.set(row, block.content as ASTBlockNode[]);

    blocks[row] = block;
  }

  const top: ASTBlockNode[] = [];
  for (let row = 0; row < rows; row++) {
    const parent = cd.parentOf(row);
    if (parent < 0) top.push(blocks[row]);
    else childrenOf.get(parent)?.push(blocks[row]);
  }
  return top;
}

function rebuildInline(cd: ColumnarDocument, text: string, runs: number[] | undefined): ASTInlineNode[] {
  if (!runs || runs.length === 0) return [{ type: 'text', text }];

  const cuts = new Set<number>([0, text.length]);
  for (let i = 0; i < runs.length; i += 3) {
    cuts.add(runs[i]);
    cuts.add(runs[i + 1]);
  }
  const points = [...cuts].filter((p) => p >= 0 && p <= text.length).sort((a, b) => a - b);

  const out: ASTInlineNode[] = [];
  let previousSignature: string | null = null;

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start === end) continue;

    const ids: number[] = [];
    for (let r = 0; r < runs.length; r += 3) {
      if (runs[r] <= start && runs[r + 1] >= end) ids.push(runs[r + 2]);
    }
    const signature = ids.join(',');

    // Carry the ids forward rather than reverse-searching markDefs to compare.
    if (previousSignature === signature && out.length) {
      out[out.length - 1].text += text.slice(start, end);
      continue;
    }

    const node: ASTInlineNode = { type: 'text', text: text.slice(start, end) };
    if (ids.length) node.marks = ids.map((id) => cloneMark(cd.markDefs[id]));
    out.push(node);
    previousSignature = signature;
  }

  return out.length ? out : [{ type: 'text', text: '' }];
}

function cloneMark(mark: ASTMark): ASTMark {
  return mark.attrs ? { type: mark.type, attrs: { ...mark.attrs } } : { type: mark.type };
}
