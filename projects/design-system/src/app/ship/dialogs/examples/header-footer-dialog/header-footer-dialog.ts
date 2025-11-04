import { Component, inject, input, output, signal } from '@angular/core';
import { ShipButton, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'header-footer-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './header-footer-dialog.html',
  styleUrl: './header-footer-dialog.scss',
})
export class HeaderFooterDialog {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    this.#dialog.open(HeaderFooterDialogContent, {
      class: this.type() ?? '',
    });
  }
}

@Component({
  selector: 'header-footer-dialog-content',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './header-footer-dialog-content.html',
  styleUrl: './header-footer-dialog-content.scss',
})
class HeaderFooterDialogContent {
  closed = output<boolean>();

  stickyHeader = signal(false);
  stickyFooter = signal(false);
}
