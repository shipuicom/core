import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipAlert } from 'ship-ui';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { CustomSteppersComponent } from './examples/custom-stepper/custom-steppers';
import { DefaultStepperComponent } from './examples/default-stepper/default-steppers';
import { Steppers } from './examples/router-stepper/router-steppers';
import { StepperSandbox } from './examples/stepper-sandbox/stepper-sandbox';

@Component({
  selector: 'app-steppers',
  imports: [
    RouterOutlet,
    Previewer,
    PropertyViewer,
    CustomSteppersComponent,
    DefaultStepperComponent,
    Steppers,
    StepperSandbox,
    ShipAlert,
  ],
  templateUrl: './steppers.html',
  styleUrl: './steppers.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepperComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
