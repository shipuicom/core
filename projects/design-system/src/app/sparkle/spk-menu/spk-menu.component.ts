import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleDividerComponent } from '../../../../../sparkle-ui/src/lib/sparkle-divider/sparkle-divider.component';
import {
  SparkleButtonComponent,
  SparkleDialogComponent,
  SparkleIconComponent,
  SparkleMenuComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-menu',
  standalone: true,
  imports: [
    SparkleDialogComponent,
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
  menuItems = signal<any[]>([]);

  fireHello() {
    console.log('Hello');
  }

  addOption() {
    this.menuItems.update((items) => [...items, Math.random()]);
  }
}
