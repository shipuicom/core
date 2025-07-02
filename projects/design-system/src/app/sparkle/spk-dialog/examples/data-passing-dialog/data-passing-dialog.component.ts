import { Component, inject, input, output } from '@angular/core';
import { SparkleButtonComponent, SparkleDialogService } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'data-passing-dialog',
  standalone: true,
  imports: [SparkleButtonComponent],
  templateUrl: './data-passing-dialog.component.html',
  styleUrl: './data-passing-dialog.component.scss',
})
export class DataPassingDialogComponent {
  #dialog = inject(SparkleDialogService);

  openDialog() {
    this.#dialog.open(DataDialogContentComponent, {
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
  imports: [SparkleButtonComponent],
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
