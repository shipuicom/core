import { Component, inject, input, output } from '@angular/core';
import { ShipButtonComponent, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'data-passing-dialog',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './data-passing-dialog.component.html',
  styleUrl: './data-passing-dialog.component.scss',
})
export class DataPassingDialogComponent {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    this.#dialog.open(DataDialogContentComponent, {
      class: this.type() ?? '',
      data: { message: 'Hello from parent!' },
      closed: (result: any) => {
        alert('Dialog closed with: ' + result);
      },
    });
  }
}

@Component({
  selector: 'data-dialog-content',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './data-dialog-content.component.html',
  styleUrl: './data-dialog-content.component.scss',
})
class DataDialogContentComponent {
  data = input<{ message: string }>();
  closed = output<string>();

  closeWithValue() {
    this.closed.emit('Some value from dialog');
  }
}
