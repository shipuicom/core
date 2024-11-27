import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent, SparkleMenuComponent } from 'spk/public';
import { SparkleDividerComponent } from '../../../../../sparkle-ui/src/lib/sparkle-divider/sparkle-divider.component';

@Component({
  selector: 'app-spk-menu',
  imports: [
    // SparkleDialogComponent,
    SparkleMenuComponent,
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

  fireHello(index: number) {
    console.log('Hello', index);
  }

  addOption() {
    this.menuItems.update((items) => [...items, Math.random()]);
  }
}
