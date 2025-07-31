import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ShipIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'sh-toggle-card',
  imports: [ShipIconComponent],
  template: `
    <h3 (click)="disallowToggle() || toggle()">
      <ng-content select="[title]">Title</ng-content>

      @if (!disallowToggle()) {
        <sh-icon class="toggle-icon">caret-down</sh-icon>
      }
    </h3>

    <div class="collapsable">
      <div class="content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
  },
})
export class ShipToggleCardComponent {
  isActive = model(false);
  disallowToggle = input(false);

  ngOnInit() {
    if (this.disallowToggle()) {
      this.isActive.set(true);
    }
  }

  toggle() {
    this.isActive.set(!this.isActive());
  }
}
