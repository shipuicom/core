# ✨ Sparkle UI

This is a early stage alpha version of the Sparkle UI. It is not ready for production use not because the compoents are not polished but because their APIs can change drastically and often.

## Todos for v1 beta

- [x] Create a datepicker component
- [x] Streamline the css attributes vs directives
- [x] Remove all the spk- prefixes inside components
- [x] Make default content projection on spk-select be options
- [x] Minimize attributes to carry less naming complexity
- [x] Have the spk-menu use a popover
- [x] Create a dialog service
- [x] Go through all components and see if we can trim down the css maybe combine styles from different components
- [x] spk-menu should support arrow keys to navigate options
- [x] Move tooltips from style to a component to use popovers
- [x] Support free text in spk-select
- [x] Create a datepicker input component
- [x] Refactor range-slider
- [x] Fix safari 17 and below popover positioning (this might also fix other legacy browsers)
- [x] Fix datepicker popover positioning
- [x] Add hotkeys to navigate spk-menu options
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
- [x] Support resizable columns in spk-table
- [x] Support free text input in spk-select
- [x] Remove the need to set #input on the input element
- [x] spk-range-slider now support negative values and floats
- [x] spk-select gets a wildcard search on the label and value similar to the spk-menu ex search value "hlo" will match "hello" and "halo" it converts into what we call a wildcard regex which are similar to globbing "*h*l*o*" just with regex.
- [x] Finalize file upload component
- [x] Improve tooltips to be a directive instead still spawning a popover on the element
- [x] Revamp color scheme to a radix like 1-12 instead of 100-900 (align with figma)
- [x] spk-table features
  - [x] Add support for sticky headers and internal rows
  - [x] Add support for sticky rows
  - [x] Add support for multi sticky rows
  - [x] Improve support for sorting with a built in sort using attribute on the column
  - [x] Add support for multi sticky columns
- [x] spk-menu features
  - [x] support multi select
  - [x] Support multiple element types
  - [x] Support custom option element selectors
  - [x] add support for multi layer menus
- [x] Make icon watcher/generator/subsetter run on node (Could make it a standalone executable)
- [x] When using wildcard searching in spk-select and spk-menu sort the closet match to the top of the list
- [x] Add flat and raised versions of alerts
- [ ] Create a accordion component
- [ ] Create a timepicker component

- [ ] Create documentation with examples for all components
- [ ] Make styles optional/configurable (base, simple, raised, outlined, flat) on a component level and generally
- [ ] Separate out icon utility into a separate package so you can add it if you need it

### Nice to haves for v1 beta

- [ ] spk-select feature: add support for custom filter predicates on inlineSearch

### Features after v1 release

- [ ] Create volume slider variant for range slider
- [ ] Drag controls for number inputs (directive)
- [ ] spk-table features
  - [ ] Add support for row resizing
- [ ] spk-menu features
  - [ ] add hotkeys to navigate options without having a search input
  - [ ] add focus with a hidden input similar to native select
- [ ] CLI util to figure out which components and styles are used in a project as a production build trimmer
- [ ] Add a A11y service to streamline accessibility, maybe be able to swap config based on page or on a method
- [ ] Add a A11y VIM mode
- [ ] Custom scrollbar component that have the native apple feel with overscrolling where scroll thumb becomes smaller and you can over scroll a div
- [ ] Grid drag and drop sortables
- [ ] Multi list drag and drop sortables

### New components after v1 release

- [ ] Create a card stack component
- [ ] Create a CSV input that create chips on comma (or enter) press, currently select has chip select which is not ideal but works for now
- [ ] Create simple chart components (could also be core for simple charts)
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Doughnut chart

### Possible extension packages

- [ ] Animation package
- [ ] Create a gantt chart component
- [ ] Create a blueprint component (like blueprints in unreal engine)
- [ ] Create a timeline component
- [ ] Code editor component
  - [ ] Syntax highlighting
  - [ ] Code completion
  - [ ] Code folding
  - [ ] Code refactoring
  - [ ] Code navigation
  - [ ] Auto formatting
  - [ ] Auto indentation
  - [ ] Auto closing
  - [ ] Auto rename
- [ ] Create a markdown editor component
- [ ] Create a spreadsheet component
- [ ] Create a wysiwyg editor component

### Testing to add

- [ ] E2E testing
- [ ] Fuzz testing
- [ ] Simulation testing

### Blocked changes

- [ ] required inputs on dialogs, since its not supported by angular yet [angular/51878](https://github.com/angular/angular/issues/51878)

### Notes

- <strike>For safari `<18` the selects does not support using options so you must use `<spk-option>` instead of `<option>` (this is fixed in the next select version currently suffixed with `-new`)</strike> (We circumvent this by using a templates instead of options)
- Known issues for selects when having two selects editing the same value and it is a multi select and searchable they clear out when opened also when selecting a new item they clear the rest of the list - not a very likely scenario but it is something to keep in mind (Your UI probably should not allow this scenario write an issue if you think it should be possible with a good explanation and example)

## Contributors

### Creators

- [Simon - development](https://github.com/sp90)
- [Morten - design](https://x.com/mortenpx)

### Sponsors

- [Duplicati](https://duplicati.com)

## License

MIT
