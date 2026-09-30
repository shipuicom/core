import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { CustomSteppersComponent } from './examples/custom-stepper/custom-steppers';
import { DefaultStepperComponent } from './examples/default-stepper/default-steppers';
import { Steppers } from './examples/router-stepper/router-steppers';
import { StepperSandbox } from './examples/stepper-sandbox/stepper-sandbox';

@Component({
  selector: 'app-steppers-examples',
  imports: [Previewer, RouterOutlet, ShipButtonGroup, StepperSandbox, DefaultStepperComponent, CustomSteppersComponent, Steppers],
  templateUrl: './steppers-examples.html',
  styleUrl: './steppers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SteppersExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  color = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('');
}
