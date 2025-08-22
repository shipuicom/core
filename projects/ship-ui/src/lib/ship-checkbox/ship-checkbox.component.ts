import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ShipIconComponent } from '../ship-icon/ship-icon.component';
import { classMutationSignal } from '../utilities/class-mutation-signal';

@Component({
  selector: 'sh-checkbox',
  imports: [ShipIconComponent],
  template: `
    <div class="box sh-sheet" [class]="showClasses()">
      <sh-icon class="inherit default-indicator">check-bold</sh-icon>
      <sh-icon class="inherit indeterminate-indicator">minus-bold</sh-icon>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipCheckboxComponent {
  currentClassList = classMutationSignal();
  showClasses = computed(() => {
    const classArr = this.currentClassList().split(' ');

    return classArr.includes('active') ? classArr : '';
  });
}
