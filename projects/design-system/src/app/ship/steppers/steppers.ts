import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShipAlert } from '@ship-ui/core/ship-alert';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicStepper } from './examples/basic-stepper/basic-stepper';
import { CustomSteppersComponent } from './examples/custom-stepper/custom-steppers';
import { DefaultStepperComponent } from './examples/default-stepper/default-steppers';
import { Steppers } from './examples/router-stepper/router-steppers';
import { StepperSandbox } from './examples/stepper-sandbox/stepper-sandbox';

@Component({
  selector: 'app-steppers',
  imports: [
    ShipTabs,
    ApiReference,
    RouterOutlet,
    Previewer,
    PropertyViewer,
    BasicStepper,
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
  activeTab = signal('overview');
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
