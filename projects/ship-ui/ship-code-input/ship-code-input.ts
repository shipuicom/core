import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { contentProjectionSignal, nativeInputValueSignal } from '@ship-ui/core';
import { ShipCodeInputDivider } from './ship-code-input-divider';
import { ShipCodeInputGroup } from './ship-code-input-group';

/**
 * One-time-code entry: `length` single-character boxes that behave as one
 * field (auto-advance, backspace, arrows, paste/autofill spreading).
 *
 * Bind the code with `[(value)]`, or project a hidden `<input>` and drive it
 * with `ngModel`, `formControl` or `[formField]` — the projected input mirrors
 * the code both ways, exactly like the inner input of `sh-select`.
 */
@Component({
  selector: 'sh-code-input',
  styleUrl: './ship-code-input.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipCodeInputGroup, NgTemplateOutlet],
  template: `
    <ng-content select="label" />

    <div
      class="cells"
      #group="shCodeInputGroup"
      [shCodeInputGroup]="type()"
      (valueChange)="onGroupChange($event)"
      (completed)="completed.emit($event)">
      @for (index of cells(); track index) {
        <input
          class="cell"
          type="text"
          [class.group-end]="isGroupEnd(index)"
          [attr.inputmode]="type() === 'numeric' ? 'numeric' : 'text'"
          [attr.autocomplete]="index === 0 ? 'one-time-code' : 'off'"
          [attr.aria-label]="'Character ' + (index + 1) + ' of ' + length()"
          [attr.autofocus]="autofocus() && index === 0 ? '' : null"
          [disabled]="disabled()"
          [readonly]="readonly()"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false" />

        @if (hasDividerAfter(index)) {
          <span class="divider" aria-hidden="true">
            @if (dividerTemplate(); as template) {
              <ng-container *ngTemplateOutlet="template.templateRef" />
            } @else {
              {{ divider() }}
            }
          </span>
        }
      }
    </div>

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.disabled]': 'disabled() ? "" : null',
    '[class.complete]': 'isComplete()',
  },
})
export class ShipCodeInput {
  #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  group = viewChild.required(ShipCodeInputGroup);

  /** Number of characters in the code. */
  length = input<number>(6);
  /** Character set: `numeric` (default) shows a numeric keyboard on mobile; `alphanumeric` allows letters too. */
  type = input<'numeric' | 'alphanumeric'>('numeric');
  /** Visually separates the boxes into groups of this size, e.g. `3` renders `123 456`. */
  groupSize = input<number>(0);
  /**
   * Text rendered between groups of boxes (between every box without a `groupSize`),
   * e.g. `"-"`. Project `<ng-template shCodeInputDivider>` instead for custom content.
   */
  divider = input<string>('');
  /** Two-way bound code. Only accepted characters are kept; never longer than `length`. */
  value = model<string>('');
  /** Focus the first box when the component renders. */
  autofocus = input<boolean>(false);
  /** Disables every box. */
  disabled = input<boolean>(false);
  /** Boxes show the code but cannot be edited. */
  readonly = input<boolean>(false);
  /** Emits the code once every box is filled — the moment to submit or verify. */
  completed = output<string>();

  dividerTemplate = contentChild(ShipCodeInputDivider);
  hasDivider = computed(() => !!this.divider() || !!this.dividerTemplate());

  cells = computed(() => Array.from({ length: Math.max(1, this.length()) }, (_, index) => index));
  isComplete = computed(() => this.value().length === this.length());

  // Optional projected input (ngModel / reactive / signal forms). It lives
  // outside `.cells`, so the group never treats it as a box.
  projectedInput = contentProjectionSignal<HTMLInputElement>('input:not(.cell)', { childList: true, subtree: true }, 0);
  #valueSync = nativeInputValueSignal<string>(this.projectedInput, {
    signal: this.value as never,
    transform: (raw) => raw ?? '',
  });

  // Model → boxes. Group-originated changes already match, so this is a no-op for them.
  #writeEffect = effect(() => {
    const value = this.value() ?? '';
    const group = this.group();
    if (group.value() !== value) group.setValue(value);
  });

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) this.group().focus(0);
    });
  }

  isGroupEnd(index: number): boolean {
    const size = this.groupSize();
    return size > 0 && (index + 1) % size === 0 && index < this.length() - 1;
  }

  /** A divider belongs after `index` when one is configured and a group ends there. */
  hasDividerAfter(index: number): boolean {
    if (!this.hasDivider() || index >= this.length() - 1) return false;
    const size = this.groupSize();
    return size > 0 ? (index + 1) % size === 0 : true;
  }

  onGroupChange(value: string) {
    this.value.set(value);
  }

  /** Empties the code and focuses the first box. */
  clear() {
    this.group().clear();
  }

  /** Focuses the box at `index` (default the first empty one). */
  focus(index?: number) {
    this.group().focus(index ?? Math.min(this.value().length, this.length() - 1));
  }

  /** Host element, handy for scrolling the field into view. */
  get nativeElement(): HTMLElement {
    return this.#elementRef.nativeElement;
  }
}
