import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  SparkleButtonGroupComponent,
  SparkleRadioComponent,
  SparkleStepperComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-stepper',
  imports: [
    SparkleStepperComponent,
    SparkleRadioComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SparkleButtonGroupComponent,
  ],
  templateUrl: './spk-stepper.component.html',
  styleUrl: './spk-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkStepperComponent {
  colorClass = signal<'' | 'primary' | 'accent' | 'warn' | 'error' | 'success'>('primary');
}
