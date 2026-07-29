import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
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
import { EditorEngineService, RenderHint } from './editor-engine.service';
import { SanitizeOption, normalizeDocument, sanitizeDocumentUrls } from './editor-sanitize';
import { RowKind } from './editor-columnar';
import { BlockPoint, blockPointAt, flatPosOfBlockChar, fragmentPlainText, pointAt, sliceDocument } from './editor-columnar-mutations';
import { BlockHeightMap } from './editor-viewport';
import { astToHtml, htmlToAst, markdownToAst, parseDOMToAST, renderInlineHTML } from './editor-serializers';
import { ShipEditorContextualToolbar, ContextualActionExtras } from './sh-editor-contextual-toolbar';
import { ShipEditorImageResize } from './sh-editor-image-resize';
import { ShipEditorImagePopover } from './sh-editor-image-popover';
import { ShipEditorLinkPopover } from './sh-editor-link-popover';
import { ShipEditorSlashMenu } from './sh-editor-slash-menu';
import { ASTDocument, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as Behaviors from './standard-behaviors';

/** A value the editor's metrics line can display. */
export type ShipEditorMetric = 'words' | 'characters' | 'blocks' | 'format';

/** `'auto'` virtualizes past this many top-level blocks. */
const VIRTUAL_AUTO_THRESHOLD = 1000;
/** Pixels of content kept mounted beyond each viewport edge. */
const VIRTUAL_OVERSCAN_PX = 600;
/** Height assumed for a block the DOM has never laid out. */
const VIRTUAL_DEFAULT_BLOCK_PX = 36;

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

  /** When `true`, the editor is view-only and rejects all input, deletion, and paste. */
  readonly = input(false);
  /** Serialization format of `value`: rich `html`, structured `json` AST, or `markdown`. */
  format = input<'html' | 'json' | 'markdown'>('html');

  /** Visual variant: compact `base` or full-width `document` styling. */
  variant = input<'base' | 'document'>('base');

  /** Additional block and inline behaviors to register alongside the built-in ones. */
  behaviors = input<(BaseBlockBehavior | BaseInlineBehavior)[]>([]);

  /** Controls URL/content sanitization applied to incoming and pasted content. */
  sanitize = input<SanitizeOption>(true);

  /** Extra actions to surface in the selection contextual toolbar. */
  contextualActions = input<ContextualActionExtras>({});

  /** Commands available in the `/` slash menu. */
  slashCommands = input<SlashCommand[]>([]);

  slashMenu = viewChild(ShipEditorSlashMenu);

  /** Optional async handler that uploads an image `File` and resolves to its URL. */
  imageUpload = input<((file: File) => Promise<string>) | null>(null);

  /** Placeholder text shown when the editor is empty. */
  placeholder = input<string>('');

  /** When `true`, displays the metrics line beneath the editor. */
  showMetrics = input(false);

  /**
   * Which metrics the line shows, in order. A metric left out is not displayed
   * and not calculated.
   */
  metrics = input<readonly ShipEditorMetric[]>(['words', 'characters', 'format']);

  /** When `true`, enables dragging image edges to resize them inline. */
  imageEdgeResize = input(false);

  /** Two-way bound editor content, serialized according to `format`. */
  value = model<string | ASTDocument | null>(null);

  /**
   * Viewport virtualization: only blocks in and around the visible viewport
   * exist in the DOM, with padding standing in for the rest. `'auto'` (the
   * default) switches it on past `VIRTUAL_AUTO_THRESHOLD` top-level blocks;
   * `true`/`false` force it.
   */
  virtualization = input<boolean | 'auto'>('auto');

  readonly viewMode = signal<'design' | 'code'>('design');

  readonly sourceDraft = signal('');

  public engine = inject(EditorEngineService);
  public selection = inject(EditorSelectionService);
  keybindings = inject(ShipA11yKeybindingsService, { optional: true });


  /**
   * Characters and words in one pass over the AST.
   *
   * Building the document as a string to measure it allocated the whole text,
   * then a second copy to strip newlines, then an array of every word. Nothing
   * here is read unless a metric that needs it is switched on, so a disabled
   * stat costs nothing.
   */
  readonly #counts = computed(() => {
    // Reads the columnar document rather than walking the AST: one string per
    // row, already flattened, instead of a recursive descent through inline
    // nodes. `version` is what changes on every edit, so it is the dependency.
    this.engine.version();
    const cd = this.engine.columnar;

    let characters = 0;
    let words = 0;

    for (let row = 0; row < cd.rows; row++) {
      const text = cd.textOf(row);
      let inWord = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        const isSpace = ch === ' ' || ch === '\n' || ch === '\t' || ch === '\r' || ch === '\f' || ch === '\v';
        if (ch !== '\n') characters++;
        if (isSpace) inWord = false;
        else if (!inWord) {
          inWord = true;
          words++;
        }
      }
    }
    return { characters, words };
  });

  readonly charCount = computed(() => this.#counts().characters);
  readonly wordCount = computed(() => this.#counts().words);
  /** Top-level blocks. Container rows hold their children, so only roots count. */
  readonly blockCount = computed(() => {
    this.engine.version();
    const cd = this.engine.columnar;
    let count = 0;
    for (let row = 0; row < cd.rows; row++) if (cd.parentOf(row) === -1) count++;
    return count;
  });

  /**
   * The stats line, assembled from only the metrics that are switched on.
   *
   * Each count is read inside its own branch, so a metric that is not listed is
   * never computed - on a large document that is the difference between walking
   * the whole AST per keystroke and doing nothing.
   */
  readonly metricsText = computed(() => {
    if (!this.showMetrics()) return '';
    const parts: string[] = [];
    // Follows the caller's order, and only reads the count it is about to show.
    for (const metric of this.metrics()) {
      if (metric === 'words') parts.push(`${this.wordCount()} words`);
      else if (metric === 'characters') parts.push(`${this.charCount()} characters`);
      else if (metric === 'blocks') parts.push(`${this.blockCount()} blocks`);
      else if (metric === 'format') parts.push(this.format().toUpperCase());
    }
    return parts.join(' · ');
  });

  /**
   * Count on demand rather than continuously.
   *
   * The signals above recompute whenever the document changes, which is every
   * keystroke. Leave `showMetrics` off and call this when a count is actually
   * wanted - on a button, on blur, when a panel opens - and the document is
   * walked once at that moment instead of on every key.
   */
  measure(): { words: number; characters: number; blocks: number } {
    const { words, characters } = this.#counts();
    return { words, characters, blocks: this.engine.blockCount() };
  }

  readonly showPlaceholder = computed(() => {
    if (!this.placeholder() || this.viewMode() === 'code') return false;
    this.engine.version();
    const cd = this.engine.columnar;
    if (this.engine.blockCount() !== 1) return false;
    if (this.engine.blocks.get(cd.typeOf(0))?.category === 'void') return false;
    for (let row = 0; row < cd.rows; row++) if (cd.textOf(row) !== '') return false;
    return true;
  });

  #isWritingFromDOM = false;

  #composing = false;

  #isInternalValueUpdate = false;

  #viewReady = signal(false);

  #dragBlockIndex: number | null = null;

  // -------------------------------------------------------------------------
  // Virtualization state. When active, the surface's children are blocks
  // [#winStart, #winEnd) and inline padding stands in for everything else.
  // When inactive, #winStart is 0 and #winEnd tracks the block count, so all
  // DOM↔block index translation below is uniform.
  // -------------------------------------------------------------------------

  #destroyRef = inject(DestroyRef);
  #virtualOn = false;
  #winStart = 0;
  #winEnd = 0;
  #heights: BlockHeightMap | null = null;
  #basePadTop = 0;
  #basePadBottom = 0;
  /** The scrollable ancestor, or null when the document itself scrolls. */
  #scrollerEl: HTMLElement | null = null;
  #scrollHooked = false;
  #scrollScheduled = false;
  /** A virtual select-all: the logical selection spans the whole document while the DOM shows the window. */
  #virtualSelectAll = false;

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
      this.engine.version();
      const format = this.format();
      const ready = this.#viewReady();
      // Everything below runs untracked: #render reads the live selection to
      // restore the DOM caret, and tracking it would re-render (and clobber
      // the DOM selection) on every selection change.
      untracked(() => {
        const serialized = this.engine.serialize(format);
        if (this.value() !== serialized) {
          this.#isInternalValueUpdate = true;
          this.value.set(serialized);
          this.onChange(serialized);
        }

        if (this.#isWritingFromDOM) {
          this.#isWritingFromDOM = false;
          return;
        }

        if (!ready) return;
        this.#render();
      });
    });

    effect(() => {
      const idx = this.engine.selectedBlock();
      this.engine.version();
      if (!this.#viewReady()) return;
      const container = this.surface().nativeElement;
      container.querySelectorAll('.sh-editor-block-selected').forEach((el) => {
        el.classList.remove('sh-editor-block-selected');
        // An emptied class attribute would make the element's outerHTML
        // diverge from the render cache and defeat its equality check.
        if (!el.className) el.removeAttribute('class');
      });
      if (idx === null) return;

      const cd = this.engine.columnar;
      const row = cd.rowOfTopLevel(idx);
      if (row >= cd.rows || this.engine.blocks.get(cd.typeOf(row))?.category !== 'void') {
        this.engine.clearBlockSelection();
        return;
      }
      const el = container.children[idx - this.#winStart] as HTMLElement | undefined;
      if (!el) return;
      el.classList.add('sh-editor-block-selected');
      this.#selectVoidBlockDOM(el);
    });

    // Voids inside the live selection range get a highlight the native
    // selection cannot paint.
    effect(() => {
      const sel = this.selection.active();
      this.engine.version();
      if (!this.#viewReady()) return;
      const container = this.surface().nativeElement;
      container.querySelectorAll('.sh-editor-void-in-selection').forEach((el) => {
        el.classList.remove('sh-editor-void-in-selection');
        if (!el.className) el.removeAttribute('class');
      });
      if (!sel || sel.from === sel.to) return;
      const cd = this.engine.columnar;
      let top = -1;
      for (let row = 0; row < cd.rows; row++) {
        if (cd.parentOf(row) !== -1) continue;
        top++;
        if (cd.kindOf(row) !== RowKind.Void) continue;
        const start = cd.startOf(row);
        if (sel.from <= start && start + 1 <= sel.to) {
          container.children[top - this.#winStart]?.classList.add('sh-editor-void-in-selection');
        }
      }
    });

    afterNextRender(() => this.#viewReady.set(true));

    this.#destroyRef.onDestroy(() => this.#unhookScroll());
  }

  /** Toggles between the design view and the raw source (code) view, syncing content in both directions. */
  toggleSourceView() {
    if (this.viewMode() === 'design') {
      this.sourceDraft.set(
        this.format() === 'json' ? JSON.stringify(this.engine.serialize('json'), null, 2) : String(this.engine.serialize(this.format()))
      );
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
      const cd = this.engine.columnar;
      const bp = sel && cd.rows ? blockPointAt(cd, sel.from) : null;
      const row = bp ? cd.rowOfTopLevel(bp.blockIndex) : cd.rows;
      if (collapsed && row < cd.rows && this.engine.blocks.get(cd.typeOf(row))?.category !== 'void') {
        this.engine.clearBlockSelection();
      }
    }
  }

  onSurfaceMouseDown(event: MouseEvent) {
    if (this.readonly()) return;
    const surface = this.surface().nativeElement;
    // Clicking any void block (image, hr, ...) selects it as a block — the
    // highlight is the affordance for copying, cutting, and pasting over it.
    let el: HTMLElement | null = event.target as HTMLElement;
    while (el && el.parentElement !== surface) el = el.parentElement;
    if (el && el.parentElement === surface) {
      const idx = this.#winStart + this.#indexInParent(el);
      const cd = this.engine.columnar;
      const row = cd.rowOfTopLevel(idx);
      if (row < cd.rows && this.engine.blocks.get(cd.typeOf(row))?.category === 'void') {
        this.engine.selectBlock(idx);
        return;
      }
    }
    this.engine.clearBlockSelection();
  }

  /** With a void block selected, copy serializes that block to the clipboard. */
  onCopy(event: ClipboardEvent) {
    const idx = this.engine.selectedBlock();
    if (idx !== null && event.clipboardData) {
      event.preventDefault();
      event.clipboardData.setData('text/html', this.engine.renderBlockHtml(idx));
      event.clipboardData.setData('text/plain', '');
      return;
    }
    this.#copyRangeFromModel(event, false);
  }

  onCut(event: ClipboardEvent) {
    if (this.readonly()) return;
    const idx = this.engine.selectedBlock();
    if (idx !== null && event.clipboardData) {
      event.preventDefault();
      event.clipboardData.setData('text/html', this.engine.renderBlockHtml(idx));
      event.clipboardData.setData('text/plain', '');
      this.engine.deleteSelectedBlock();
      this.#render();
      return;
    }
    this.#copyRangeFromModel(event, true);
  }

  /**
   * When the logical selection reaches beyond the mounted window, the native
   * copy of the partial DOM would silently truncate the clipboard — serialize
   * the selected span from the model instead. Fully mounted selections keep
   * the native path.
   */
  #copyRangeFromModel(event: ClipboardEvent, cut: boolean) {
    if (!this.#virtualOn || !event.clipboardData) return;
    const sel = this.selection.active();
    if (!sel || sel.from === sel.to) return;
    const cd = this.engine.columnar;
    if (!cd.rows) return;
    const from = Math.min(sel.from, sel.to);
    const to = Math.max(sel.from, sel.to);
    const first = blockPointAt(cd, from).blockIndex;
    const last = blockPointAt(cd, to).blockIndex;
    if (first >= this.#winStart && last < this.#winEnd) return;

    event.preventDefault();
    const fragment = sliceDocument(cd, { from, to });
    event.clipboardData.setData('text/html', astToHtml(fragment, this.engine.blocks, this.engine.inlines));
    event.clipboardData.setData('text/plain', fragmentPlainText(fragment));
    if (cut) {
      this.engine.deleteRange();
      this.#render();
    }
  }

  onDragStart(event: DragEvent) {
    if (this.readonly()) return;
    const surface = this.surface().nativeElement;
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG' && target.parentElement === surface) {
      const idx = this.#winStart + this.#indexInParent(target);
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
    // Indexed directly off the live collection: this runs on every dragover, so
    // materialising an array of every block per event is wasted allocation.
    const children = surface.children;
    if (!children.length) return null;
    const bodyTop = body.getBoundingClientRect().top;
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return { gap: this.#winStart + i, top: rect.top - bodyTop };
    }
    const last = children[children.length - 1].getBoundingClientRect();
    return { gap: this.#winStart + children.length, top: last.bottom - bodyTop };
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
    const start = this.mapDOMToPoint(container, tr.startContainer, tr.startOffset, 'start');
    const end = this.mapDOMToPoint(container, tr.endContainer, tr.endOffset, 'end');
    if (!start || !end || start.blockIndex !== end.blockIndex) return false;
    const cd = this.engine.columnar;
    this.selection.live.set({ from: flatPosOfBlockChar(cd, start), to: flatPosOfBlockChar(cd, end) });
    return true;
  }

  #handleDelete(event: InputEvent, direction: 'backward' | 'forward') {
    const sel = this.selection.active();

    if (sel && sel.from !== sel.to) {
      this.engine.deleteRange();
      return;
    }

    const tr = event.getTargetRanges?.()[0];
    if (tr) {
      const container = this.surface().nativeElement;
      const start = this.mapDOMToPoint(container, tr.startContainer, tr.startOffset, 'start');
      const end = this.mapDOMToPoint(container, tr.endContainer, tr.endOffset, 'end');
      if (start && end && start.blockIndex === end.blockIndex) {
        const cd = this.engine.columnar;
        const from = flatPosOfBlockChar(cd, start);
        const to = flatPosOfBlockChar(cd, end);
        if (from !== to) {
          this.selection.live.set({ from, to });
          this.engine.deleteRange();
          return;
        }
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
    return el && el.parentElement === container ? this.#winStart + this.#indexInParent(el) : -1;
  }

  #caretAtBlockEdge(idx: number, forward: boolean): boolean {
    if (typeof window === 'undefined') return false;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;
    const blockEl = this.surface().nativeElement.children[idx - this.#winStart] as HTMLElement | undefined;
    if (!blockEl) return false;
    const clone = range.cloneRange();
    clone.selectNodeContents(blockEl);
    if (forward) clone.setStart(range.endContainer, range.endOffset);
    else clone.setEnd(range.startContainer, range.startOffset);
    return clone.toString().length === 0;
  }

  #reconcileBlockFromDOM(index: number) {
    const container = this.surface().nativeElement;
    const blockEl = container.children[index - this.#winStart] as HTMLElement | undefined;
    if (!blockEl) return;
    const temp = this.#document.createElement('div');
    temp.appendChild(blockEl.cloneNode(true));
    const parsed = parseDOMToAST(temp, this.engine.blocks, this.engine.inlines);
    if (!parsed.length) return;
    this.#isWritingFromDOM = true;
    this.engine.replaceBlock(index, parsed[0]);
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
    if (this.#virtualSelectAll) {
      // The DOM can only show the mounted slice of a select-all; keep the
      // full-document logical selection until the user makes a new one.
      if (range.startContainer === container && range.endContainer === container) {
        this.selection.updateRect(container);
        return;
      }
      this.#virtualSelectAll = false;
    }
    this.selection.updateRect(container);
    const startPoint = this.mapDOMToPoint(container, range.startContainer, range.startOffset, 'start');
    const endPoint = range.collapsed
      ? startPoint
      : this.mapDOMToPoint(container, range.endContainer, range.endOffset, 'end');
    if (startPoint && endPoint) {
      const cd = this.engine.columnar;
      const from = flatPosOfBlockChar(cd, startPoint);
      this.selection.live.set({ from, to: range.collapsed ? from : flatPosOfBlockChar(cd, endPoint) });
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

    // Pasting into a whitespace-preserving block (code): code editors put
    // styled markup on the clipboard, and parsing that HTML collapses the
    // whitespace — line breaks and indentation vanish. The plain-text flavor
    // carries the code verbatim, so it goes in as literal text: one
    // transaction, range replacement and caret placement included.
    if (plainText && this.#pasteKeepsWhitespace()) {
      this.engine.insertText(plainText.replace(/\r\n?/g, '\n'));
      this.#render();
      return;
    }

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

    if (this.engine.selectedBlock() !== null) {
      this.engine.replaceSelectedBlock(fragment);
    } else {
      this.engine.insertFragment(fragment);
    }
    this.#render();
  }

  /**
   * True when the paste target is a single whitespace-preserving text block
   * (a code block): the caret — or the whole selection — sits inside one row
   * whose behavior declares `preserveWhitespace`. A selection reaching into
   * other blocks falls back to the fragment path.
   */
  #pasteKeepsWhitespace(): boolean {
    if (this.engine.selectedBlock() !== null) return false;
    const sel = this.selection.active();
    if (!sel) return false;
    const cd = this.engine.columnar;
    if (!cd.rows) return false;
    const a = pointAt(cd, Math.min(sel.from, sel.to));
    if (cd.kindOf(a.row) !== RowKind.Text) return false;
    if (sel.from !== sel.to && pointAt(cd, Math.max(sel.from, sel.to)).row !== a.row) return false;
    return this.engine.blocks.get(cd.typeOf(a.row))?.preserveWhitespace === true;
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
        const cd = this.engine.columnar;
        const targetIdx = before ? Math.max(0, selectedIdx - 1) : Math.min(this.engine.blockCount() - 1, selectedIdx + 1);
        this.engine.clearBlockSelection();
        const targetRow = cd.rowOfTopLevel(targetIdx);
        if (targetRow < cd.rows && this.engine.blocks.get(cd.typeOf(targetRow))?.category !== 'void') {
          const edge = before ? Number.MAX_SAFE_INTEGER : 0;
          const from = flatPosOfBlockChar(this.engine.columnar, { blockIndex: targetIdx, itemIndex: edge, charOffset: edge });
          this.selection.live.set({ from, to: from });
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
      const cd = this.engine.columnar;
      const targetRow = blockIdx >= 0 && targetIdx >= 0 ? cd.rowOfTopLevel(targetIdx) : cd.rows;
      if (
        targetRow < cd.rows &&
        this.engine.blocks.get(cd.typeOf(targetRow))?.category === 'void' &&
        this.#caretAtBlockEdge(blockIdx, forward)
      ) {
        event.preventDefault();
        this.engine.selectBlock(targetIdx);
        return;
      }
    }

    // Select-all in a virtualized document: the DOM holds only the window, so
    // the native selection cannot span the document. The logical selection
    // becomes the whole document; the DOM paints the mounted slice of it.
    if (
      this.#virtualOn &&
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      !event.shiftKey &&
      event.key.toLowerCase() === 'a'
    ) {
      event.preventDefault();
      this.selection.live.set({ from: 0, to: this.engine.columnar.size });
      this.#virtualSelectAll = true;
      const container = this.surface().nativeElement;
      const range = this.#document.createRange();
      range.selectNodeContents(container);
      const domSel = window.getSelection();
      domSel?.removeAllRanges();
      domSel?.addRange(range);
      return;
    }

    // Ordinary typing cannot match an editor shortcut — every one of them
    // requires ctrlOrCmd — so skip the ~20 keybinding parses this block performs
    // for each plain character. A bare single-character binding is excluded by
    // this, but such a binding would make that character untypable anyway.
    const isPlainTyping = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;

    if (this.keybindings && !isPlainTyping) {

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
    this.selection.suppress();
    this.patchDOM();
    const sel = this.selection.active();
    if (sel && this.#virtualOn && sel.from === sel.to) {
      this.#virtualSelectAll = false;
      this.#scrollCaretIntoView(sel.from);
    }
    if (sel) this.restoreDOMSelection(sel);
    this.selection.unsuppress();
  }

  /**
   * Replay the engine's render hints against the DOM.
   *
   * An inline op re-renders exactly one element; a structural op is a DOM
   * splice — remove the replaced elements, insert the new ones, and the
   * suffix shifts in place without being touched. Anything unexpected falls
   * back to a full reconciliation pass.
   */
  private patchDOM() {
    const container = this.surface().nativeElement;
    const hints = this.engine.consumeRenderHints();
    const count = this.engine.blockCount();

    const wantVirtual = this.#shouldVirtualize(count);
    if (wantVirtual !== this.#virtualOn) {
      this.#virtualOn = wantVirtual;
      if (wantVirtual) this.#activateVirtual(container);
      else this.#deactivateVirtual(container);
      // Either direction, the DOM must be rebuilt from scratch.
      hints.length = 0;
      hints.push({ kind: 'all' });
    }

    if (this.#virtualOn) {
      this.#patchVirtual(container, hints, count);
      return;
    }
    this.#winEnd = count;

    let full = false;
    for (const hint of hints) {
      if (hint.kind === 'all') {
        full = true;
        break;
      }
      if (hint.kind === 'block') {
        const el = container.children[hint.index] as HTMLElement | undefined;
        if (!el) {
          full = true;
          break;
        }
        const html = this.engine.renderBlockHtml(hint.index);
        if (el.outerHTML !== html) {
          const next = this.#htmlToElement(html);
          // Prefer patching text data into the existing nodes: replacing the
          // caret's element forces the browser to re-canonicalize the
          // selection over the whole editing host, which measured ~15ms per
          // keystroke at 10k blocks. A character-data change keeps layout
          // incremental and the caret's text node alive.
          if (next && !this.#patchTextInPlace(el, next)) el.replaceWith(next);
          else if (!next) full = true;
        }
      } else {
        for (let i = 0; i < hint.remove; i++) container.children[hint.at]?.remove();
        const before = container.children[hint.at] ?? null;
        for (let i = 0; i < hint.insert; i++) {
          const next = this.#htmlToElement(this.engine.renderBlockHtml(hint.at + i));
          if (next) container.insertBefore(next, before);
          else full = true;
        }
      }
      if (full) break;
    }

    if (full || container.children.length !== count) {
      for (let i = 0; i < count; i++) {
        const el = container.children[i] as HTMLElement | undefined;
        const html = this.engine.renderBlockHtml(i);
        if (!el) {
          const next = this.#htmlToElement(html);
          if (next) container.appendChild(next);
        } else if (el.outerHTML !== html) {
          const next = this.#htmlToElement(html);
          if (next) el.replaceWith(next);
        }
      }
      while (container.children.length > count) container.lastElementChild?.remove();
    }
  }

  // -------------------------------------------------------------------------
  // Virtualization: the windowed render path.
  // -------------------------------------------------------------------------

  #shouldVirtualize(count: number): boolean {
    if (typeof window === 'undefined') return false;
    const mode = this.virtualization();
    return mode === true || (mode === 'auto' && count > VIRTUAL_AUTO_THRESHOLD);
  }

  #activateVirtual(container: HTMLElement) {
    const style = getComputedStyle(container);
    this.#basePadTop = parseFloat(style.paddingTop) || 0;
    this.#basePadBottom = parseFloat(style.paddingBottom) || 0;
    this.#scrollerEl = this.#findScrollContainer(container);
    // Window splices swap spacer padding for real blocks above the viewport.
    // The browser's scroll anchoring reads that as content movement and
    // "corrects" scrollTop, which re-triggers an update at the new position —
    // a permanent oscillation. Anchoring is ours to manage here.
    container.style.overflowAnchor = 'none';
    this.#heights = null;
    if (!this.#scrollHooked) {
      (this.#scrollerEl ?? window).addEventListener('scroll', this.#onViewportChange, { passive: true });
      window.addEventListener('resize', this.#onViewportChange, { passive: true });
      this.#scrollHooked = true;
    }
  }

  #deactivateVirtual(container: HTMLElement) {
    this.#unhookScroll();
    container.style.paddingTop = '';
    container.style.paddingBottom = '';
    container.style.overflowAnchor = '';
    this.#heights = null;
    this.#winStart = 0;
    this.#winEnd = 0;
    this.#virtualSelectAll = false;
  }

  #unhookScroll() {
    if (!this.#scrollHooked) return;
    (this.#scrollerEl ?? window).removeEventListener('scroll', this.#onViewportChange);
    window.removeEventListener('resize', this.#onViewportChange);
    this.#scrollHooked = false;
  }

  #findScrollContainer(el: HTMLElement): HTMLElement | null {
    for (let node = el.parentElement; node; node = node.parentElement) {
      const overflowY = getComputedStyle(node).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') return node;
    }
    return null;
  }

  readonly #onViewportChange = () => {
    if (this.#scrollScheduled || !this.#virtualOn) return;
    this.#scrollScheduled = true;
    requestAnimationFrame(() => {
      this.#scrollScheduled = false;
      if (!this.#virtualOn || !this.#viewReady()) return;
      this.#updateVirtualWindow(false);
    });
  };

  /** The viewport's edges in client coordinates. */
  #viewportEdges(): { top: number; bottom: number } {
    if (this.#scrollerEl) {
      const rect = this.#scrollerEl.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    }
    return { top: 0, bottom: window.innerHeight };
  }

  #adjustScroll(delta: number) {
    if (delta === 0) return;
    const el = this.#scrollerEl ?? (this.#document.scrollingElement as HTMLElement | null);
    if (el) el.scrollTop += delta;
  }

  #patchVirtual(container: HTMLElement, hints: RenderHint[], count: number) {
    let structural = false;
    let rebuildHeights = this.#heights === null;
    for (const hint of hints) {
      if (hint.kind === 'all') {
        structural = true;
        rebuildHeights = true;
      } else if (hint.kind === 'splice') {
        structural = true;
        if (!rebuildHeights) this.#heights!.splice(hint.at, hint.remove, hint.insert);
      }
    }
    if (rebuildHeights || this.#heights!.count !== count) {
      this.#heights = new BlockHeightMap(count, this.#heights?.estimate ?? VIRTUAL_DEFAULT_BLOCK_PX);
      structural = true;
    }
    if (structural) this.#virtualSelectAll = false;

    if (!structural) {
      for (const hint of hints) {
        if (hint.kind !== 'block') continue;
        if (hint.index < this.#winStart || hint.index >= this.#winEnd) continue;
        const el = container.children[hint.index - this.#winStart] as HTMLElement | undefined;
        if (!el) {
          structural = true;
          break;
        }
        const html = this.engine.renderBlockHtml(hint.index);
        if (el.outerHTML !== html) {
          const next = this.#htmlToElement(html);
          if (next && !this.#patchTextInPlace(el, next)) el.replaceWith(next);
          else if (!next) structural = true;
        }
      }
    }

    this.#updateVirtualWindow(structural);
  }

  /**
   * Bring the DOM window in line with the scroll viewport.
   *
   * `force` rebuilds the whole window from the model (structural edits, mode
   * flips); otherwise the window's edges are spliced — surviving children,
   * including the caret's element, are never touched. After reconciliation
   * the mounted run is measured (offsetTop deltas, so margins and collapse
   * are inside the numbers) and the paddings are recomputed.
   */
  #updateVirtualWindow(force: boolean) {
    const container = this.surface().nativeElement;
    const heights = this.#heights;
    const count = this.engine.blockCount();
    if (!heights) return;

    if (count === 0) {
      container.replaceChildren();
      this.#setVirtualPadding(container, 0, 0);
      this.#winStart = this.#winEnd = 0;
      return;
    }

    // Block 0's theoretical top in client coordinates: the current inline
    // padding already contains prefix(#winStart), so the base padding alone
    // offsets from the surface's border box.
    const origin = container.getBoundingClientRect().top + this.#basePadTop;
    const { top: vpTop, bottom: vpBottom } = this.#viewportEdges();
    const ds = heights.indexAt(vpTop - VIRTUAL_OVERSCAN_PX - origin);
    const de = Math.min(count, heights.indexAt(vpBottom + VIRTUAL_OVERSCAN_PX - origin) + 1);

    const prevStart = this.#winStart;
    const overlapStart = Math.max(ds, prevStart);
    const overlapEnd = Math.min(de, this.#winEnd);
    const mismatch = container.children.length !== this.#winEnd - prevStart;

    const renderRange = (from: number, to: number): DocumentFragment => {
      const fragment = this.#document.createDocumentFragment();
      for (let i = from; i < to; i++) {
        const el = this.#htmlToElement(this.engine.renderBlockHtml(i));
        if (el) fragment.appendChild(el);
      }
      return fragment;
    };

    const rebuilt = force || mismatch || overlapEnd <= overlapStart;
    if (rebuilt) {
      container.replaceChildren(renderRange(ds, de));
    } else if (ds !== prevStart || de !== this.#winEnd) {
      this.#dropDOMSelectionIfUnmounting(container, ds, de);
      for (let i = prevStart; i < overlapStart; i++) container.firstElementChild?.remove();
      for (let i = overlapEnd; i < this.#winEnd; i++) container.lastElementChild?.remove();
      if (ds < overlapStart) container.insertBefore(renderRange(ds, overlapStart), container.firstChild);
      if (de > overlapEnd) container.appendChild(renderRange(overlapEnd, de));
    }

    this.#winStart = ds;
    this.#winEnd = de;

    // Anchor: when blocks are prepended, their estimate→measured correction
    // must not shift the content the user is looking at.
    const anchorPrefixBefore = rebuilt ? 0 : heights.prefixHeight(overlapStart);
    const children = container.children;
    for (let k = 0; k < children.length; k++) {
      const el = children[k] as HTMLElement;
      const next = children[k + 1] as HTMLElement | undefined;
      const height = next ? next.offsetTop - el.offsetTop : el.offsetHeight;
      if (height > 0) heights.measure(ds + k, height);
    }
    this.#setVirtualPadding(container, heights.prefixHeight(ds), heights.total() - heights.prefixHeight(de));
    if (!rebuilt && ds < prevStart) {
      // Sub-pixel drift must not feed back into the scroll position: an
      // adjustment fires a scroll event, which schedules another update.
      const shift = heights.prefixHeight(overlapStart) - anchorPrefixBefore;
      if (Math.abs(shift) >= 1) this.#adjustScroll(shift);
    }
  }

  #setVirtualPadding(container: HTMLElement, top: number, bottom: number) {
    container.style.paddingTop = `${this.#basePadTop + Math.max(0, top)}px`;
    container.style.paddingBottom = `${this.#basePadBottom + Math.max(0, bottom)}px`;
  }

  /**
   * Removing an element holding a DOM selection endpoint makes the browser
   * re-anchor the selection at the container, which the selectionchange sync
   * would read as a real caret move. The logical selection is the source of
   * truth here — drop the DOM one before pulling its nodes out.
   */
  #dropDOMSelectionIfUnmounting(container: HTMLElement, ds: number, de: number) {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;
    const staysMounted = (node: Node): boolean => {
      let el: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
      while (el && el !== container && el.parentElement !== container) el = el.parentElement;
      if (!el || el === container) return true; // container-anchored — survives
      const index = this.#winStart + this.#indexInParent(el);
      return index >= ds && index < de;
    };
    if (!staysMounted(range.startContainer) || !staysMounted(range.endContainer)) sel.removeAllRanges();
  }

  /**
   * Keep the caret's block inside the viewport after an edit: without this,
   * typing at the window's edge (or undo jumping far away) would leave the
   * caret in an unmounted — hence invisible — block.
   */
  #scrollCaretIntoView(pos: number) {
    const heights = this.#heights;
    const cd = this.engine.columnar;
    if (!heights || !cd.rows) return;
    const { blockIndex } = blockPointAt(cd, pos);
    const container = this.surface().nativeElement;
    const origin = container.getBoundingClientRect().top + this.#basePadTop;
    const top = origin + heights.prefixHeight(blockIndex);
    const bottom = top + heights.heightOf(blockIndex);
    const { top: vpTop, bottom: vpBottom } = this.#viewportEdges();
    let delta = 0;
    if (top < vpTop) delta = top - vpTop;
    else if (bottom > vpBottom) delta = Math.min(bottom - vpBottom, top - vpTop);
    if (delta !== 0) {
      this.#adjustScroll(delta);
      this.#updateVirtualWindow(false);
    } else if (blockIndex < this.#winStart || blockIndex >= this.#winEnd) {
      this.#updateVirtualWindow(false);
    }
  }

  /**
   * If `el` and `next` have identical element structure and attributes and
   * differ only in text data, copy the text into `el`'s existing nodes and
   * report true. Any structural difference reports false, and the caller
   * replaces the element wholesale.
   */
  #patchTextInPlace(el: Element, next: Element): boolean {
    const sameShape = (a: Node, b: Node): boolean => {
      if (a.nodeType !== b.nodeType) return false;
      if (a.nodeType === Node.ELEMENT_NODE) {
        const ea = a as Element;
        const eb = b as Element;
        if (ea.tagName !== eb.tagName || ea.attributes.length !== eb.attributes.length) return false;
        for (const attr of Array.from(eb.attributes)) {
          if (ea.getAttribute(attr.name) !== attr.value) return false;
        }
        if (a.childNodes.length !== b.childNodes.length) return false;
        for (let i = 0; i < a.childNodes.length; i++) {
          if (!sameShape(a.childNodes[i], b.childNodes[i])) return false;
        }
      }
      return true;
    };
    if (!sameShape(el, next)) return false;

    const copyText = (a: Node, b: Node) => {
      if (a.nodeType === Node.TEXT_NODE) {
        if (a.textContent !== b.textContent) a.textContent = b.textContent;
        return;
      }
      for (let i = 0; i < a.childNodes.length; i++) copyText(a.childNodes[i], b.childNodes[i]);
    };
    copyText(el, next);
    return true;
  }

  #htmlToElement(html: string): Element | null {
    const wrapper = this.#document.createElement('div');
    wrapper.innerHTML = html;
    return wrapper.firstElementChild;
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

  /**
   * Index of a direct child within its parent.
   *
   * Deliberately a sibling walk rather than `Array.from(parent.children).indexOf`:
   * the array version materialises every block on every call, which costs the
   * same whether the caret is in the first block or the last. On a 1000-block
   * document that measured ~0.093 ms per call against 0.016 ms worst case and
   * 0.00005 ms near the top for the walk — and this runs on every selection
   * change, twice when the selection is not collapsed.
   */
  #indexInParent(el: Element): number {
    let index = 0;
    for (let sibling = el.previousElementSibling; sibling; sibling = sibling.previousElementSibling) index++;
    return index;
  }

  /**
   * DOM node/offset → block, item, character. The DOM genuinely has that
   * shape, so this is the one place positions are tree-shaped; the result is
   * converted to a flat position by `flatPosOfBlockChar` at every call site.
   *
   * A boundary can sit on the container itself — Cmd+A anchors the range at
   * `(surface, 0)..(surface, childCount)`, and dragging past the last line
   * ends there too. That offset counts blocks, not characters, and which
   * block it means depends on which end is being mapped: as a start it is the
   * beginning of block `offset`, as an end it is the end of block
   * `offset - 1`. Returning null here left the live selection stale, so
   * pasting over a select-all landed at the old caret.
   */
  private mapDOMToPoint(container: HTMLElement, node: Node, offset: number, bias: 'start' | 'end'): BlockPoint | null {
    if (node === container) {
      const count = this.engine.blockCount();
      if (count === 0) return null;
      // `offset` counts DOM children — window-relative when virtualized.
      const winEnd = this.#virtualOn ? this.#winEnd : count;
      if (bias === 'end' && offset > 0) {
        const edge = Number.MAX_SAFE_INTEGER;
        return { blockIndex: Math.min(this.#winStart + offset, winEnd) - 1, itemIndex: edge, charOffset: edge };
      }
      return { blockIndex: Math.min(this.#winStart + offset, winEnd - 1), charOffset: 0 };
    }

    let blockEl: HTMLElement | null = node.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node.parentElement;
    while (blockEl && blockEl.parentElement !== container) blockEl = blockEl.parentElement;
    if (!blockEl || blockEl.parentElement !== container) return null;

    const blockIndex = this.#winStart + this.#indexInParent(blockEl);
    const cd = this.engine.columnar;
    const root = cd.rowOfTopLevel(blockIndex);
    if (root >= cd.rows) return { blockIndex, charOffset: 0 };

    if (cd.kindOf(root) === RowKind.Container) {
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

      return { blockIndex, itemIndex, charOffset: this.#domCharOffset(targetEl, node, offset) };
    }

    return { blockIndex, charOffset: this.#domCharOffset(blockEl, node, offset) };
  }

  #placeCaretBesideBlock(idx: number) {
    const cd = this.engine.columnar;
    const count = this.engine.blockCount();
    const editable = (i: number) =>
      i >= 0 && i < count && this.engine.blocks.get(cd.typeOf(cd.rowOfTopLevel(i)))?.category !== 'void';
    let from: number | null = null;
    if (editable(idx + 1)) from = flatPosOfBlockChar(cd, { blockIndex: idx + 1, charOffset: 0 });
    else if (editable(idx - 1)) {
      const edge = Number.MAX_SAFE_INTEGER;
      from = flatPosOfBlockChar(cd, { blockIndex: idx - 1, itemIndex: edge, charOffset: edge });
    }
    if (from === null) return;
    this.selection.live.set({ from, to: from });
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

    // The DOM is tree-shaped, so the flat selection is translated back to
    // block/item/character here — the one place that needs the shape.
    const cd = this.engine.columnar;
    if (!cd.rows) return;
    const isCollapsed = sel.from === sel.to;
    let startBp = blockPointAt(cd, sel.from);
    let endBp = isCollapsed ? startBp : blockPointAt(cd, sel.to);

    if (this.#virtualOn) {
      if (isCollapsed) {
        // An off-window caret has no element to sit in; the logical selection
        // stays authoritative and the DOM selection is simply not painted.
        if (startBp.blockIndex < this.#winStart || startBp.blockIndex >= this.#winEnd) return;
      } else {
        const start = this.#clampToWindow(startBp, 'start');
        const end = this.#clampToWindow(endBp, 'end');
        if (!start || !end) return;
        startBp = start;
        endBp = end;
      }
    }

    try {
      const range = document.createRange();
      const getPos = (bp: BlockPoint) => {
        const blockEl = container.children[bp.blockIndex - this.#winStart];
        if (!blockEl) return null;

        const row = cd.rowOfTopLevel(bp.blockIndex);
        const behavior = row < cd.rows ? this.engine.blocks.get(cd.typeOf(row)) : undefined;

        if (behavior?.category === 'void') return null;

        if (behavior?.category === 'container') {
          const liEl = blockEl.children[bp.itemIndex ?? 0];
          if (!liEl) return { node: blockEl, offset: 0 };
          return this.#domPosAtChar(liEl as HTMLElement, bp.charOffset);
        }

        if (behavior?.resolveDOMPosition) {
          const blockAst = this.engine.blockAt(bp.blockIndex);
          const result = blockAst ? behavior.resolveDOMPosition(blockEl as HTMLElement, blockAst, bp.charOffset) : null;
          if (result) return result;
        }

        return this.#domPosAtChar(blockEl as HTMLElement, bp.charOffset);
      };

      const start = getPos(startBp);
      if (start) {

        range.setStart(start.node, start.offset);

        if (isCollapsed) range.collapse(true);
        else {
          const end = getPos(endBp);
          if (end) range.setEnd(end.node, end.offset);
        }
        const domSel = window.getSelection();
        // addRange re-canonicalizes the selection over the whole editing
        // host; skip it when the DOM selection already matches.
        if (
          domSel &&
          domSel.rangeCount === 1 &&
          domSel.anchorNode === range.startContainer &&
          domSel.anchorOffset === range.startOffset &&
          domSel.focusNode === range.endContainer &&
          domSel.focusOffset === range.endOffset
        ) {
          return;
        }
        domSel?.removeAllRanges();
        domSel?.addRange(range);
      }
    } catch (e) {
      console.warn('[sh-editor] restoreDOMSelection failed:', e);
    }
  }

  /**
   * Clamp a range endpoint to the mounted window so the visible part of a
   * selection spanning off-window content still paints. Returns null when the
   * whole selection lies outside the window.
   */
  #clampToWindow(bp: BlockPoint, edge: 'start' | 'end'): BlockPoint | null {
    if (this.#winEnd <= this.#winStart) return null;
    if (bp.blockIndex < this.#winStart) {
      return edge === 'start' ? { blockIndex: this.#winStart, charOffset: 0 } : null;
    }
    if (bp.blockIndex >= this.#winEnd) {
      const max = Number.MAX_SAFE_INTEGER;
      return edge === 'end' ? { blockIndex: this.#winEnd - 1, itemIndex: max, charOffset: max } : null;
    }
    return bp;
  }
}
