import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipPopover } from '@ship-ui/core/ship-popover';
import { EditorEngineService } from './editor-engine.service';
import { isSafeUrl } from './editor-sanitize';
import { LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';

/**
 * URL input popover for the link mark, built on ShipUI primitives: an
 * `sh-popover` anchored at the caret (via a zero-size trigger positioned over
 * the selection) hosting an `sh-form-field` and `shButton` actions. Embedded
 * inside <sh-editor> — it injects the editor-scoped engine/selection services
 * directly, so there is no import cycle with the component — and opened by the
 * engine's `uiRequest`: the toolbar link button, the floating toolbar, or Cmd+K.
 *
 * Flows:
 * - selection → Apply: force-set the link mark with the entered href
 * - caret inside a link → prefilled; Apply edits the WHOLE run, Remove unlinks
 * - collapsed caret on no link → the URL is inserted as linked text
 *
 * URLs are normalized (bare domains get https://) and validated with
 * isSafeUrl — the popover refuses what the sanitizer would strip anyway.
 * Escape and overlay clicks are handled by sh-popover itself.
 */
@Component({
  selector: 'sh-editor-link-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipPopover, ShipFormField, ShipButton],
  template: `
    <div class="sh-editor-link-anchor" [style.top.px]="top()" [style.left.px]="left()">
      <sh-popover [(isOpen)]="isOpen" (closed)="onClosed()" [disableOpenByClick]="true" [asSheetOnMobile]="true" [options]="{ closeOnButton: false, closeOnEsc: true }">
        <div class="sh-editor-link-form" (keydown)="onFormKeydown($event)">
          <sh-form-field size="small">
            <label>Link URL</label>
            <!-- autofocus: the Popover API focuses it natively on showPopover() -->
            <input
              #urlInput
              type="text"
              autofocus
              placeholder="Paste or type a link…"
              [value]="url()"
              (input)="url.set($any($event.target).value); error.set(null)" />
            @if (error(); as message) {
              <span error role="alert">{{ message }}</span>
            }
          </sh-form-field>
          <div class="link-actions">
            <button shButton color="primary" (click)="apply()">Apply</button>
            @if (hasExistingLink()) {
              <button shButton (click)="remove()">Remove</button>
            }
          </div>
        </div>
      </sh-popover>
    </div>
  `,
})
export class ShipEditorLinkPopover {
  /** The editor's contenteditable surface — focus returns here on close. */
  surface = input.required<HTMLElement>();

  engine = inject(EditorEngineService);
  selection = inject(EditorSelectionService);
  #selfRef = inject(ElementRef<HTMLElement>);

  urlInput = viewChild<ElementRef<HTMLInputElement>>('urlInput');

  isOpen = signal(false);
  url = signal('');
  error = signal<string | null>(null);
  hasExistingLink = signal(false);
  /** Anchor offset within .sh-editor-container (position: relative). */
  top = signal(0);
  left = signal(0);

  /** Selection captured at open time — applied against, even after the input stole focus. */
  #savedSelection: LogicalSelection | null = null;

  constructor() {
    effect(() => {
      const request = this.engine.uiRequest();
      if (request?.action !== 'link') return;
      // untracked: #open reads selection/activeFormats signals — tracking them
      // here would re-run this effect on every edit and re-open the popover
      // (the apply -> setMark -> doc change -> reopen loop). Consume the
      // request so only a fresh dispatch (new token) opens again.
      untracked(() => {
        this.engine.uiRequest.set(null);
        this.#open();
      });
    });
    // Focus the URL input once the popover content is actually attached —
    // sh-popover mounts its top-layer panel a task later than our signal flip,
    // so retry briefly instead of racing it.
    effect(() => {
      if (!this.isOpen()) return;
      let tries = 0;
      const tryFocus = () => {
        const el = this.urlInput()?.nativeElement;
        if (el && el.isConnected) {
          el.focus();
          el.select();
          if (document.activeElement === el) return;
        }
        if (++tries < 20) setTimeout(tryFocus, 25);
      };
      queueMicrotask(tryFocus);
    });
  }

  #open() {
    const sel = this.selection.active();
    if (!sel) return;
    this.#savedSelection = structuredClone(sel);

    const existing = this.engine.activeFormats().marks.find((m) => m.type === 'link');
    this.hasExistingLink.set(!!existing);
    this.url.set((existing?.attrs?.['href'] as string) ?? '');
    this.error.set(null);

    // Anchor at the caret/selection: viewport rect → container-relative offset.
    // (selection.domRect only tracks non-collapsed ranges; read the live range
    // so a bare caret anchors too.)
    const container = this.#selfRef.nativeElement.closest('.sh-editor-container') as HTMLElement | null;
    const containerRect = container?.getBoundingClientRect();
    const domSel = typeof window !== 'undefined' ? window.getSelection() : null;
    const rect = domSel && domSel.rangeCount > 0 ? domSel.getRangeAt(0).getBoundingClientRect() : null;
    if (rect && containerRect && (rect.width > 0 || rect.height > 0)) {
      this.top.set(rect.bottom - containerRect.top);
      this.left.set(rect.left + rect.width / 2 - containerRect.left);
    } else if (containerRect) {
      this.top.set(48);
      this.left.set(containerRect.width / 2);
    }
    this.isOpen.set(true);
  }

  onFormKeydown(event: KeyboardEvent) {
    // Enter applies; Escape is sh-popover's (document-level) concern.
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.apply();
    }
  }

  apply() {
    const raw = this.url().trim();
    if (!raw) {
      if (this.hasExistingLink()) this.remove();
      else this.isOpen.set(false);
      return;
    }
    // Bare domains become https://; scheme-carrying and relative URLs pass through.
    const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw);
    const isRelative = raw.startsWith('/') || raw.startsWith('#') || raw.startsWith('?');
    const normalized = hasScheme || isRelative ? raw : `https://${raw}`;
    if (!isSafeUrl(normalized)) {
      this.error.set('That URL scheme is not allowed.');
      return;
    }

    if (this.#savedSelection) this.selection.live.set(structuredClone(this.#savedSelection));
    const applied = this.engine.setMark('link', { href: normalized });
    if (!applied) {
      // Nothing under the caret to mark — insert the URL as linked text.
      this.engine.insertTextWithMarks(normalized, [{ type: 'link', attrs: { href: normalized } }]);
    }
    this.isOpen.set(false);
  }

  remove() {
    if (this.#savedSelection) this.selection.live.set(structuredClone(this.#savedSelection));
    this.engine.removeMark('link');
    this.isOpen.set(false);
  }

  /** sh-popover closed (apply, Esc, or overlay click) — hand focus back. */
  onClosed() {
    this.#savedSelection = null;
    this.surface().focus();
  }
}
