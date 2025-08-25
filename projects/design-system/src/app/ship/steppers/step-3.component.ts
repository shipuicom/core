import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-3',
  imports: [],
  template: `
    <h1>step-3 works!</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step3Component {}
