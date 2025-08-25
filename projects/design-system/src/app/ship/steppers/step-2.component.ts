import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-2',
  imports: [],
  template: `
    <h1>step-2 works!</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step2Component {}
