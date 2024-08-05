import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'spk-divider',
  standalone: true,
  imports: [],
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleDividerComponent {}
