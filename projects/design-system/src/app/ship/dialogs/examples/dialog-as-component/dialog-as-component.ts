import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDialog } from '@ship-ui/core/ship-dialog';

@Component({
  selector: 'app-dialog-as-component',
  imports: [ShipDialog, ShipButton],
  templateUrl: './dialog-as-component.html',
  styleUrl: './dialog-as-component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogAsComponent {
  type = input<string>();

  isOpen = signal(false);

  openDialog() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }
}
