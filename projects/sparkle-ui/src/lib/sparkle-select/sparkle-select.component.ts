import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleMenuComponent } from '../sparkle-menu/sparkle-menu.component';

@Component({
  selector: 'spk-select',
  standalone: true,
  imports: [SparkleIconComponent, SparkleMenuComponent, SparkleFormFieldComponent],
  template: `
    <spk-menu>
      <div class="select-wrap">
        <spk-form-field>
          <div class="input" spkInput>
            <ng-content select="input"></ng-content>
          </div>

          <div class="select-open-indicator" spkSuffix>
            <ng-content select="[open-indicator]"></ng-content>
            <spk-icon class="default-indicator">caret-down</spk-icon>
          </div>
        </spk-form-field>
      </div>

      <div class="select-options" menu>
        <ng-content select="[option]"></ng-content>
      </div>
    </spk-menu>
  `,
  host: {
    '[class.open]': 'isOpen()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSelectComponent {
  #selfRef = inject(ElementRef<SparkleSelectComponent>);

  isOpen = signal(false);

  @HostListener('click')
  onClick() {
    if (this.inputSearchField) {
      this.inputSearchField.focus();

      return;
    }
  }

  get inputSearchField(): HTMLInputElement | null {
    return this.#selfRef.nativeElement.querySelector('input[type="search"]') ?? null;
  }

  get inputField(): HTMLInputElement | null {
    const input = this.#selfRef.nativeElement.querySelector('input');

    return input && input.type !== 'search' ? input : null;
  }
}
