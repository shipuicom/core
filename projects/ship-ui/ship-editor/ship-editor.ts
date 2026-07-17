import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  ElementRef,
  HostListener,
  ViewEncapsulation,
  afterNextRender,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { BaseBlockBehavior, BaseInlineBehavior, SlashCommand } from './editor-behaviors';
import { EditorEngineService } from './editor-engine.service';
import { SanitizeOption, normalizeDocument, sanitizeDocumentUrls } from './editor-sanitize';
import { htmlToAst, markdownToAst, parseDOMToAST, renderInlineHTML } from './editor-serializers';
import { ShipEditorContextualToolbar, ContextualActionExtras } from './sh-editor-contextual-toolbar';
import { ShipEditorImageResize } from './sh-editor-image-resize';
import { ShipEditorImagePopover } from './sh-editor-image-popover';
import { ShipEditorLinkPopover } from './sh-editor-link-popover';
import { ShipEditorSlashMenu } from './sh-editor-slash-menu';
import { ASTBlockNode, ASTDocument, ASTInlineNode, LogicalPosition, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as Behaviors from './standard-behaviors';

function blockPlainText(block: ASTBlockNode): string {
  const parts: string[] = [];
  const walk = (nodes: any[]) => {
    for (const n of nodes) {
      if (typeof n?.text === 'string') parts.push(n.text);
      else if (Array.isArray(n?.content)) {
        walk(n.content);
        parts.push('\n');
      }
    }
  };
  walk((block.content as any[]) ?? []);
  return parts.join('');
}

@Component({
  selector: 'sh-editor',
  standalone: true,
  exportAs: 'shEditor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,

  host: { '[class.document]': "variant() === 'document'" },
  imports: [ShipEditorLinkPopover, ShipEditorImagePopover, ShipEditorContextualToolbar, ShipEditorImageResize, ShipEditorSlashMenu],
  providers: [
    EditorEngineService,
    EditorSelectionService,
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ShipEditor), multi: true },
  ],
  templateUrl: './ship-editor.html',
  styleUrl: './ship-editor.scss',
})
export class ShipEditor implements ControlValueAccessor {
  #document = inject(DOCUMENT);
  surface = viewChild.required<ElementRef<HTMLElement>>('surface');

  readonly = input(false);
  format = input<'html' | 'json' | 'markdown'>('html');

  variant = input<'base' | 'document'>('base');

  behaviors = input<(BaseBlockBehavior | BaseInlineBehavior)[]>([]);

  sanitize = input<SanitizeOption>(true);

  contextualActions = input<ContextualActionExtras>({});

  slashCommands = input<SlashCommand[]>([]);

  slashMenu = viewChild(ShipEditorSlashMenu);

  imageUpload = input<((file: File) => Promise<string>) | null>(null);

  placeholder = input<string>('');

  showMetrics = input(false);

  imageEdgeResize = input(false);

  value = model<string | ASTDocument | null>(null);

  readonly viewMode = signal<'design' | 'code'>('design');

  readonly sourceDraft = signal('');

  public engine = inject(EditorEngineService);
  public selection = inject(EditorSelectionService);
  keybindings = inject(ShipA11yKeybindingsService, { optional: true });

  readonly #plainText = computed(() => this.engine.document().map(blockPlainText).join('\n'));
  readonly charCount = computed(() => this.#plainText().replace(/\n/g, '').length);
  readonly wordCount = computed(() => {
    const t = this.#plainText().trim();
    return t ? t.split(/\s+/).length : 0;
  });

  readonly showPlaceholder = computed(() => {
    if (!this.placeholder() || this.viewMode() === 'code') return false;
    const doc = this.engine.document();
    if (doc.length !== 1) return false;
    const only = doc[0];
    return this.engine.blocks.get(only.type)?.category !== 'void' && this.#plainText() === '';
  });

  #isWritingFromDOM = false;

  #composing = false;

  #lastRenderedDoc: ASTDocument | null = null;
  #isInternalValueUpdate = false;

  #viewReady = signal(false);

  #dragBlockIndex: number | null = null;

  readonly dropIndicator = signal<{ top: number } | null>(null);
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
      new Behaviors.StyleBehavior(),
    ].forEach((b) => this.engine.register(b));

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

      if (doc === this.#lastRenderedDoc) return;

      if (!this.#viewReady()) return;
      this.#render();
    });

    effect(() => {
      const idx = this.engine.selectedBlock();
      const doc = this.engine.document();
      if (!this.#viewReady()) return;
      const container = this.surface().nativeElement;
      container
        .querySelectorAll('.sh-editor-block-selected')
        .forEach((el) => el.classList.remove('sh-editor-block-selected'));
      if (idx === null) return;

      const block = doc[idx];
      if (!block || this.engine.blocks.get(block.type)?.category !== 'void') {
        this.engine.clearBlockSelection();
        return;
      }
      const el = container.children[idx] as HTMLElement | undefined;
      if (!el) return;
      el.classList.add('sh-editor-block-selected');
      this.#selectVoidBlockDOM(el);
    });

    afterNextRender(() => this.#viewReady.set(true));
  }

  toggleSourceView() {
    if (this.viewMode() === 'design') {
      const doc = this.engine.document();
      this.sourceDraft.set(this.format() === 'json' ? JSON.stringify(doc, null, 2) : String(this.engine.serialize(this.format())));
      this.viewMode.set('code');
    } else {
      const draft = this.sourceDraft();
      if (this.format() === 'json') {
        try {
          this.value.set(JSON.parse(draft));
        } catch {

        }
      } else {
        this.value.set(draft);
      }
      this.viewMode.set('design');
    }
  }

  onSourceInput(event: Event) {
    this.sourceDraft.set((event.target as HTMLTextAreaElement).value);
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

    if (this.engine.selectedBlock() !== null) {
      const domSel = window.getSelection();
      const collapsed = !domSel || domSel.rangeCount === 0 || domSel.getRangeAt(0).collapsed;
      const sel = this.selection.active();
      const block = sel && this.engine.document()[sel.start.blockIndex];
      if (collapsed && block && this.engine.blocks.get(block.type)?.category !== 'void') {
        this.engine.clearBlockSelection();
      }
    }
  }

  onSurfaceMouseDown(event: MouseEvent) {
    if (this.readonly()) return;
    const surface = this.surface().nativeElement;
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' && target.parentElement === surface) {
      const idx = Array.from(surface.children).indexOf(target);
      if (idx >= 0) {

        this.engine.selectBlock(idx);
        return;
      }
    }
    this.engine.clearBlockSelection();
  }

  onDragStart(event: DragEvent) {
    if (this.readonly()) return;
    const surface = this.surface().nativeElement;
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' && target.parentElement === surface) {
      const idx = Array.from(surface.children).indexOf(target);
      if (idx >= 0) {
        this.#dragBlockIndex = idx;
        this.engine.selectBlock(idx);
        event.dataTransfer?.setData('text/plain', '');
        if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        return;
      }
    }

    event.preventDefault();
  }

  onDragOver(event: DragEvent) {
    if (this.#dragBlockIndex === null) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    const target = this.#computeDropTarget(event.clientY);
    this.dropIndicator.set(target ? { top: target.top } : null);
  }

  onDrop(event: DragEvent) {
    if (this.#dragBlockIndex === null) return;
    event.preventDefault();
    const target = this.#computeDropTarget(event.clientY);
    const from = this.#dragBlockIndex;
    this.#dragBlockIndex = null;
    this.dropIndicator.set(null);
    if (target) {
      this.engine.moveBlock(from, target.gap);
      this.#render();
    }
  }

  onDragEnd() {
    this.#dragBlockIndex = null;
    this.dropIndicator.set(null);
  }

  onDragLeave(event: DragEvent) {

    const related = event.relatedTarget as Node | null;
    if (!related || !this.surface().nativeElement.contains(related)) this.dropIndicator.set(null);
  }

  #computeDropTarget(clientY: number): { gap: number; top: number } | null {
    const surface = this.surface().nativeElement;
    const body = surface.parentElement;
    if (!body) return null;
    const children = Array.from(surface.children) as HTMLElement[];
    if (!children.length) return null;
    const bodyTop = body.getBoundingClientRect().top;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return { gap: i, top: rect.top - bodyTop };
    }
    const last = children[children.length - 1].getBoundingClientRect();
    return { gap: children.length, top: last.bottom - bodyTop };
  }

  onBeforeInput(event: InputEvent) {
    if (this.readonly()) return;
    if (this.#composing) return;

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

    this.#syncLogicalSelectionFromDOM();

    const format: Record<string, string> = {
      formatBold: 'bold',
      formatItalic: 'italic',
      formatUnderline: 'underline',
      formatStrikeThrough: 'strike',
    };

    let mutated = true;

    switch (event.inputType) {
      case 'insertText':
      case 'insertReplacementText': {
        const data = event.data ?? '';
        event.preventDefault();
        if (!data) break;

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

        mutated = false;
        queueMicrotask(() => {
          if (this.#composing) return;
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

        event.preventDefault();
        mutated = false;
      }
    }

    if (mutated) this.#render();
  }

  onCompositionStart() {
    this.#composing = true;
  }

  onCompositionEnd() {
    this.#composing = false;

    this.#reconcileCaretBlockFromDOM();
  }

  #reconcileCaretBlockFromDOM() {
    const index = this.#currentBlockIndex();
    if (index >= 0) this.#reconcileBlockFromDOM(index);
    this.#syncLogicalSelectionFromDOM();
  }

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

    if (sel && !sel.isCollapsed) {
      this.engine.deleteRange();
      return;
    }

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

  #caretAtBlockEdge(idx: number, forward: boolean): boolean {
    if (typeof window === 'undefined') return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    const blockEl = this.surface().nativeElement.children[idx] as HTMLElement | undefined;
    if (!blockEl) return false;
    const clone = range.cloneRange();
    clone.selectNodeContents(blockEl);
    if (forward) clone.setStart(range.endContainer, range.endOffset);
    else clone.setEnd(range.startContainer, range.startOffset);
    return clone.toString().length === 0;
  }

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
    this.#isWritingFromDOM = true;

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
    if (this.#composing) return;

    const slash = this.slashMenu();
    if (slash?.isOpen()) {
      if (event.key === 'ArrowDown') return event.preventDefault(), slash.move(1);
      if (event.key === 'ArrowUp') return event.preventDefault(), slash.move(-1);
      if (event.key === 'Enter' || event.key === 'Tab') return event.preventDefault(), slash.confirm();
      if (event.key === 'Escape') return event.preventDefault(), slash.close();
    }

    const selectedIdx = this.engine.selectedBlock();
    if (selectedIdx !== null) {
      if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        this.engine.deleteSelectedBlock();
        this.#render();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.engine.clearBlockSelection();

        this.#placeCaretBesideBlock(selectedIdx);
        return;
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

    if (
      selectedIdx === null &&
      (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowUp')
    ) {
      const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
      const blockIdx = this.#currentBlockIndex();
      const targetIdx = forward ? blockIdx + 1 : blockIdx - 1;
      const targetBlock = blockIdx >= 0 ? this.engine.document()[targetIdx] : undefined;
      if (
        targetBlock &&
        this.engine.blocks.get(targetBlock.type)?.category === 'void' &&
        this.#caretAtBlockEdge(blockIdx, forward)
      ) {
        event.preventDefault();
        this.engine.selectBlock(targetIdx);
        return;
      }
    }

    if (this.keybindings) {

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

          return this.engine.dispatch(inline.type);
        }
      }
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      if (this.engine.handleEscapeHatch()) event.preventDefault();
      return;
    }
  }

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

  #htmlToElement(html: string): Element | null {
    const wrapper = this.#document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
  }

  private renderInlineContent(nodes: ASTInlineNode[], softBreaks = true): string {

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

  #isPadBreak(n: Node): boolean {
    return n.nodeName === 'BR' && (n as HTMLElement).hasAttribute?.('data-sh-pad');
  }

  #nodeCharLen(n: Node): number {
    if (n.nodeType === Node.TEXT_NODE) return n.textContent?.length ?? 0;
    if (n.nodeName === 'BR') return this.#isPadBreak(n) ? 0 : 1;
    let sum = 0;
    for (const kid of Array.from(n.childNodes)) sum += this.#nodeCharLen(kid);
    return sum;
  }

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

          if (target <= chars) {
            const parent = n.parentNode!;
            result = { node: parent, offset: Array.from(parent.childNodes).indexOf(n as ChildNode) };
          }
          return;
        }
        if (target <= chars) {
          const parent = n.parentNode!;
          result = { node: parent, offset: Array.from(parent.childNodes).indexOf(n as ChildNode) };
        } else {
          chars += 1;
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

  #placeCaretBesideBlock(idx: number) {
    const doc = this.engine.document();
    const editable = (i: number) =>
      i >= 0 && i < doc.length && this.engine.blocks.get(doc[i]?.type)?.category !== 'void';
    let pos: LogicalPosition | null = null;
    if (editable(idx + 1)) pos = { blockIndex: idx + 1, inlineIndex: 0, offset: 0 };
    else if (editable(idx - 1)) {
      const content = (doc[idx - 1].content ?? []) as ASTInlineNode[];
      const lastIdx = Math.max(0, content.length - 1);
      pos = { blockIndex: idx - 1, inlineIndex: lastIdx, offset: content[lastIdx]?.text.length ?? 0 };
    }
    if (!pos) return;
    this.selection.live.set({ start: pos, end: pos, isCollapsed: true });
    this.#render();
  }

  #selectVoidBlockDOM(el: HTMLElement) {
    if (typeof window === 'undefined') return;
    try {
      this.surface().nativeElement.focus({ preventScroll: true });
      const range = document.createRange();
      range.selectNode(el);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch (e) {
      console.warn('[sh-editor] void-block selection failed:', e);
    }
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

        if (behavior?.category === 'void') return null;

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
