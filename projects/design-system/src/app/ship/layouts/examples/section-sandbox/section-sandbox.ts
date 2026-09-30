import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutSectionVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipLayoutSection } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-section-sandbox',
  imports: [ShipLayoutSection, ShipCard, ShipButton],
  templateUrl: './section-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionSandbox {
  variant = input<ShipLayoutSectionVariant>('');
}
