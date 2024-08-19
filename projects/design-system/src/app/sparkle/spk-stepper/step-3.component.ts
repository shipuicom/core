import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-3',
  standalone: true,
  imports: [],
  template: `
    <p>step-3 works!</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step3Component {}
