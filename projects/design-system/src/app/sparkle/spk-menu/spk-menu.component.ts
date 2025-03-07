import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SparkleButtonComponent,
  SparkleCheckboxComponent,
  SparkleDividerComponent,
  SparkleIconComponent,
  SparkleMenuComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-menu',
  imports: [
    SparkleMenuComponent,
    SparkleCheckboxComponent,
    SparkleIconComponent,
    SparkleButtonComponent,
    SparkleDividerComponent,
  ],
  templateUrl: './spk-menu.component.html',
  styleUrl: './spk-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkMenuComponent {
  menuItems = signal<any[]>(new Array(500).fill(0));
  activeItems = signal<number[]>([]);

  fireHello(index: number) {
    console.log('Hello', index);
  }

  toggleActive(index: number) {
    const activeItems = this.activeItems();

    if (activeItems.includes(index)) {
      this.activeItems.set(activeItems.filter((x) => x !== index));
    } else {
      this.activeItems.update((items) => [...items, index]);
    }
  }

  addOption() {
    this.menuItems.update((items) => [...items, Math.random()]);
  }
}
