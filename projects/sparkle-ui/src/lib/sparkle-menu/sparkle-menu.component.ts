import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { SparklePopoverComponent } from '../sparkle-popover/sparkle-popover.component';

@Component({
  selector: 'spk-menu',
  standalone: true,
  imports: [SparklePopoverComponent],
  template: `
    <spk-popover
      #formFieldWrapper
      [(isOpen)]="isOpen"
      [disableOpenByClick]="true"
      (closed)="close()"
      [above]="above()"
      [right]="right()"
      [options]="{
        closeOnButton: false,
        closeOnEsc: true,
      }">
      <div trigger (click)="isOpen.set(true)">
        <ng-content />
      </div>

      <div class="options" (click)="close('selected')">
        <ng-content select="[menu]" />
      </div>
    </spk-popover>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleMenuComponent {
  above = input<boolean>(false);
  right = input<boolean>(false);
  isOpen = model<boolean>(false);
  closed = output<boolean>();

  close(action: 'closed' | 'selected' = 'closed') {
    this.isOpen.set(false);
    this.closed.emit(action === 'selected');
  }
}
