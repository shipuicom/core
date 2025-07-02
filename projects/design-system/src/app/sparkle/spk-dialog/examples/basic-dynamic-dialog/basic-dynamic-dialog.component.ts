import { Component, inject } from '@angular/core';
import { SparkleButtonComponent, SparkleDialogService } from '../../../../../../../sparkle-ui/src/public-api';

@Component({
  selector: 'basic-dynamic-dialog',
  standalone: true,
  imports: [SparkleButtonComponent],
  templateUrl: './basic-dynamic-dialog.component.html',
  styleUrl: './basic-dynamic-dialog.component.scss',
})
export class BasicDynamicDialogComponent {
  #dialog = inject(SparkleDialogService);

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
