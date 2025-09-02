import { DestroyRef, ElementRef, inject, signal, Signal, WritableSignal } from '@angular/core';

export function classMutationSignal(): Signal<string> {
  const element = inject(ElementRef).nativeElement;

  if (!element) return signal('');

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

  observer.observe(element, { attributes: true, attributeFilter: ['class'] });
  destroyRef.onDestroy(() => observer.disconnect());

  return classListSignal.asReadonly();
}
