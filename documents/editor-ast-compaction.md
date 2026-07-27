# Draft: shrinking the editor AST

Status: **proposal, nothing implemented.** Numbers below are measured on this
machine against the current `ship-editor` source, not estimates.

## The short version

For a 1,000-paragraph document containing **235 KB of actual text**, the current
AST retains **844 KB** — meaning we spend **609 KB describing the structure of
235 KB of prose**. A packed representation holds the same document in **255 KB**,
of which only **20 KB** is structure.

| | Current | Packed | Change |
|---|---|---|---|
| Retained heap | 844 KB | 255 KB | **−70%** |
| Structural overhead (excl. text) | 609 KB | 20 KB | **−97%** |
| Heap objects | 20,381 | 6,880 | **−66%** |
| Bytes per character | 3.59 | 1.09 | **−70%** |
| `logicalToPos` (last block) | 0.027 ms | 0.00003 ms | **~900× faster** |
| `posToLogical` (end of doc) | 0.029 ms | 0.00006 ms | **~490× faster** |

Method: 10 copies of each representation, measured with `heapStats()` from
`bun:jsc` against a baseline taken while nothing else was allocating, forced GC
either side. Timings are the mean of 2,000 iterations after 50 warm-up passes.

## Where the memory actually goes

The document above has 1,000 blocks but **4,999 inline nodes**. Each one is a
separate heap object:

```ts
{ type: 'text', text: 'some words ', marks?: [{ type: 'bold' }] }
```

So a single paragraph with mixed formatting becomes one block object, one
`content` array, five-ish inline objects, five-ish separate strings, plus a
`marks` array and a mark object per formatted run. The text `'bold'` appears
779 times in this document as 779 distinct mark objects.

Three things follow from that:

1. **Object headers dominate.** 4,999 inline objects plus their strings and mark
   arrays cost more than the prose they describe.
2. **Every text edit re-allocates strings.** `sliceInline` calls
   `structuredClone(node)` per node and `text.slice(s, e)`, so typing a character
   rebuilds the run objects around the caret.
3. **Marks are never shared.** Identical `{ type: 'bold' }` objects are allocated
   per run rather than pointing at one interned entry.

## The proposed shape

Keep one string per block, describe formatting as ranges over it, and intern the
repeated vocabulary.

```ts
interface PackedBlock {
  typeId: number;        // index into a shared type table ('paragraph', 'heading', …)
  text: string;          // the whole block's text, one string
  markRuns: Int32Array;  // flat [start, end, markId] triples; shared EMPTY when unformatted
  attrs?: Record<string, unknown>;
}

class PackedDoc {
  blocks: PackedBlock[];
  prefix: Int32Array;    // prefix[i] = total size of blocks [0, i)
  types: TypeTable;      // 2 entries for the benchmark document
  marks: MarkTable;      // 2 entries, vs 779 mark objects today
}
```

`markRuns` is deliberately a flat `Int32Array` rather than an array of objects —
it is contiguous, has no per-entry header, and unformatted blocks share a single
frozen empty array.

## Why traversal gets faster

This is the part that matters more than the bytes, and it is not really about
the representation — it is about `nodeSize`.

`nodeSize()` recomputes a block's size by walking its entire subtree, and it is
uncached. `logicalToPos` then calls it **once per preceding block**:

```ts
for (let i = 0; i < lp.blockIndex && i < doc.length; i++) pos += nodeSize(doc[i]);
```

So placing the caret in the last block of a 1,000-block document walks the whole
document. Every caret move, every selection change, every remote op that needs
position mapping pays this. `posToLogical` has the same shape.

The prefix-sum index replaces that with an array lookup:

- `logicalToPos` → `prefix[blockIndex] + 1 + offset`, **O(1)**
- `posToLogical` → binary search over `prefix`, **O(log n)**

Only the suffix after an edited block needs reindexing, so a single-block edit
costs one `Int32Array` write pass rather than a document walk per query.

**This is worth doing even if we adopt nothing else.** A memoised size field on
the existing `ASTBlockNode` would capture most of the traversal win without
changing the node shape at all.

### Correctness check

I cross-checked the prefix index against the current implementation over **40
random documents and 94,733 positions**, comparing total document size, the
block each position resolves to, and the character offset within that block.
Zero mismatches. The index is a drop-in for the position maths as it stands.

## Three problems worth fixing regardless of the representation

These are independent of the AST shape and are, honestly, the bigger wins.

### 1. `diffFlat` allocates one string per character — 19.8 ms per keystroke

`tokens()` builds a string like `` `#${char}:${marks}` `` for **every character in
the document**, on every diff:

```ts
for (let i = 0; i < text.length; i++) out.push(`#${text[i]}:${marks}`);
```

For the 1,000-paragraph document that is ~235,000 string allocations per call,
plus a `JSON.stringify` of the marks per run. Measured:

| Document | `diffDocuments` | `diffFlat` |
|---|---|---|
| 200 paragraphs | 0.19 ms | **3.53 ms** |
| 1,000 paragraphs | 0.72 ms | **19.83 ms** |

19.8 ms lands inside the frame budget for a single keypress, and it is pure
garbage — the result is one `StepMap` with a single range.

`stepMapFromOp()` already exists and derives the same `StepMap` from an op in
O(blocks) with no allocation. Since `#commit` already computes the op via
`diffDocuments`, the fix is to feed that op to `stepMapFromOp` instead of
re-diffing both documents from scratch. **This is the single highest-value change
in this document** and does not require touching the AST at all.

### 2. The undo stack is unbounded

`#commit` does `this.#undoStack.update((s) => [...s, tx])` with no cap. Every
transaction retains `structuredClone`d `removed` and `inserted` fragments, so a
long editing session grows without limit. A bounded ring buffer (a few hundred
entries) would cap it. Worth confirming the desired depth before picking a number.

### 3. Deep clones where structural sharing would do

`structuredClone` appears throughout `sliceInline`, `applyOp`, `diffDocuments`
and the engine's mark handling. Nodes are already treated as immutable — ops
rebuild arrays rather than mutating in place — so most of these clones are
defensive rather than necessary. `blocksEqual` is also
`JSON.stringify(a) === JSON.stringify(b)`, which serialises entire blocks to
compare them, in a loop over every block.

## Suggested order

Ordered by value per unit of risk, not by how interesting they are:

1. **`stepMapFromOp` instead of `diffFlat`** — biggest measured win, smallest
   change, no representation change.
2. **Memoise block size / add the prefix index** — kills the O(document) caret
   maths. Verified equivalent above.
3. **Cap the undo stack** — bounded memory, trivially reversible.
4. **Intern marks and block types** — 779 objects → 2 here; cheap and contained.
5. **Pack inline runs into one string + `markRuns`** — the 70% number, but the
   most invasive: serializers, behaviors, and everything reading
   `block.content` as inline nodes would need to move to a range API.

Steps 1–4 are additive and independently shippable. Step 5 is the one that
deserves a real design discussion before anyone writes code.

## Addendum: shorthand keys and a columnar layout

Two follow-up ideas, both measured on the same 1,000-paragraph document. One of
them does not do what it looks like it should.

### Shorthand keys (`text` → `x`, `marks` → `m`) save nothing in memory

Renaming properties is intuitively appealing but JavaScript engines already store
property *names* once per object **shape** (the hidden class), not once per
instance. Two arrays of 20,000 otherwise-identical objects:

| Keys | Heap | Objects |
|---|---|---|
| `{ type, text, markRuns }` | 2,157,785 B | 57,587 |
| `{ t, x, m }` | 2,174,797 B | 58,200 |

The shorthand version measured **0.8% larger** — that is noise, and the honest
reading is "identical". There is no per-object cost to a longer property name.

On the wire it does help a little, but less than you would hope:

| Format | Raw JSON | gzipped |
|---|---|---|
| 1. current | 430.4 KB | 49.6 KB |
| 2. packed, verbose keys | 266.1 KB | 45.4 KB |
| 3. packed, shorthand keys | 255.8 KB | 44.9 KB |
| 4. columnar (field named once) | 245.7 KB | 43.8 KB |

Shorthand keys buy **4% raw, 1% gzipped** over verbose keys. gzip's whole job is
collapsing repeated literals, so it already erases most of what key-shortening
would win. **Recommendation: don't.** It costs readable payloads and debuggable
dev-tools output to save ~500 bytes on a 44 KB response.

Note the wider point in that table: raw JSON drops 43% from packing, but only
**12% gzipped**. If documents move over a compressed transport, the wire is not
where the win is. The win is RAM.

### Columnar *is* the right instinct — for memory

Describing each field once, CSV-style, turns out to be the best in-memory shape,
for a reason that has nothing to do with key names: it removes the per-object
header entirely. 1,000 block objects become a handful of typed arrays.

Three variants measured, same document:

| Representation | Heap | Objects | vs current |
|---|---|---|---|
| Current | 883 KB | 21,304 | — |
| Packed, array-of-structs | 284 KB | 7,326 | −68% |
| Columnar, one global text corpus | 241 KB | 6,144 | −73% |
| **Hybrid: typed-array columns + one string per block** | **201 KB** | **4,558** | **−77%** |

```ts
class HybridDoc {
  types: string[];        // interned vocabulary, once
  markDefs: Mark[];       // 779 mark objects → 2 entries
  blockType: Int32Array;  // one column
  prefix: Int32Array;     // running position — O(1) logicalToPos, O(log n) reverse
  text: string[];         // one string per block
  markRuns: Int32Array;   // flat [blockIndex, start, end, markId] quads
  attrs: Map<number, object>;  // sparse — only blocks that have any
}
```

The hybrid beats the fully columnar version because it drops the per-block object
*and* the corpus offset table, while keeping strings per block.

**Why not one global text corpus?** It measures slightly worse and edits worse.
Inserting a character means rebuilding the whole 235 KB string: 2.2 µs versus
0.17 µs for a per-block string, 13× slower. In absolute terms 2.2 µs is nothing
against a 16 ms frame, so this is not disqualifying — but it allocates ~235 KB of
garbage per keystroke, and per-block strings avoid that for free. If a global
corpus is ever wanted, it needs a piece table or rope, not plain concatenation.

### Traversal

Columnar helps here too, and not only through the prefix index:

| Operation | Current | Columnar |
|---|---|---|
| `posToLogical` (end of document) | 0.027 ms | 0.000075 ms (**360×**) |
| Scan every block's length | 0.0163 ms | 0.0021 ms (**7.6×**) |

The second row is pure cache locality — walking an `Int32Array` instead of
chasing 5,000 object pointers across the heap. No algorithmic change.

### Other small wins found along the way

- **Empty attrs.** Every paragraph and heading currently carries
  `attrs: { align: "" }` — a whole object per block to hold an empty string.
  Dropping empty-valued attrs at parse time is a few lines in the serializer.
  This is folded into all the packed numbers above.
- **Flattened lists.** `bullet-list` → `list-item` nesting collapses into a
  `depth` column, so container recursion disappears from every traversal.

### Array-of-arrays (positional tuples) — measured worse on all three axes

Worth testing, since it moves field names into the type system entirely:

```ts
type BlockTuple = readonly [type: number, text: string, marks: Int32Array | null, attrs: object | null];
```

Same document, same interning, only the per-block container differs:

| | Heap | Objects | Raw JSON | gzipped | Read all fields | Filter by type |
|---|---|---|---|---|---|---|
| Packed objects | 259 KB | 6,750 | 258.7 KB | 45.1 KB | 0.00270 ms | 0.00144 ms |
| **Packed tuples** | **271 KB** | **7,929** | 247.9 KB | 44.7 KB | **0.00316 ms** | 0.00147 ms |
| Columnar hybrid | **211 KB** | **5,140** | **245.7 KB** | **43.8 KB** | **0.00142 ms** | **0.00079 ms** |

Tuples are **4.5% heavier** than objects and **17% slower to read**. Both results
have the same cause, and it is worth understanding because it explains why
columnar wins:

- **A JS array is an object plus a separate elements backing store.** A
  fixed-shape object with four named properties stores them inline, with the
  names held once in the shared hidden class. The tuple version allocates the
  block *and* its element storage — hence 1,179 extra objects.
- **A mixed-type array cannot use a specialised element kind.** `[number, string,
  Int32Array | null, object | null]` forces generic boxed storage. An engine can
  only use its fast packed representations when the elements are uniformly
  numbers.
- **Monomorphic property access is not slower than indexing.** `b.text` on a
  stable shape compiles to a direct offset load. `b[1]` needs a bounds check and
  an element-kind check, then a hop through the backing store.

On the wire tuples do save something — 10.8 KB raw — but only **0.4 KB gzipped**,
the same 1% that shorthand keys bought, for the same reason.

The instinct behind the idea is sound: *stop repeating the field description per
instance*. The way to actually cash that in is to split the fields apart by type
so each column can use a specialised representation — which is the columnar
layout — rather than interleaving mixed types in one array, which defeats every
optimisation the engine has.

There is also a maintenance cost worth naming: labelled tuple types give
compile-time names, but positional access means inserting a field in the middle
silently reindexes every read site. Columnar keeps real names on the columns.

### Revised recommendation

Add to the ordered list above, between steps 4 and 5:

> **4b. Adopt the hybrid columnar layout** rather than an array of packed structs.
> Same migration surface as step 5, better result (−77% vs −68%), and it makes
> full-document scans 7.6× faster as a side effect.

And explicitly **drop** two ideas from consideration, both measured:

- **Shorthand property keys** — zero memory benefit, 1% gzipped.
- **Array-of-arrays block tuples** — 4.5% heavier than objects, 17% slower to
  read, 1% gzipped. Columnar delivers what this was reaching for, and more.

## Implemented: `ColumnarDocument` (branch `editor-columnar-model`)

`editor-columnar.ts` is now a mutable, Fenwick-indexed columnar model rather than
a pair of converters. Measured against the **real** shipped code on a 1,000-block
document, p50 over 40 rounds:

| | Tree | Columnar | |
|---|---|---|---|
| Heap | 903 KB | 216 KB | **−76%** |
| Heap objects | 21,605 | 4,706 | **−78%** |
| position → block | 0.0363 | 0.000018 | **1994×** |
| block → position | 0.0341 | 0.000009 | **3440×** |
| insert char | 0.000871 | 0.000182 | **4.8×** |
| paste ~10 KB into one block | 0.000833 | 0.000193 | **4.3×** |

Write figures perform the operation *and* its inverse, so a single edit is around
half those numbers. Correctness is checked against the tree implementation in the
same run: total size, `posToRow` and `rowToPos` all agree, and a round-trip
preserves document size.

Design decisions that mattered:

- **Mutable, not persistent.** Copying every column per keystroke cost ~50× more
  than the edit itself. Undo here is already op-based (`EditorTransaction` stores
  an `EditorOp` and inverts it), so document identity was never load-bearing, and
  change detection can hang off the `version` counter that ticks on every
  mutation.
- **Fenwick size index instead of a cumulative `prefix` column.** A prefix column
  is invalidated across its whole suffix by any length change; a Fenwick absorbs
  it in O(log n).
- **Capacity-backed columns.** Structural edits `copyWithin` inside the existing
  buffer and only reallocate on growth.
- **Row-sorted mark runs with binary-searched ranges.** See below.

### The same bug, twice

The first version of the class scanned every mark run in the document to find the
ones belonging to one row — the identical mistake the earlier `columnarMarksAt`
made, reintroduced when the file was rewritten. It made an insert **7.5× slower
than the nested tree** (0.00712 vs 0.000949), a 285× regression against the
prototype.

Runs are kept sorted by row, so `#rowRunRange` binary-searches the slice
belonging to a row and every text edit works only within it. That single change
took inserts from 0.00712 to 0.000182.

Worth stating plainly because it is the failure mode this representation invites:
**a flat array is only fast if you never scan it end to end**, and the prototype
that suggested 40× was not maintaining mark ranges at all. The shipped class does
strictly more work than the prototype and is still ~5× faster than the tree.

### Full stat sheet: tree vs flat Fenwick vs chunked Fenwick

`ColumnarDocument` takes an index strategy — `'flat'` (plain Fenwick) or
`'chunked'` (Fenwick over chunk totals, row sizes local to each chunk). Both are
covered by tests asserting they produce identical sizes, starts, positions and
documents after the same edit script, including across chunk splits.

1,000-block document, 235 KB of text. Times are ms p50; columnar write rows
perform the operation *and* its inverse, so a single op is about half.

**Size**

| | Heap | Objects | vs tree |
|---|---|---|---|
| Tree | 903 KB | 21,605 | — |
| Columnar, flat | **224 KB** | **4,667** | **−75.2% / −78.4%** |
| Columnar, chunked | 250 KB | 5,522 | −72.3% / −74.4% |

Chunking costs ~26 KB, because each chunk is a JS `number[]` rather than one
contiguous typed array.

**Reads**

| Operation | Tree | Flat | Chunked | flat× | chunked× |
|---|---|---|---|---|---|
| position → block | 0.018609 | **0.000017** | 0.000021 | **1095×** | 886× |
| block → position | 0.017084 | **0.000011** | 0.000022 | **1553×** | 777× |
| extract all text | 0.028236 | 0.003189 | 0.003149 | 8.9× | 9.0× |
| count blocks of a type | 0.001955 | 0.001586 | 0.001586 | 1.2× | 1.2× |

Chunking roughly halves position-query speed — a `findRow` now descends to a
chunk and scans inside it — but at 0.00002 ms against the tree's 0.017 that is
irrelevant in absolute terms.

**Writes**

| Operation | Tree | Flat | Chunked | flat× | chunked× |
|---|---|---|---|---|---|
| insert char mid-document | 0.000878 | **0.000182** | 0.000190 | 4.8× | 4.6× |
| paste ~10 KB into one block | 0.000834 | **0.000207** | 0.000212 | 4.0× | 3.9× |
| insert block mid-document | **0.002972** | 0.016072 | 0.005544 | 0.2× | 0.5× |
| append block at end | 0.002157 | 0.011667 | **0.001562** | 0.2× | **1.4×** |

**What chunking buys:** appending a block goes from 5.4× slower than the tree to
**1.4× faster**, and a mid-document insert improves 2.9× (0.0161 → 0.0055),
though it remains 1.9× slower than an array splice. Text editing is unchanged,
which is the point — chunking was not supposed to cost anything there, and it
does not.

**A regression to note:** making the index pluggable meant `insertRows` calls
`index.insert()` per row, and the flat Fenwick's insert is a full rebuild — so
inserting *k* rows now costs *k* rebuilds. That is why flat's block-insert figure
(0.0161) is worse than the 0.0128 measured before the refactor. A batched insert
would fix it; chunked is the better answer for block-heavy work regardless.

### Remote (collaborator) ops: flat does *not* win

Local typing and remote ops are different workloads. `applyRemoteOperation`
remaps the live selection and the selected block on **every** op — four position
queries — and remote edits land at arbitrary rows rather than at a caret.

Per remote op, sweeping the share that create a block rather than type a
character:

| block ops | flat | chunked | winner |
|---|---|---|---|
| 0% (pure text) | **0.000593** | 0.000665 | flat, 1.12× |
| 1% | 0.001302 | **0.000651** | chunked, 2.0× |
| 2% | 0.001318 | **0.000712** | chunked, 1.91× |
| 5% | 0.001337 | **0.000729** | chunked, 1.83× |
| 10% | 0.002237 | **0.001018** | chunked, 2.2× |
| 25% | 0.004658 | **0.001835** | chunked, 2.54× |
| 50% | 0.008145 | **0.003152** | chunked, 2.58× |
| 100% | 0.016279 | **0.006158** | chunked, 2.64× |

**What "block ops" means.** A *block op* creates or removes a block — Enter
(split), Backspace at the start of a block (merge), a new list item, pasting
several paragraphs, deleting a block. A *text op* edits characters inside an
existing block. The percentage is the share of incoming remote operations that
are block ops.

A finer sweep puts the crossover between **0.25% and 0.5%**:

| block ops | flat | chunked | winner |
|---|---|---|---|
| 0% | **0.000556** | 0.000709 | flat, 1.28× |
| 0.25% | **0.000516** | 0.000538 | flat, 1.04× (a tie) |
| 0.5% | 0.000984 | **0.000831** | chunked, 1.18× |
| 1% | 0.000645 | **0.000567** | chunked, 1.14× |
| 2% | 0.000824 | **0.000655** | chunked, 1.26× |
| 5% | 0.001338 | **0.000950** | chunked, 1.41× |

**Translated into writing**, one block op per *N* characters typed is a ratio of
1/(N+1), so the ~0.4% crossover is roughly **one Enter per 250 characters**:

| Document shape | chars per block | block ops | wins |
|---|---|---|---|
| Long-form prose (300–500 char paragraphs) | ~400 | ~0.25% | **flat**, narrowly |
| Structured doc, short paragraphs + headings | ~150 | ~0.7% | chunked |
| Lists, outlines, bullet notes | ~40 | ~2.4% | **chunked** |
| Heavy restructuring (splitting, reordering) | — | >5% | **chunked** |

An earlier draft of this document claimed any real multi-user session exceeds 1%.
That is **wrong for long-form prose**, which sits just on flat's side. It is right
for lists and outlines.

The crossover is much lower here than for local typing, and the arithmetic
explains it. Flat's per-op advantage on pure text is 0.00007 ms; its block-insert
penalty is 0.0106 ms. That breaks even at roughly 150 ops per block op — **0.7%**.
For local typing the same sum uses flat's larger per-keystroke advantage
(0.00019 ms) and breaks even near 56 keystrokes per Enter, which real prose sits
right on top of.

Two things to hold alongside this:

- **`diffFlat` used to dwarf both — it no longer does.** It was 36.3 ms per
  remote op on a 1000-block document; it is now **0.0985 ms**, a 369x fix
  (see [editor-performance.md](./editor-performance.md)). It sits on the *tree*
  path only — a columnar document would derive its `StepMap` from its own ops and
  never call it — so the sweep above is unchanged by the fix. What changed is the
  baseline it is measured against: the index choice is now a visible share of a
  remote op rather than 0.3% noise.
- Flat's block-insert figure carries the per-row rebuild regression noted above.
  Fixing it would recover ~20%, which does not move the crossover past ~1%.

### Recommendation

- **Single-user editing → `'flat'`.** Wins every read, wins the per-keystroke
  write, uses ~26 KB less, and prose sits just on its side of the break-even.
- **Collaborative or block-heavy → `'chunked'`.** Above ~0.4% block ops, which
  means lists, outlines and structured documents — but *not* long-form prose,
  which sits just on flat's side.
- **Keep the absolute numbers in view.** After the `diffFlat` fix a remote op on
  the *tree* path costs ~0.0985 ms, while the whole flat-vs-chunked difference is
  ~0.0002 ms — under 0.2% of the total. The choice only becomes material if
  columnar owns the document outright, since then `diffFlat` disappears and a
  remote op is ~0.0006 ms, making the index difference ~30% of it.

### Investigation: chunked and B-tree row stores

Block insert was the remaining weakness, so the obvious question was whether a
chunked or B-tree row store fixes it. **It does not, and the profile explains
why.** Marginal cost of inserting one row into a 1,000-row document:

| Phase | ms | share |
|---|---|---|
| shift 4 typed columns (`copyWithin`) | 0.000108 | 1% |
| text column splice | 0.000151 | 1% |
| **Fenwick rebuild** | **0.0043** | **38%** |
| mark run row shift | 0.001618 | 14% |
| **attrs rekey** | **0.005138** | **45%** |

The memmove that a chunked store would eliminate is **2% of the cost**. The other
98% is bookkeeping keyed by row *index*, which shifts on insert.

Three size-index designs measured head to head, all agreeing with a brute-force
prefix scan:

| Operation | Fenwick | Chunked | B-tree |
|---|---|---|---|
| insert one row | 0.00289 | **0.0000976** | 0.00792 |
| position → row | **0.0000135** | 0.0000515 | 0.0000463 |
| row → position | **0.00001** | 0.0000561 | 0.0000517 |
| adjust one row's size (per keystroke) | **0.0000125** | 0.0000478 | 0.0000622 |

- **Chunked wins insert by 30×** — a local splice into one chunk plus that
  chunk's total, instead of rebuilding the whole tree.
- **Fenwick wins every query and the per-keystroke size update by ~4×**, being a
  single contiguous `Int32Array`.
- **The B-tree loses both**, and is *worse at insert than Fenwick's full
  rebuild*. At n≈1000 with order 32 the tree is two levels deep, so O(log n) buys
  nothing, while chasing node objects costs plenty against flat typed arrays. It
  would only start paying somewhere in the 10⁵–10⁶ row range, which is not a
  document.

**Which wins depends on the mix, and typing dominates.** Per keystroke you pay
one size update plus a few position queries: Fenwick ≈ 0.000066, chunked ≈
0.000254. Per Enter, chunked saves ≈ 0.0028. Break-even is around 15 characters
typed per block created; real prose runs 50–80. **Keep the Fenwick.**

### What was fixed instead

The profile pointed at bookkeeping, not structure:

- `insertRows` re-sorted the entire mark-run array after every insert, via an
  array-of-arrays sort and a `flat()`. Shifting row keys preserves relative
  order, so the new rows' runs only need splicing in at the boundary.
- `removeRows` rebuilt the whole run array and the whole attrs map.

Together: block insert+remove **0.0532 → 0.0256 ms, a 2.1× improvement**, with no
change to the data structures.

### Next, if block editing needs to get faster

**Stable row ids, not a B-tree.** Key mark runs and attributes by an id that
never changes rather than by positional index, and insert/remove stop touching
them at all — that is the 45% + 14% = **59%** of the remaining cost, and it works
with the Fenwick exactly as it stands. Only after that would the Fenwick rebuild
(38%) be worth attacking, and the answer there is chunking, not a tree.

### What is still slower

Block insert and removal rebuild the size index, because inserting a row shifts
every subsequent index and a Fenwick cannot absorb that. Measured earlier at
~2.2× slower than the tree even with capacity-backed columns and `copyWithin`;
capacity only bought 23%, so this is structural rather than an implementation
detail. Enter, Backspace-at-start and list manipulation all land here. Closing it
needs a chunked or B-tree row store, not flat arrays.

## Converters (superseded — see above) and whether a runtime swap is worth it

`editor-columnar.ts` now provides `toColumnar()` / `fromColumnar()`, kept internal
alongside `editor-flat-positions.ts` rather than exported.

Measured on the same 1,000-paragraph document, using the real converter rather
than a prototype:

| | Current | Columnar | Change |
|---|---|---|---|
| Heap | 883 KB | 274 KB | **−69%** |
| Objects | 21,304 | 5,716 | **−73%** |
| `toColumnar` | — | 0.19 ms | |
| `fromColumnar` | — | 0.43 ms | |

The round-trip is **semantically lossless, not byte-identical**, and the
difference is deliberate:

- Adjacent runs carrying identical marks **merge** on the way back. That is the
  same normalisation `normalizeInlineNodes` already performs, so a document that
  was already normalised round-trips byte-identical.
- Overlapping marks are re-split at every boundary, so a span covered by bold and
  a link comes back carrying both — which the per-node shape could only express
  by accident of how it was constructed.

Two edge cases are load-bearing and covered by tests:

- **A void block and a block holding empty text are not the same thing.** They
  have sizes 1 and 2 respectively, so conflating them would shift every position
  after them. The `kind` column keeps them distinct.
- **Void rows have no interior position.** `columnarLogicalToPos` returns the
  row's start rather than start+1, matching `logicalToPos`. A test caught this;
  the naive version was off by one for every position after an `<hr>`.

Verification: 300 randomly generated documents round-trip with identical text,
per-character marks, structure, attributes and document size, plus an idempotency
check and agreement with `posToLogical` on flat documents.

### Read and write cost, measured

Same 1,000-block document, same logical operation performed on both. Times in ms.

> **Method.** Earlier drafts of this document reported a single mean over 3,000
> iterations, rounded to 5 decimal places. At the scale the columnar operations
> run (~0.00001 ms) that rounding *is* the measurement — 0.0000113 became
> 0.00001, and the JIT had not settled after only 30 warm-up passes. Everything
> below is 40 independent rounds of 20,000 iterations (200 for the expensive
> ones), reported as percentiles. The tree side reproduces to within 0.06%
> between repeat runs, which is the check that the harness itself is sound.

**Reads — p50, with p99 in brackets:**

| Operation | Tree | Columnar | Speedup (p50 / p99) |
|---|---|---|---|
| position → block | 0.0277 (0.0295) | 0.0000113 (0.0000261) | **2452× / 1132×** |
| block → position | 0.0249 (0.0265) | 0.0000054 (0.0000076) | **4619× / 3486×** |
| extract all text | 0.0216 (0.0254) | 0.0032 (0.0052) | **6.7× / 4.5×** |
| marks at an offset | 0.0000113 | 0.0000135 | **0.84× — columnar is ~19% slower** |

Two corrections to earlier drafts, both from the bad harness:

- The position-maths speedups were **understated** by roughly an order of
  magnitude (287× and 458× were really 2452× and 4619×), because rounding
  inflated the columnar side.
- `columnarMarksAt` is **not** faster than the tree, as previously claimed. At
  p50 it is about 19% slower. The two are comparable; the honest summary is that
  the index removed a real regression rather than delivering a win.

**Writes — superseded, see below.** An earlier version of this table showed
columnar winning text edits. That result did not survive two corrections:

1. The "tree" side was a hand-written proxy built on `spliceInlineContent`, which
   deep-clones per node. It was roughly 5× slower than the real
   `executeInsertText` path, which flattered columnar.
2. `executeInsertText` then stopped deep-cloning the document altogether (see
   [editor-performance.md](./editor-performance.md)), making the real tree
   ~2,100× faster on that path.

Re-measured against the **real** shipped code, p50 over 40 rounds, 1,000 blocks:

| Operation | Tree | Columnar | |
|---|---|---|---|
| insert char mid-document | **0.00107** | 0.00166 | tree **1.6× faster** |
| paste ~10 KB into one block | **0.00086** | 0.00176 | tree **2.0× faster** |
| insert block mid-document | **0.00278** | 0.00660 | tree **2.4× faster** |
| append block at end | 0.0040 | 0.0074 | tree 1.9× faster |
| paste 200 blocks (bulk) | 0.0099 | 0.0142 | tree 1.4× faster |
| paste 200 blocks (one at a time) | 0.627 | 1.871 | tree 3× faster |

For reference, the same char insert before the clone fix: **2.29–3.29 ms**. The
tree was two thousand times slower than columnar on writes; it is now faster than
it on every write measured.

**The conclusion has flipped: columnar loses on writes across the board.** It
previously won two of these rows. Adding or removing a block has to rebuild every
column, shift every mark run's row index and rekey the attrs map, where the tree
splices one array — and now even a single-character edit costs more, because the
prefix column has to be re-run for the suffix while the tree just replaces one
node.

### …but that was an unfair fight, and columnar wins it when optimised

The table above compares an **optimised tree** against a **naive columnar**. The
tree got a path copy; columnar was still copying its whole prefix column and
re-running the cumulative sum across the entire suffix for one character. Giving
columnar the equivalent treatment:

| insert char mid-document | p50 | vs tree |
|---|---|---|
| tree (real, path copy) | 0.001027 | — |
| columnar naive (O(n) prefix rebuild) | 0.00181 | 1.8× slower |
| columnar + Fenwick (still copying columns) | 0.001335 | 1.3× slower |
| **columnar + Fenwick, mutable** | **0.000025** | **~41× faster** |

Two separate costs, and the smaller one is the interesting part:

- **The O(n) prefix rebuild was only ~26% of it.** Replacing the cumulative
  `prefix` column with a Fenwick tree makes a size change O(log n): 0.00181 →
  0.001335. Verified against the materialised column — `prefix(i)` matches at
  every index and `findBlock(pos)` matches binary search at every sampled
  position.
- **The other ~98% of what remained was the immutable column copy.** Copying a
  1000-element `text` array per keystroke dominates everything else. Dropping it
  takes 0.001335 → 0.000025, a further 53×.

So the write disadvantage was never intrinsic to columnar — it was the cost of
pretending a typed-array model is persistent. Note the mutable figure above
performs the edit *and* restores it, so a single edit is nearer 0.0000125.

**Is a mutable model compatible with this engine?** Both things it would need are
already true:

- Undo is **op-based**, not snapshot-based — `EditorTransaction` stores an
  `EditorOp` and `undo()` applies `invertOp`. It never needed document identity.
- Change detection can hang off the existing `version` signal, which already
  increments on every commit, instead of a new document reference.

Cost of the Fenwick on reads, both still ~1000–2500× faster than the tree:

| | materialised prefix | Fenwick |
|---|---|---|
| position → block | 0.000010 | 0.000012 |
| block → position | 0.000005 (O(1)) | 0.000009 (O(log n)) |

**What this does not fix:** block insert and delete still rebuild every column,
because inserting a row shifts every subsequent index — a Fenwick does not help
with that. Enter, Backspace-at-start and list manipulation stay O(n), and that is
the remaining argument against making columnar the live model. It would need a
chunked or gap-buffered row store to close.

So the honest state: **columnar can beat the tree on text editing by ~40× if it
is mutable and Fenwick-indexed**, and still loses on structural editing. Reads and
memory were never in question.

Two consequences:

- **Bulk APIs are mandatory, not a nicety.** Pasting 200 blocks one at a time
  costs 1.87 ms against 0.014 ms for a single bulk insert — a 130× penalty for
  looping. The tree degrades under the same misuse (0.63 ms) but far less
  steeply, because it is only copying one array per step rather than six.
- **Structural churn is the worst case**, and it is exactly what an editor does
  on Enter, Backspace-at-start, and list manipulation. A gap-buffer or
  capacity-with-slack layout would soften this; plain typed-array rebuilds will
  not. Until something like that exists, columnar should not own the live
  document — see the Fenwick results above, which close the text-editing gap but
  leave this one open.

### A regression this benchmark caught

The first version of `columnarMarksAt` scanned every mark run in the document to
find the ones belonging to one row: **9× slower than the tree**, and worsening as
the document grew (0.00075 ms at 847 runs, 0.00771 ms at 4,777 — an order of
magnitude for 5.6× the marks).

Runs are already emitted in row order, so a `markRowStart` index makes each lookup
bounded by the runs in that row.

The first attempt to confirm the fix was itself a bad test: the "heavy" document
had more runs *per row* as well as more runs document-wide, so the two variables
moved together and a correct implementation would also have looked slower. The
proper version holds the queried row **identical** — always the same three runs,
two of them marked — and varies only the mark density of every *other* row:

| Marks on other rows | Runs in document | Runs in queried row | p50 | p90 | p99 |
|---|---|---|---|---|---|
| none | 2 | 2 | 0.0000135 | 0.0000200 | 0.0000503 |
| 15% | 962 | 2 | 0.0000137 | 0.0000155 | 0.0000439 |
| 50% | 3,443 | 2 | 0.0000134 | 0.0000146 | 0.0000364 |
| 100% | 6,447 | 2 | 0.0000135 | 0.0000146 | 0.0000418 |

**p50 varies by 2% across a 3,200× change in document-wide run count.** The lookup
is bounded by the row, not the document. That is the property the index was meant
to buy, and it now holds.

Worth recording because it is the shape of mistake this representation invites —
a flat array is only fast if you never scan it end to end — and because the first
attempt to *verify* the fix was confounded, which is the shape of mistake
benchmarking invites.

### Is a runtime swap possible? Mostly it should be ignored

There are **194 reads of `.content`** across seven files (130 in
`editor-ast.utils.ts` alone) and **102 sites that assume the inline-node shape**.
That number decides the answer:

- **A facade that materialises `ASTInlineNode[]` on demand** would make the two
  interchangeable with no call-site changes — and would be *worse than today*,
  because every read reallocates the objects the change exists to remove.
  Not worth building.
- **A full abstraction both backends implement** is possible, but an interface
  general enough for both tends toward the tree shape, which stops columnar from
  using batch scans and typed-array iteration — the things that made it fast.
  This is the entire migration wearing a disguise.

What is actually worth doing, in order:

1. **Use columnar where documents are held rather than structurally edited** —
   persistence, serialisation, and above all the undo history, which is the stack
   that grows without bound. Small surface, it captures the memory win where
   memory actually accumulates, and it plays to the read/write split above:
   these are read-mostly, and none of them splice blocks.
2. **Migrate the position maths**, which is self-contained and already verified
   equivalent.
3. **Leave the live editing document as a tree** until 1 and 2 have paid off.

One genuinely useful flag: a dev-only assertion that runs
`fromColumnar(toColumnar(doc))` and deep-compares against the original on every
commit. Cheap, and it catches drift between the two representations while the
migration is in progress.

## What I have not checked

- **Non-ASCII text.** JSC stores ASCII strings 8-bit; a document with significant
  non-Latin content will have a different text-to-overhead ratio, and the packed
  form's advantage would grow, not shrink, since the overhead is what changes.
- **Container blocks (lists).** The benchmark document is paragraphs and
  headings. Nested list items add a level to the current shape; the packed form
  needs a decision on whether items become their own blocks with a depth field
  (flat, which is what I would suggest) or stay nested.
- **Real-world documents.** The generator produces plausible prose with ~15% of
  runs marked. A document with heavy inline formatting would make the current
  representation look worse, not better.
- **The rendering path.** I only measured the model. Whether `ship-editor.ts`
  can render from ranges without re-materialising inline nodes is the open
  question that decides whether step 5 is worth it.
