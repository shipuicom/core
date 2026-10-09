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
  when it has a hover state) and lets `styles/skins/_sheet.scss` provide the variant × colour surface.
- Inputs that have no styling or behaviour are not declared. If `color` or `variant` is accepted, the scss must style it.
- Ids come from `generateUniqueId()` (`src/lib/utilities/random-id.ts`), never `Math.random()`.

## Styles

A component's whole style, structure and skin, lives in `ship-<name>.scss`, inside `@layer ship`.

```scss
@use 'helpers' as *;

@layer ship {
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

- The file starts with `@use 'helpers' as *;`, then Sass-only declarations (`$vars`, `@mixin`, `@function`), then one
  `@layer ship { … }` holding every rule. One layer for all of ShipUI keeps the internal cascade (specificity, then
  source order) unchanged while any unlayered app CSS wins over it. Never split it into sub-layers: a later sub-layer
  would beat an earlier one regardless of specificity.
- It declares no `$ship<Name>` flag and has no `@if` guard: ng-packagr compiles it into the component, so nothing a
  consumer writes can reach a flag in it (the lint's `local-flag` rule rejects a flag or guard here).
- Avoid `!important`: inside a layer it beats the app's `!important`, so the app can no longer override it.
- Styles live in the `.scss` file (`styleUrl`), never in an inline `styles:` block (`inline-styles` rule), so the
  helpers and every rule here apply. The same rules run over `styles/skins`, `styles/core` and `src/lib`.
- Sizes go through `p2r()`. No raw `px` except `1px`/`2px` hairlines and outlines.
- Density: padding reads a `--pad-y-N` / `--pad-x-N` tier through the component's `--<abbr>-py` / `--<abbr>-px`;
  gaps read a gap tier by axis: `--gap-y-N` between stacked items (row gap), `--gap-x-N` between items side by side
  (column gap), both on a grid or a wrapping row (`gap: var(--gap-y-3) var(--gap-x-3)`). `--space-N` is the fixed
  scale for spacing that must not follow the density.
- No hardcoded fallback in `var()` (`var-fallback` rule): declare the token's default on the component instead.
  Another `var()`, a Sass variable, `0` or a keyword (`auto`, `none`, `currentColor`) is fine.
- Colour only through tokens: `--base-1..12`, `--<color>-1..12`, `--<color>-g2/g3`, `--<color>-c8` (contrast text
  on `-8`), `--light-text`/`--dark-text`. No hex / hsl / rgb literals, and no hardcoded fallbacks in `var()`.
  Derived colours use `rgb(from var(--x) r g b / .5)` or `color-mix()`.
- Colour classes are exactly `primary | accent | warn | error | success`. Never `warning`, `danger`, `info`.
- Sheet variants are exactly `simple | outlined | flat | raised`; layout variants are `type-b | type-c | type-d`.
- Skin blocks (`.simple/.outlined/.flat/.raised`, `.type-*`) only set tokens; they never change layout.
  A component that is a sheet does not re-implement these blocks.
- A component may consume another component's public tokens (`--btn-h`, `--ff-s`, `--sheet-bg`). It may not
  `@use '../ship-x/ship-x.scss'` or select another component's internal classes.
- Every `--x` a file reads is defined either in `styles/core/core/variables.scss`, the sheet utility, the file's own
  host block, or a documented public token of the component it wraps.
- Demo-only styling lives in the docs app (`projects/design-system`), not in the library scss.

## Skins

A skin is the variant × colour part of a component's style. It lives in the component's own scss, written once
against the `--c-*` tokens instead of once per colour:

```scss
sh-name {
  --name-bg: var(--c-8, var(--base-8));      // the colour class's step 8, the grey base without one

  &.flat {
    --name-bg: var(--c-8, var(--base-8));
    --name-c: var(--c-c8, var(--light-text));
  }
}
```

A colour class (`.primary`, `.brand`, …) sets `--c-1..12`, `--c-g2/g3` and `--c-c8` to its palette
(`styles/skins/_colors.scss`, one block per palette, built-in or added through `$shipPalettes`). The tokens are
registered with `inherits: false`, so a colour class colours its own element only and a nested uncoloured component
keeps its base look. Read them on the host, where the class is; descendants inherit the resolved values through the
component's own tokens.

- Every colour value has a fallback to the uncoloured value: `var(--c-<step>, <base value>)`.
- A value that only applies under a colour class goes through a private token set to `var(--c-<step>)` with no
  fallback (invalid without a colour class) and read as `var(--name-x-c, var(--name-x))`; see `--toggle-bg-c`.
- Built-in aliases (`.danger`, `.action-primary`, …) map `--c-*` locally in the component.

Only what has to be global stays in `styles/skins`: the colour map, the shared sheet surface, the tooltip (its colour
class sits on the anchor, a sibling of the wrapper) and the avatar `ring-<colour>` second colour. Those are listed in
`SHIP_STYLE_SKINS` and switched by their `$ship<Name>` flag.
