import { computed, DestroyRef, ElementRef, inject, signal, Signal, WritableSignal } from '@angular/core';

export function contentProjectionSignal<T = HTMLElement>(
  querySelector: string,
  options?: MutationObserverInit
): Signal<T[]>;
export function contentProjectionSignal<T = HTMLElement>(
  querySelector: string,
  options: MutationObserverInit | undefined,
  index: number
): Signal<T | undefined>;
export function contentProjectionSignal<T = HTMLElement>(
  querySelector: string,
  options?: MutationObserverInit,
  index?: number
): Signal<T[]> | Signal<T | undefined> {
  options ??= { childList: true };

  const hostElement = inject(ElementRef<HTMLElement>).nativeElement;
  const destroyRef = inject(DestroyRef);

  const projectedElementsSignal: WritableSignal<T[]> = signal([]);
  const updateElements = () => {
    projectedElementsSignal.set(Array.from(hostElement.querySelectorAll(querySelector)) as T[]);
  };

  updateElements();

  const result =
    index === undefined ? projectedElementsSignal.asReadonly() : computed(() => projectedElementsSignal()[index]);

  if (typeof MutationObserver === 'undefined') return result;

  const observer = new MutationObserver((mutations) => {
    const hasChildListChanges = mutations.some((mutation) => mutation.type === 'childList');
    if (hasChildListChanges) {
      updateElements();
    }
  });

  observer.observe(hostElement, options);
  destroyRef.onDestroy(() => observer.disconnect());

  return result;
}
