# ShipCode — Execution Plan

Exhaustive TODO list for building `ship-code`. Each task follows TDD: write the failing test first, implement until green, refactor, move on.

> See [grand-plan.md](file:///Users/simon/Documents/dev/ship-ui/projects/ship-ui/ship-code/grand-plan.md) for architecture context.

---

## Phase 1 — Foundation: Editable Code Surface

### 1.0 Project Scaffolding
- [x] Create `ship-code/` directory structure matching grand-plan file tree
- [x] Add `ng-package.json` for Angular library build
- [x] Add `ship-code` to workspace `tsconfig` paths (already handled by `@ship-ui/core/*` wildcard)
- [x] Add `public-api.ts` barrel file
- [x] Vendor `vscode-textmate` v9.1.0 and `vscode-oniguruma` v2.0.1 into `vendor/` (no npm deps)
- [x] Include `onig.wasm` binary in vendor folder
- [x] Add `vendor/README.md` with versions and update instructions
- [x] Add vitest config for `ship-code` (uses `vitest-base.config.ts`)

### 1.1 Core Types & Interfaces
- [x] `textmate/types.ts` — Define `IToken`, `StateStack`, `ScopeStack`, `TokenizeResult`
- [x] `textmate/engine.ts` — Define `TokenizerEngine` interface (the swap point)
- [x] `core/document.ts` — Define `CodeLine`, `CodeDocument`, `Change`, `Transaction` types
- [x] `core/selection.ts` — Define `CaretPosition`, `SelectionRange`, `SelectionState` types
- [x] `keymaps/keymap.ts` — Define `ShipCodeAction` union type and `ShipCodeKeymap` type

### 1.2 Document Model
- [x] Test: create empty document, verify line count is 1
- [x] Test: create document from multi-line string, verify line count and content
- [x] Test: `getLine(doc, n)` returns correct line text
- [x] Test: `getText(doc)` returns full document text with newlines
- [x] Implement `createDocument(text: string): CodeDocument`
- [x] Implement `getLine(doc, lineIndex): string`
- [x] Implement `getText(doc): string`
- [x] Test: insert text at `{ line: 0, column: 5 }` produces correct result
- [x] Test: insert newline splits line into two
- [x] Test: insert at end of line
- [x] Test: insert at beginning of line
- [x] Implement `insertText(doc, position, text): CodeDocument`
- [x] Test: delete range within single line
- [x] Test: delete range spanning multiple lines (merges them)
- [x] Test: delete at beginning of line merges with previous
- [x] Implement `deleteRange(doc, from, to): CodeDocument`
- [x] Test: `applyTransaction` with single insert change
- [x] Test: `applyTransaction` with single delete change
- [x] Test: `applyTransaction` with multiple changes (applied in order)
- [x] Implement `applyTransaction(doc, tx): CodeDocument`
- [ ] Test: transaction updates selection position
- [ ] Implement selection tracking in transactions

### 1.3 Selection & Caret System
- [x] Test: collapsed selection (caret) at `{ line: 0, column: 0 }`
- [x] Test: non-collapsed selection with anchor and head
- [x] Test: `isCollapsed` returns true when anchor equals head
- [x] Implement `SelectionState` with array of `SelectionRange`
- [x] Test: `moveCaretRight` at middle of line
- [x] Test: `moveCaretRight` at end of line wraps to next line
- [x] Test: `moveCaretRight` at end of document stays put
- [x] Test: `moveCaretLeft` at middle of line
- [x] Test: `moveCaretLeft` at beginning of line wraps to previous line
- [x] Test: `moveCaretLeft` at beginning of document stays put
- [x] Test: `moveCaretUp` from middle of document
- [x] Test: `moveCaretUp` remembers preferred column (sticky column)
- [x] Test: `moveCaretDown` from middle of document
- [x] Test: `moveCaretDown` at last line stays put
- [x] Implement `moveCaretRight`, `moveCaretLeft`, `moveCaretUp`, `moveCaretDown`
- [x] Test: `moveWordLeft` skips to beginning of word
- [x] Test: `moveWordRight` skips to end of word
- [x] Test: `moveLineStart` goes to column 0
- [x] Test: `moveLineEnd` goes to end of line
- [x] Test: `moveDocStart` goes to `{ line: 0, column: 0 }`
- [x] Test: `moveDocEnd` goes to last line, last column
- [x] Implement word-level and line-level movement functions
- [x] Test: `selectWord` at caret position selects the word under caret
- [x] Test: `selectLine` selects entire current line
- [x] Test: `selectAll` selects from doc start to doc end
- [x] Implement `selectWord`, `selectLine`, `selectAll`
- [ ] Test: extending selection with Shift+movement (anchor stays, head moves)
- [ ] Implement selection extension variants

### 1.4 Keymap Presets
- [x] `keymaps/sublime.keymap.ts` — Export `SUBLIME_KEYMAP: ShipCodeKeymap` constant
- [x] `keymaps/vscode.keymap.ts` — Export `VSCODE_KEYMAP: ShipCodeKeymap` constant
- [x] Test: `SUBLIME_KEYMAP` satisfies `ShipCodeKeymap` type (all actions present)
- [x] Test: `VSCODE_KEYMAP` satisfies `ShipCodeKeymap` type (all actions present)
- [x] Test: every `ShipCodeAction` has a mapping in both keymaps
- [x] Test: Sublime maps `Alt+ArrowLeft` to `code.caret.moveWordLeft`
- [x] Test: VS Code maps `ctrlOrCmd+ArrowLeft` to `code.caret.moveWordLeft`

### 1.5 Action Registry
- [ ] `core/actions.ts` — Define action handler registry
- [ ] Test: register an action handler, dispatch by name, verify it runs
- [ ] Test: dispatch unknown action returns false (no-op)
- [ ] Test: action handler receives `(doc, selection)` and returns `{ doc, selection }`
- [ ] Implement `registerAction`, `dispatchAction`
- [ ] Register all caret movement actions (wire to selection functions from 1.3)
- [ ] Test: dispatching `code.caret.moveRight` moves caret right
- [ ] Test: dispatching `code.selection.selectAll` selects all

### 1.6 TextMate Tokenization (vscode-textmate wrapper)
- [ ] `textmate/vscode-engine.ts` — Implement `createVSCodeEngine(): Promise<TokenizerEngine>`
- [ ] Load `onig.wasm`, init `vscode-oniguruma`, create `vscode-textmate` `Registry`
- [ ] Test: tokenize `const x = 5;` with TypeScript grammar, verify `storage.type` scope on `const`
- [ ] Test: tokenize `// comment`, verify `comment.line` scope
- [ ] Test: tokenize multi-line string, verify scope stack continuity
- [ ] Test: tokenize empty line returns empty token array
- [ ] `grammars/registry.ts` — Language ID → scope name + grammar JSON mapping
- [ ] Test: `getGrammar('typescript')` returns grammar with `scopeName: 'source.ts'`
- [ ] Test: `getGrammar('unknown')` returns null
- [ ] Copy VS Code TypeScript grammar JSON to `grammars/typescript.json`
- [ ] Copy VS Code HTML grammar JSON to `grammars/html.json`
- [ ] Copy VS Code CSS grammar JSON to `grammars/css.json`
- [ ] Copy VS Code JSON grammar JSON to `grammars/json.json`
- [ ] Implement incremental tokenization: cache `ruleStack` per line
- [ ] Test: edit line 3, only lines 3+ are re-tokenized
- [ ] Test: edit line 3, if scope stack stabilizes at line 5, lines 6+ are untouched

### 1.7 Theme System
- [ ] `themes/theme-resolver.ts` — Implement `resolveScope(scopes, theme): StyledToken`
- [ ] Test: `keyword.control.ts` resolves to theme's keyword color
- [ ] Test: more specific scope wins over general scope
- [ ] Test: `fontStyle: 'italic'` is applied when theme specifies it
- [ ] Test: unmatched scope falls back to default foreground
- [ ] `themes/ship-dark.ts` — Export dark theme `tokenColors` array
- [ ] `themes/ship-light.ts` — Export light theme `tokenColors` array
- [ ] Test: `ship-dark` theme has rules for all major scope categories
- [ ] Test: `ship-light` theme has rules for all major scope categories

### 1.75 Columnar Core & Flat Selection (adopted from ship-editor's architecture)
> The document's line array is the storage column; `core/line-index.ts` is the
> prefix-sum index over it (flat offset ⇄ line/column, cached per document
> identity). The selection is a flat `{anchor, head}` pair — ship-editor's
> flat-selection shape — and edits are flat `{from, to, insert}` changes that
> return their inverses (the history/rebase currency).
- [x] `core/line-index.ts` — `LineIndex` prefix sums, `posOf`/`pointAt`/`lineAt`/`sliceText`, `indexFor` cache
- [x] `core/flat-edit.ts` — `applyFlatChange(s)` with inverse changes, `mapFlatPos`/`mapThroughChanges`
- [x] `core/flat-motion.ts` — flat caret motion (char/word/line/doc), goal-column vertical moves, select word/line/all
- [x] Selection extension variants (`applyMotion` with `extend`; plain moves collapse to the range edge)
- [x] `matchesShortcut` — framework-free chord matching for keymap specs
- [x] Tests: line-index round-trips, change inversion, motion invariants, shortcut matching

### 1.8 View Layer
> Built directly into the `<sh-code>` component (signals templates render the
> window; no separate view/ module). Virtualization uses the shared
> `BlockHeightMap` from `@ship-ui/core/ship-virtual-scroll` — the same pixel
> model ship-editor's virtualization runs on, in its own bundle so neither
> editor pulls the other's code.
- [x] Line rendering (plain text; tokenized spans arrive with 1.6/1.7)
- [ ] Test (JSDOM): content area contains `<span>` elements matching token count
- [ ] Test (JSDOM): token `<span>` elements have correct inline styles from theme
- [x] Blinking caret as absolutely positioned `<div>` (flat head → line/col → pixel box)
- [x] Line number gutter, window-synchronized, sticky under horizontal scroll
- [ ] Active line number highlighted
- [x] Hidden `<textarea>` input capture (keydown → keymap actions, input → insertText, IME composition buffered, paste via textarea, copy/cut from the flat selection)
- [x] Viewport-aware rendering: only lines within viewport + overscan exist in the DOM (`BlockHeightMap` window + spacer padding)
- [x] Recalculate on scroll (rAF with hidden-document timeout fallback)
- [x] Verified: 20,000-line document renders ~50 visible lines

### 1.9 Angular Component
- [x] `sh-code.ts` — Standalone Angular component `<sh-code>`
- [x] Inputs: `value`, `language`, `readonly`, `lineNumbers`, `keymap`, `virtualization` (theme arrives with 1.7)
- [x] Output: `valueChange` (via `model()` two-way `value`)
- [x] Implement `ControlValueAccessor` (ngModel / reactive forms)
- [x] Editing: typing, Enter, Backspace/Delete, indent/outdent, delete/duplicate/move line, delete word, undo/redo (inverse-change history)
- [ ] Wire tokenizer + theme once 1.6/1.7 land
- [ ] Register active keymap into `ShipA11yKeybindingsService` on init
- [ ] `ship-code.scss` — Styles
- [ ] Editor container (monospace font via `--code-20`, background, border)
- [ ] Gutter styles (muted color, right-aligned numbers, padding)
- [ ] Active line highlight
- [ ] Focus ring matching ship-editor's code block style
- [ ] Caret styles (blinking animation)
- [ ] Selection highlight overlay
- [ ] Light/dark mode via Ship theme tokens

### 1.10 Showcase Integration
- [ ] Add `ship-code` showcase page at `/code-editor`
- [ ] Demo: editable TypeScript code with syntax highlighting
- [ ] Demo: readonly mode
- [ ] Demo: toggle line numbers
- [ ] Demo: switch keymap (Sublime / VS Code)
- [ ] Demo: switch theme (ship-dark / ship-light)

---

## Phase 2 — Text Manipulation & History

### 2.1 Undo/Redo
- [ ] `core/history.ts` — Transaction history stack
- [ ] Test: push transaction, undo returns previous document state
- [ ] Test: undo then redo returns to current state
- [ ] Test: rapid typing coalesces into single history entry
- [ ] Test: new edit after undo forks history (discards redo stack)
- [ ] Implement `HistoryStack` with `push`, `undo`, `redo`, coalescing
- [ ] Wire undo/redo actions to history stack

### 2.2 Indentation
- [ ] Test: Tab at caret inserts configured indent (2 spaces default)
- [ ] Test: Shift+Tab at caret removes up to 2 leading spaces
- [ ] Test: Enter at end of indented line auto-indents new line
- [ ] Test: Enter after `{` increases indent by one level
- [ ] Test: select 3 lines, Tab indents all 3
- [ ] Test: select 3 lines, Shift+Tab outdents all 3
- [ ] Implement indent/outdent for single caret and block selection

### 2.3 Multi-Caret Editing
- [ ] Test: add caret below creates second `SelectionRange`
- [ ] Test: typing with 2 carets inserts text at both positions
- [ ] Test: overlapping selections auto-merge
- [ ] Test: delete with multiple carets removes at all positions
- [ ] Implement multi-caret support in `dispatchAction` and `applyTransaction`

### 2.4 Clipboard
- [ ] Test: copy with selection copies selected text
- [ ] Test: copy with no selection copies entire line (Sublime behavior)
- [ ] Test: cut removes selected text and puts it on clipboard
- [ ] Test: paste at caret inserts clipboard text
- [ ] Test: paste multi-line text with auto-indent matching context
- [ ] Test: paste N lines across N carets (one line per caret)
- [ ] Implement clipboard handlers

### 2.5 Line Operations
- [ ] Test: move line up swaps current line with line above
- [ ] Test: move line down swaps current line with line below
- [ ] Test: duplicate line inserts copy below
- [ ] Test: delete line removes current line, moves caret
- [ ] Test: toggle comment adds `//` prefix (based on language)
- [ ] Test: toggle comment removes `//` prefix if already present
- [ ] Implement all line operations

---

## Phase 3 — ship-editor Integration

### 3.1 Extension Bridge
- [ ] `bridge/ship-editor-code-block.ts` — New `ShipEditorBlockExtension`
- [ ] `onBlockRender`: mount `<sh-code>` instance inside code block element
- [ ] Sync content: `sh-code` value change → update editor AST block content
- [ ] Sync content: editor AST change → update `sh-code` value
- [ ] Pass `block.attrs.language` to `sh-code` language input
- [ ] Handle focus transitions: click on code block → focus `sh-code`

### 3.2 Focus & Navigation
- [ ] Test: Escape from `sh-code` returns focus to rich text editor
- [ ] Test: Arrow up at first line of code block exits to previous block
- [ ] Test: Arrow down at last line of code block exits to next block
- [ ] Test: Tab in code block inserts indent (does not focus next element)
- [ ] Implement focus boundary handling

### 3.3 Language Selector
- [ ] UI: dropdown/picker in code block toolbar to change language
- [ ] Filterable: type to filter language list
- [ ] On select: update `block.attrs.language`, re-tokenize
- [ ] Include all bundled language IDs

### 3.4 Configuration
- [ ] `configureExtension(codeBlockBlockExtension, { renderer: 'ship-code' })` enables rich mode
- [ ] `configureExtension(codeBlockBlockExtension, { renderer: 'plain' })` keeps current `<pre>` behavior
- [ ] Default: `'plain'` (no breaking change for existing users)
- [ ] Document in `EXTENSIONS.md`

---

## Phase 4 — Advanced Features

### 4.1 Search & Replace
- [ ] `Ctrl+F` / `Cmd+F` opens find bar
- [ ] Highlight all matches in document
- [ ] Navigate between matches (Enter / Shift+Enter)
- [ ] `Ctrl+H` / `Cmd+H` opens replace mode
- [ ] Replace one / replace all
- [ ] Regex mode toggle

### 4.2 Code Folding
- [ ] Indent-based folding detection
- [ ] Fold gutter markers (clickable triangles)
- [ ] Collapse: hide lines, show `...` placeholder
- [ ] Expand: restore hidden lines
- [ ] Fold/unfold keyboard shortcuts

### 4.3 Bracket Matching
- [ ] Highlight matching bracket when caret is adjacent
- [ ] Jump to matching bracket via shortcut
- [ ] Support `()`, `[]`, `{}`, `<>` (configurable)

### 4.4 Autocomplete
- [ ] Word-based completion from current document
- [ ] Popup positioned at caret
- [ ] Keyboard navigation (up/down/enter/escape)
- [ ] Extensible: `CompletionProvider` interface for language-specific completions

### 4.5 Minimap
- [ ] Scaled-down code overview (right side panel)
- [ ] Click to scroll to position
- [ ] Viewport indicator highlight

---

## Phase 5 — More Grammars & Themes

### 5.1 Additional Language Grammars
- [ ] `python`, `rust`, `go`, `java`
- [ ] `markdown`, `yaml`, `toml`, `xml`
- [ ] `sql`, `bash`/`shell`
- [ ] `graphql`, `dockerfile`
- [ ] All lazy-loaded on first use

### 5.2 Theme Ecosystem
- [ ] Import any VS Code `.json` color theme
- [ ] `loadTheme(url | json)` → parse `tokenColors` + editor colors
- [ ] Additional built-in themes (e.g., Monokai, Solarized, GitHub)

### 5.3 Custom Grammar Registration
- [ ] `registerGrammar({ scopeName, grammar })` public API
- [ ] Document in README

---

## Phase 6 — Diff View & Collaboration

### 6.1 Diff View
- [ ] `<sh-code [diff]="{ original, modified }">` input mode
- [ ] Side-by-side rendering with synchronized scroll
- [ ] Inline diff mode (single column)
- [ ] Line-level and character-level diff highlighting
- [ ] Read-only diff mode + editable right-side mode

### 6.2 OT Foundation
- [ ] Document model supports OT-compatible operations
- [ ] Transform function for concurrent change resolution

---

## Phase 7 — Custom WASM Engine (Rust/Zig)

> Replace `vscode-textmate` + `vscode-oniguruma` with our own high-performance WASM engine.

### 7.1 Research & Decision
- [ ] Evaluate Rust vs Zig for WASM target
- [ ] Prototype: compile Oniguruma regex in chosen language
- [ ] Benchmark: WASM engine vs `vscode-oniguruma` on large files
- [ ] Decision doc: language choice + rationale

### 7.2 Core Engine
- [ ] Implement Oniguruma-compatible regex scanner in Rust/Zig
- [ ] Implement scope stack machine (begin/end, begin/while rules)
- [ ] Implement grammar JSON parser
- [ ] Compile to `.wasm` (<200KB target)

### 7.3 JS Bindings
- [ ] `textmate/wasm-engine.ts` — Load WASM, expose `TokenizerEngine` interface
- [ ] Zero-copy result passing via typed arrays / `SharedArrayBuffer`
- [ ] Async initialization with fallback to vscode-engine

### 7.4 Integration
- [ ] Swap engine: replace `vscode-engine` import with `wasm-engine`
- [ ] Run full tokenization test suite against new engine (must pass identically)
- [ ] Benchmark: large file tokenization speed comparison
- [ ] Remove `vendor/` folder (vscode-textmate + vscode-oniguruma no longer needed)

### 7.5 CI & Distribution
- [ ] Add WASM build step to CI pipeline
- [ ] Ship `.wasm` as a lazy-loaded asset (not bundled in JS)
- [ ] Document build prerequisites (Rust/Zig toolchain)
