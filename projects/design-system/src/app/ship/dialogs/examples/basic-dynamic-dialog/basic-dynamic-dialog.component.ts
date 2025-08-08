import { Component, inject, input } from '@angular/core';
import { ShipButtonComponent, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'basic-dynamic-dialog',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './basic-dynamic-dialog.component.html',
  styleUrl: './basic-dynamic-dialog.component.scss',
})
export class BasicDynamicDialogComponent {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    this.#dialog.open(SimpleDialogContentComponent, {
      class: this.type() ?? '',
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
class SimpleDialogContentComponent {}
