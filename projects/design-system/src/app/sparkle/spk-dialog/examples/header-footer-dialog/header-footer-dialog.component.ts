import { Component, inject, output, signal } from '@angular/core';
import { SparkleButtonComponent, SparkleDialogService } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'header-footer-dialog',
  standalone: true,
  imports: [SparkleButtonComponent],
  templateUrl: './header-footer-dialog.component.html',
  styleUrl: './header-footer-dialog.component.scss',
})
export class HeaderFooterDialogComponent {
  #dialog = inject(SparkleDialogService);

  openDialog() {
    this.#dialog.open(HeaderFooterDialogContentComponent);
  }
}

@Component({
  selector: 'header-footer-dialog-content',
  standalone: true,
  imports: [SparkleButtonComponent],
  templateUrl: './header-footer-dialog-content.component.html',
  styleUrl: './header-footer-dialog-content.component.scss',
})
class HeaderFooterDialogContentComponent {
  closed = output<boolean>();

  stickyHeader = signal(false);
  stickyFooter = signal(false);
}
