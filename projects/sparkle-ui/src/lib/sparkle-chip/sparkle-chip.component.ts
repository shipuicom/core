import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
    selector: 'spk-chip',
    imports: [],
    template: '<ng-content></ng-content>',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SparkleChipComponent {}
