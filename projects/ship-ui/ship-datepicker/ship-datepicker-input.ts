import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  output,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { classMutationSignal, contentProjectionSignal, nativeInputValueSignal } from '@ship-ui/core';
import { ShipFormFieldPopover } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipDatepicker } from './ship-datepicker';

@Component({
  selector: 'sh-datepicker-input',
  styleUrl: './ship-datepicker.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipDatepicker, ShipFormFieldPopover, ShipIcon],
  providers: [DatePipe],
  template: `
    <sh-form-field-popover (closed)="close()" [(isOpen)]="isOpen">
      <ng-content select="label" ngProjectAs="label" />

      <ng-content select="[prefix]" ngProjectAs="[prefix]" />
      <ng-content select="[textPrefix]" ngProjectAs="[textPrefix]" />

      <div id="input-wrap" class="input" ngProjectAs="input">
        @if (this.masking()) {
          <div class="masked-value">
            {{ _maskedDate() }}
          </div>
        }
        <ng-content select="input" />
      </div>

      <ng-content select="[textSuffix]" ngProjectAs="[textSuffix]" />
      <ng-content select="[suffix]" ngProjectAs="[suffix]" />
      <sh-icon class="default-indicator" suffix>calendar</sh-icon>

      <div popoverContent>
        @if (this.isOpen()) {
          <sh-datepicker
            [date]="internalDate() ?? null"
            (dateChange)="onDateChange($event)"
            (tabbedOut)="isOpen.set(false)"
            [class]="currentClass()" />
        }
      </div>
    </sh-form-field-popover>

    <ng-template #defaultIndicator></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // SSG: the popoverContent div projects into sh-popover's closed `@if`
    // branch, which the hydration serializer can't map (NG0502) — skip
    // hydration so this subtree client-renders instead.
    ngSkipHydration: 'true',
  },
})
export class ShipDatepickerInput {
  #selfRef = inject(ElementRef);
  ngControl = contentChild(NgControl);
  #datePipe = inject(DatePipe);

  /** `DatePipe` format used to render the masked date display (empty disables masking). */
  masking = input('mediumDate');
  /**
   * `DatePipe` format reflected into the input's actual value — what screen
   * readers announce and what an unmasked input displays. Defaults to the
   * `masking` format; when that format would lose precision (e.g. a
   * date-only mask on a date holding a time), a lossless `'medium'` format
   * is used instead so a round-trip through parsing keeps the same instant.
   * Set to `''` to keep the raw `Date.toString()` value.
   */
  valueFormat = input<string | null>(null);
  /** Emits the selected date when the picker popover closes. */
  closed = output<Date | null>();

  isOpen = model<boolean>(false);
  currentClass = classMutationSignal();
  #inputObserver = contentProjectionSignal<HTMLInputElement>('#input-wrap input', undefined, 0);

  internalDate = nativeInputValueSignal<Date | null>(this.#inputObserver, {
    transform: (value) => this.#parseInputValue(value),
    compare: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null),
  });

  datepicker = viewChild(ShipDatepicker);

  _maskedDate = computed(() => {
    const date = this.internalDate();
    const mask = this.masking();

    if (!mask) return date;
    if (!date) return null;

    return this.#datePipe.transform(date, mask);
  });

  // Reflect the formatted date into the real input value. Without this the
  // input holds `Date.toString()` ("Thu Aug 20 2026 17:10:00 GMT+0200 …"),
  // which is what screen readers announce — the masked overlay only fixes
  // what sighted users see. Reflection is safe because parsing the formatted
  // string yields the same instant (guarded below) and the value signal
  // compares dates by time, so no feedback loop occurs.
  #formatValueEffect = effect(() => {
    const input = this.#inputObserver();
    const date = this.internalDate();
    const format = this.valueFormat() ?? this.masking();

    if (!input || !format) return;
    // Typed inputs (time, date, datetime-local) require their native value
    // format — only free-text inputs can hold a DatePipe-formatted string.
    if (input.type !== 'text') return;
    // Never clobber while the user is typing in the field.
    if (input.ownerDocument.activeElement === input) return;

    if (!date) return;

    for (const candidate of [format, 'medium']) {
      const formatted = this.#datePipe.transform(date, candidate);
      if (!formatted || input.value === formatted) return;
      // Only reflect losslessly: the formatted string must parse back to
      // the same instant, or forms would silently drop precision.
      if (this.#parseInputValue(formatted)?.getTime() === date.getTime()) {
        input.value = formatted;
        return;
      }
    }
  });

  #inputSetupEffect = effect((onCleanup) => {
    const input = this.#inputObserver();

    if (!input) return;

    input.autocomplete = 'off';

    const openOnFocus = () => this.isOpen.set(true);
    input.addEventListener('focus', openOnFocus);

    onCleanup(() => input.removeEventListener('focus', openOnFocus));
  });

  #isOpenEffect = effect(() => {
    if (this.isOpen()) {
      setTimeout(() => {
        this.datepicker()?.focusActiveDate();
      }, 50);
    }
  });

  @HostListener('focusout', ['$event'])
  onFocusOut(event: FocusEvent) {
    setTimeout(() => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && activeElement !== document.body && !this.#selfRef.nativeElement.contains(activeElement)) {
        this.isOpen.set(false);
      }
    });
  }

  onDateChange(date: Date | null) {
    this.internalDate.set(date);

    // Reactive/ngModel controls are pushed the Date directly. Signal forms
    // register a FormField as NgControl without a setValue — they pick the
    // change up from the input event the value signal write-back dispatches.
    const control = this.ngControl()?.control;

    if (control && typeof control.setValue === 'function') {
      control.setValue(date);
    }
  }

  close() {
    this.closed.emit(this.internalDate() ?? null);
  }

  #parseInputValue(value: string): Date | null {
    if (!value) return null;

    let newD = new Date(value);

    if (isNaN(newD.getTime()) && /^(\d{2}):(\d{2})/.test(value)) {
      const match = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (match) {
        const current = untracked(() => this.internalDate()) || new Date();
        newD = new Date(current);
        newD.setHours(parseInt(match[1], 10), parseInt(match[2], 10), match[3] ? parseInt(match[3], 10) : 0, 0);
      }
    }

    if (isNaN(newD.getTime())) return untracked(() => this.internalDate()) ?? null;

    return newD;
  }
}
