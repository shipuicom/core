import { Component, inject, input, output } from '@angular/core';
import { ShipButton, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'data-passing-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './data-passing-dialog.html',
  styleUrl: './data-passing-dialog.scss',
})
export class DataPassingDialog {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    const dialogRef = this.#dialog.open(DataDialogContent, {
      class: this.type() ?? '',
      data: { message: 'Hello from parent!' },
      closed: (result: any) => {
        console.log('Dialog function closed with: \t' + result);
      },
    });

    dialogRef.component.closed.subscribe((res) => {
      console.log('Dialog component closed: \t', res);
    });

    dialogRef.closed.subscribe((res) => {
      console.log('Dialog ref closed: \t', res);
    });
  }
}

@Component({
  selector: 'data-dialog-content',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './data-dialog-content.html',
  styleUrl: './data-dialog-content.scss',
})
class DataDialogContent {
  data = input<{ message: string }>();
  closed = output<string>();

  closeWithValue() {
    console.log('closeWithValue');
    this.closed.emit('Some value from dialog');
  }
}
