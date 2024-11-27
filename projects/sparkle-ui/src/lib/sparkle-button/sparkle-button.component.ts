import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: '[spk-button]',
    imports: [],
    template: '<ng-content></ng-content>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleButtonComponent {}
