import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-step-1',
  standalone: true,
  imports: [],
  template: `
    <p>step-1 works!</p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Step1Component {}
