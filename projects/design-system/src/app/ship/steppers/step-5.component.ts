import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'app-step-5',
    imports: [],
    template: `
    <p>step-5 works!</p>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Step5Component {}
