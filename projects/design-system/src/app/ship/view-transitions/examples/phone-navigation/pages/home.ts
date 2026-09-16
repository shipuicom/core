import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';

export const DEMO_ITEMS = [
  { id: '1', title: 'Morning run', subtitle: '5.2 km · 28 min' },
  { id: '2', title: 'Lunch with Ida', subtitle: 'Tomorrow 12:30' },
  { id: '3', title: 'Ship the release', subtitle: 'v0.26 · 3 tasks left' },
  { id: '4', title: 'Read: View Transitions', subtitle: 'MDN · 12 min read' },
];

@Component({
  selector: 'app-demo-home',
  imports: [RouterLink, ShipList, ShipIcon],
  template: `
    <h3>Home</h3>
    <p>Open an item to push a detail page.</p>

    <sh-list class="items">
      @for (item of items; track item.id) {
        <a class="item" [routerLink]="['/view-transitions/examples/detail', item.id]">
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.subtitle }}</small>
          </span>
          <sh-icon>caret-right</sh-icon>
        </a>
      }
    </sh-list>
  `,
  styleUrl: './demo-page.scss',
  styles: `
    .item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 8px;
      text-decoration: none;
      color: inherit;
      border-bottom: var(--border-10);

      span {
        display: flex;
        flex-direction: column;
      }
      small {
        color: var(--base-8);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoHome {
  items = DEMO_ITEMS;
}
