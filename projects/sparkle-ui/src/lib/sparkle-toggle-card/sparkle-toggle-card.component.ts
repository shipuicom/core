import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { SparkleIconComponent } from '../../public-api';

@Component({
  selector: 'spk-toggle-card',
  standalone: true,
  imports: [SparkleIconComponent],
  template: `
    <h3 (click)="disallowToggle() || toggle()">
      <ng-content select="[title]">Title</ng-content>

      @if (!disallowToggle()) {
        <spk-icon>caret-down</spk-icon>
      }
    </h3>

    <div class="content">
      <ng-content></ng-content>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
  },
})
export default class SparkleToggleCardComponent {
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
