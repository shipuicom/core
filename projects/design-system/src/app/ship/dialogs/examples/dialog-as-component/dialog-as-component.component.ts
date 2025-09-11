import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { ShipButtonComponent, ShipDialogComponent } from 'ship-ui';

@Component({
  selector: 'app-dialog-as-component',
  imports: [ShipDialogComponent, ShipButtonComponent],
  templateUrl: './dialog-as-component.component.html',
  styleUrl: './dialog-as-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogAsComponentComponent {
  type = input<string>();

  isOpen = signal(false);

  openDialog() {
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }
}
