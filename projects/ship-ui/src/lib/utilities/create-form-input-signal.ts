import {
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { observeFirstChild } from './observe-elements';

export function createFormInputSignal<T extends HTMLInputElement | HTMLTextAreaElement>(
  formEl?: Signal<ElementRef<T> | undefined>,
  elementTags: string[] = ['input', 'textarea']
): WritableSignal<string | undefined> {
  const elementRefSignal = formEl ? formEl : observeFirstChild<T>(inject(ElementRef), elementTags);
  const valueSignal: WritableSignal<string | undefined> = signal(undefined);
  const injector = inject(Injector);
  const destroyRef = injector.get(DestroyRef);
  const firstInputEl = signal<HTMLInputElement | HTMLTextAreaElement | null>(null);

  effect(
    (onCleanup) => {
      const elRef = elementRefSignal();

      if (!elRef) return;

      const inputEl = elRef.nativeElement;

      if (!inputEl) return;

      createCustomInputEventListener(inputEl);

      firstInputEl.set(inputEl);
      valueSignal.set(inputEl.value ?? '');

      onCleanup(() => {
        firstInputEl.set(null);
      });
    },
    { injector }
  );

  let removeListener: (() => void) | null = null;

  effect(
    () => {
      const inputEl = firstInputEl();

      if (!inputEl) return;

      if (removeListener) {
        removeListener();
        removeListener = null;
      }

      const inputChangedListener = (event: Event) => {
        valueSignal.set((event as CustomEvent<{ value: string }>).detail.value);
      };

      const inputListener = (event: Event) => {
        valueSignal.set((event.target as HTMLInputElement | HTMLTextAreaElement).value);
      };

      inputEl.addEventListener('input', inputListener as EventListener);
      inputEl.addEventListener('inputValueChanged', inputChangedListener as EventListener);

      valueSignal.set(inputEl.value);

      removeListener = () => {
        inputEl.removeEventListener('input', inputListener as EventListener);
        inputEl.removeEventListener('inputValueChanged', inputChangedListener as EventListener);
      };

      destroyRef.onDestroy(() => {
        if (removeListener) removeListener();
      });
    },
    { injector }
  );

  effect(
    () => {
      const inputEl = firstInputEl();

      if (!inputEl) return;

      const inputValue = valueSignal();

      if (!inputValue) return;

      inputEl.value = inputValue;
      inputEl.dispatchEvent(new Event('input'));
    },
    { injector }
  );

  return valueSignal;
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
