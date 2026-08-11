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
  untracked,
} from '@angular/core';

interface InputSignalOptions<T> {
  debounce?: number;
  initialValue?: T | null | undefined;
  transform?: (value: string) => T | null | undefined;
  compare?: (prev: T | null | undefined, curr: T | null | undefined) => boolean;
  forceType?: 'number' | 'boolean' | 'string';
  injector?: Injector;
  returnPreviousValue?: boolean;
  /**
   * Adopt an existing writable signal (e.g. a `model()`) as the backing store instead of
   * creating one. When provided, the caller owns the initial value: the primitive skips
   * seeding from the DOM on attach and skips resetting the value on detach — it only wires
   * ongoing input↔signal sync.
   */
  signal?: WritableSignal<T | null | undefined>;
  /**
   * Called after a DOM-originated change actually updates the signal, with where it came
   * from: `'user'` for typing (a native `input` event), `'programmatic'` for code writing
   * `input.value` from outside (forms/ngModel — surfaced via the value interceptor).
   * Signal-originated `.set()` calls and echo round-trips never trigger it.
   */
  onDomChange?: (value: T | null | undefined, source: 'user' | 'programmatic') => void;
}

type InputElement = HTMLInputElement | HTMLTextAreaElement;

export function createInputSignal<T>(
  input: Signal<InputElement | ElementRef<InputElement> | null | undefined>,
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
    onDomChange = undefined,
  } = options || {};

  const adopted = options?.signal;
  const valueSignal = adopted ?? signal<T | null | undefined>(initialValue);
  const destroyRef = injector.get(DestroyRef);
  const inputElementRef = computed(() => {
    const raw = input();
    const inputElement = raw instanceof ElementRef ? raw.nativeElement : raw;

    if (!(inputElement instanceof HTMLInputElement || inputElement instanceof HTMLTextAreaElement)) {
      return;
    }

    return createCustomInputEventListener(inputElement);
  });

  let previousValue: string | undefined;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastValueFromInput: T | null | undefined = undefined;
  let hasValueFromInput = false;
  let writeBackDepth = 0;

  effect(
    () => {
      const inputElement = inputElementRef();

      if (!inputElement) {
        if (!adopted) {
          valueSignal.set(returnPreviousValue && previousValue ? transform(previousValue) : undefined);
        }
        return;
      }

      lastValueFromInput = undefined;
      hasValueFromInput = false;

      if (!adopted) {
        if (initialValue !== undefined && inputElement.value === '') {
          valueSignal.set(initialValue);
        } else if (inputElement.value !== '') {
          syncValueFromInput();
        }
      }

      const inputHandler = (e: Event) => {
        const source: 'user' | 'programmatic' = e.type === 'inputValueChanged' ? 'programmatic' : 'user';

        if (debounce <= 0) {
          syncValueFromInput(source);
          return;
        }

        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
          timeoutId = null;
          syncValueFromInput(source);
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

      const currentValue = valueSignal();

      if (hasValueFromInput && compare(currentValue, lastValueFromInput)) return;

      const domValue = currentValue === null || currentValue === undefined ? '' : String(currentValue);

      if (inputElement.value !== domValue) {
        previousValue = domValue;
        writeBackDepth++;
        try {
          inputElement.value = domValue;
          inputElement.dispatchEvent(new Event('input'));
        } finally {
          writeBackDepth--;
        }
      }
    },
    { injector }
  );

  return valueSignal;

  function syncValueFromInput(source?: 'user' | 'programmatic') {
    const inputElement = inputElementRef();
    if (!inputElement) return;

    const inputValue = inputElement.value;
    const transformedValue = forceType ? forceTransform(inputValue, forceType) : transform(inputValue);
    previousValue = inputValue;
    lastValueFromInput = transformedValue;
    hasValueFromInput = true;

    if (!compare(untracked(valueSignal), transformedValue)) {
      valueSignal.set(transformedValue);

      if (source && writeBackDepth === 0) {
        onDomChange?.(transformedValue, source);
      }
    }
  }

  function createCustomInputEventListener(input: HTMLInputElement | HTMLTextAreaElement) {
    Object.defineProperty(input, 'value', {
      configurable: true,
      get() {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value'); 
        return descriptor!.get!.call(this);
      },
      set(newVal) {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value'); 
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
