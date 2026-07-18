# ShipUI Editor (`@ship-ui/core/ship-editor`)

An AST-first rich text editor. The in-memory `ASTDocument` is the source of truth;
HTML and Markdown are produced only at serialization time (`serialize('html' | 'json' | 'markdown')`).

## Non-destructive block conversions (void-block stash)

Converting a text block into a **void** block (e.g. `hr`) does not throw its text
away. `setBlockType` stashes the origin block's type, attrs, and inline content on
the new block's `attrs.stashed`, and renders the void block as normal (a bare `<hr>`
/ `---`). Converting that void block back to a text block — or into a list —
recovers the stashed text.

```
h1 "My Title"  → hr           (text parked on attrs.stashed, renders as <hr>)
hr             → h1           → h1 "My Title"      (recovered)
hr             → hr (toggle)  → paragraph "My Title"
p  "hello"     → hr → ul/ol   → <ul><li>hello</li></ul>
```

A **stash-less** void block — a bare inserted `hr`, an `image` — has nothing to
recover, so it converts to an empty paragraph and is skipped when building a list.

### Scope: in-memory / JSON only

The stash lives entirely in the AST. It **survives `serialize('json')`** (the whole
document is cloned, `attrs.stashed` included), so it persists if JSON is your storage
format.

It **does not survive a Markdown or HTML round-trip.** A void token like `---` has no
slot to carry inline content: `renderMarkdown`/`renderHTML` ignore `attrs`, and
`HrBehavior.parseDOM` returns `content: []` with no stash. This is expected — turning
text into `---` and then *saving to Markdown* is legitimately lossy.

### Future: `hr` with a visible label

The stash deliberately lives on `attrs.stashed`, leaving the `hr`'s own `content`
slot free. A future "labelled rule" (`---- some content ----`) can use `content` for
the visible label and serialize it, which *would* round-trip through Markdown as a
non-standard extension.

Implemented in `setBlockType` in [`editor-ast.utils.ts`](./editor-ast.utils.ts)
(`toBlockOfType` helper + the void restore branches).
