import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-2',
  standalone: true,
  imports: [],
  template: `
    <p>step-2 works!</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step2Component {}
