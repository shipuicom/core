import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'spk-tabs',
    imports: [],
    template: `
    <ng-content />
  `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleTabsComponent {}
