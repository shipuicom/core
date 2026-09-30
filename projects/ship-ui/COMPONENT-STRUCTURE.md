# Component structure

Every package under `projects/ship-ui/ship-<name>/` follows the shape below. `bun run lint:structure` checks it.

## Files

```
ship-<name>/
  ng-package.json        # secondary entry point, styleIncludePaths: ["../styles"]
  public-api.ts
  ship-<name>.ts         # the component (or directive / service)
  ship-<name>.scss       # structure only (see "Styles")
  ship-<name>.html       # optional, when the template is more than a few lines
  ship-<name>.service.ts # optional
  ship-<name>.spec.ts    # optional
```

- File and selector prefix is `ship-` / `sh-` (`sh-<name>` element, `[sh<Name>]` attribute). No `sh-*.ts` file names,
  no `.component.ts` / `.directive.ts` suffixes, no `*.module.ts`.
- Packages with several components (`ship-layout`, `ship-video`) keep one `.ts` + `.scss` pair per component.

## TypeScript

- Standalone is the default: do not write `standalone: true`.
- `encapsulation: ViewEncapsulation.None` and `changeDetection: ChangeDetectionStrategy.OnPush` on every component.
- Signal APIs only: `input()`, `model()`, `output()`, `viewChild()`, `contentChildren()`. No decorators for inputs,
  outputs, queries or host listeners; use the `host` metadata object.
- `inject()` for dependencies; constructors only register `effect`/`afterNextRender`.
- Styling classes come from `shipComponentClasses('<camelName>', { color, variant, size, … })` bound with
  `'[class]': 'hostClasses()'`. `<camelName>` is also the key in `ShipConfig` (`eventCard`, `rangeSlider`).
- A component whose surface is a sheet (button, chip, alert, …) adds the static host class `sh-sheet` (or `sh-sheet-h`
  when it has a hover state) and lets `styles/components/ship-sheet.utility.scss` provide the variant × colour skin.
- Inputs that have no styling or behaviour are not declared. If `color` or `variant` is accepted, the scss must style it.
- Ids come from `generateUniqueId()` (`src/lib/utilities/random-id.ts`), never `Math.random()`.

## Styles

Structure (`ship-<name>.scss`) and skin (`styles/skins/_<name>.scss`, phase 3) are separate.

```scss
@use 'helpers' as *;

$shipName: true !default;

@if $shipName == true {
  sh-name {
    // 1. tokens: --<abbr>-<style>[-<state>] (see variable-abbrevation-cheatsheet.md)
    --name-h: #{p2r(40)};
    --name-bg: var(--base-1);
    --name-c: var(--base-12);
    --name-bc: var(--base-4);

    // 2. structure: layout, sizing, motion, states, a11y
    display: inline-flex;
    height: var(--name-h);
    background: var(--name-bg);
    color: var(--name-c);
    border: var(--border-10);
    border-color: var(--name-bc);

    &.small { --name-h: #{p2r(32)}; }
    &:focus-visible { outline: 2px solid var(--primary-8); outline-offset: 2px; }
  }
}
```

- The file starts with `@use 'helpers' as *;`, declares `$ship<Name>: true !default` and wraps everything in the
  `@if` guard. Nothing sits outside the guard (no `%placeholder`, `@keyframes`, `@position-try` leaks).
- Sizes go through `p2r()`. No raw `px` except `1px`/`2px` hairlines and outlines.
- Colour only through tokens: `--base-1..12`, `--<color>-1..12`, `--<color>-g2/g3`, `--<color>-c8` (contrast text
  on `-8`), `--light-text`/`--dark-text`. No hex / hsl / rgb literals, and no hardcoded fallbacks in `var()`.
  Derived colours use `rgb(from var(--x) r g b / .5)` or `color-mix()`.
- Colour classes are exactly `primary | accent | warn | error | success`. Never `warning`, `danger`, `info`.
- Sheet variants are exactly `simple | outlined | flat | raised`; layout variants are `type-b | type-c | type-d`.
- Skin blocks (`.simple/.outlined/.flat/.raised` × `.<color>`, `.type-*`) only set tokens; they never change layout.
  A component that is a sheet does not re-implement these blocks.
- A component may consume another component's public tokens (`--btn-h`, `--ff-s`, `--sheet-bg`). It may not
  `@use '../ship-x/ship-x.scss'` or select another component's internal classes.
- Every `--x` a file reads is defined either in `styles/core/core/variables.scss`, the sheet utility, the file's own
  host block, or a documented public token of the component it wraps.
- Demo-only styling lives in the docs app (`projects/design-system`), not in the library scss.

## Flags

`styles/index.scss` declares one `$ship<Name>` flag per component. Today a component's scss ships with the component
through `styleUrl`, so the flag only documents intent; once skins move to `styles/skins/` (phase 3) the flag and the
`$ship<Name>Variants` / `$ship<Name>Colors` lists control what the skin emits.
