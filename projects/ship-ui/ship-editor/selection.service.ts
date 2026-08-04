import { computed, Injectable, signal } from '@angular/core';
import { LogicalSelection } from './editor.types';
import { normalizeLogical } from './editor-multi-selection';

@Injectable()
export class EditorSelectionService {
  /**
   * The primary range — the one the browser's own selection paints and every
   * single-cursor code path reads. It stays a plain `{from, to}` so nothing
   * that predates multi-cursor has to change.
   */
  readonly live = signal<LogicalSelection | null>(null);

  /**
   * The extra cursors, painted by the editor's own overlay because a
   * contenteditable only ever gets one native range. Never contains the
   * primary.
   */
  readonly secondary = signal<readonly LogicalSelection[]>([]);

  readonly domRect = signal<DOMRect | null>(null);

  #suppressed = false;

  readonly active = computed(() => this.live());

  /** Every cursor, sorted and disjoint — primary included. */
  readonly ranges = computed<LogicalSelection[]>(() => {
    const primary = this.live();
    const rest = this.secondary();
    if (!primary) return normalizeLogical(rest);
    if (!rest.length) return [{ ...primary }];
    return normalizeLogical([primary, ...rest]);
  });

  readonly isMulti = computed(() => this.secondary().length > 0);

  readonly isSuppressed = () => this.#suppressed;

  /** Drop the extra cursors. Any plain click or fresh selection does this. */
  clearSecondary() {
    if (this.secondary().length) this.secondary.set([]);
  }

  updateRect(editorRoot: HTMLElement) {
    if (typeof window === 'undefined') return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && editorRoot.contains(sel.anchorNode)) {
      this.domRect.set(sel.getRangeAt(0).getBoundingClientRect());
    } else {
      this.domRect.set(null);
    }
  }

  suppress() {
    this.#suppressed = true;
  }

  unsuppress() {
    this.#suppressed = false;
  }
}
