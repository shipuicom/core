import { Component, inject, output, signal } from '@angular/core';
import { ShipButtonComponent, ShipDialogService } from 'ship-ui';

@Component({
  selector: 'header-footer-dialog',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './header-footer-dialog.component.html',
  styleUrl: './header-footer-dialog.component.scss',
})
export class HeaderFooterDialogComponent {
  #dialog = inject(ShipDialogService);

  openDialog() {
    this.#dialog.open(HeaderFooterDialogContentComponent);
  }
}

@Component({
  selector: 'header-footer-dialog-content',
  standalone: true,
  imports: [ShipButtonComponent],
  templateUrl: './header-footer-dialog-content.component.html',
  styleUrl: './header-footer-dialog-content.component.scss',
})
class HeaderFooterDialogContentComponent {
  closed = output<boolean>();

  stickyHeader = signal(false);
  stickyFooter = signal(false);
}
