import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  effect,
  forwardRef,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import { EditorEngineService } from './editor-engine.service';
import { SanitizeOption, normalizeDocument, sanitizeDocumentUrls } from './editor-sanitize';
import { htmlToAst, markdownToAst, parseDOMToAST, renderInlineHTML } from './editor-serializers';
import { ShipEditorContextualToolbar, ContextualActionExtras } from './sh-editor-contextual-toolbar';
import { ShipEditorImagePopover } from './sh-editor-image-popover';
import { ShipEditorLinkPopover } from './sh-editor-link-popover';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalPosition, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as Behaviors from './standard-behaviors';

@Component({
  selector: 'sh-editor',
  standalone: true,
  exportAs: 'shEditor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [ShipEditorLinkPopover, ShipEditorImagePopover, ShipEditorContextualToolbar],
  providers: [
    EditorEngineService,
    EditorSelectionService,
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ShipEditorExp), multi: true },
  ],
  template: `
    <div class="sh-editor-container">
      <ng-content select="sh-editor-toolbar:not([position='bottom'])"></ng-content>
      <div class="sh-editor-body">
        <div
          #surface
          class="sh-editor-content"
          [class.readonly]="readonly()"
          [attr.contenteditable]="!readonly()"
          (blur)="onDOMBlur()"
          (focus)="onDOMFocus()"
          (keydown)="onKeyDown($event)"
          (paste)="onPaste($event)"
          (beforeinput)="onBeforeInput($event)"
          (mousedown)="onSurfaceMouseDown($event)"
          (compositionstart)="onCompositionStart()"
          (compositionend)="onCompositionEnd()"></div>
      </div>
      <sh-editor-link-popover [surface]="surface" />
      <sh-editor-image-popover [surface]="surface" />
      <sh-editor-contextual-toolbar [surface]="surface" [extras]="contextualActions()" />
    </div>
  `,
  styleUrl: './ship-editor.scss',
})
export class ShipEditorExp implements ControlValueAccessor {
  #document = inject(DOCUMENT);
  surface = viewChild.required<ElementRef<HTMLElement>>('surface');

  readonly = input(false);
  format = input<'html' | 'json' | 'markdown'>('html');

  /**
   * Extra block/inline behaviors to register on top of the built-in set.
   * Lets a consumer extend the editor with custom marks or blocks — e.g. a
   * highlight mark that renders `<mark class="…">` — without forking the editor.
   */
  behaviors = input<(BaseBlockBehavior | BaseInlineBehavior)[]>([]);

  /**
   * Sanitization policy for untrusted HTML/markdown/JSON reaching `value` or the
   * clipboard. `true` (default) scrubs against the built-in allow-list; `false`
   * trusts the input and skips the scrub (HTML is still parsed inertly — never
   * `innerHTML`'d — so it can't execute); an object extends the allow-list with
   * extra `tags`/`attrs` for custom behaviors. Render-time escaping always runs
   * regardless, so a hostile JSON `value` can never inject on render.
   */
  sanitize = input<SanitizeOption>(true);

  /**
   * Consumer-provided extra contextual-toolbar actions, keyed by block type —
   * appended to whatever a block behavior declares via `contextualActions()`.
   * Lets a consumer add buttons to (say) the image toolbar without subclassing.
   */
  contextualActions = input<ContextualActionExtras>({});

  value = model<string | ASTDocument | null>(null);

  public engine = inject(EditorEngineService);
  public selection = inject(EditorSelectionService);
  keybindings = inject(ShipA11yKeybindingsService, { optional: true });

  /** Set only while reconciling a block after IME composition, so the render
   * effect skips patching (the DOM already holds the composed text). */
  #isWritingFromDOM = false;
  /** True between compositionstart/compositionend — the IME owns the DOM then. */
  #composing = false;
  /** The doc reference last projected to the DOM. Lets the render effect skip a
   * redundant pass when an input handler already rendered this exact version. */
  #lastRenderedDoc: ASTDocument | null = null;
  #isInternalValueUpdate = false;
  onChange: any = () => {};
  onTouched: any = () => {};

  constructor() {
    [
      new Behaviors.ParagraphBehavior(),
      new Behaviors.HeadingBehavior(),
      new Behaviors.QuoteBehavior(),
      new Behaviors.InfoCalloutBehavior(),
      new Behaviors.CodeBlockBehavior(),
      new Behaviors.HrBehavior(),
      new Behaviors.ImageBehavior(),
      new Behaviors.BulletListBehavior(),
      new Behaviors.OrderedListBehavior(),
      new Behaviors.ListItemBehavior(),
      new Behaviors.BoldBehavior(),
      new Behaviors.ItalicBehavior(),
      new Behaviors.UnderlineBehavior(),
      new Behaviors.StrikeBehavior(),
      new Behaviors.InlineCodeBehavior(),
      new Behaviors.LinkBehavior(),
    ].forEach((b) => this.engine.register(b));

    // Register consumer-provided behaviors. Runs before the value effect below
    // (effects flush in creation order) so custom marks/blocks are known before
    // any content is parsed. register() is idempotent — keyed by behavior type.
    effect(() => this.behaviors().forEach((b) => this.engine.register(b)));

    effect(() => {
      const externalVal = this.value();
      if (this.#isInternalValueUpdate) {
        this.#isInternalValueUpdate = false;
        return;
      }
      const sanitize = this.sanitize();
      untracked(() => {
        if (!externalVal) this.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
        else if (this.format() === 'json' && Array.isArray(externalVal)) {
          // JSON bypasses HTML parsing. Always coerce to a structurally valid
          // document (crash-safety is not opt-out); additionally neutralize
          // dangerous URLs unless the consumer opted out of sanitization.
          const structural = normalizeDocument(externalVal) as ASTDocument;
          this.engine.reset(sanitize === false ? structural : sanitizeDocumentUrls(structural));
        }
        else {
          const doc =
            this.format() === 'markdown'
              ? markdownToAst(externalVal as string, this.engine.blocks, this.engine.inlines, sanitize)
              : htmlToAst(externalVal as string, this.engine.blocks, this.engine.inlines, sanitize);
          this.engine.reset(doc);
        }
      });
    });

    effect(() => {
      const doc = this.engine.document();
      const format = this.format();
      untracked(() => {
        const serialized = this.engine.serialize(format);
        if (this.value() !== serialized) {
          this.#isInternalValueUpdate = true;
          this.value.set(serialized);
          this.onChange(serialized);
        }
      });

      if (this.#isWritingFromDOM) {
        this.#isWritingFromDOM = false;
        return;
      }
      // An input handler may have already projected this exact doc synchronously
      // (fast-typing path). Skip the redundant patch, but only for the identical
      // doc reference — a mutation from elsewhere (toolbar, undo) is a new array
      // and still renders here.
      if (doc === this.#lastRenderedDoc) return;
      this.#render();
    });

    // Reflect the engine's selected void block (image) as a highlight class on
    // its element — runs after the render effect (created earlier), so the DOM
    // is patched by the time this reads it.
    effect(() => {
      const idx = this.engine.selectedBlock();
      const container = this.surface().nativeElement;
      container
        .querySelectorAll('.sh-editor-block-selected')
        .forEach((el) => el.classList.remove('sh-editor-block-selected'));
      if (idx !== null) container.children[idx]?.classList.add('sh-editor-block-selected');
    });
  }

  writeValue(obj: any): void {
    if (obj !== this.value()) this.value.set(obj);
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    if (this.selection.isSuppressed() || this.#composing || typeof window === 'undefined') return;
    this.#syncLogicalSelectionFromDOM();
    // A genuine caret in a (non-void) text block means the user left the image
    // — drop the void-block selection so its contextual toolbar closes.
    if (this.engine.selectedBlock() !== null) {
      const sel = this.selection.active();
      const block = sel && this.engine.document()[sel.start.blockIndex];
      if (block && this.engine.blocks.get(block.type)?.category !== 'void') this.engine.clearBlockSelection();
    }
  }

  /** Select an image on click (a void block has no text caret), else clear any
   * void-block selection when the click lands in text. */
  onSurfaceMouseDown(event: MouseEvent) {
    if (this.readonly()) return;
    const surface = this.surface().nativeElement;
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' && target.parentElement === surface) {
      const idx = Array.from(surface.children).indexOf(target);
      if (idx >= 0) {
        event.preventDefault(); // no text caret in a void block
        this.engine.selectBlock(idx);
        return;
      }
    }
    this.engine.clearBlockSelection();
  }

  /**
   * All content mutation flows through here. We intercept `beforeinput`, cancel
   * the browser's native edit, and translate the `inputType` into an AST
   * transaction — so the DOM is a pure projection of the AST and is never read
   * back for content. The exception is IME composition, which must edit the DOM
   * natively; it's reconciled once, per block, on `compositionend`.
   */
  onBeforeInput(event: InputEvent) {
    if (this.readonly()) return;
    if (this.#composing) return; // IME owns the DOM until compositionend

    // A selected image (void block) has no text caret: delete removes it, any
    // other input just dismisses the selection (never writes into the void).
    if (this.engine.selectedBlock() !== null) {
      event.preventDefault();
      if (event.inputType.startsWith('delete')) {
        this.engine.deleteSelectedBlock();
      } else {
        this.engine.clearBlockSelection();
      }
      this.#render();
      return;
    }

    // Sample the real caret/selection from the DOM at command time, so a
    // transaction never runs against a stale mirror when selectionchange lagged
    // a user-driven caret move (click/arrow-then-type). Branches below that
    // carry a precise getTargetRanges() still refine this afterwards.
    this.#syncLogicalSelectionFromDOM();

    const format: Record<string, string> = {
      formatBold: 'bold',
      formatItalic: 'italic',
      formatUnderline: 'underline',
      formatStrikeThrough: 'strike',
    };

    // Every handled branch mutates the AST; the two exceptions clear this so we
    // don't patch (composition edits the DOM itself; unknown types are no-ops).
    let mutated = true;

    switch (event.inputType) {
      case 'insertText':
      case 'insertReplacementText': {
        const data = event.data ?? '';
        event.preventDefault();
        if (!data) break;
        // Autocorrect/spellcheck replacements carry the range to replace.
        this.#selectTargetRange(event);
        this.engine.insertText(data);
        break;
      }
      case 'insertParagraph':
        event.preventDefault();
        this.engine.handleEnter();
        break;
      case 'insertLineBreak':
        event.preventDefault();
        this.engine.insertText('\n');
        break;
      case 'deleteContentBackward':
      case 'deleteWordBackward':
      case 'deleteSoftLineBackward':
      case 'deleteHardLineBackward':
        event.preventDefault();
        this.#handleDelete(event, 'backward');
        break;
      case 'deleteContentForward':
      case 'deleteWordForward':
      case 'deleteSoftLineForward':
      case 'deleteHardLineForward':
        event.preventDefault();
        this.#handleDelete(event, 'forward');
        break;
      case 'deleteByCut':
      case 'deleteContent':
        event.preventDefault();
        this.engine.deleteRange();
        break;
      case 'insertFromPaste':
      case 'insertFromDrop':
        // Paste content is applied transactionally by onPaste(); block the native
        // insert so the DOM can't drift. Drag-drop is not yet supported.
        event.preventDefault();
        break;
      case 'historyUndo':
        event.preventDefault();
        this.engine.undo();
        break;
      case 'historyRedo':
        event.preventDefault();
        this.engine.redo();
        break;
      case 'insertCompositionText':
        // We only reach this while NOT composing — during a real composition the
        // guard above returns before the switch. So this is a lone composition
        // input with no surrounding compositionstart/end: Android GBoard commits
        // autocorrect/suggestions/glide typing (and sometimes plain keystrokes)
        // this way, often with null `data`. Allow the native edit, but there is no
        // compositionend coming to reconcile it, so schedule the reconcile
        // ourselves once the browser has applied the edit (default action runs
        // synchronously after this handler; the microtask sees the updated DOM).
        mutated = false;
        queueMicrotask(() => {
          if (this.#composing) return; // a real composition began; its end will reconcile
          this.#reconcileCaretBlockFromDOM();
        });
        break;
      default: {
        const markType = format[event.inputType];
        if (markType && this.engine.inlines.has(markType)) {
          event.preventDefault();
          this.engine.toggleMark(markType);
          break;
        }
        // Unknown input type: cancel it so the DOM stays in lockstep with the AST.
        event.preventDefault();
        mutated = false;
      }
    }

    // Project the transaction to the DOM synchronously, before this handler
    // returns — no async gap for a stale selectionchange to race the caret.
    if (mutated) this.#render();
  }

  onCompositionStart() {
    this.#composing = true;
  }

  onCompositionEnd() {
    this.#composing = false;
    // The IME wrote composed text straight into the DOM. Reconcile just that one
    // block back into the AST (never the whole surface) and resync the selection.
    this.#reconcileCaretBlockFromDOM();
  }

  /** Reparse the block the caret sits in from the DOM, then resync the logical
   * selection. Shared by compositionend and the lone-`insertCompositionText`
   * path — both leave composed text in the DOM that the AST hasn't seen yet. */
  #reconcileCaretBlockFromDOM() {
    const index = this.#currentBlockIndex();
    if (index >= 0) this.#reconcileBlockFromDOM(index);
    this.#syncLogicalSelectionFromDOM();
  }

  /** Point the logical selection at a beforeinput target range (single-block only). */
  #selectTargetRange(event: InputEvent): boolean {
    const tr = event.getTargetRanges?.()[0];
    if (!tr) return false;
    const container = this.surface().nativeElement;
    const start = this.mapDOMToLogical(container, tr.startContainer, tr.startOffset);
    const end = this.mapDOMToLogical(container, tr.endContainer, tr.endOffset);
    if (!start || !end || start.blockIndex !== end.blockIndex) return false;
    const collapsed =
      start.inlineIndex === end.inlineIndex && start.offset === end.offset;
    this.selection.live.set({ start, end, isCollapsed: collapsed });
    return true;
  }

  #handleDelete(event: InputEvent, direction: 'backward' | 'forward') {
    const sel = this.selection.active();
    // An existing (user) selection: delete exactly it.
    if (sel && !sel.isCollapsed) {
      this.engine.deleteRange();
      return;
    }
    // Word/line delete: the browser hands us the precise range to remove. Use it
    // when it stays within one block; block-boundary deletes fall through to the
    // engine so merge/escape semantics apply.
    const tr = event.getTargetRanges?.()[0];
    if (tr) {
      const container = this.surface().nativeElement;
      const start = this.mapDOMToLogical(container, tr.startContainer, tr.startOffset);
      const end = this.mapDOMToLogical(container, tr.endContainer, tr.endOffset);
      const sameBlockRange =
        start &&
        end &&
        start.blockIndex === end.blockIndex &&
        !(start.inlineIndex === end.inlineIndex && start.offset === end.offset);
      if (sameBlockRange) {
        this.selection.live.set({ start, end, isCollapsed: false });
        this.engine.deleteRange();
        return;
      }
    }
    if (direction === 'backward') this.engine.handleBackspace();
    else this.engine.deleteForward();
  }

  /** Index (within the surface) of the block the caret is currently in, or -1. */
  #currentBlockIndex(): number {
    if (typeof window === 'undefined') return -1;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return -1;
    const container = this.surface().nativeElement;
    const node = sel.getRangeAt(0).startContainer;
    let el: HTMLElement | null =
      node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    while (el && el.parentElement !== container) el = el.parentElement;
    return el && el.parentElement === container ? Array.from(container.children).indexOf(el) : -1;
  }

  /** Re-parse a single block element from the DOM into the AST (post-composition). */
  #reconcileBlockFromDOM(index: number) {
    const container = this.surface().nativeElement;
    const blockEl = container.children[index] as HTMLElement | undefined;
    if (!blockEl) return;
    const temp = this.#document.createElement('div');
    temp.appendChild(blockEl.cloneNode(true));
    const parsed = parseDOMToAST(temp, this.engine.blocks, this.engine.inlines);
    if (!parsed.length) return;
    const doc = [...this.engine.document()];
    doc[index] = parsed[0];
    this.#isWritingFromDOM = true; // DOM already reflects this block; skip the patch
    // Commit through the engine so the composed text is an invertible,
    // undoable transaction like any other edit (a raw document.set would
    // desync the operation-based history).
    this.engine.commitDocument(doc);
  }

  #syncLogicalSelectionFromDOM() {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = this.surface().nativeElement;
    if (!container.contains(range.commonAncestorContainer)) {
      this.selection.domRect.set(null);
      return;
    }
    this.selection.updateRect(container);
    const startLogical = this.mapDOMToLogical(container, range.startContainer, range.startOffset);
    const endLogical = range.collapsed
      ? startLogical
      : this.mapDOMToLogical(container, range.endContainer, range.endOffset);
    if (startLogical && endLogical) {
      this.selection.live.set({ start: startLogical, end: endLogical, isCollapsed: range.collapsed });
    }
  }

  onPaste(event: ClipboardEvent) {
    if (this.readonly()) return;
    event.preventDefault();

    // Paste replaces the current selection — sample it from the DOM at command
    // time rather than trusting the possibly-stale mirror.
    this.#syncLogicalSelectionFromDOM();

    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const html = clipboard.getData('text/html');
    const plainText = clipboard.getData('text/plain');

    let fragment: ASTDocument;

    if (html) {
      fragment = htmlToAst(html, this.engine.blocks, this.engine.inlines, this.sanitize());
    } else if (plainText) {
      fragment = plainText
        .split(/\n{2,}/)
        .filter((p) => p.length > 0)
        .map((p) => ({
          type: 'paragraph' as const,
          content: [{ type: 'text' as const, text: p.replace(/\n/g, ' ') }],
        }));
      if (fragment.length === 0) return;
    } else {
      return;
    }

    this.engine.insertFragment(fragment);
    this.#render();
  }

  onDOMBlur() {
    this.onTouched();
  }
  onDOMFocus() {}

  onKeyDown(event: KeyboardEvent) {
    if (this.readonly()) return;
    if (this.#composing) return; // IME dispatches keyCode 229; ignore during composition

    // While an image is selected, arrows move the caret out of it and Escape
    // deselects. (Delete/Backspace arrive as beforeinput and are handled there.)
    const selectedIdx = this.engine.selectedBlock();
    if (selectedIdx !== null) {
      if (event.key === 'Escape') {
        event.preventDefault();
        return this.engine.clearBlockSelection();
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        const before = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
        const targetIdx = before ? Math.max(0, selectedIdx - 1) : Math.min(this.engine.document().length - 1, selectedIdx + 1);
        this.engine.clearBlockSelection();
        const targetBlock = this.engine.document()[targetIdx];
        if (targetBlock && this.engine.blocks.get(targetBlock.type)?.category !== 'void') {
          const content = targetBlock.content as ASTInlineNode[];
          const lastIdx = before ? Math.max(0, content.length - 1) : 0;
          const offset = before ? (content[lastIdx]?.text.length ?? 0) : 0;
          const pos: LogicalPosition = { blockIndex: targetIdx, inlineIndex: lastIdx, offset };
          this.selection.live.set({ start: pos, end: pos, isCollapsed: true });
          this.#render();
        }
        return;
      }
    }

    if (this.keybindings) {
      // A shortcut the editor consumes must not also reach app-level document
      // listeners — e.g. Cmd+K is both editor.link and the app's spotlight
      // search, and without stopPropagation both would fire.
      const consume = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      if (this.keybindings.matches(event, 'editor.undo')) {
        consume();
        return this.engine.undo();
      }
      if (this.keybindings.matches(event, 'editor.redo')) {
        consume();
        return this.engine.redo();
      }

      for (const block of this.engine.blocks.values()) {
        if (block.keybinding && this.keybindings.matches(event, block.keybinding)) {
          consume();
          return this.engine.setBlockType(block.type);
        }
      }

      for (const inline of this.engine.inlines.values()) {
        if (inline.keybinding && this.keybindings.matches(event, inline.keybinding)) {
          consume();
          // Through dispatch, so UI-requesting marks (Cmd+K -> link popover)
          // open their input instead of toggling an attr-less mark.
          return this.engine.dispatch(inline.type);
        }
      }
    }

    // Structural navigation only. Text entry, Enter, and deletion are handled
    // transactionally in onBeforeInput().
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      if (this.engine.handleEscapeHatch()) event.preventDefault();
      return;
    }
  }

  /**
   * Synchronously project the current AST to the DOM and restore the caret.
   *
   * Deliberately synchronous — no queued microtask. Input handlers call this
   * before returning, so by the time a keystroke is processed the DOM and caret
   * already reflect the transaction. That leaves no async window in which a
   * stale `selectionchange` (reading the not-yet-patched DOM) could clobber the
   * logical selection — the cause of the caret jumping between letters when
   * typing fast. `selectionchange` is suppressed for the duration.
   */
  #render() {
    const doc = this.engine.document();
    this.selection.suppress();
    this.patchDOM(doc);
    const sel = this.selection.active();
    if (sel) this.restoreDOMSelection(sel);
    this.selection.unsuppress();
    this.#lastRenderedDoc = doc;
  }

  private patchDOM(doc: ASTDocument) {
    const container = this.surface().nativeElement;

    doc.forEach((block, index) => {
      const behavior = this.engine.blocks.get(block.type);
      if (!behavior) return;

      const newHTML =
        behavior.category === 'container'
          ? this.renderContainerBlock(block, behavior)
          : behavior.renderHTML(block, this.renderInlineContent(block.content as any, !behavior.preserveWhitespace));
      const existingEl = container.children[index] as HTMLElement;

      if (!existingEl) {
        const el = this.#htmlToElement(newHTML);
        if (el) container.appendChild(el);
      } else if (existingEl.outerHTML !== newHTML) {
        const el = this.#htmlToElement(newHTML);
        if (el) existingEl.replaceWith(el);
      }
    });

    while (container.children.length > doc.length) container.lastElementChild?.remove();
  }

  /**
   * Parse a single block's HTML string into an element.
   *
   * Uses a `<div>` wrapper rather than `<template>` so it works under
   * server-side rendering too: Angular's SSR DOM (domino) has no
   * `<template>.content`, which made `patchDOM` crash during prerender. Every
   * block renders to one top-level element, so a `<div>` parses it faithfully in
   * both the browser and on the server.
   */
  #htmlToElement(html: string): Element | null {
    const wrapper = this.#document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }

  private renderInlineContent(nodes: ASTInlineNode[], softBreaks = true): string {
    // Use the shared mark-stack serializer so the live DOM matches astToHtml
    // exactly — overlapping marks (e.g. a highlight spanning bold) render as one
    // continuous, correctly-nested run instead of a fresh tag per node.
    return renderInlineHTML(nodes, this.engine.inlines, softBreaks);
  }

  private renderContainerBlock(block: ASTBlockNode, behavior: BaseBlockBehavior): string {
    const childrenHtml = (block.content as ASTBlockNode[])
      .map((child) => {
        const childBehavior = this.engine.blocks.get(child.type);
        if (!childBehavior) return '';
        const innerHtml = this.renderInlineContent(child.content as ASTInlineNode[], !childBehavior.preserveWhitespace);
        return childBehavior.renderHTML(child, innerHtml);
      })
      .join('');
    return behavior.renderHTML(block, childrenHtml);
  }

  /**
   * Character offset of a DOM caret `(node, offset)` within `root`, counting
   * each `<br>` as one character — soft line breaks are `\n` in the AST but
   * zero-width in the text-node stream, so a plain text walk would undercount.
   */
  #domCharOffset(root: Node, node: Node, offset: number): number {
    let chars = 0;
    let done = false;
    const visit = (n: Node) => {
      if (done) return;
      if (n === node) {
        if (n.nodeType === Node.TEXT_NODE) {
          chars += offset;
        } else {
          const kids = Array.from(n.childNodes);
          for (let i = 0; i < offset && i < kids.length; i++) chars += this.#nodeCharLen(kids[i]);
        }
        done = true;
        return;
      }
      if (n.nodeType === Node.TEXT_NODE) {
        chars += n.textContent?.length ?? 0;
      } else if (n.nodeName === 'BR') {
        if (!this.#isPadBreak(n)) chars += 1;
      } else {
        for (const kid of Array.from(n.childNodes)) {
          visit(kid);
          if (done) return;
        }
      }
    };
    visit(root);
    return chars;
  }

  /** A padding `<br>` (trailing-break caret shim) is zero-width, not a char. */
  #isPadBreak(n: Node): boolean {
    return n.nodeName === 'BR' && (n as HTMLElement).hasAttribute?.('data-sh-pad');
  }

  /** Character length of a DOM subtree (text length; each real `<br>` = 1). */
  #nodeCharLen(n: Node): number {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent?.length ?? 0;
    if (n.nodeName === 'BR') return this.#isPadBreak(n) ? 0 : 1;
    let sum = 0;
    for (const kid of Array.from(n.childNodes)) sum += this.#nodeCharLen(kid);
    return sum;
  }

  /**
   * Inverse of {@link #domCharOffset}: the DOM position for character offset
   * `target` within `root`. A caret adjacent to a `<br>` resolves to the
   * neighboring text node where possible, else an element position around the
   * break.
   */
  #domPosAtChar(root: HTMLElement, target: number): { node: Node; offset: number } {
    let chars = 0;
    let result: { node: Node; offset: number } | null = null;
    const visit = (n: Node) => {
      if (result) return;
      if (n.nodeType === Node.TEXT_NODE) {
        const len = n.textContent?.length ?? 0;
        if (chars + len >= target) result = { node: n, offset: target - chars };
        else chars += len;
      } else if (n.nodeName === 'BR') {
        if (this.#isPadBreak(n)) {
          // The empty line the pad shim creates: caret sits just before it
          // (after the real trailing break), start of the new visual line.
          if (target <= chars) {
            const parent = n.parentNode!;
            result = { node: parent, offset: Array.from(parent.childNodes).indexOf(n as ChildNode) };
          }
          return; // the shim itself consumes no characters
        }
        if (target <= chars) {
          const parent = n.parentNode!;
          result = { node: parent, offset: Array.from(parent.childNodes).indexOf(n as ChildNode) };
        } else {
          chars += 1; // caret after the br is handled by the following node (or the end fallback)
        }
      } else {
        for (const kid of Array.from(n.childNodes)) {
          visit(kid);
          if (result) return;
        }
      }
    };
    visit(root);
    return result ?? { node: root, offset: root.childNodes.length };
  }

  private mapDOMToLogical(container: HTMLElement, node: Node, offset: number): LogicalPosition | null {
    let blockEl: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    while (blockEl && blockEl.parentElement !== container) blockEl = blockEl.parentElement;
    if (!blockEl || blockEl.parentElement !== container) return null;

    const blockIndex = Array.from(container.children).indexOf(blockEl);
    const blockAst = this.engine.document()[blockIndex];
    if (!blockAst) return { blockIndex, inlineIndex: 0, offset: 0 };

    const behavior = this.engine.blocks.get(blockAst.type);

    if (behavior?.category === 'container') {
      let liEl: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      while (liEl && liEl.tagName.toLowerCase() !== 'li' && liEl !== blockEl) {
        liEl = liEl.parentElement;
      }

      let itemIndex = 0;
      let targetEl = blockEl;

      if (liEl && liEl.tagName.toLowerCase() === 'li') {
        const listItems = Array.from(blockEl.children).filter((c) => c.tagName.toLowerCase() === 'li');
        itemIndex = listItems.indexOf(liEl);
        if (itemIndex === -1) itemIndex = 0;
        else targetEl = liEl;
      }

      const charOffset = this.#domCharOffset(targetEl, node, offset);

      const itemAst = blockAst.content[itemIndex] as ASTBlockNode | undefined;
      if (!itemAst) return { blockIndex, itemIndex, inlineIndex: 0, offset: charOffset };

      let remaining = charOffset;
      for (let i = 0; i < itemAst.content.length; i++) {
        const inline = itemAst.content[i] as ASTInlineNode;
        if (remaining <= inline.text.length) return { blockIndex, itemIndex, inlineIndex: i, offset: remaining };
        remaining -= inline.text.length;
      }

      const lastIdx = Math.max(0, itemAst.content.length - 1);
      const lastInline = itemAst.content[lastIdx] as ASTInlineNode | undefined;
      return { blockIndex, itemIndex, inlineIndex: lastIdx, offset: lastInline ? lastInline.text.length : 0 };
    }

    const charOffset = this.#domCharOffset(blockEl, node, offset);

    let remaining = charOffset;
    for (let i = 0; i < blockAst.content.length; i++) {
      const inline = blockAst.content[i] as ASTInlineNode;
      if (remaining <= inline.text.length) return { blockIndex, inlineIndex: i, offset: remaining };
      remaining -= inline.text.length;
    }

    const lastIdx = Math.max(0, blockAst.content.length - 1);
    const lastInline = blockAst.content[lastIdx] as ASTInlineNode | undefined;
    return { blockIndex, inlineIndex: lastIdx, offset: lastInline ? lastInline.text.length : 0 };
  }

  private restoreDOMSelection(sel: LogicalSelection) {
    const container = this.surface().nativeElement;
    if (typeof window === 'undefined') return;

    try {
      const range = document.createRange();
      const getPos = (pos: LogicalPosition) => {
        const blockEl = container.children[pos.blockIndex];
        if (!blockEl) return null;

        const behavior = this.engine.blocks.get(this.engine.document()[pos.blockIndex]?.type);
        // A void block has no text caret; put the DOM selection ON the block so
        // it maps back to this void position, rather than leaving a stale caret
        // in some other block that a selectionchange would then sync to (which
        // would clear the void-block selection immediately after we set it).
        if (behavior?.category === 'void') return { node: blockEl, offset: 0 };

        const blockAst = this.engine.document()[pos.blockIndex];

        if (behavior?.category === 'container') {
          const itemIdx = pos.itemIndex ?? 0;
          const liEl = blockEl.children[itemIdx];
          if (!liEl) return { node: blockEl, offset: 0 };

          const itemAst = blockAst?.content[itemIdx] as ASTBlockNode | undefined;
          let targetChar = pos.offset;
          if (itemAst) {
            for (let i = 0; i < pos.inlineIndex; i++) {
              targetChar += (itemAst.content[i] as ASTInlineNode).text.length;
            }
          }

          return this.#domPosAtChar(liEl as HTMLElement, targetChar);
        } else {
          let targetChar = pos.offset;
          for (let i = 0; i < pos.inlineIndex; i++) targetChar += (blockAst?.content[i] as ASTInlineNode).text.length;

          if (behavior?.resolveDOMPosition && blockAst) {
            const result = behavior.resolveDOMPosition(blockEl as HTMLElement, blockAst, targetChar);
            if (result) return result;
          }

          return this.#domPosAtChar(blockEl as HTMLElement, targetChar);
        }
      };

      const start = getPos(sel.start);
      if (start) {
        // `#domPosAtChar` may return an element position (a caret around a
        // `<br>`), so honor the real offset rather than forcing 0.
        range.setStart(start.node, start.offset);

        if (sel.isCollapsed) range.collapse(true);
        else {
          const end = getPos(sel.end);
          if (end) range.setEnd(end.node, end.offset);
        }
        const domSel = window.getSelection();
        domSel?.removeAllRanges();
        domSel?.addRange(range);
      }
    } catch (e) {
      console.warn('[sh-editor] restoreDOMSelection failed:', e);
    }
  }
}
