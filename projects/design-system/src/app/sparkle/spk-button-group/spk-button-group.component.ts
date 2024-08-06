import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleButtonGroupComponent, SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-button-group',
  standalone: true,
  imports: [SparkleButtonGroupComponent, SparkleIconComponent],
  templateUrl: './spk-button-group.component.html',
  styleUrl: './spk-button-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkButtonGroupComponent {
  activeIndex = signal<number | null>(null);

  items = signal(new Array(5).fill(0));

  updateActiveIndex(newIndex: number) {
    this.activeIndex.set(newIndex === this.activeIndex() ? null : newIndex);
  }
}
