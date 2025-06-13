import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-chip',
  imports: [],
  template: '<div><ng-content></ng-content></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleChipComponent {}
