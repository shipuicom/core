import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-5',
  imports: [],
  template: `
    <h1>step-5 works!</h1>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step5Component {}
