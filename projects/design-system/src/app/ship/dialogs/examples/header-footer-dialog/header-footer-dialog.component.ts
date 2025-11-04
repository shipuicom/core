import { Component, inject, input, output, signal } from '@angular/core';
import { ShipButton, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'header-footer-dialog',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './header-footer-dialog.component.html',
  styleUrl: './header-footer-dialog.component.scss',
})
export class HeaderFooterDialogComponent {
  #dialog = inject(ShipDialogService);

  type = input<string>();

  openDialog() {
    this.#dialog.open(HeaderFooterDialogContentComponent, {
      class: this.type() ?? '',
    });
  }
}

@Component({
  selector: 'header-footer-dialog-content',
  standalone: true,
  imports: [ShipButton],
  templateUrl: './header-footer-dialog-content.component.html',
  styleUrl: './header-footer-dialog-content.component.scss',
})
class HeaderFooterDialogContentComponent {
  closed = output<boolean>();

  stickyHeader = signal(false);
  stickyFooter = signal(false);
}
