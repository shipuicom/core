# ⛵ Ship UI

This is a early stage alpha version of the Ship UI. It is not ready for production use not because the compoents are not polished but because their APIs can change drastically and often.

## Todos for v1 beta

- [x] Create a datepicker component
- [x] Streamline the css attributes vs directives
- [x] Remove all the sh- prefixes inside components
- [x] Make default content projection on sh-select be options
- [x] Minimize attributes to carry less naming complexity
- [x] Have the sh-menu use a popover
- [x] Create a dialog service
- [x] Go through all components and see if we can trim down the css maybe combine styles from different components
- [x] sh-menu should support arrow keys to navigate options
- [x] Move tooltips from style to a component to use popovers
- [x] Support free text in sh-select
- [x] Create a datepicker input component
- [x] Refactor range-slider
- [x] Fix safari 17 and below popover positioning (this might also fix other legacy browsers)
- [x] Fix datepicker popover positioning
- [x] Add hotkeys to navigate sh-menu options
- [x] Create a color picker component
- [x] Create a spinner component
- [x] Refactor select component once again
- [x] Add template placeholder
- [x] Add option template
- [x] Add placeholder template
- [x] Chip support
- [x] Select multiple support (with search)
- [x] Inline search support
- [x] Lazy search support
- [x] Multi select menu's that dosn't close when checking an option
- [x] Make colors optional/configurable (primary, accent, tertiary, warn, success) on a component level and generally
- [x] Add support of multiple phosphor icons types (bold, fill, light, regular, thin) in the same font by just suffixing with (-bold, -fill, etc)
- [x] Support datepicker ranges
- [x] Support multiple month views in datepicker
- [x] Create a daterange input component
- [x] Support resizable columns in sh-table
- [x] Support free text input in sh-select
- [x] Remove the need to set #input on the input element
- [x] sh-range-slider now support negative values and floats
- [x] sh-select gets a wildcard search on the label and value similar to the sh-menu ex search value "hlo" will match "hello" and "halo" it converts into what we call a wildcard regex which are similar to globbing "*h*l*o*" just with regex.
- [x] Finalize file upload component
- [x] Improve tooltips to be a directive instead still spawning a popover on the element
- [x] Revamp color scheme to a radix like 1-12 instead of 100-900 (align with figma)
- [x] sh-table features
  - [x] Add support for sticky headers and internal rows
  - [x] Add support for sticky rows
  - [x] Add support for multi sticky rows
  - [x] Improve support for sorting with a built in sort using attribute on the column
  - [x] Add support for multi sticky columns
  - [x] Multi sticky columns use cumulative offsets — adjacent sticky columns pin next to each other instead of sliding beneath one another, same engine for markup- and config-based tables (no [shStickyColumns] wrapper needed)
  - [x] Row resizing (shRowResize) — drag the bottom edge or Shift+ArrowUp/Down, with minHeight/maxHeight inputs
  - [x] Fix sh-table losing its row/cell elements under SSR hydration (browsers strip table tags outside a real <table>; sh-table now skips hydration)
- [x] sh-menu features
  - [x] support multi select
  - [x] Support multiple element types
  - [x] Support custom option element selectors
  - [x] add support for multi layer menus
- [x] Make icon watcher/generator/subsetter run on node (Could make it a standalone executable)
- [x] When using wildcard searching in sh-select and sh-menu sort the closet match to the top of the list
- [x] Add flat and raised versions of alerts
- [x] Create documentation with examples for all components
- [x] Create a timepicker component
- [x] Bug on table headers with sticky rows - sticky rows hide table headers but should add to the table headers
- [x] Create a accordion component
- [x] Add another button group variant
- [x] Grid drag and drop sortables
- [x] Multi list drag and drop sortables
- [x] sh-virtualization
  - [x] Extract virtualization into a shared core: ShipVirtualWindow (headless, axis-aware) drives sh-virtual-scroll, the new shVirtualScroll directive, sh-code and sh-spreadsheet; sh-editor stays on BlockHeightMap directly
  - [x] shVirtualScroll directive: apply to your own markup, vertical or horizontal, scrolls against the nearest overflow-auto ancestor
  - [x] Virtual Scroll docs page: Architecture tab (component/directive/engine, with examples) + live directive example, added to the sidebar
- [x] Document component services on dedicated Service tabs (dialogs, alerts, spotlight, a11y-keybindings, datepickers, lists, sortables, theme-toggle, videos)
- [x] sh-editor
  - [x] wysiwyg editor
  - [x] markdown editor
- [x] sh-popover should have a pos center feature for the dropdown
- [ ] Apply the new sheet utility to radio buttons
- [ ] Make styles optional/configurable (base, simple, raised, outlined, flat) on a component level and generally
- [ ] Make color themes optional/configurable (primary, accent, warn, error, success) globally.
- [ ] sh-select feature: add support for custom filter predicates on inlineSearch

### Features after v1 release

- [ ] CLI utility to remove unused css variables to not ship unused code
- [ ] Create volume slider variant for range slider
- [ ] Drag controls for number inputs (directive)
- [ ] sh-menu features
  - [ ] add hotkeys to navigate options without having a search input
  - [ ] add focus with a hidden input similar to native select
- [ ] CLI util to figure out which components and styles are used in a project as a production build trimmer
- [ ] Add a A11y service to streamline accessibility, maybe be able to swap config based on page or on a method
- [ ] Add a A11y VIM mode
- [ ] Custom scrollbar component that have the native apple feel with overscrolling where scroll thumb becomes smaller and you can over scroll a div

### New components after v1 release

- [ ] Create a code input (like n amont of boxes for 2FA codes etc).
- [ ] Create a card stack component
- [x] Bottom-sheet dialog type — a ShipDialog variant (e.g. type "bottom-sheet"; "sheet" is taken by the surface utility) that anchors the dialog as a native-feeling card: drag handle, slide-down dismiss with velocity snap (transpose ship-sidenav's drag machinery), backdrop + Escape from the dialog for free, opened through the same typed ShipDialogService.open(). Foundation for the editor's mobile sheet mode.
- [ ] Create a CSV input that create chips on comma (or enter) press, currently select has chip select which is not ideal but works for now
- [ ] Create simple chart components (could also be core for simple charts)
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Doughnut chart

### WIP Complex Components

### Complex Components

- [x] (WIP) Create a spreadsheet component (sh-spreadsheet)
- [x] (WIP) Create a blueprint component (aka flowchart)
- [x] Code editor component (sh-code)
  - [x] Syntax highlighting (textmate grammars)
  - [x] Indent/outdent, multi-cursor, keymaps (sublime/vscode)
- [ ] Animation package

#### Complex Components (Timeline/Gantt)

Might be sharing a lot of features and could be useful to do in the same one

- [ ] Create a gantt chart component
- [ ] Create a timeline component

#### Complex Components feature additions to complex components

- [ ] sh-editor features
  - [ ] Editable tables — as a component block (BaseComponentBlockBehavior), like the existing spreadsheet block but swapping in the editable composer once sh-spreadsheet cell editing lands
  - [ ] Embed blocks — as a component block (BaseComponentBlockBehavior) so the live component owns the iframe/video and the sanitizer keeps stripping raw embeds from pasted HTML; the document form stays a safe placeholder (url attrs), like the spreadsheet block's table form
  - [ ] Task list / checkbox block
  - [ ] Find & replace
  - [ ] Mentions (@user) and emoji autocomplete
  - [ ] Drag handles for block reordering (keyboard block move already works)
  - [ ] Collaborative editing — remoteStepMap + rebase foundations exist, missing transport, presence and remote cursors
  - [ ] Comments / annotations and track changes
  - [x] Mobile sheet editing mode (sh-editor-sheet) — on coarse-pointer/narrow viewports the inline editor renders as a tap-to-edit preview that opens the real editing surface in a bottom-sheet dialog: toolbar position="bottom" pinned above the keyboard (visualViewport tracking already shipped), editor fills the card and is its own scroller (virtualization picks the sheet body up as scroll container). Never reparent a live contenteditable into the sheet — mount fresh and restore the logical selection.
  - [ ] Markdown input rules — typing `# `, `- `, `> `, ``` autoconverts the block
  - [ ] Smart paste rules — URL over selection becomes a link, image URL becomes an image block
  - [ ] Toggle/collapsible block and multi-column layout block (component blocks)
  - [ ] Callout variants beyond info (warn/success/error — color system already exists)
  - [ ] Image captions + alt-text UI; gallery block
  - [ ] Heading anchors/ids + generated table of contents
  - [ ] Templates/snippets — insert predefined block structures via the slash menu
  - [ ] Version snapshots with local diff (pairs with the collab foundations)
  - [ ] AI hooks — selection rewrite / continue writing as slash commands over the behavior API
  - [ ] Smart typography (curly quotes, em-dashes)
- [ ] sh-code features
  - [ ] Find & replace bar (regex + in-selection)
  - [ ] Code completion
  - [ ] Code folding
  - [ ] Auto formatting
  - [ ] Auto indentation / auto closing
  - [ ] Soft wrap toggle — breaks the uniform-line-height assumption, needs per-line measureElements on the virtual window
  - [ ] Diff/merge view (two documents, gutter markers)
  - [ ] Diagnostics API — squiggles + gutter decorations so an LSP or linter can hang data on it
  - [ ] Bracket-pair matching/highlight, indent guides, whitespace rendering
  - [ ] Snippets with tabstops
  - [ ] Gutter extension API (breakpoints, blame, custom markers)
  - [ ] Color swatches on hex values, clickable URLs
  - [ ] Sticky scope header (current function pinned at top)
- [ ] sh-spreadsheet features (the first six are also on the docs page's "Not there yet" section)
  - [ ] Cell editing — editable composer wrapping the read-only sh-spreadsheet view
  - [ ] Keyboard navigation — arrow-key roving, Shift+arrow range extension
  - [ ] User-resizable columns and rows (resize = heights.measure + sync on the axis windows; regenerate the column stylesheet)
  - [ ] Paste into an existing spreadsheet (in-place range paste; today a pasted table becomes a new editor block)
  - [ ] Formulas / computed cells + formula bar UI and named ranges
  - [ ] Cell formatting, sorting, merged cells, frozen panes beyond the header rails
  - [ ] Fill handle — drag to autofill series
  - [ ] Row/column insert/delete/move (structural ops mirror into the axis windows via splice)
  - [ ] Cell types + validation (number/date/dropdown), conditional formatting
  - [ ] CSV/XLSX import/export
  - [ ] Multi-sheet tabs (workbook model)
  - [ ] Per-cell comments (shares the editor's future comments layer)
  - [ ] In-sheet search
  - [ ] Charts from a selected range — ties into the planned chart components
- [ ] Cross-cutting (build once, use in all three)
  - [ ] One find & replace engine shared by sh-editor / sh-code / sh-spreadsheet
  - [ ] Shared collab layer — generalize the remoteStepMap foundations beyond the editor
  - [ ] Screen-reader announcement pass for grid/editor operations
    - [x] announce(message, politeness) API — ShipA11yAnnouncerService (@ship-ui/core/ship-a11y-announcer), hidden aria-live regions per politeness, clear-then-set so repeats re-voice
    - [x] Alert toasts announce (error/warn assertive, rest polite)
    - [x] sh-spreadsheet announces the settled selection on mouseup ("B2 to C3 selected, 2 ranges") and copy ("Copied A1 to B3")
    - [x] sh-select announces option select/unselect with count, chip removal, and filtered option counts while searching
    - [x] sh-menu announces search result counts
    - [x] sh-editor announces mark toggles ("Bold on/off"), block conversions ("Heading 2"), undo/redo
    - [x] sh-datepicker announces the visible month when paging ("March 2026")
    - [ ] Grid ARIA on sh-spreadsheet (role=grid/row/gridcell, aria-rowcount/colcount + row/colindex — required because virtualization mounts only a window of rows, aria-selected)
    - [ ] sh-code cursor/occurrence announcements ("2 cursors", "3 of 7 occurrences")

### Testing (WIP)

Working on expanding testing surface currently tests most complex ui components

- [-] (WIP) Unit testing
- [-] (WIP) E2E testing
- [-] (WIP) Fuzz testing
- [ ] Simulation testing

### Blocked changes

- [ ] required inputs on dialogs, since its not supported by angular yet [angular/51878](https://github.com/angular/angular/issues/51878)
