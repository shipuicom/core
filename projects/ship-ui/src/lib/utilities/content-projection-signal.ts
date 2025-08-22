import { DestroyRef, inject, signal, Signal, WritableSignal } from '@angular/core';

export function contentProjectionSignal<T = HTMLElement>(
  hostElement: HTMLElement,
  querySelector?: string
): Signal<T[]> {
  const projectedElementsSignal: WritableSignal<T[]> = signal([]);
  const destroyRef = inject(DestroyRef);

  const updateElements = () => {
    let elements: HTMLElement[] = [];

    // If a querySelector is provided, use it to filter the children.
    if (querySelector) {
      elements = Array.from(hostElement.querySelectorAll(querySelector)) as HTMLElement[];
    } else {
      // Otherwise, get all direct child elements.
      elements = Array.from(hostElement.children) as HTMLElement[];
    }
    projectedElementsSignal.set(elements as T[]);
  };

  const observer = new MutationObserver((mutations) => {
    // Only update if child nodes have been added or removed.
    const hasChildListChanges = mutations.some((mutation) => mutation.type === 'childList');
    if (hasChildListChanges) {
      updateElements();
    }
  });

  // Observe the host element for child list changes.
  observer.observe(hostElement, { childList: true });

  // Disconnect the observer when the component is destroyed.
  destroyRef.onDestroy(() => observer.disconnect());

  // Perform an initial update to get the current list of elements.
  updateElements();

  return projectedElementsSignal.asReadonly();
}
