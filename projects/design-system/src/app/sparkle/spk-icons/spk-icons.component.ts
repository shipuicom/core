import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleIconComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-icons',
  imports: [SparkleIconComponent],
  templateUrl: './spk-icons.component.html',
  styleUrl: './spk-icons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkIconsComponent {
  icons = signal([
    'acorn',
    'circle',
    'x',
    'minus',
    'upload-simple',
    'magnifying-glass',
    'x-circle',
    'caret-left',
    'caret-right',
    'caret-down',
    'caret-up',
    'backspace',
    'calendar',
    'info',
    'check',
    'check-circle',
    'warning-octagon',
    'warning',
    'question',
    'plus',
  ]);
}
