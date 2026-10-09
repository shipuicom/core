import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipRangeSlider } from '@ship-ui/core/ship-range-slider';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

/** The tier multipliers in styles/core/core/variables.scss, with their values at the default 8px / 12px pair. */
const TIERS_Y = ['0.25', '0.5', '1', '1.5', '2', '3', '4', '6'];
const TIERS_X = ['1/3', '2/3', '1', '4/3', '5/3', '2', '8/3', '4'];
const GAPS_Y = ['0.5', '1', '1.5', '2', '3', '4', '6', '8'];
const GAPS_X = ['1/3', '2/3', '1', '4/3', '2', '8/3', '4', '16/3'];
const fraction = (value: string) => {
  const [n, d = '1'] = value.split('/');
  return Number(n) / Number(d);
};

@Component({
  selector: 'app-spacing',
  imports: [FormsModule, Highlight, PropertyViewer, ShipButton, ShipCard, ShipChip, ShipFormField, ShipIcon, ShipRangeSlider],
  templateUrl: './spacing.html',
  styleUrl: './spacing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Spacing {
  readonly padY = signal(8);
  readonly padX = signal(12);

  readonly tiers = TIERS_Y.map((y, i) => ({
    tier: i + 1,
    y,
    x: TIERS_X[i]!,
    yPx: Math.round((8 * fraction(y)) / 2) * 2,
    xPx: Math.round((12 * fraction(TIERS_X[i]!)) / 2) * 2,
  }));

  readonly gaps = GAPS_Y.map((y, i) => ({
    tier: i + 1,
    y,
    x: GAPS_X[i]!,
    yPx: Math.round((8 * fraction(y)) / 2) * 2,
    xPx: Math.round((12 * fraction(GAPS_X[i]!)) / 2) * 2,
  }));

  readonly GAPS = `.toolbar {
  display: flex;
  gap: var(--gap-x-2);                      // a row: column gap
}

.stack {
  display: flex;
  flex-direction: column;
  gap: var(--gap-y-4);                      // a column: row gap
}

.grid {
  display: grid;
  gap: var(--gap-y-5) var(--gap-x-5);       // both axes
}`;

  readonly space = [4, 8, 12, 16, 24, 32, 48, 64].map((px, i) => ({ token: `--space-${i + 1}`, px }));
  readonly shapes = [4, 8, 12, 16, 20].map((px, i) => ({ token: `--shape-${i + 1}`, px }));

  readonly DENSITY = `:root {
  --pad-y: 6px;   // default 8px
  --pad-x: 10px;  // default 12px
}`;

  readonly SCOPE = `// The tiers are computed on <body>, so a subtree with its own pair redeclares them
.compact-panel {
  --pad-y: 4px;
  --pad-x: 8px;
  --pad-y-3: round(var(--pad-y), 2px);
  --pad-x-3: round(var(--pad-x), 2px);
  --gap-y-2: round(var(--pad-y), 2px);
  --gap-x-2: round(calc(var(--pad-x) * 2 / 3), 2px);
  // … the padding and gap tiers its components read (see the multipliers above)
}`;

  readonly ONE_COMPONENT = `sh-card {
  --card-py: var(--pad-y-6);   // one size class up
  --card-px: var(--pad-x-6);
}

.compact sh-form-field {
  --ff-py: var(--pad-y-2);
  --ff-px: var(--pad-x-2);
}`;

  readonly SHAPE = `:root {
  --shape-scale: 0;    // square corners everywhere
}

.pill {
  --shape-scale: 2;    // or rounder in one subtree
}`;
}
