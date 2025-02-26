import {
  DestroyRef,
  ElementRef,
  Injector,
  Signal,
  WritableSignal,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

interface InputSignalOptions<T> {
  debounce?: number;
  initialValue?: T | null | undefined;
  transform?: (value: string) => T | null | undefined;
  compare?: (prev: T | null | undefined, curr: T | null | undefined) => boolean;
  forceType?: 'number' | 'boolean' | 'string';
  injector?: Injector;
  returnPreviousValue?: boolean;
}

export function createInputSignal<T>(
  input: Signal<ElementRef<HTMLInputElement | HTMLTextAreaElement> | undefined>,
  options?: InputSignalOptions<T>
): WritableSignal<T | null | undefined> {
  const injector = options?.injector || (assertInInjectionContext(createInputSignal), inject(Injector));
  const {
    debounce = 0,
    initialValue = undefined,
    transform = (value: string) => value as unknown as T,
    compare = (a: T | null | undefined, b: T | null | undefined) => a === b,
    forceType = undefined,
    returnPreviousValue = true,
  } = options || {};

  const valueSignal = signal<T | null | undefined>(initialValue);
  const destroyRef = injector.get(DestroyRef);
  const inputElementRef = computed(() => {
    const inputElement = input()?.nativeElement;

    if (!(inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement)) {
      return;
    }

    return createCustomInputEventListener(inputElement);
  });

  let isUpdating = false;
  let previousValue: string | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  effect(
    () => {
      const inputElement = inputElementRef();

      if (!inputElement) {
        return valueSignal.set(returnPreviousValue && previousValue ? transform(previousValue) : undefined);
      }

      if (initialValue !== undefined && inputElement.value === '') {
        valueSignal.set(initialValue);
      } else if (inputElement.value !== '') {
        syncValueFromInput();
      }

      const inputHandler = (e: any) => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          timeoutId = null;
          syncValueFromInput();
        }, debounce);
      };

      inputElement.addEventListener('input', inputHandler);
      inputElement.addEventListener('inputValueChanged', inputHandler);

      destroyRef.onDestroy(() => {
        inputElement!.removeEventListener('input', inputHandler);
        inputElement!.removeEventListener('inputValueChanged', inputHandler);
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      });
    },
    { injector }
  );

  effect(
    () => {
      const inputElement = inputElementRef();

      if (!inputElement) return;

      const currentValue = valueSignal() ?? '';

      let domValue = currentValue === null || currentValue === undefined ? '' : String(currentValue);

      if (inputElement.value !== domValue) {
        previousValue = domValue;
        inputElement.value = domValue;
        inputElement.dispatchEvent(new Event('input'));
      }
    },
    { injector }
  );

  return valueSignal;

  function syncValueFromInput() {
    if (isUpdating) return;

    isUpdating = true;
    try {
      const inputElement = inputElementRef();
      if (!inputElement) return;

      const inputValue = inputElement.value;
      const transformedValue = forceType ? forceTransform(inputValue, forceType) : transform(inputValue);
      previousValue = inputValue;

      if (!compare(valueSignal(), transformedValue)) {
        valueSignal.set(transformedValue);
      }
    } finally {
      isUpdating = false;
    }
  }

  function createCustomInputEventListener(input: HTMLInputElement | HTMLTextAreaElement) {
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value'); // Use Object.getPrototypeOf
        return descriptor!.get!.call(this);
      },
      set(newVal) {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value'); // Use Object.getPrototypeOf
        descriptor!.set!.call(this, newVal);

        const inputEvent = new CustomEvent('inputValueChanged', {
          bubbles: true,
          cancelable: true,
          detail: {
            value: newVal,
          },
        });

        this.dispatchEvent(inputEvent);

        return newVal;
      },
    });

    return input;
  }

  function forceTransform(value: string, type: 'number' | 'boolean' | 'string'): T | null | undefined {
    switch (type) {
      case 'string':
        return value.toString() as unknown as T;
      case 'number':
        const num = Number(value);
        return isNaN(num) ? undefined : (num as unknown as T);
      case 'boolean':
        return (value.toLowerCase() === 'true'
          ? true
          : value.toLowerCase() === 'false'
            ? false
            : undefined) as unknown as T;
      default:
        return value as unknown as T;
    }
  }
}
