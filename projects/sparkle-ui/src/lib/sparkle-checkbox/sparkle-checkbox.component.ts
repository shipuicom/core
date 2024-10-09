import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject } from '@angular/core';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';

@Component({
  selector: 'spk-checkbox',
  standalone: true,
  imports: [SparkleIconComponent],
  template: `
    <div class="box">
      <spk-icon class="inherit default-indicator">check</spk-icon>
      <spk-icon class="inherit indeterminate-indicator">minus</spk-icon>
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleCheckboxComponent {
  #selfRef = inject(ElementRef);

  @HostListener('click')
  onClick() {
    if (this.#selfRef.nativeElement.querySelector('input')) {
      this.#selfRef.nativeElement.querySelector('input').focus();
    }
  }
}
