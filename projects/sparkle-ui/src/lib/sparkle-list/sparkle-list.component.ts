import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'spk-list',
    imports: [],
    template: `
    <ng-content />
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleListComponent {}
