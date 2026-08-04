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

## Custom component blocks (live Angular components as void blocks)

A block can be a live Angular component — a map, a video player, an embedded
code editor. Subclass `BaseComponentBlockBehavior`, point it at a component,
and register it via the editor's `[behaviors]` input:

```ts
class MapBlockBehavior extends BaseComponentBlockBehavior {
  readonly type = 'map';
  readonly component = MapBlockComponent;   // any standalone component
}
```

The component is mounted inside the block's wrapper element and injects
`SHIP_EDITOR_BLOCK_CONTEXT` (a `ShipEditorBlockContext`): `attrs`, `index`,
`selected` and `readonly` signals, plus `updateAttrs(patch)` (one undoable
transaction), `select()` and `remove()`. **Attrs are the block's only
persistent state** — they survive serialization, undo/redo and virtualization
unmounts; anything the component wants to keep goes through `updateAttrs`.

Interaction contract:

- **Clicks**: interactive content (buttons, inputs, canvas, iframes, ARIA
  roles, contenteditable) gets its clicks untouched. A click on nothing
  interactive falls through and selects the block; a component's own click
  handler can `stopPropagation()` to keep those too.
- **Focus inside the component**: the editor intercepts *nothing* — keys,
  shortcuts, clipboard, IME all belong to the component, so an embedded
  editor keeps its whole keymap. Hand control back with `context.select()`
  (bind it to Escape, or anything else).
- **Block selected** (arrow navigation from adjacent text, click
  fall-through, or `select()`): the standard void-block keybindings apply —
  arrows navigate (hopping void-to-void), Backspace/Delete removes, Escape
  returns the caret to the text. A cross-block text selection sweeping over
  the block paints the void-in-selection highlight, exactly like images.

Serialization defaults to a neutral wrapper —
`<div data-sh-block="type" data-sh-attrs="…json…"></div>` — which round-trips
through the `html` format (the default sanitizer allowlists these two
attributes on `div`). `renderMarkdown` emits the same wrapper verbatim;
parsing it back *from* markdown is not supported by default. Override
`renderHTML`/`parseDOM`/`renderMarkdown` for richer output (a real `<video>`
tag, say). Demo blocks: `projects/design-system/src/app/ship/editors/sh-editor-demo-blocks.ts`.
