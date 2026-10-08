import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipButton } from '@ship-ui/core/ship-button';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-palettes',
  imports: [Highlight, PropertyViewer, ShipButton, RouterLink],
  templateUrl: './palettes.html',
  styleUrl: './palettes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Palettes {
  readonly palettes = ['base', 'primary', 'accent', 'warn', 'error', 'success'] as const;
  readonly colors = ['primary', 'accent', 'warn', 'error', 'success'] as const;
  readonly steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

  readonly USAGE = `.callout {
  background: var(--primary-2);     // tinted surface
  border: 1px solid var(--primary-6);
  color: var(--primary-11);         // readable text on light steps
}

.badge {
  background: var(--accent-8);      // the solid brand step
  color: var(--accent-c8);          // contrast text chosen for step 8
}`;

  readonly CUSTOM = `@use '@ship-ui/core/styles' with (
  $shipPalettes: (
    // (hue, saturation, lightness) of step 8; steps 1-12 and the gradients are generated
    brand: (200, 80%, 45%),
    // optional 4th value: distribution exponent, how the steps spread around step 8
    info: (210, 90%, 55%, 1.2),
  ),
);`;

  readonly STEP_MAP = `@use '@ship-ui/core/styles' with (
  $shipPalettes: (
    // or a full map of step: (light, dark) pairs, the same shape as the built-in palettes;
    // a built-in name (primary, accent, …) overrides that palette
    primary: (1: (#f5f8ff, #0b1120), 2: (#eaf0ff, #111a30), /* … */ 12: (#0b1530, #f2f6ff)),
  ),
);`;

  readonly USE_CLASS = `<button shButton color="brand" variant="raised">Brand</button>
<sh-chip class="brand">Brand chip</sh-chip>`;

  readonly STEPS = `@use '@ship-ui/core/styles' with (
  // the library's skins read steps 1-4 and 6-11; drop 5 and 12 if your own styles don't use them
  $shipPaletteSteps: (1, 2, 3, 4, 6, 7, 8, 9, 10, 11),
);`;
}
