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
- [x] Support displayWith in spk-select

- [ ] Streamline general color variables 10-70 instead of 100-900 (align with figma)
- [ ] Create a datepicker input component
- [ ] Create a CSV input that create chips on comma (or enter) press
- [ ] Create a accordion component
- [ ] Create a spinner component

- [ ] Make styles optional/configurable (base, simple, raised, outlined, flat) on a component level and generally
- [ ] Make colors optional/configurable (primary, accent, tertiary, warn, success) on a component level and generally
- [ ] Create documentation with examples for all components

- [ ] Refactor range-slider (dosn't really work or isn't easy enough to use)
- [ ] Refactor select component once again

### Nice to haves for v1 beta

- [ ] Create a timepicker component
- [ ] Multi select menu's that dosn't close when checking an option
- [ ] Create a datepicker range input component
- [ ] Add hotkeys to navigate spk-menu options
- [ ] Add flat and raised versions of alerts
- [ ] Create a color picker component
- [ ] Create a gantt chart component
- [ ] Create simple chart components
  - [ ] Line chart
  - [ ] Bar chart
  - [ ] Pie chart
  - [ ] Doughnut chart
- [ ] CLI util to figure out which components and styles are used in a project as a production build trimmer
- [ ] On spk-menu, add focus with a hidden input similar to native select
- [ ] On spk-select move over to using contentChildren requiring #prefix to the option elements

### Testing to add

- [ ] E2E testing
- [ ] Fuzz testing
- [ ] Simulation testing

### Blocked changes

- [ ] required inputs on dialogs, since its not supported by angular yet [angular/51878](https://github.com/angular/angular/issues/51878)

## Contributors

### Creators

- [Simon - development](https://github.com/sp90)
- [Morten - design](https://x.com/mortenpx)

### Sponsors

- [Duplicati](https://duplicati.com)

## License

MIT
