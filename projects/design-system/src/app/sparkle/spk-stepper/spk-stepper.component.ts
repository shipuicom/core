import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  SparkleIconComponent,
  SparkleRadioComponent,
  SparkleStepperComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-stepper',
  standalone: true,
  imports: [
    SparkleStepperComponent,
    SparkleIconComponent,
    SparkleRadioComponent,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './spk-stepper.component.html',
  styleUrl: './spk-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkStepperComponent {}
