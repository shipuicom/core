import { Directive, ElementRef, HostListener, inject, input, Renderer2 } from '@angular/core';

type MaskingFunction = (cleanValue: string) => string | null;

@Directive({
  selector: '[shInputMask]',
  standalone: true,
})
export class ShipInputMaskDirective {
  #selfRef: ElementRef<HTMLInputElement> = inject(ElementRef);
  #renderer: Renderer2 = inject(Renderer2);

  shInputMask = input<string | MaskingFunction>('(999) 999-9999');

  @HostListener('input', ['$event'])
  onInput(event: Event) {
    const inputElement = this.#selfRef.nativeElement;
    const oldRawValue = inputElement.value;
    const newRawValue = (event.target as HTMLInputElement).value;
    const oldCursorPos = inputElement.selectionStart ?? 0;

    const newCleanValue = this.#cleanValue(newRawValue);
    const maskedValue = this.#applyMask(newCleanValue);

    this.#renderer.setProperty(inputElement, 'value', maskedValue);

    const newCursorPos = this.#getNewCursorPosition(maskedValue, oldRawValue, oldCursorPos);
    inputElement.setSelectionRange(newCursorPos, newCursorPos);
  }

  #getNewCursorPosition(maskedValue: string, oldRawValue: string, oldCursorPos: number): number {
    let digitsBeforeCursor = 0;

    for (let i = 0; i < oldCursorPos; i++) {
      if (oldRawValue[i] && oldRawValue[i].match(/\d/)) {
        digitsBeforeCursor++;
      }
    }

    let newCursorPos = 0;
    let digitsFound = 0;

    while (newCursorPos < maskedValue.length && digitsFound < digitsBeforeCursor) {
      if (maskedValue[newCursorPos].match(/\d/)) {
        digitsFound++;
      }

      newCursorPos++;
    }

    return newCursorPos;
  }

  #cleanValue(value: string | null): string {
    if (!value) return '';
    return value.replace(/\D/g, '');
  }

  #applyMask(cleanValue: string): string {
    const inputMask = this.shInputMask();

    if (typeof inputMask === 'function') {
      return inputMask(cleanValue) ?? '';
    }

    const pattern = inputMask;
    let masked = '';
    let digitIndex = 0;

    for (let i = 0; i < pattern.length && digitIndex < cleanValue.length; i++) {
      const maskChar = pattern[i];
      const digitChar = cleanValue[digitIndex];

      if (maskChar === '9') {
        masked += digitChar;
        digitIndex++;
      } else {
        masked += maskChar;
      }
    }
    return masked;
  }
}
