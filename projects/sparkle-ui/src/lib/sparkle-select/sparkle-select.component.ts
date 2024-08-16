import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
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
      (closeAction)="closeAction($event)"
      #menuRef>
      <div class="select-wrap">
        <spk-form-field>
          <ng-container spkLabel>
            <ng-content select="[spkLabel]"></ng-content>
          </ng-container>

          <div class="input" spkInput>
            @if ((_displayValue() && hasSearchInput() && !isOpen()) || (_displayValue() && !hasSearchInput())) {
              <div class="display-value">{{ _displayValue() }}</div>
            }
            <ng-content select="input"></ng-content>
          </div>

          @if (!!selectedOption() && !!hasSearchInput()) {
            <div class="deselect-indicator" (click)="deselect($event)" spkSuffix>
              <ng-content select="[deselect-indicator]"></ng-content>
              <spk-icon class="default-indicator">x-circle</spk-icon>
            </div>
          } @else {
            <div class="select-open-indicator" [class.open]="isOpen()" spkSuffix>
              <ng-content select="[open-indicator]"></ng-content>
              <spk-icon class="default-indicator">caret-down</spk-icon>
            </div>
          }

          <!-- <ng-container spkHint>
            <ng-content select="[spkHint]"></ng-content>
          </ng-container> -->
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
  menuRef = viewChild.required<SparkleMenuComponent>('menuRef');
  selectedChange = output<string>();
  hasSearchInput = computed(() => this.inputSearchField != null);
  #previousSearchValue = signal<string | null>(null);

  controller: AbortController | null = null;
  focusController: AbortController | null = null;

  e = effect(() => {
    if (this.isOpen()) {
      this.controller = new AbortController();

      window.addEventListener(
        'click',
        (e) => {
          if ((e.target as HTMLElement).hasAttribute('option')) {
            this.selectedOption.set(e.target as HTMLElement);
          }

          setTimeout(() => {
            if (this.inputSearchField && this.inputSearchField.value === this.#previousSearchValue()) {
              this.optionInFocus.set(0);
            }
            if (this.inputSearchField) {
              this.#previousSearchValue.set(this.inputSearchField.value);
            }
          }, 0);
        },
        { signal: this.controller.signal }
      );

      this.inputSearchField?.addEventListener(
        'keydown',
        (e) => {
          if (e.key !== 'Enter' && e.key !== 'Escape') {
            this.optionInFocus.set(0);
          }
        },
        {
          signal: this.controller.signal,
        }
      );
    } else {
      setTimeout(() => {
        this.controller?.abort();
      }, 0);
    }
  });

  ngOnInit() {
    this.focusController = new AbortController();

    this.currentInput?.addEventListener(
      'focus',
      () => {
        this.isOpen.set(true);
        this.optionInFocus.set(0);

        if (this.inputSearchField) {
          this.storedValue.set(this.inputSearchField.value + '');
          this.inputSearchField.value = '';
          this.inputSearchField.dispatchEvent(new Event('input'));
        }
      },
      {
        signal: this.focusController.signal,
      }
    );
  }

  setSelectedOption(byInputValue: string) {
    this.menuRef().setSelectedOption(byInputValue);
  }

  deselect($event: Event) {
    $event.stopPropagation();

    if (this.currentInput) {
      this.currentInput!.value = '';
      this.currentInput!.dispatchEvent(new Event('input'));
    }

    this.menuRef().deselectOption();
  }

  closeAction(action: 'closed' | 'selected') {
    if (this.inputSearchField) {
      if (action === 'closed' && this.storedValue()) {
        this.menuRef().selectCurrentOption();
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

  get currentInput(): HTMLInputElement | null {
    return this.inputSearchField ?? this.inputField;
  }

  ngOnDestroy() {
    this.focusController?.abort();
  }
}
