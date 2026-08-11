import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Previewer } from '../../previewer/previewer';
import { CustomSteppersComponent } from './examples/custom-stepper/custom-steppers';
import { DefaultStepperComponent } from './examples/default-stepper/default-steppers';
import { Steppers } from './examples/router-stepper/router-steppers';
import { StepperSandbox } from './examples/stepper-sandbox/stepper-sandbox';

@Component({
  selector: 'app-steppers-examples',
  imports: [Previewer, RouterOutlet, StepperSandbox, DefaultStepperComponent, CustomSteppersComponent, Steppers],
  templateUrl: './steppers-examples.html',
  styleUrl: './steppers-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SteppersExamples {}
