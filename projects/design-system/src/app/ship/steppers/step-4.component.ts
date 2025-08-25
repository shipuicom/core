import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-4',
  imports: [],
  template: `
    <h1>step-4 works!</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step4Component {}
