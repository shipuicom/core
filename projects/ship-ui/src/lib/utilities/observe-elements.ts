import { isPlatformServer } from '@angular/common';
import {
  DestroyRef,
  effect,
  EffectRef,
  ElementRef,
  inject,
  Injector,
  PLATFORM_ID,
  Signal,
  signal,
} from '@angular/core';
import { SIGNAL } from '@angular/core/primitives/signals';

export function observeFirstChild<T extends HTMLElement>(
  parentEl: ElementRef<HTMLElement>,
  elementTags: string[]
): Signal<ElementRef<T> | null> {
  const elementSignal = signal<ElementRef<T> | null>(null);
  const _upperCaseElementTags = elementTags.map((tag) => tag.toUpperCase());
  const injector = inject(Injector);
  const destroyRef = injector.get(DestroyRef);

  if (isPlatformServer(injector.get(PLATFORM_ID)) || typeof MutationObserver === 'undefined')
    return elementSignal.asReadonly();

  const initialElement = _upperCaseElementTags.find((tag) => parentEl.nativeElement.querySelector(tag));

  if (initialElement) {
    elementSignal.set(new ElementRef(parentEl.nativeElement.querySelector(elementTags[0]) as T));
    return elementSignal.asReadonly();
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node.nodeType === Node.ELEMENT_NODE && _upperCaseElementTags.includes(node.nodeName)) {
            elementSignal.set(new ElementRef(node as T));
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

export function observeChildren<T extends HTMLElement>(
  parentEl: ElementRef<HTMLElement> | Signal<ElementRef<HTMLElement> | null | undefined>,
  elementTags: string[] | Signal<string[]>
) {
  const injector = inject(Injector);
  const destroyRef = injector.get(DestroyRef);
  const elementsSignal = signal<T[]>([]);

  let effectOnSignal: EffectRef | null = null;
  let observer: MutationObserver | null = null;

  const setupObserver = (el: ElementRef<HTMLElement>, elementTags: string[]) => {
    if (observer) {
      observer.disconnect();
    }

    const foundElements = Array.from(el.nativeElement.querySelectorAll(elementTags.join(',')));

    elementsSignal.set(foundElements as T[]);

    if (typeof MutationObserver !== 'undefined') {
      observer = new MutationObserver((_) => {
        queueMicrotask(() => {
          const foundElements = Array.from(el.nativeElement.querySelectorAll(elementTags.join(',')));

          elementsSignal.set(foundElements as T[]);
        });
      });

      observer.observe(el.nativeElement, {
        childList: true,
        subtree: true,
      });
    }

    destroyRef.onDestroy(() => destroySelf());
  };

  effectOnSignal = effect(
    () => {
      const el =
        typeof parentEl === 'function' && !!parentEl[SIGNAL] ? parentEl() : (parentEl as ElementRef<HTMLElement>);
      const tags = typeof elementTags === 'function' ? elementTags() : elementTags;

      if (el && tags?.length > 0) {
        setupObserver(el, tags);
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

  function destroySelf() {
    if (effectOnSignal) {
      effectOnSignal.destroy();
    }

    if (observer) {
      observer.disconnect();
    }
  }

  return {
    signal: elementsSignal.asReadonly(),
    destroy: destroySelf,
  };
}
