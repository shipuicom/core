import { Directive, ElementRef, inject, input, output } from '@angular/core';

export type ShipCodeInputAccept = 'numeric' | 'alphanumeric' | 'any' | RegExp;

/**
 * Turns a set of single-character inputs into one code entry: typing advances
 * to the next input, backspace on an empty input steps back, arrow keys move
 * between inputs, and pasting (or autofill) into any input spreads the code
 * across the remaining ones.
 *
 * Apply it to the element wrapping the inputs — every non-hidden `<input>`
 * beneath it is part of the group, in DOM order.
 */
@Directive({
  selector: '[shCodeInputGroup]',
  standalone: true,
  exportAs: 'shCodeInputGroup',
  host: {
    '(input)': 'onInput($event)',
    '(keydown)': 'onKeydown($event)',
    '(paste)': 'onPaste($event)',
    '(focusin)': 'onFocusin($event)',
  },
})
export class ShipCodeInputGroup {
  #host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Which characters are kept: `numeric` (default), `alphanumeric`, `any`, or a RegExp matching one allowed character. */
  accept = input<ShipCodeInputAccept, ShipCodeInputAccept | ''>('numeric', {
    alias: 'shCodeInputGroup',
    transform: (value) => value || 'numeric',
  });
  /** Emits the joined value of all inputs whenever any of them changes. */
  valueChange = output<string>();
  /** Emits the full code once every input holds a character. */
  completed = output<string>();

  /** The inputs that make up the group, in DOM order. */
  inputs(): HTMLInputElement[] {
    return Array.from(this.#host.nativeElement.querySelectorAll<HTMLInputElement>('input:not([type="hidden"])'));
  }

  /** The current code — one character per input, empty inputs contribute nothing. */
  value(): string {
    return this.inputs()
      .map((input) => input.value)
      .join('');
  }

  /** `true` once every input holds a character. */
  isComplete(): boolean {
    const inputs = this.inputs();
    return inputs.length > 0 && inputs.every((input) => input.value.length > 0);
  }

  /** Writes a code into the inputs from the first one on, clearing the rest. Does not move focus. */
  setValue(code: string) {
    const chars = this.#clean(code);
    this.inputs().forEach((input, index) => (input.value = chars[index] ?? ''));
  }

  /** Empties every input and focuses the first one. */
  clear(focus = true) {
    const inputs = this.inputs();
    inputs.forEach((input) => (input.value = ''));
    if (focus) inputs[0]?.focus();
    this.#emit();
  }

  /** Focuses the input at `index` (clamped to the group) and selects its content. */
  focus(index = 0) {
    const inputs = this.inputs();
    const target = inputs[Math.max(0, Math.min(index, inputs.length - 1))];
    target?.focus();
    target?.select();
  }

  onInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const inputs = this.inputs();
    const index = inputs.indexOf(target);
    if (index === -1) return;

    const chars = this.#clean(target.value);

    if (chars.length === 0) {
      target.value = '';
      this.#emit();
      return;
    }

    // Single keystroke or a multi-character write (paste, OS autofill, IME):
    // spread it over this input and the ones after it.
    this.#fill(inputs, index, chars);
  }

  onPaste(event: ClipboardEvent) {
    const target = event.target as HTMLInputElement;
    const inputs = this.inputs();
    const index = inputs.indexOf(target);
    if (index === -1) return;

    const chars = this.#clean(event.clipboardData?.getData('text') ?? '');
    if (chars.length === 0) return;

    event.preventDefault();
    this.#fill(inputs, index, chars);
  }

  onKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    const inputs = this.inputs();
    const index = inputs.indexOf(target);
    if (index === -1) return;

    switch (event.key) {
      case 'Backspace':
        if (target.value === '' && index > 0) {
          event.preventDefault();
          const previous = inputs[index - 1];
          previous.value = '';
          previous.focus();
          this.#emit();
        }
        return;
      case 'Delete':
        event.preventDefault();
        target.value = '';
        this.#emit();
        return;
      case 'ArrowLeft':
        event.preventDefault();
        this.focus(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        this.focus(index + 1);
        return;
      case 'Home':
        event.preventDefault();
        this.focus(0);
        return;
      case 'End':
        event.preventDefault();
        this.focus(inputs.length - 1);
        return;
    }
  }

  onFocusin(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    if (target instanceof HTMLInputElement) target.select();
  }

  #fill(inputs: HTMLInputElement[], from: number, chars: string[]) {
    let cursor = from;
    for (const char of chars) {
      if (cursor >= inputs.length) break;
      inputs[cursor].value = char;
      cursor++;
    }

    // Land on the next empty input, or stay on the last one when the code is full.
    const next = Math.min(cursor, inputs.length - 1);
    inputs[next]?.focus();
    inputs[next]?.select();

    this.#emit();
  }

  #emit() {
    const value = this.value();
    this.valueChange.emit(value);
    if (this.isComplete()) this.completed.emit(value);
  }

  #clean(raw: string): string[] {
    const accept = this.accept();
    const test =
      accept === 'numeric'
        ? /[0-9]/
        : accept === 'alphanumeric'
          ? /[a-zA-Z0-9]/
          : accept === 'any'
            ? /\S/
            : accept;

    return Array.from(raw).filter((char) => test.test(char));
  }
}
