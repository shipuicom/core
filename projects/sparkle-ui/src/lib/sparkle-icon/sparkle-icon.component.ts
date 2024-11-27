import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'spk-icon',
    imports: [],
    template: `
    <ng-content />
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleIconComponent {}
