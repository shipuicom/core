import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SparkleButtonComponent, SparkleIconComponent } from '@sparkle-ui/core';
import { SparkleDialogComponent } from '../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'app-spk-dialog',
  standalone: true,
  imports: [SparkleButtonComponent, SparkleDialogComponent, SparkleIconComponent],
  templateUrl: './spk-dialog.component.html',
  styleUrl: './spk-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SpkDialogComponent {
  isOpen = signal(false);
}
