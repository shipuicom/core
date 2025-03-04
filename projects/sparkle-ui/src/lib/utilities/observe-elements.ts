import { DestroyRef, effect, ElementRef, inject, Injector, Signal, signal } from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

export function observeFirstChild(
  parentEl: ElementRef<HTMLElement>,
  elementTags: string[]
): Signal<ElementRef<HTMLElement> | null> {
  const elementSignal = signal<ElementRef<HTMLElement> | null>(null);
  const _upperCaseElementTags = elementTags.map((tag) => tag.toUpperCase());
  const injector = inject(Injector);
  const destroyRef = injector.get(DestroyRef);

  if (typeof MutationObserver === 'undefined') return elementSignal.asReadonly();

  const initialElement = _upperCaseElementTags.find((tag) => parentEl.nativeElement.querySelector(tag));

  if (initialElement) {
    elementSignal.set(new ElementRef(parentEl.nativeElement.querySelector(elementTags[0]) as HTMLInputElement));
    return elementSignal.asReadonly();
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE && _upperCaseElementTags.includes(node.nodeName)) {
            elementSignal.set(new ElementRef(node as HTMLElement));
            observer.disconnect();
            return;
          }
        }
      }
    }
  });

  observer.observe(parentEl.nativeElement, {
    childList: true,
    subtree: true,
  });

  destroyRef.onDestroy(() => observer.disconnect());

  return elementSignal.asReadonly();
}

export function observeChildren(
  parentEl: ElementRef<HTMLElement> | Signal<ElementRef<HTMLElement> | null | undefined>,
  elementTags: string[]
): Signal<ElementRef<HTMLElement>[]> {
  const injector = inject(Injector);
  const destroyRef = injector.get(DestroyRef);
  const elementsSignal = signal<ElementRef<HTMLElement>[]>([]);
  const _upperCaseElementTags = elementTags.map((tag) => tag.toUpperCase());

  let observer: MutationObserver | null = null;

  const setupObserver = (el: ElementRef<HTMLElement>) => {
    if (observer) {
      observer.disconnect();
    }

    const foundElements = Array.from(el.nativeElement.querySelectorAll('*'))
      .filter((elem) => elem.nodeType === Node.ELEMENT_NODE && _upperCaseElementTags.includes(elem.nodeName))
      .map((elem) => new ElementRef(elem as HTMLElement));

    elementsSignal.set(foundElements);

    observer = new MutationObserver((mutations) => {
      let currentElements = elementsSignal();

      for (const mutation of mutations) {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && _upperCaseElementTags.includes(node.nodeName)) {
              currentElements = [...currentElements, new ElementRef(node as HTMLElement)];
            }
          });
        }
        if (mutation.removedNodes) {
          mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && _upperCaseElementTags.includes(node.nodeName)) {
              currentElements = currentElements.filter((elem) => elem.nativeElement !== node);
            }
          });
        }
      }

      elementsSignal.set(currentElements);
    });

    observer.observe(el.nativeElement, {
      childList: true,
      subtree: true,
    });

    destroyRef.onDestroy(() => {
      if (observer) {
        observer.disconnect();
      }
    });
  };

  if (typeof parentEl === 'function' && !!parentEl[SIGNAL]) {
    effect(
      () => {
        const el = parentEl();
        if (el) {
          setupObserver(el);
        } else {
          elementsSignal.set([]);
          if (observer) {
            observer.disconnect();
            observer = null;
          }
        }
      },
      { injector }
    );
  } else {
    if (parentEl instanceof ElementRef) {
      setupObserver(parentEl);
    }
  }

  return elementsSignal.asReadonly();
}
