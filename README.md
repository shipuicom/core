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
  - [x] Support displayWith in spk-select (through templates)
  - [x] use templates to template options and have the list inside the select
  - [x] Add lazy search
  - [x] Add template placeholder
- [ ] Create a CSV input that create chips on comma (or enter) press
- [ ] Create a accordion component
- [ ] Create a timepicker component
- [ ] Finalize file upload component

- [ ] Streamline general color variables 10-70 instead of 100-900 (align with figma)
- [ ] Make styles optional/configurable (base, simple, raised, outlined, flat) on a component level and generally
- [ ] Make colors optional/configurable (primary, accent, tertiary, warn, success) on a component level and generally
- [ ] Create documentation with examples for all components

### Nice to haves for v1 beta

- [ ] Multi select menu's that dosn't close when checking an option
- [ ] Create a datepicker range input component
- [ ] Add flat and raised versions of alerts
- [ ] Create a gantt chart component
- [ ] Create simple chart components
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Doughnut chart
- [ ] CLI util to figure out which components and styles are used in a project as a production build trimmer
- [ ] On spk-menu, add focus with a hidden input similar to native select
- [ ] Add support of multiple phosphor icons types (bold, duotone, fill, light, regular, thin) in the same font by just prefixing with (duo-, bold-, etc)
- [ ] Add a A11y service to streamline accessibility, maybe be able to swap config based on page or on a method
- [ ] Add a A11y VIM mode

### Testing to add

- [ ] E2E testing
- [ ] Fuzz testing
- [ ] Simulation testing

### Blocked changes

- [ ] required inputs on dialogs, since its not supported by angular yet [angular/51878](https://github.com/angular/angular/issues/51878)

### Notes

- For safari `<18` the selects does not support using options so you must use `<spk-option>` instead of `<option>`

## Contributors

### Creators

- [Simon - development](https://github.com/sp90)
- [Morten - design](https://x.com/mortenpx)

### Sponsors

- [Duplicati](https://duplicati.com)

## License

MIT
