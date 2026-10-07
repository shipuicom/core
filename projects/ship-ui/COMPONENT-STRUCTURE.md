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
  when it has a hover state) and lets `styles/skins/_sheet.scss` provide the variant × colour skin.
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

- The file starts with `@use 'helpers' as *;`. It declares no `$ship<Name>` flag and has no `@if` guard: ng-packagr
  compiles it into the component, so nothing a consumer writes can reach a flag in it. The `$ship<Name>` flags in
  `styles/index.scss` switch skins only (the lint's `local-flag` rule rejects a flag or guard here).
- Styles live in the `.scss` file (`styleUrl`), never in an inline `styles:` block (`inline-styles` rule), so the
  helpers and every rule here apply. The same rules run over `styles/skins`, `styles/core` and `src/lib`.
- Sizes go through `p2r()`. No raw `px` except `1px`/`2px` hairlines and outlines.
- No hardcoded fallback in `var()` (`var-fallback` rule): declare the token's default on the component instead.
  Another `var()`, a Sass variable, `0` or a keyword (`auto`, `none`, `currentColor`) is fine.
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

## Skins

A component's variant × colour blocks live in `styles/skins/_<name>.scss` as `@mixin skin($colors, $variants)` and are
emitted from `styles/skins/_index.scss` behind the component's `$ship<Name>` flag. The structure file keeps neutral
token defaults and everything keyed by state or geometry; the skin only sets tokens under `.<colour>`, `.simple`,
`.outlined`, `.flat`, `.raised` (and `.type-*` where a type is purely a skin). Layout-only `type-*` blocks stay in
the structure file.

```scss
@use '@ship-ui/core/styles' with (
  $shipColors: (primary, error),                   // every skin: only these colour classes
  $shipVariants: (simple, flat),                   // every skin: only these sheet variants
  $shipSkins: (toggle: (colors: (primary))),       // per skin overrides
  $shipToggle: false,                              // a skin switched off entirely
  $shipPalettes: (brand: (200, 80%, 45%)),         // an extra palette: --brand-1..12, -g2, -g3, -c8 and .brand classes
  $shipPaletteSteps: (1, 2, 3, 4, 8, 9)            // emit only these steps (the skins read 1-4 and 6-11)
);
```

Adding a skin: create `styles/skins/_<name>.scss`, loop `@each $c in $colors` / guard variants with `has($variants, …)`
from `./util`, then register it in `_index.scss` (`@use` + `@if enabled(<name>) { @include … }`). The flag key is
the camel-cased flag name without `ship` (`$shipLayoutStat` → `layoutStat`).
