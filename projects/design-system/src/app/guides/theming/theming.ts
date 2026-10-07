import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton } from '@ship-ui/core/ship-button';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-theming',
  imports: [Highlight, PropertyViewer, ShipButton, RouterLink],
  templateUrl: './theming.html',
  styleUrl: './theming.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Theming {
  readonly variants = ['simple', 'outlined', 'flat', 'raised'] as const;
  readonly colors = ['primary', 'accent', 'warn', 'error', 'success'] as const;

  readonly STYLES = `@use '@ship-ui/core/styles';`;

  readonly WITH = `@use '@ship-ui/core/styles' with (
  $shipColors: (primary, error),              // colour classes every skin emits (default: all palettes)
  $shipVariants: (simple, flat),              // sheet variants every skin emits (default: all four)
  $shipSkins: (toggle: (colors: (primary))),  // per component overrides of the two lists
  $shipChip: false,                           // drop one component's skin entirely
);`;

  readonly SHIP_STYLES = `npx ship-styles                                            # ./ship-config.json → ./src/_ship-styles.scss
npx ship-styles --in ship-styles.json --out src/styles/_ship.scss
npx ship-styles --stdout                                   # print instead of writing`;

  readonly SHIP_STYLES_USE = `// styles.scss: the generated file replaces the plain @use
@use 'ship-styles';`;

  readonly CONFIG = `import { ApplicationConfig } from '@angular/core';
import { SHIP_CONFIG } from '@ship-ui/core';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: SHIP_CONFIG,
      useValue: {
        button: { color: 'primary', variant: 'raised' },
        chip: { variant: 'outlined', sharp: true },
        formField: { size: 'small' },
        editor: { variant: 'document' },
      },
    },
  ],
};`;

  readonly THEME_HEAD = `import { SHIP_THEME_INIT_SCRIPT } from '@ship-ui/core/ship-theme-toggle';

// Inline it in the <head> of index.html (or your SSR document) so a saved
// light/dark choice applies before first paint:
// <script>{{ SHIP_THEME_INIT_SCRIPT }}</script>`;

  readonly KNOBS = `:root {
  --font-family: 'Geist', sans-serif; // every text token reads it
  --font-size: 15px;                  // the rem base: sizes, spacing and icons follow
  --shape-scale: 0.5;                 // multiplies --shape-1..5 (corner radii)
  --border-width: 1px;
  --pad-y: 6px;                       // density: see Spacing & density
  --pad-x: 10px;
}`;
}
