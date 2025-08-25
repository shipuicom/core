import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-1',
  imports: [],
  template: `
    <h1>step-1 works!</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step1Component {}
