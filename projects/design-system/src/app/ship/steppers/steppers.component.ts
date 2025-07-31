import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { DefaultStepperComponent } from './examples/default-stepper/default-steppers.component';
import { SteppersComponent } from './examples/router-stepper/router-steppers.component';
import { StepperSandboxComponent } from './examples/stepper-sandbox/stepper-sandbox.component';

@Component({
  selector: 'app-steppers',
  imports: [
    RouterOutlet,
    PreviewerComponent,
    PropertyViewerComponent,
    DefaultStepperComponent,
    SteppersComponent,
    StepperSandboxComponent,
  ],
  templateUrl: './steppers.component.html',
  styleUrl: './steppers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StepperComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
