import { DestroyRef, inject, signal, Signal, WritableSignal } from '@angular/core';

export function classMutationSignal(element: HTMLElement): Signal<string> {
  const classListSignal: WritableSignal<string> = signal(element.className);

  if (typeof MutationObserver === 'undefined') return classListSignal.asReadonly();

  const destroyRef = inject(DestroyRef);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target as HTMLElement;
        classListSignal.set(target.className);
      }
    }
  });

  observer.observe(element, { attributes: true });
  destroyRef.onDestroy(() => observer.disconnect());

  return classListSignal.asReadonly();
}
