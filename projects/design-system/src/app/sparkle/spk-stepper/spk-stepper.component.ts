import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { DefaultStepperComponent } from './examples/default-stepper/default-stepper.component';
import { RouterStepperComponent } from './examples/router-stepper/router-stepper.component';
import { StepperSandboxComponent } from './examples/stepper-sandbox/stepper-sandbox.component';

@Component({
  selector: 'app-spk-stepper',
  imports: [
    RouterOutlet,
    PreviewerComponent,
    PropertyViewerComponent,
    DefaultStepperComponent,
    RouterStepperComponent,
    StepperSandboxComponent,
  ],
  templateUrl: './spk-stepper.component.html',
  styleUrl: './spk-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkStepperComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
