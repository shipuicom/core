import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockStepsVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockStep, ShipBlockSteps } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';

@Component({
  selector: 'app-steps-sandbox',
  imports: [ShipBlockSteps, ShipBlockStep, ShipButton],
  templateUrl: './steps-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsSandbox {
  variant = input<ShipBlockStepsVariant>('');
  color = input<ShipColor>('primary');

  steps = [
    { title: 'Install the package', text: 'Add @ship-ui/core and import the blocks you need. Nothing global to set up.' },
    { title: 'Compose your page', text: 'Drop a heading, some copy and a few buttons into each block; it arranges them.' },
    { title: 'Ship it', text: 'Theme with your palette, deploy, and watch it reflow on every screen size.' },
  ];
}
