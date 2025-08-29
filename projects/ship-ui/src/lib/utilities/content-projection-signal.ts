import { DestroyRef, ElementRef, inject, signal, Signal, WritableSignal } from '@angular/core';

export function contentProjectionSignal<T = HTMLElement>(querySelector: string): Signal<T[]> {
  const hostElement = inject(ElementRef<HTMLElement>).nativeElement;
  const destroyRef = inject(DestroyRef);

  const projectedElementsSignal: WritableSignal<T[]> = signal([]);
  const updateElements = () => {
    projectedElementsSignal.set(Array.from(hostElement.querySelectorAll(querySelector)) as T[]);
  };

  updateElements();

  if (typeof MutationObserver === 'undefined') return projectedElementsSignal.asReadonly();

  const observer = new MutationObserver((mutations) => {
    const hasChildListChanges = mutations.some((mutation) => mutation.type === 'childList');
    if (hasChildListChanges) {
      updateElements();
    }
  });

  observer.observe(hostElement, { childList: true });
  destroyRef.onDestroy(() => observer.disconnect());

  return projectedElementsSignal.asReadonly();
}
