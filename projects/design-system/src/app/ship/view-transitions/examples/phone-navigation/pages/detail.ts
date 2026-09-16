import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { DEMO_ITEMS } from './home';

@Component({
  selector: 'app-demo-detail',
  imports: [ShipButton, ShipIcon],
  template: `
    <button shButton class="flat back" (click)="back()">
      <sh-icon>caret-left</sh-icon>
      Back
    </button>
    <div class="hero"></div>
    <h3>{{ item()?.title }}</h3>
    <p>{{ item()?.subtitle }}</p>
    <p>This page is deeper in the URL, so it was pushed. Going back pops it.</p>
  `,
  styleUrl: './demo-page.scss',
  styles: `
    .back {
      align-self: flex-start;
      margin-left: -8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoDetail {
  #location = inject(Location);
  id = input.required<string>();
  item = computed(() => DEMO_ITEMS.find((item) => item.id === this.id()));

  back() {
    this.#location.back();
  }
}
