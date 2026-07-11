import { computed, Injectable, signal } from '@angular/core';
import { LogicalSelection } from './editor.types';

@Injectable()
export class EditorSelectionService {
  readonly live = signal<LogicalSelection | null>(null);
  readonly domRect = signal<DOMRect | null>(null);

  /** True while the engine is patching the DOM — selectionchange events should be ignored. */
  #suppressed = false;

  readonly active = computed(() => this.live());
  readonly isSuppressed = () => this.#suppressed;

  updateRect(editorRoot: HTMLElement) {
    if (typeof window === 'undefined') return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRoot.contains(sel.anchorNode)) {
      this.domRect.set(sel.getRangeAt(0).getBoundingClientRect());
    } else {
      this.domRect.set(null);
    }
  }

  /** Suppress selectionchange events during programmatic DOM updates. */
  suppress() {
    this.#suppressed = true;
  }

  /** Resume listening to selectionchange events. */
  unsuppress() {
    this.#suppressed = false;
  }
}
