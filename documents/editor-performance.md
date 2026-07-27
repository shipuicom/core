# Editor performance: applied fixes and remaining work

All timings measured in a real browser (not jsdom) on a generated 1,000-block
prose document, reported as p50 over 20–30 rounds unless noted. Separate from
[editor-ast-compaction.md](./editor-ast-compaction.md), which is about the AST
representation; everything here works with the AST exactly as it is.

## Applied

### 1. `structuredClone` of the whole document on every keystroke → path copy

`executeInsertText` deep-cloned the entire AST to insert a single character.

| | 200 blocks | 1,000 blocks |
|---|---|---|
| `structuredClone(doc)` | 0.634 ms | **3.00 ms** (p99 3.44) |
| path copy of one block | 0.00005 ms | **0.00015 ms** |

Roughly **20,000× cheaper**, and it removes the largest single cost from the
typing path. Only the caret's path — document array, block, list item, content
array, touched inline node — gets new identity; everything else stays shared.

Safe here specifically because `executeInsertText` mutates nothing outside that
path, and the one function that mutates a `marks` array in place
(`applyMarkToContent`, `editor-ast.utils.ts:1070`) is only reachable through
callers that still deep-clone. **That reasoning does not transfer automatically
to the other 13 clone sites** — see below.

Four tests were added covering the property that actually changed: the previous
document must stay observably untouched (the undo stack holds it), untouched
blocks must be shared by reference, repeated typing then undo must round-trip,
and a marked run must not share its `marks` array after an edit.

### 2. `Array.from(container.children).indexOf(el)` → sibling walk

Ran on **every** selection change, twice when the selection was not collapsed,
plus on every click and drag start. `Array.from` materialises every block in the
document, so it costs the same wherever the caret is:

| Caret position | `Array.from().indexOf` | sibling walk |
|---|---|---|
| block 5 | 0.0926 ms | **0.00005 ms** |
| block 750 | 0.0930 ms | **0.0122 ms** |
| block 999 | 0.0923 ms | **0.0160 ms** |

Between 5.8× and 1850× cheaper depending on caret position. Applied at four
sites via a shared `#indexInParent` helper, plus the `dragover` handler now
indexes the live collection instead of copying it per event.

### 3. ~20 keybinding parses per plain character → skipped

Every keydown looped over every registered block and inline behavior calling
`keybindings.matches()`, each of which splits and parses the shortcut string.
Every editor binding requires `ctrlOrCmd`, so ordinary typing could never match
one. Now guarded by a plain-typing check.

### 4. `diffFlat` allocated a string per character — 369x faster

`applyRemoteOperation` calls `diffFlat` on **every remote operation**. It built a
token stream — one token per block delimiter and one per character — as an array
of strings, then compared it. On a 1000-block document that is ~235,000 string
allocations to discover a one-character change.

| Document | Before | After | |
|---|---|---|---|
| 200 blocks | 6.56 ms | 0.0177 ms | **370x** |
| 1,000 blocks | 36.34 ms | 0.0985 ms | **369x** |

The stream is now walked with cursors instead of materialised, and the scan
short-circuits on reference-equal blocks — which is most of them, since `applyOp`
shares everything it did not touch.

**`stepMapFromOp` was the obvious fix and it is wrong.** It already exists and
derives a `StepMap` from the op directly, but measured against
`diffFlat(oldDoc, applyOp(oldDoc, op))` the two disagree on **7.5%** of mapped
positions: they use different association semantics at an insertion boundary, so
swapping would move where a collaborator's cursor lands when a remote insert
arrives exactly at it. Keeping `diffFlat`'s semantics and removing the allocation
was the safe route.

Verified by keeping the original implementation as an oracle in the spec:
**500 random document pairs** — containers, voids, marks, attrs — produce
identical `StepMap`s, and identical documents still return `null`.

Two boundary cases the first rewrite got wrong, now covered by tests:

- The closing token is `c:type` and carries **no attrs**, while the opening token
  is `o:type:attrs`. Two blocks differing only in attributes still share a
  suffix.
- Two **non-void** blocks of the same type share their opening token even when
  their shapes differ (one holding text, the other children).

## Remaining, ranked by impact × frequency

### A. `patchDOM` re-renders and re-serialises every block per keystroke

`ship-editor.ts:741-762`. Two full-document walks on every render: HTML is built
for **every** block even though one changed, and `existingEl.outerHTML` asks the
browser to serialise each existing element back to a string for comparison.

Measured cost of the `outerHTML` reads alone: **0.91 ms** at 1,000 blocks
(0.18 ms at 200) — and that excludes re-rendering the HTML itself.

The engine already knows which block changed: `#commit` produces an `EditorOp`
carrying `blockIndex`, exposed as `lastTransaction`. Patch only the named blocks
and fall back to the full walk only for `op.kind === 'block'`. A cheaper interim
fix is to cache the last rendered HTML string per index and compare against that
instead of reading `outerHTML`.

**This is now the largest remaining per-keystroke cost.**

### B. The other 13 `structuredClone` sites

`editor-ast.utils.ts` lines 38, 266, 290, 342, 374, 382, 462, 507, 852, 879, 897,
941, 1193. Same 3 ms cost whenever they are on the typing path — `deleteRange`
and `handleEnter` each clone, and `dispatchWithTruncation` clones *twice* per
keystroke when the selection is not collapsed.

**Do not convert these in bulk.** The file is at 69% statement / 59% branch
coverage, and the safety of a path copy depends on exactly what each function
mutates — `applyMarkToContent` mutates a `marks` array in place, so any caller
that stops deep-cloning has to be checked against that. One function at a time,
each with an isolation test like the four added above.

### C. Full re-serialisation of the document on every keystroke

`ship-editor.ts:192-202`. The ControlValueAccessor effect runs
`engine.serialize(format)` over the whole document on every change, then compares
two document-sized strings — even when nothing is bound to `value`. For
`format === 'json'` it also `structuredClone`s the document again.

Debouncing the emit to idle (or a frame) would remove it from the typing path
entirely; the CVA contract does not require synchronous per-character emission.

### D. `flattenChars` allocates an object per character per commit

`editor-transactions.ts:69-77`, reached from `diffDocuments` on every
transaction. Same shape as the `diffFlat`/`tokens` problem: a 5,000-character
paragraph produces 10,000 heap objects plus 10,000 single-character strings per
keystroke. The common case — one character inserted at the caret — is knowable in
O(1) from the caret position without diffing at all.

### E. `normalizeInlineNodes` compares marks with `JSON.stringify`

`editor-ast.utils.ts:1320-1335`, called at the end of essentially every mutation,
O(inline nodes in the block) stringifies each time. A structural compare (length,
then per-mark type and shallow attrs) returns false on the first mismatch instead
of building two strings.

### F. Computeds return fresh object literals, so nothing downstream memoises

`editor-engine.service.ts:289-297` (`slashState`) and `185-228`
(`activeFormats`). Signals compare with `Object.is`, so a new object literal is
always "changed" — every keystroke invalidates the slash menu's `filtered`,
`isOpen` and `view`, plus every toolbar button's `isActive` and its host
bindings. `sh-editor-slash-menu.ts:66-69` additionally writes a signal from
inside an effect on every keystroke. Give both computeds an `equal:` comparator,
or return a stable primitive.

### G. `dragover` measures every block, with read-write-read thrash

`ship-editor.ts:355-368` calls `getBoundingClientRect` in a loop over blocks at
~60 Hz during a drag, and `onDragOver` writes `dropIndicator` on every event, so
the next event's measurement hits a dirty layout. Snapshot the block tops once on
`dragstart` — layout cannot change mid-drag — and binary-search `clientY` against
that array.

### H. Smaller items

- **Metrics** (`ship-editor.ts:115-120`) rebuild the whole document as a string
  per keystroke when `showMetrics` is on, then allocate a second full copy via
  `.replace(/\n/g,'')` just to count characters. A single pass over the AST needs
  no strings at all.
- **Serializer mark tables** (`editor-serializers.ts:164-201`) rebuild a `Map` of
  every registered inline type per block, and `markKey` `JSON.stringify`s each
  mark 3–4 times per node per render. All memoisable on the `inlines` map, which
  only changes at `register()` time.
- **`Array.from(node.childNodes)`** at every node of the DOM walks in
  `#domCharOffset` / `#domPosAtChar` (`ship-editor.ts:787-862`). `for (let c =
  n.firstChild; c; c = c.nextSibling)` allocates nothing.
- **Image `src` copying** (`standard-behaviors.ts:217`): `isSafeUrl` and
  `escapeAttr` allocate ~7 copies of a `data:` URL that can be megabytes, per
  block per render. Mostly disappears once (A) stops re-rendering every block.

### Checked and *not* problems

All five editor components use `OnPush`; the template has no method calls beyond
signal reads; `editor-sanitize.ts` regexes are all module-level constants; and
`sh-editor-image-resize.ts` correctly hoists `getComputedStyle` out of its
`mousemove` handler.
