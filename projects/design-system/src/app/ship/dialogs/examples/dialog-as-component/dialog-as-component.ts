import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButton, ShipDialog } from 'ship-ui';

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
