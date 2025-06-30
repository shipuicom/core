import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SparkleRadioComponent, SparkleStepperComponent } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-router-stepper',
  standalone: true,
  imports: [SparkleStepperComponent, SparkleRadioComponent, RouterLink, RouterLinkActive],
  templateUrl: './router-stepper.component.html',
  styleUrl: './router-stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RouterStepperComponent {}
