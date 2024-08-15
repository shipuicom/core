import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { SparkleFormFieldComponent } from '../sparkle-form-field/sparkle-form-field.component';
import { SparkleIconComponent } from '../sparkle-icon/sparkle-icon.component';
import { SparkleMenuComponent } from '../sparkle-menu/sparkle-menu.component';

@Component({
  selector: 'spk-select',
  standalone: true,
  imports: [SparkleIconComponent, SparkleMenuComponent, SparkleFormFieldComponent],
  template: `
    <spk-menu
      [(isActive)]="isOpen"
      [(optionInFocus)]="optionInFocus"
      [(selectedOption)]="selectedOption"
      (closeAction)="closeAction($event)">
      <div class="select-wrap">
        <spk-form-field>
          <div class="input" spkInput>
            @if (_displayValue()) {
              <div class="display-value">{{ _displayValue() }}</div>
            }
            <ng-content select="input"></ng-content>
          </div>

          <div class="select-open-indicator" [class.open]="isOpen()" spkSuffix>
            <ng-content select="[open-indicator]"></ng-content>
            <spk-icon class="default-indicator">caret-down</spk-icon>
          </div>
        </spk-form-field>
      </div>

      <ng-container menu>
        <ng-content select="[option]"></ng-content>
      </ng-container>
    </spk-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparkleSelectComponent {
  #selfRef = inject(ElementRef<SparkleSelectComponent>);
  displayValue = input<string | null>('');
  displayString = input<string>('');
  isOpen = signal(false);
  optionInFocus = signal<number | null>(null);
  selectedOption = signal<HTMLElement | null>(null);
  _displayValue = computed(() => this.displayValue() ?? this.selectedOption()?.innerText ?? '');
  storedValue = signal<string | null>(null);

  @HostListener('click')
  onClick() {
    if (this.inputField) {
      this.isOpen.set(true);
      this.inputField.blur();
    }

    if (this.inputSearchField) {
      this.inputSearchField.focus();
      this.storedValue.set(this.inputSearchField.value + '');
      this.inputSearchField.value = '';
      this.inputSearchField.dispatchEvent(new Event('input'));
      this.optionInFocus.set(0);
    }
  }

  closeAction(action: 'closed' | 'selected') {
    if (this.inputSearchField) {
      // console.log('this.storedValue(): ', this.storedValue());

      if (action === 'closed' && this.storedValue()) {
        this.inputSearchField.setAttribute('value', this.storedValue() as string);
        // console.log('this.inputSearchField: ', this.inputSearchField);
      }

      this.inputSearchField.blur();
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
