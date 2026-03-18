import { Component, inject, input, TemplateRef } from '@angular/core';
import { ShipButton, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'template-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './template-dialog.html',
  styleUrl: './template-dialog.scss',
})
export class TemplateDialog {
  #dialog = inject(ShipDialogService);
  type = input<string>();

  openTemplateDialog(template: TemplateRef<any>) {
    this.#dialog.open(template, {
      data: { message: 'Hello from Template!' },
      class: this.type() || 'default',
    });
  }
}
