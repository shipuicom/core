import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: '[spk-button]',
  imports: [],
  template: '<div><ng-content></ng-content></div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleButtonComponent {}
