import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-list',
  standalone: true,
  imports: [],
  template: `
    <ng-content></ng-content>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleListComponent {}
