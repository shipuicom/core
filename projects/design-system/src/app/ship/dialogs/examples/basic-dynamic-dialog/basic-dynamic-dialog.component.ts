import { Component, inject } from '@angular/core';
import { ShipButtonComponent, ShipDialogService } from '@ship-ui/core';

@Component({
  selector: 'basic-dynamic-dialog',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './basic-dynamic-dialog.component.html',
  styleUrl: './basic-dynamic-dialog.component.scss',
})
export class BasicDynamicDialogComponent {
  #dialog = inject(ShipDialogService);

  openDialog() {
    this.#dialog.open(SimpleDialogContentComponent);
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
