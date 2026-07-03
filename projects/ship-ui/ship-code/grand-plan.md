# 🖥️ ShipCode — Grand Plan

A config-driven, framework-agnostic code editor component for the Ship UI design system.
Designed from day one to work standalone **and** as a drop-in replacement for `ship-editor`'s code blocks.

---

## Vision

Build a lightweight, extensible code editor — not a full IDE, but something that sits between a `<textarea>` and VS Code. Deeply inspired by the **TextMate grammar architecture**: scope-based tokenization, hierarchical grammar rules, and VS Code theme compatibility from day one.

### Design Principles

| Principle | Meaning |
|-----------|---------|
| **TextMate-compatible** | TextMate grammars as the tokenization engine — same scopes, same accuracy as VS Code |
| **Ship fast, replace later** | Use `vscode-textmate` now → drop-in replace with our own Rust/Zig WASM engine later |
| **TDD-driven** | Every feature starts with a failing test — implement until green, move on |
| **Incremental** | Each phase is shippable and useful on its own |
| **Composable** | Features are extensions, not baked-in monolith |
| **Pluggable** | Designed to embed inside `ship-editor` code blocks via the extension API |
| **Framework-agnostic core** | Pure TypeScript engine with a thin Angular wrapper |
| **Ship-native** | Uses Ship design tokens, theming, and keybinding system |

### Naming Conventions

| Term | Usage | Rationale |
|------|-------|-----------|
| **Caret** | The blinking insertion point | Aligns with `CaretState` from `ship-editor` |
| **Selection** | A range (can be collapsed to a caret) | Aligns with `EditorSelection` / `EditorSelectionState` from `ship-editor` |
| **Transaction** | An atomic document change | Standard in ProseMirror, CodeMirror 6 |
| **Scope** | TextMate scope string (`keyword.control.ts`) | TextMate standard |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                    Angular Wrapper                        │
│               <sh-code> component (thin)                  │
├──────────────────────────────────────────────────────────┤
│                     View Layer                            │
│           DOM rendering, caret, selections                │
├──────────────────────────────────────────────────────────┤
│                   Extension Host                          │
│      Autocomplete, search, folding, minimap...            │
├──────────────────────────────────────────────────────────┤
│               TextMate Tokenization Layer                 │
│   Scope stack · Grammar registry · Incremental tokenize   │
├──────────────────────────────────────────────────────────┤
│                     Core Engine                           │
│       Document model, transactions, history               │
└──────────────────────────────────────────────────────────┘
```

### ship-editor Integration Point

`ship-editor` already has a `codeBlockBlockExtension` that renders `<pre><code>...</code></pre>`. The integration:

1. `ship-code` exposes a standalone `<sh-code>` component
2. A `codeBlockBlockExtension` variant mounts `<sh-code>` inside code blocks via `onBlockRender`
3. The rich editor's plain `<pre>` is replaced with a live `sh-code` instance
4. Two-way sync: `sh-code` content changes flow back to the editor's AST

```typescript
// Future: ship-editor uses ship-code for its code blocks
const richCodeBlock = configureExtension(codeBlockBlockExtension, {
  renderer: 'ship-code',  // mount <sh-code> instead of plain <pre>
});
```

---

## TextMate Grammar Architecture

> Everything in ship-code's syntax engine follows the TextMate model. This section describes the architecture we're adopting.

### How TextMate Tokenization Works

TextMate grammars define a set of **patterns** (regular expressions) that match portions of code and assign **scopes** (hierarchical labels like `keyword.control.ts`) to them. The tokenizer processes input **line by line**, maintaining a **scope stack** across lines to handle multi-line constructs (strings, comments, etc.).

```
Input:   const x = "hello";
Scopes:  ─────┬─ ┬ ┬ ──┬──  ┬
         │     │ │ │    │    │
         │     │ │ │    │    └─ punctuation.terminator.statement.ts
         │     │ │ │    └───── string.quoted.double.ts
         │     │ │ └────────── keyword.operator.assignment.ts
         │     │ └──────────── variable.other.readwrite.ts
         │     └────────────── storage.type.ts
         └──────────────────── source.ts
```

### Scope Naming Conventions

We follow the TextMate / VS Code scope naming hierarchy — this ensures full compatibility with all VS Code themes.

| Top-level Scope | Purpose | Examples |
|----------------|---------|---------|
| `comment` | Comments | `comment.line.double-slash`, `comment.block.documentation` |
| `constant` | Fixed values | `constant.numeric`, `constant.language` (`true`, `null`) |
| `entity` | Named declarations | `entity.name.function`, `entity.name.type`, `entity.name.tag` |
| `keyword` | Reserved words | `keyword.control` (`if`, `for`), `keyword.operator` |
| `markup` | Prose formatting | `markup.heading`, `markup.bold`, `markup.list` |
| `meta` | Structural context | `meta.function`, `meta.class`, `meta.block` |
| `punctuation` | Delimiters | `punctuation.definition.string`, `punctuation.separator` |
| `storage` | Storage keywords | `storage.type` (`class`, `const`), `storage.modifier` (`static`) |
| `string` | Quoted text | `string.quoted.double`, `string.quoted.single`, `string.regexp` |
| `support` | Library/framework | `support.function`, `support.type` |
| `variable` | Identifiers | `variable.parameter`, `variable.language` (`this`, `self`) |

### Grammar Structure

Each TextMate grammar JSON follows this structure:

```jsonc
{
  "scopeName": "source.typescript",     // Root scope
  "patterns": [                         // Top-level rules
    { "include": "#comments" },
    { "include": "#keywords" },
    { "include": "#strings" }
  ],
  "repository": {                       // Named rule groups
    "comments": {
      "patterns": [
        {
          "name": "comment.line.double-slash.ts",
          "match": "//.*$"              // Single match pattern
        },
        {
          "name": "comment.block.ts",
          "begin": "/\\*",              // Begin/end pattern (multi-line)
          "end": "\\*/"
        }
      ]
    },
    "strings": {
      "patterns": [
        {
          "name": "string.quoted.double.ts",
          "begin": "\"",
          "end": "\"",
          "patterns": [                 // Nested patterns (escapes inside strings)
            { "include": "#string-escapes" }
          ]
        }
      ]
    }
  }
}
```

### Tokenizer Pipeline

```
                  Grammar JSON
                       │
                       ▼
              ┌─────────────────┐
              │  Grammar Parser  │  Parse grammar JSON into internal rule tree
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Native JS Regex │  ES2024 RegExp (named groups, lookbehind, /v flag)
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Line Tokenizer  │  Process line-by-line, maintain scope stack
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Token Stream    │  Array of { startIndex, endIndex, scopes: string[] }
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Theme Resolver  │  Map scopes → colors via theme rules
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Styled Tokens   │  { text, color, fontStyle } → render as <span>
              └─────────────────┘
```

### Engine Strategy: Two-Phase

We ship fast using the battle-tested `vscode-textmate` + `vscode-oniguruma` libraries, then build a high-performance drop-in replacement in Rust or Zig compiled to WASM.

#### Phase A — Ship with `vscode-textmate` (now)

Use the same libraries that power VS Code and Shiki. This gives us:
- 100% grammar compatibility from day one
- Proven, battle-tested scope stack machine
- Ability to focus engineering effort on the editor itself, not the tokenizer

```typescript
// Thin wrapper around vscode-textmate — our TokenizerEngine interface
import { Registry, parseRawGrammar } from 'vscode-textmate';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';

interface TokenizerEngine {
  tokenizeLine(line: string, prevState: StateStack | null): TokenizeResult;
}

interface TokenizeResult {
  tokens: IToken[];       // { startIndex, endIndex, scopes: string[] }
  ruleStack: StateStack;  // Scope stack at end of line
}
```

#### Phase B — Drop-in replace with Rust/Zig WASM (later)

Once the editor is stable, we replace the tokenizer engine with our own:

| Option | Pros | Cons |
|--------|------|------|
| **Rust** (`wasm-pack`) | Mature WASM tooling, `onig` crate wraps Oniguruma natively | Larger binary, Rust learning curve |
| **Zig** (`zig build -target wasm32-freestanding`) | Tiny binaries, C interop (Oniguruma is C), no runtime | Younger ecosystem |

The key: both expose the same `TokenizerEngine` interface. The editor doesn't know or care which backend is running.

```typescript
// Same interface — swap the import, everything works
import { createEngine } from './textmate/engine/vscode-engine';   // Phase A
import { createEngine } from './textmate/engine/wasm-engine';     // Phase B (drop-in)
```

The WASM engine will:
1. Compile Oniguruma regex natively (no JS regex translation needed)
2. Run the scope stack machine in compiled code (faster than JS for large files)
3. Expose results as a flat typed array (zero-copy to JS via `SharedArrayBuffer`)
4. Ship as a `.wasm` file loaded on demand (~200KB vs ~4MB for the current WASM)

---

## Phased Roadmap

### Phase 1 — Foundation: Editable Code Surface 🏗️

> Goal: A working `<sh-code>` component that renders a monospaced editable surface with line numbers, basic editing, **and syntax highlighting from day one**.

#### 1.1 Document Model
- `CodeDocument`: array of `Line` objects, each holding raw text + cached token data
- Immutable update model (transaction-based, like ProseMirror)
- `Transaction` type: `{ changes: Change[], selection?: Selection }`
- `Change`: `{ from: number, to: number, insert: string }` (character offsets)
- `applyTransaction(doc, tx) → doc` pure function
- Each `Line` caches its tokenization result + the end-of-line scope stack (for incremental re-tokenization)

#### 1.2 TextMate Tokenization (from day one)
- `GrammarRegistry`: wraps `vscode-textmate` Registry — loads grammar JSON, resolves `scopeName` references
- `LineTokenizer`: tokenizes a single line given a `ruleStack` (scope stack from previous line)
- **Abstracted behind `TokenizerEngine` interface** — swappable from vscode-textmate to our WASM engine later
- **Incremental**: when a line changes, only re-tokenize from that line forward until the end-of-line scope stack stabilizes
- **Lazy grammar loading**: grammars loaded on demand when a language is first used

```typescript
interface TokenizeResult {
  tokens: IToken[];       // { startIndex, endIndex, scopes: string[] }
  ruleStack: StateStack;  // Scope stack at end of line (for next line)
}
```

#### 1.3 Theme System (from day one)
- `ShipCodeTheme`: maps TextMate scopes → foreground color, fontStyle (bold/italic/underline)
- Follows VS Code `color-theme.json` format for `tokenColors`
- Two built-in themes: `ship-light`, `ship-dark` — derived from Ship design tokens
- Theme resolution: most-specific scope wins (e.g., `keyword.control.ts` overrides `keyword`)
- CSS custom properties for editor chrome (background, gutter, caret, selection)

```typescript
interface ThemeRule {
  scope: string | string[];  // TextMate scope selector
  settings: {
    foreground?: string;
    fontStyle?: 'bold' | 'italic' | 'underline' | 'bold italic';
  };
}
```

#### 1.4 View Layer
- Custom DOM rendering (no `contenteditable`)
- Hidden `<textarea>` for input capture (CodeMirror approach — more control, fewer browser quirks)
- Line-based rendering: each line is a `<div>` with a gutter and content area
- Content area renders tokenized `<span>` elements with inline `color` and `font-style`
- Viewport-aware rendering: only render visible lines (virtual scrolling from the start)
- Caret: blinking insertion point rendered as an absolutely positioned `<div>`
- Basic selection: highlight range rendered as positioned overlays

#### 1.5 Selection & Caret System
- Custom selection library (not browser Selection API — we own the model)
- `CaretPosition`: `{ line: number, column: number }`
- `SelectionRange`: `{ anchor: CaretPosition, head: CaretPosition }` (anchor = where selection started, head = where caret is)
- Multi-caret support from the start: `SelectionState` holds an array of `SelectionRange`
- All caret/selection movement is driven by named **actions** (e.g., `'caret.moveRight'`, `'selection.selectWord'`)
- Actions are mapped to keys via **keymap presets** (see 1.6)

#### 1.6 Keymap Presets
- Keymaps are **typed constant exports** — just data, no classes or services
- Each keymap file exports a `ShipCodeKeymap` satisfying a type defined in our library
- Ship a **Sublime Text keymap** as the default (`sublime.keymap.ts`)
- Ship a **VS Code keymap** as an alternative (`vscode.keymap.ts`)
- The component registers the active keymap into `ShipA11yKeybindingsService` on init
- Users can override any binding via `SHIP_A11Y_KEYBINDINGS_OVERRIDE` (existing DI token)

```typescript
// keymaps/keymap.ts — the type, defined in our library
export type ShipCodeAction =
  | 'code.caret.moveLeft'       | 'code.caret.moveRight'
  | 'code.caret.moveUp'         | 'code.caret.moveDown'
  | 'code.caret.moveWordLeft'   | 'code.caret.moveWordRight'
  | 'code.caret.moveLineStart'  | 'code.caret.moveLineEnd'
  | 'code.caret.moveDocStart'   | 'code.caret.moveDocEnd'
  | 'code.selection.selectAll'  | 'code.selection.selectWord'
  | 'code.selection.selectLine'
  | 'code.selection.addCaretAbove' | 'code.selection.addCaretBelow'
  | 'code.edit.indent'          | 'code.edit.outdent'
  | 'code.edit.undo'            | 'code.edit.redo'
  | 'code.edit.deleteWordLeft'  | 'code.edit.deleteWordRight'
  | 'code.edit.deleteLine'
  | 'code.edit.moveLineUp'      | 'code.edit.moveLineDown'
  | 'code.edit.duplicateLine'   | 'code.edit.toggleComment'
  | 'code.search.find'          | 'code.search.replace';

export type ShipCodeKeymap = Record<ShipCodeAction, string>;
```

```typescript
// keymaps/sublime.keymap.ts — just a const export
import { ShipCodeKeymap } from './keymap';

export const SUBLIME_KEYMAP: ShipCodeKeymap = {
  'code.caret.moveLeft':          'ArrowLeft',
  'code.caret.moveRight':         'ArrowRight',
  'code.caret.moveUp':            'ArrowUp',
  'code.caret.moveDown':          'ArrowDown',
  'code.caret.moveWordLeft':      'Alt+ArrowLeft',
  'code.caret.moveWordRight':     'Alt+ArrowRight',
  'code.caret.moveLineStart':     'Home, ctrlOrCmd+ArrowLeft',
  'code.caret.moveLineEnd':       'End, ctrlOrCmd+ArrowRight',
  'code.caret.moveDocStart':      'ctrlOrCmd+Home',
  'code.caret.moveDocEnd':        'ctrlOrCmd+End',
  'code.selection.selectAll':     'ctrlOrCmd+a',
  'code.selection.selectWord':    'ctrlOrCmd+d',
  'code.selection.selectLine':    'ctrlOrCmd+l',
  'code.selection.addCaretAbove': 'ctrlOrCmd+Alt+ArrowUp',
  'code.selection.addCaretBelow': 'ctrlOrCmd+Alt+ArrowDown',
  'code.edit.indent':             'Tab',
  'code.edit.outdent':            'Shift+Tab',
  'code.edit.undo':               'ctrlOrCmd+z',
  'code.edit.redo':               'ctrlOrCmd+Shift+z',
  'code.edit.deleteWordLeft':     'Alt+Backspace',
  'code.edit.deleteWordRight':    'Alt+Delete',
  'code.edit.deleteLine':         'ctrlOrCmd+Shift+k',
  'code.edit.moveLineUp':         'ctrlOrCmd+Shift+ArrowUp',
  'code.edit.moveLineDown':       'ctrlOrCmd+Shift+ArrowDown',
  'code.edit.duplicateLine':      'ctrlOrCmd+Shift+d',
  'code.edit.toggleComment':      'ctrlOrCmd+/',
  'code.search.find':             'ctrlOrCmd+f',
  'code.search.replace':          'ctrlOrCmd+h',
};
```

```typescript
// keymaps/vscode.keymap.ts — overrides only the differences
import { ShipCodeKeymap } from './keymap';
import { SUBLIME_KEYMAP } from './sublime.keymap';

export const VSCODE_KEYMAP: ShipCodeKeymap = {
  ...SUBLIME_KEYMAP,
  'code.edit.moveLineUp':         'Alt+ArrowUp',
  'code.edit.moveLineDown':       'Alt+ArrowDown',
  'code.edit.duplicateLine':      'Shift+Alt+ArrowDown',
  'code.caret.moveWordLeft':      'ctrlOrCmd+ArrowLeft',
  'code.caret.moveWordRight':     'ctrlOrCmd+ArrowRight',
};
```

#### 1.7 Input Handling
- Hidden `<textarea>` captures keystrokes, IME input, paste
- Key events are matched against the active keymap via `ShipA11yKeybindingsService.matches()`
- Matched action names dispatch to the selection/editing engine
- Text insertion events create `Transaction` objects
- On every edit, trigger incremental re-tokenization of affected lines

#### 1.8 Angular Component
- `<sh-code>` standalone component
- Inputs: `value: string`, `language: string`, `readonly: boolean`, `lineNumbers: boolean`, `theme: string`, `keymap: 'sublime' | 'vscode'`
- Outputs: `valueChange: string`
- `ControlValueAccessor` for forms integration
- Ship theme tokens for editor chrome colors

#### 1.9 Bundled Grammars (Phase 1 set)
- `typescript` / `javascript` (TSX/JSX included)
- `html`
- `css` / `scss`
- `json`
- Grammars sourced from VS Code's built-in extensions (MIT licensed)

**Deliverable:** A syntax-highlighted code editor that looks like VS Code from day one.

---

### Phase 2 — Text Manipulation & History 📝

> Goal: Comfortable editing with undo/redo, indentation, and multi-caret.

#### 2.1 Undo/Redo
- Transaction history stack
- Coalesce rapid typing into single history entries (debounce window)
- Branching history: new edits from an earlier state fork a new branch

#### 2.2 Indentation
- Tab inserts configurable indent (2 spaces / 4 spaces / tab character)
- Shift+Tab dedents
- Auto-indent on Enter (match previous line's whitespace + increase after `{`, `(`, `[`)
- Block indent: select multiple lines → Tab/Shift+Tab indents/dedents all
- Language-aware: grammar scopes can signal indent increase/decrease rules

#### 2.3 Multi-Caret Editing
- Add carets above/below via keymap action
- All carets receive the same typed input simultaneously
- Each caret maintains its own `SelectionRange`
- Merging: overlapping ranges auto-merge into one

#### 2.4 Clipboard
- Cut/Copy/Paste with proper line handling
- Paste auto-indentation (match context)
- Copy full lines when no selection (Sublime / VS Code behavior)
- Multi-caret paste: N lines pasted across N carets

**Deliverable:** A genuinely usable code editor for editing real code.

---

### Phase 3 — ship-editor Integration 🔗

> Goal: `ship-editor`'s code blocks use `ship-code` as their renderer.

#### 3.1 Extension Bridge
- `shipCodeBlockExtension`: a `ShipEditorBlockExtension` that:
  - Uses `onBlockRender` to mount an `<sh-code>` instance inside the `<pre>` element
  - Syncs content bidirectionally between `sh-code`'s document and the editor's AST
  - Passes `language` from `block.attrs.language` to `sh-code`
  - Handles focus transitions: editor focus → sh-code focus and back

#### 3.2 Language Selector
- Dropdown in the code block toolbar to change language
- Updates `block.attrs.language` and re-tokenizes
- Filterable: type "type" → shows TypeScript, "jav" → Java, JavaScript

#### 3.3 Seamless UX
- Escape from code block returns focus to the rich text editor
- Arrow up/down at first/last line exits to adjacent blocks
- Copy the entire code block via toolbar button

#### 3.4 Configuration
```typescript
const richCodeBlock = configureExtension(codeBlockBlockExtension, {
  renderer: 'ship-code',   // mount <sh-code> instead of plain <pre>
  theme: 'ship-dark',      // override theme
  lineNumbers: true,        // toggle line numbers
});
```

**Deliverable:** ship-editor code blocks have syntax highlighting and proper editing.

---

### Phase 4 — Advanced Features 🚀

> Goal: Power-user features.

#### 4.1 Autocomplete
- Extension-based completion provider interface
- Basic: word-based completion from the current document
- Language-aware: keyword + built-in completions (from grammar scope analysis)
- Popup UI: positioned at caret position, keyboard navigable

#### 4.2 Search & Replace
- `Ctrl+F` / `Ctrl+H` with regex support
- Highlight all matches
- Replace one / replace all

#### 4.3 Code Folding
- Indent-based folding (language-agnostic)
- Language-aware folding (bracket matching, `meta` scope analysis)
- Fold gutter with clickable markers

#### 4.4 Minimap
- Scaled-down overview of the document (VS Code-style)
- Click-to-scroll, highlighted viewport indicator

#### 4.5 Bracket Matching & Line Operations
- Highlight matching brackets/parens on caret proximity
- Move line up/down (`Alt+Up/Down`)
- Duplicate line (`Shift+Alt+Down`)
- Delete line (`Ctrl+Shift+K`)
- Toggle line comment (`Ctrl+/`)

**Deliverable:** A rich code editing experience rivaling embedded CodeMirror.

---

### Phase 5 — More Grammars & Theme Ecosystem 🎨

> Goal: Broad language coverage and user-contributed themes.

#### 5.1 Additional Languages
- `python`, `rust`, `go`, `java`, `c`, `cpp`, `csharp`
- `markdown`, `yaml`, `toml`, `xml`, `sql`, `bash`/`shell`
- `graphql`, `dockerfile`, `terraform`
- All sourced from VS Code built-in or popular extension grammars

#### 5.2 Theme Import
- Import any VS Code `.json` color theme
- `loadTheme(url)` → parses `tokenColors` + editor colors
- Community theme gallery integration (future)

#### 5.3 Custom Grammar Registration
```typescript
import { registerGrammar } from 'ship-ui/ship-code';

registerGrammar({
  scopeName: 'source.myLang',
  grammar: myLanguageGrammarJSON,
});
```

---

### Phase 6 — Diff View & Collaboration Foundations 🔄

> Goal: Side-by-side diffs and the architecture for real-time collaboration.

#### 6.1 Diff View
- Side-by-side and inline diff rendering
- `<sh-code [diff]="{ original, modified }" />`
- Line-level and character-level diff highlighting
- Read-only diff mode + editable right-side mode

#### 6.2 Operational Transforms (OT) Foundation
- Document model supports OT-compatible operations
- Transform function: resolve concurrent changes
- Architectural groundwork — real-time collab comes later

---

## File Structure

```
projects/ship-ui/ship-code/
├── grand-plan.md                          # This file
├── ship-code.ts                           # Angular <sh-code> component
├── ship-code.html                         # Template
├── ship-code.scss                         # Styles
├── core/
│   ├── document.ts                        # CodeDocument, Line, Change, Transaction
│   ├── document.spec.ts                   # Document model tests
│   ├── history.ts                         # Undo/redo stack
│   ├── history.spec.ts                    # History tests
│   ├── selection.ts                       # SelectionState, SelectionRange, CaretPosition
│   ├── selection.spec.ts                  # Selection & caret math tests
│   ├── actions.ts                         # Named action registry (caret.moveRight, etc.)
│   └── actions.spec.ts                    # Action dispatch tests
├── keymaps/
│   ├── keymap.ts                          # ShipCodeAction union + ShipCodeKeymap type
│   ├── sublime.keymap.ts                  # Sublime Text keymap constant (default)
│   ├── vscode.keymap.ts                   # VS Code keymap constant (alternative)
│   └── keymap.spec.ts                     # Keymap type + action coverage tests
├── textmate/
│   ├── engine.ts                          # TokenizerEngine interface (the swap point)
│   ├── vscode-engine.ts                   # Phase A: wraps vscode-textmate + vscode-oniguruma
│   ├── wasm-engine.ts                     # Phase B: our Rust/Zig WASM engine (future)
│   ├── grammar-registry.ts                # Load + resolve TextMate grammars
│   ├── grammar-registry.spec.ts           # Grammar loading tests
│   ├── tokenizer.ts                       # Line tokenizer (uses TokenizerEngine)
│   ├── tokenizer.spec.ts                  # Tokenization snapshot tests
│   └── types.ts                           # IToken, StateStack, ScopeStack types
├── themes/
│   ├── theme-resolver.ts                  # Map scopes → colors via theme rules
│   ├── theme-resolver.spec.ts             # Theme resolution tests
│   ├── ship-light.ts                      # Ship light theme (design tokens)
│   └── ship-dark.ts                       # Ship dark theme (design tokens)
├── grammars/
│   ├── registry.ts                        # Language → grammar mapping + lazy loading
│   ├── typescript.json                    # TS/JS grammar (from VS Code)
│   ├── html.json                          # HTML grammar
│   ├── css.json                           # CSS grammar
│   └── json.json                          # JSON grammar
├── view/
│   ├── editor-view.ts                     # DOM rendering engine
│   ├── caret.ts                           # Caret rendering + blinking
│   ├── gutter.ts                          # Line number gutter
│   ├── input-handler.ts                   # Hidden textarea input capture
│   └── virtual-scroll.ts                  # Viewport-aware line rendering
├── extensions/
│   ├── autocomplete.ts                    # Completion provider + popup
│   ├── search.ts                          # Find & replace
│   ├── folding.ts                         # Code folding (scope-based)
│   ├── bracket-match.ts                   # Bracket matching
│   └── minimap.ts                         # Document minimap
├── bridge/
│   └── ship-editor-code-block.ts          # ShipEditorBlockExtension for ship-editor
└── ship-code.spec.ts                      # Integration tests
```

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Tokenizer (now)** | `vscode-textmate` + `vscode-oniguruma` | Ship fast, 100% grammar compat, battle-tested |
| **Tokenizer (later)** | Own Rust/Zig → WASM | Drop-in replace behind `TokenizerEngine` interface, tiny binary, zero JS deps |
| **Input capture** | Hidden `<textarea>` | More control than `contenteditable`, fewer browser quirks (CodeMirror approach) |
| **State model** | Immutable transactions | Better for undo/redo, incremental tokenization, testability |
| **Naming** | "caret" not "cursor" | Aligns with `CaretState` from ship-editor, avoids CSS cursor ambiguity |
| **Default keymap** | Sublime Text | Closest to macOS native text editing; VS Code shipped as alternative |
| **Keymap format** | Typed const exports | `sublime.keymap.ts` exports a `ShipCodeKeymap` — just data, no classes |
| **Virtual scroll** | Custom implementation | Code editors need character-level precision, can't reuse generic list scroll |
| **Bundle strategy** | Grammars + themes lazy-loaded | Only ship what the user's language needs |
| **Scope naming** | TextMate / VS Code conventions | Full compatibility with the existing theme ecosystem |
| **Development** | TDD (test-first) | Write failing test → implement → green → next feature |

---

## Dependencies

**Phase A** (ship fast) — vendored, not npm-installed:

Ship is dependency-free. These libraries are copied directly into `vendor/` so there's no npm dependency to keep in sync. When we build our own WASM engine (Phase B), we delete the vendor folder.

| Vendored Library | Version | Purpose | Size |
|-----------------|---------|---------|------|
| `vscode-textmate` | 9.1.0 | TextMate grammar parser + scope stack machine | ~57KB JS + types |
| `vscode-oniguruma` | 2.0.1 | Oniguruma regex engine (WASM) | ~20KB JS + ~462KB WASM |

See `vendor/README.md` for update instructions.

**Phase B** (replace later): Both vendored libraries replaced by our own `~200KB` WASM binary.

Internal Ship dependencies (already in project, zero-cost):

| Dependency | Purpose | When |
|------------|---------|------|
| Ship design tokens | Theming | Phase 1+ |
| `ShipA11yKeybindingsService` | Customizable keyboard shortcuts | Phase 1 |
| `ShipEditorBlockExtension` | ship-editor integration | Phase 3 |

---

## Development Methodology: TDD

> **Every feature starts with a failing test. Implement until it's green. Move on.**

This is non-negotiable for ship-code. The core engine is pure TypeScript with no DOM dependencies — it's trivially testable, and we'll keep it that way.

### The Cycle

```
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
  │  🔴 RED      │ ──▶ │  🟢 GREEN    │ ──▶ │  🔵 REFACTOR │
  │  Write test  │     │  Make it pass│     │  Clean up    │
  └─────────────┘     └──────────────┘     └──────────────┘
           ▲                                       │
           └───────────────────────────────────────┘
```

### Rules

1. **Write the test first** — describe the behavior you expect before writing any implementation code
2. **Run the test, watch it fail** — if it passes immediately, the test is wrong or the feature already exists
3. **Write the minimum code** to make the test pass — no premature abstraction
4. **Refactor** once green — clean up duplication, extract helpers, improve naming
5. **Never leave a red test** — every commit should be green

### Example: Document Insert

```typescript
// Step 1: 🔴 Write the failing test
it('should insert text at caret position', () => {
  const doc = createDocument('hello world');
  const tx = insertText(doc, { line: 0, column: 5 }, ' beautiful');
  const result = applyTransaction(doc, tx);
  expect(getLine(result, 0)).toBe('hello beautiful world');
});

// Step 2: 🟢 Implement insertText() + applyTransaction() until green
// Step 3: 🔵 Refactor if needed
// Step 4: Commit and move to next test
```

### What Gets Tested First (per feature)

| Feature | Test First |
|---------|------------|
| Document model | `applyTransaction` produces expected doc state |
| Selection | `moveCaretRight` at end of line wraps to next line |
| Tokenization | `const x = 5;` produces expected scope array |
| Theme resolver | `keyword.control.ts` resolves to correct color |
| Keymap | Sublime preset maps `Alt+ArrowLeft` to `caret.moveWordLeft` |
| History | Undo reverses last transaction, redo re-applies it |
| Incremental tokenize | Edit on line 5 only re-tokenizes lines 5+ |

---

## Testing Strategy

| Layer | Approach | Example |
|-------|----------|---------|
| **Document model** | Pure unit tests (Vitest) | Transaction application, history branching |
| **Selection & caret** | Unit tests | Caret movement, range expansion, multi-caret merge |
| **Keymaps** | Unit tests | Sublime maps `ctrlOrCmd+d` to `selection.selectWord` |
| **Tokenization** | Snapshot tests | `const x = 5;` → expected scope assignments per token |
| **Theme resolution** | Unit tests | `keyword.control.ts` resolves to `#C586C0` with VS Code Dark+ |
| **Incremental re-tokenization** | Unit tests | Edit line 5, verify only lines 5-N are re-tokenized |
| **Grammar loading** | Integration tests | Load TS grammar, tokenize, verify scopes |
| **View rendering** | JSDOM tests | DOM structure for tokenized lines, gutter numbers |
| **ship-editor bridge** | Integration tests | AST sync, focus transitions |
| **Keybinding dispatch** | Simulated keyboard event tests | Tab indent, Ctrl+Z undo |

---

## Success Criteria

| Phase | Metric |
|-------|--------|
| **Phase 1** | Renders syntax-highlighted editable code, looks like VS Code on 1000+ line files |
| **Phase 2** | Comfortable enough to write real code — undo/redo, indentation, multi-caret |
| **Phase 3** | ship-editor users get rich code blocks with zero additional configuration |
| **Phase 4** | Competitive with embedded CodeMirror for documentation / blog editors |
| **Phase 5** | 20+ languages supported, VS Code theme import works |
| **Phase 6** | Architectural foundation for real-time collaborative editing |
