import { InjectionToken, Signal, Type } from '@angular/core';
import { BaseBlockBehavior } from './editor-behaviors';
import { escapeAttr } from './editor-sanitize';
import { ASTBlockNode } from './editor.types';

/**
 * The editor-side handle a custom block component talks to.
 *
 * Injected into every mounted block component via `SHIP_EDITOR_BLOCK_CONTEXT`.
 * `attrs` is the block's persisted state — the only state that survives
 * serialization, undo/redo, and virtualization unmounts — so anything the
 * component wants to keep goes through `updateAttrs` (one undoable
 * transaction per call).
 */
export interface ShipEditorBlockContext {
  /** The block's current attrs, updated live on undo/redo and remote edits. */
  readonly attrs: Signal<Record<string, unknown>>;
  /** The block's current top-level index in the document. */
  readonly index: Signal<number>;
  /** True while the block is selected as a block (blue border, editor keybindings). */
  readonly selected: Signal<boolean>;
  /** Mirrors the editor's `readonly` input. */
  readonly readonly: Signal<boolean>;
  /** Merge a patch into the block's attrs as one undoable transaction. */
  updateAttrs(patch: Record<string, unknown>): void;
  /**
   * Hand control back to the editor: selects the block (border + editor
   * keybindings) and moves focus to the editing surface. While focus is
   * inside the component the editor intercepts nothing, so a component that
   * wants a keyboard exit binds its own key (e.g. Escape) to this.
   */
  select(): void;
  /** Delete this block from the document. */
  remove(): void;
}

export const SHIP_EDITOR_BLOCK_CONTEXT = new InjectionToken<ShipEditorBlockContext>('SHIP_EDITOR_BLOCK_CONTEXT');

/**
 * A void block rendered as a live Angular component — a map, a video player,
 * an embedded code editor.
 *
 * The behavior owns the block's identity and serialization; the `component`
 * is mounted into the block's wrapper element by the editor and receives a
 * `ShipEditorBlockContext` through injection. Interaction contract:
 *
 * - Clicks on interactive content (buttons, inputs, canvas, iframes, ARIA
 *   roles, contenteditable) pass through to the component untouched. A click
 *   that lands on nothing interactive falls through and selects the block;
 *   a component's own click handler can call `stopPropagation()` (or
 *   `preventDefault()`) to keep such clicks for itself.
 * - While focus is inside the component, the editor intercepts no keys, no
 *   input, no clipboard — an embedded editor keeps its whole keymap.
 * - When the block itself is selected (arrow navigation from adjacent text,
 *   click fall-through, or `context.select()`), the standard void-block
 *   keybindings apply: arrows navigate, Backspace/Delete removes, Escape
 *   returns to text.
 *
 * The default serialization is a neutral wrapper —
 * `<div data-sh-block="type" data-sh-attrs="…json…"></div>` — which
 * round-trips through the `html` format (and is emitted verbatim for
 * `markdown`; parsing it back from markdown is not supported by default).
 * Override `renderHTML`/`parseDOM`/`renderMarkdown` for richer output.
 *
 * **Security — treat `attrs` as untrusted input.** Pasted or loaded HTML can
 * instantiate any registered component block with arbitrary
 * `data-sh-attrs`; the editor's sanitizer round-trips them as opaque JSON
 * and cannot vet what they mean to your component. Validate types and
 * ranges, allowlist URL schemes before using an attr as an `href`/`src`,
 * and never feed attr values into `innerHTML`, style, or code evaluation.
 */
export abstract class BaseComponentBlockBehavior extends BaseBlockBehavior {
  readonly category = 'void' as const;

  /** The Angular component mounted inside the block's wrapper element. */
  abstract readonly component: Type<unknown>;

  readonly enterPhysics = { strategy: 'insert-default-below' as const, defaultSplitTarget: 'paragraph' };
  readonly backspacePhysics = {};

  parseDOM(el: HTMLElement): ASTBlockNode | null {
    if (el.tagName?.toLowerCase() !== 'div' || el.dataset['shBlock'] !== this.type) return null;
    let attrs: Record<string, unknown> | null = null;
    const raw = el.dataset['shAttrs'];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) attrs = parsed;
      } catch {
        // Malformed attrs payload parses as an attr-less block.
      }
    }
    return { type: this.type, ...(attrs && Object.keys(attrs).length ? { attrs } : {}), content: [] };
  }

  renderHTML(block: ASTBlockNode): string {
    const attrs = block.attrs ?? {};
    const attrsHtml = Object.keys(attrs).length ? ` data-sh-attrs="${escapeAttr(JSON.stringify(attrs))}"` : '';
    return `<div class="sh-editor-component-block" data-sh-block="${escapeAttr(this.type)}"${attrsHtml} contenteditable="false"></div>`;
  }

  override renderMarkdown(block: ASTBlockNode): string {
    return `${this.renderHTML(block)}\n\n`;
  }
}
