import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SparkleDividerComponent } from '../../../../../sparkle-ui/src/lib/sparkle-divider/sparkle-divider.component';
import {
  SparkleButtonComponent,
  SparkleIconComponent,
  SparkleMenuComponent,
} from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-menu',
  standalone: true,
  imports: [SparkleMenuComponent, SparkleIconComponent, SparkleButtonComponent, SparkleDividerComponent],
  templateUrl: './spk-menu.component.html',
  styleUrl: './spk-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkMenuComponent {
  fireHello() {
    console.log('Hello');
  }
}
