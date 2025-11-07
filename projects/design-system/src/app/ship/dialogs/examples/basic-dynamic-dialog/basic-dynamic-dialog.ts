import { Component, inject, input, output } from '@angular/core';
import { ShipButton, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'basic-dynamic-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './basic-dynamic-dialog.html',
  styleUrl: './basic-dynamic-dialog.scss',
})
export class BasicDynamicDialog {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    const dialogRef = this.#dialog.open(SimpleDialogContentComponent, {
      data: { message: 'Hello from parent!', yellow: false },
      class: this.type() ?? '',
    });

    dialogRef.closed.subscribe((res) => {
      console.log('closed res', res);
    });

    dialogRef.component.closed.subscribe((res) => {
      console.log('closed res', res);
    });
  }
}

@Component({
  selector: 'simple-dialog-content',
  standalone: true,
  template: `
    <div style="padding: 2rem;">Hello from a basic dialog!</div>
  `,
})
class SimpleDialogContentComponent {
  data = input<{ message: string; yellow: boolean }>();
  closed = output<string>();
}
