import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  Injector,
  ViewEncapsulation,
  WritableSignal,
  afterNextRender,
  computed,
  createComponent,
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
import { BlockHeightMap } from '@ship-ui/core/ship-virtual-scroll';
import { alignStyledCode, astToHtml, dedentPastedCode, htmlToAst, markdownToAst, parseDOMToAST, renderInlineHTML } from './editor-serializers';
import { ShipEditorContextualToolbar, ContextualActionExtras } from './sh-editor-contextual-toolbar';
import { ShipEditorImageResize } from './sh-editor-image-resize';
import { ShipEditorImagePopover } from './sh-editor-image-popover';
import { ShipEditorLinkPopover } from './sh-editor-link-popover';
import { ShipEditorSlashMenu } from './sh-editor-slash-menu';
import { BaseComponentBlockBehavior, SHIP_EDITOR_BLOCK_CONTEXT, ShipEditorBlockContext } from './sh-editor-component-block';
import { ASTDocument, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import { logicalRangesInSpan, normalizeLogical } from './editor-multi-selection';
import * as Behaviors from './standard-behaviors';

/** A value the editor's metrics line can display. */
export type ShipEditorMetric = 'words' | 'characters' | 'blocks' | 'format';

/** `'auto'` virtualizes past this many top-level blocks. */
const VIRTUAL_AUTO_THRESHOLD = 1000;
/** Pixels of content kept mounted beyond each viewport edge. */
const VIRTUAL_OVERSCAN_PX = 600;
/** Height assumed for a block the DOM has never laid out. */
const VIRTUAL_DEFAULT_BLOCK_PX = 36;

/** CSS highlight registry name for secondary (non-native) selection ranges. */
const SECONDARY_HIGHLIGHT = 'sh-editor-secondary';

/** Keys that only arm a chord — pressing one is not an interaction with the document. */
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']);

/** Keys that move the single native caret, ending multi-cursor mode. */
const NAVIGATION_KEYS = new Set([
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown',
]);

/** Elements whose clicks belong to a component block, never to fall-through selection. */
const INTERACTIVE_TAGS = new Set([
  'a', 'button', 'input', 'textarea', 'select', 'option', 'label', 'summary', 'details',
  'video', 'audio', 'iframe', 'embed', 'object', 'canvas',
]);
const INTERACTIVE_ROLES = new Set([
  'button', 'link', 'checkbox', 'radio', 'textbox', 'searchbox', 'combobox', 'listbox', 'option',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'slider', 'switch', 'tab', 'spinbutton',
]);

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
  /**
   * Alt+click to open a second cursor, editing every cursor as one undo step.
   *
   * Off by default. A rich-text surface is not where people reach for multiple
   * cursors, and only the primary one is the browser's own — the rest are
   * painted by the editor, so they miss the native affordances (a blinking
   * caret of the platform's shape, IME, spellcheck) that this surface is
   * otherwise careful to keep. Opt in where the document is structured enough
   * to want it.
   */
  multiCursor = input(false);
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
  /**
   * False while the logical selection has no DOM counterpart because its
   * block sits outside the mounted window.
   *
   * Blink invents a selection at the top of the editing host when an edit
   * arrives at a focused contenteditable that has none — so the DOM selection
   * in this state is not the user's and must never be adopted. `true` in every
   * other case, including a plain unfocused editor, so the ordinary sync path
   * is untouched.
   */
  #domSelectionPainted = true;

  /** The element the last render targeted; a different one means the view was re-created. */
  #lastSurface: HTMLElement | null = null;

  // -------------------------------------------------------------------------
  // Custom component blocks: live Angular components mounted inside void-block
  // wrapper elements. Keyed by the wrapper, so the render pipeline can keep a
  // wrapper (and the component's state) alive across patches and destroy the
  // component the moment its wrapper leaves the DOM.
  // -------------------------------------------------------------------------

  #appRef = inject(ApplicationRef);
  #envInjector = inject(EnvironmentInjector);
  #injector = inject(Injector);

  #componentBlocks = new Map<
    HTMLElement,
    {
      ref: ComponentRef<unknown>;
      type: string;
      index: WritableSignal<number>;
      attrs: WritableSignal<Record<string, unknown>>;
      /** The wrapper's data-sh-attrs at last sync — change detector for the attrs signal. */
      lastAttrsJson: string;
    }
  >();

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
      // Also track the surface element itself: an in-place view re-creation
      // (dev HMR swapping the template) replaces it with a fresh, empty
      // element without any model change — the element's identity is the
      // only signal that anything happened.
      if (ready) this.surface();
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

    // The extra cursors are ours to paint, and nothing else will: the browser
    // fires no event for them, so a change to the set has to repaint itself.
    // Switching multi-cursor off mid-session drops them rather than stranding
    // them somewhere the user can no longer reach.
    effect(() => {
      const enabled = this.multiCursor();
      this.selection.secondary();
      untracked(() => {
        // Repaint either way: switching off has to take the drawn carets and
        // the highlight down with the cursors, or they linger next to the
        // restored native caret.
        if (!enabled) this.selection.clearSecondary();
        if (this.#viewReady()) this.#paintSecondaryCursors();
      });
    });

    // Any selection move rewinds the shared blink clock, so the carets are
    // solid the instant they land and a cursor opened mid-cycle starts in the
    // same phase as the rest.
    effect(() => {
      this.selection.live();
      this.selection.secondary();
      untracked(() => {
        if (this.#viewReady()) this.#restartCaretBlink();
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

    this.#destroyRef.onDestroy(() => {
      this.#unhookScroll();
      for (const entry of this.#componentBlocks.values()) entry.ref.destroy();
      this.#componentBlocks.clear();
    });
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
    // A click always establishes a real DOM selection, so the sync path can
    // trust the DOM again even if a window move had unmounted the old caret.
    this.#domSelectionPainted = true;
    // A new gesture retires any under-painted selection left by a drag that
    // ended on a component block.
    this.#voidPaint = null;
    // Alt+click opens another cursor: the current primary is demoted to a
    // secondary and the click below establishes the new primary. A plain click
    // is a fresh single selection.
    if (event.altKey && this.multiCursor()) {
      const primary = this.selection.active();
      if (primary) this.selection.secondary.update((rest) => normalizeLogical([...rest, primary]));
    } else {
      this.selection.clearSecondary();
    }
    if (this.readonly()) return;
    this.#selectionDragAnchor = null;
    this.#selectionDragOverVoid = null;
    const surface = this.surface().nativeElement;
    // Clicking any void block (image, hr, ...) selects it as a block — the
    // highlight is the affordance for copying, cutting, and pasting over it.
    let el: HTMLElement | null = event.target as HTMLElement;
    while (el && el.parentElement !== surface) el = el.parentElement;
    if (el && el.parentElement === surface) {
      // Component blocks are interactive — clicks pass through to the
      // component instead of selecting the block. Selection happens via
      // keyboard navigation or the component calling its context's select().
      if (this.#componentBehaviorFor(el)) {
        this.engine.clearBlockSelection();
        return;
      }
      const idx = this.#winStart + this.#indexInParent(el);
      const cd = this.engine.columnar;
      const row = cd.rowOfTopLevel(idx);
      if (row < cd.rows && this.engine.blocks.get(cd.typeOf(row))?.category === 'void') {
        this.engine.selectBlock(idx);
        return;
      }
    }
    this.engine.clearBlockSelection();
    // A drag-selection may be starting: remember its anchor so the moving end
    // can be clamped when the pointer crosses a component block.
    if (event.button === 0) {
      const doc = this.#document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null };
      const range = doc.caretRangeFromPoint?.(event.clientX, event.clientY);
      const point = range ? this.mapDOMToPoint(surface, range.startContainer, range.startOffset, 'start') : null;
      this.#selectionDragAnchor = point ? flatPosOfBlockChar(this.engine.columnar, point) : null;
    }
  }

  // ---------------------------------------------------------------------------
  // Pointer-driven selection over component blocks. Their wrappers are atomic,
  // non-selectable islands, so a native drag-selection has no valid position
  // inside them — and none *between* two adjacent ones. Blink then either
  // collapses the range back to the text above or jumps it past every island
  // to the next selectable text, which reads as "I dragged into the first
  // block and both got selected". The pointer is the truth: while a drag is
  // over a component block, the selection's moving end clamps to that block's
  // boundary and the DOM-derived mapping stands down.
  // ---------------------------------------------------------------------------

  /** Flat anchor of a live pointer drag-selection, null when no drag. */
  #selectionDragAnchor: number | null = null;
  /** Component block index currently under the dragging pointer, if any. */
  #selectionDragOverVoid: number | null = null;
  /**
   * A selection whose paint is deliberately shorter than the model.
   *
   * Blink cannot put a selection endpoint inside a component block, so a drag
   * ending on one paints up to its boundary while the logical selection still
   * covers the block. Recorded here so the DOM→logical sync can recognise its
   * own under-paint and leave the model alone — otherwise the next edit reads
   * the shorter range back and spares the very block the user selected.
   */
  #voidPaint: { start: Node; startOffset: number; end: Node; endOffset: number } | null = null;

  onSurfaceMouseMove(event: MouseEvent) {
    if (this.#selectionDragAnchor === null || event.buttons !== 1) return;
    const surface = this.surface().nativeElement;
    let el: HTMLElement | null = event.target as HTMLElement;
    while (el && el.parentElement !== surface) el = el.parentElement;
    const over =
      el && el.parentElement === surface && this.#componentBehaviorFor(el) ? this.#winStart + this.#indexInParent(el) : null;
    this.#selectionDragOverVoid = over;
    if (over !== null) this.#applyVoidDragClamp();
  }

  /**
   * Bring the painted range back in line with the clamped logical selection
   * when a drag ends over a component block.
   *
   * Blink cannot put a selection endpoint inside a `contenteditable="false"`
   * island, so such a drag leaves the native range running on to the end of
   * the editing host — every block past the component reads as selected.
   * `#applyVoidDragClamp` already corrects the *logical* selection, but the
   * native range is what the next `beforeinput` re-derives from once the drag
   * state is cleared, so leaving it overshooting meant the next keystroke
   * deleted every block through the end of the document.
   */
  #repaintAfterVoidDrag(voidIndex: number) {
    if (typeof window === 'undefined') return;
    const container = this.surface().nativeElement;
    const voidEl = container.children[voidIndex - this.#winStart];
    const domSel = window.getSelection();
    if (!voidEl || !domSel || domSel.rangeCount === 0) return;
    const cd = this.engine.columnar;
    const row = cd.rowOfTopLevel(voidIndex);
    if (row >= cd.rows) return;
    const anchor = this.#selectionDragAnchor;
    const draggingDown = anchor === null || anchor <= cd.startOf(row);
    const range = domSel.getRangeAt(0).cloneRange();
    this.selection.suppress();
    try {
      // The component's own highlight comes from the void-in-selection class,
      // so the painted range stops at its boundary rather than trying to reach
      // inside it.
      if (draggingDown) range.setEndBefore(voidEl);
      else range.setStartAfter(voidEl);
      domSel.removeAllRanges();
      domSel.addRange(range);
      this.#voidPaint = {
        start: range.startContainer,
        startOffset: range.startOffset,
        end: range.endContainer,
        endOffset: range.endOffset,
      };
    } catch (e) {
      console.warn('[sh-editor] void-drag repaint failed:', e);
    }
    this.selection.unsuppress();
  }

  /**
   * A drag that ended over a component block leaves the native range
   * overshooting; repaint it while the clamp's anchor is still around. The
   * drag state itself is cleared by the next mousedown or keydown, so the
   * clamp keeps asserting the logical selection until the user moves on.
   */
  @HostListener('document:mouseup')
  onDocumentMouseUp() {
    if (this.#selectionDragOverVoid !== null) this.#repaintAfterVoidDrag(this.#selectionDragOverVoid);
  }

  #applyVoidDragClamp() {
    const idx = this.#selectionDragOverVoid;
    const anchor = this.#selectionDragAnchor;
    if (idx === null || anchor === null) return;
    const cd = this.engine.columnar;
    const row = cd.rowOfTopLevel(idx);
    if (row >= cd.rows) return;
    const start = cd.startOf(row);
    // Dragging down: anchor .. just past the hovered block. Dragging up: the
    // hovered block's start .. anchor.
    const next = anchor <= start ? { from: anchor, to: start + 1 } : { from: start, to: anchor };
    const cur = this.selection.active();
    if (!cur || cur.from !== next.from || cur.to !== next.to) this.selection.live.set(next);
  }

  /**
   * Click fall-through for component blocks: a click that reaches this
   * handler unconsumed and didn't land on anything interactive selects the
   * block. Components keep real interactions — native/ARIA interactive
   * elements are exempt, and a component's own click handler can call
   * `stopPropagation()` (or `preventDefault()`) to keep the click entirely.
   */
  onSurfaceClick(event: MouseEvent) {
    if (this.readonly() || event.defaultPrevented) return;
    const surface = this.surface().nativeElement;
    let el: HTMLElement | null = event.target as HTMLElement;
    while (el && el.parentElement !== surface) el = el.parentElement;
    if (!el || !this.#componentBehaviorFor(el)) return;
    if (this.#interactiveWithin(event.target as HTMLElement, el)) return;
    this.engine.selectBlock(this.#winStart + this.#indexInParent(el));
  }

  /** True when anything on the path from `target` up to `wrapper` is interactive. */
  #interactiveWithin(target: HTMLElement | null, wrapper: HTMLElement): boolean {
    for (let el: HTMLElement | null = target; el && el !== wrapper; el = el.parentElement) {
      if (INTERACTIVE_TAGS.has(el.tagName.toLowerCase())) return true;
      if (el.isContentEditable) return true;
      const tabindex = el.getAttribute('tabindex');
      if (tabindex !== null && Number(tabindex) >= 0) return true;
      const role = el.getAttribute('role');
      if (role && INTERACTIVE_ROLES.has(role)) return true;
      if (el.onclick) return true;
    }
    return false;
  }

  /** With a void block selected, copy serializes that block to the clipboard. */
  onCopy(event: ClipboardEvent) {
    if (this.#insideComponentBlock(event.target)) return;
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
    if (this.#insideComponentBlock(event.target)) return;
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
    // Drags that start inside a component block (a slider, an internal DnD)
    // belong to the component.
    if (this.#insideComponentBlock(event.target)) return;
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
    // Typing inside a component block edits the component, not the document.
    if (this.#insideComponentBlock(event.target)) return;

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

    this.#ensureCaretPainted();
    this.#syncLogicalSelectionFromDOM();

    const format: Record<string, string> = {
      formatBold: 'bold',
      formatItalic: 'italic',
      formatUnderline: 'underline',
      formatStrikeThrough: 'strike',
    };

    let mutated = true;
    // `beforeinput` fires once, for the native range — which is the primary
    // cursor. Every mutating intent is replayed at the other cursors here, as
    // one undo step; the event's own target ranges describe the primary only,
    // so they are skipped while fanning out.
    const multi = this.selection.isMulti();

    switch (event.inputType) {
      case 'insertText':
      case 'insertReplacementText': {
        const data = event.data ?? '';
        event.preventDefault();
        if (!data) break;

        this.#fanOut(() => {
          if (!multi) this.#selectTargetRange(event);
          this.engine.insertText(data);
        });
        break;
      }
      case 'insertParagraph':
        event.preventDefault();
        this.#fanOut(() => this.engine.handleEnter());
        break;
      case 'insertLineBreak':
        event.preventDefault();
        this.#fanOut(() => this.engine.insertText('\n'));
        break;
      case 'deleteContentBackward':
      case 'deleteWordBackward':
      case 'deleteSoftLineBackward':
      case 'deleteHardLineBackward':
        event.preventDefault();
        this.#fanOut(() => this.#handleDelete(event, 'backward', !multi));
        break;
      case 'deleteContentForward':
      case 'deleteWordForward':
      case 'deleteSoftLineForward':
      case 'deleteHardLineForward':
        event.preventDefault();
        this.#fanOut(() => this.#handleDelete(event, 'forward', !multi));
        break;
      case 'deleteByCut':
      case 'deleteContent':
        event.preventDefault();
        this.#fanOut(() => this.engine.deleteRange());
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
          this.#fanOut(() => this.engine.toggleMark(markType));
          break;
        }

        event.preventDefault();
        mutated = false;
      }
    }

    if (mutated) this.#render();
  }

  onCompositionStart(event?: CompositionEvent) {
    if (event && this.#insideComponentBlock(event.target)) return;
    this.#composing = true;
  }

  onCompositionEnd(event?: CompositionEvent) {
    if (event && this.#insideComponentBlock(event.target)) return;
    this.#composing = false;

    this.#reconcileCaretBlockFromDOM();
  }

  #reconcileCaretBlockFromDOM() {
    const index = this.#currentBlockIndex();
    if (index >= 0) this.#reconcileBlockFromDOM(index);
    this.#syncLogicalSelectionFromDOM();
  }

  /** Run an intent at every cursor when several are live, else just once. */
  #fanOut(run: () => void) {
    if (this.selection.isMulti()) this.engine.runAtEveryCursor(run);
    else run();
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

  #handleDelete(event: InputEvent, direction: 'backward' | 'forward', useTargetRange = true) {
    const sel = this.selection.active();

    if (sel && sel.from !== sel.to) {
      this.engine.deleteRange();
      return;
    }

    const tr = useTargetRange ? event.getTargetRanges?.()[0] : undefined;
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
    // A component block's DOM is Angular's, not the model's — never parse it back.
    if (this.#componentBehaviorFor(blockEl)) return;
    const temp = this.#document.createElement('div');
    temp.appendChild(blockEl.cloneNode(true));
    const parsed = parseDOMToAST(temp, this.engine.blocks, this.engine.inlines);
    if (!parsed.length) return;
    this.#isWritingFromDOM = true;
    this.engine.replaceBlock(index, parsed[0]);
  }

  #syncLogicalSelectionFromDOM() {
    if (typeof window === 'undefined') return;
    // The caret's block is unmounted, so whatever the DOM reports is Blink's
    // invention, not a selection the user made. The logical selection stays
    // authoritative until `#ensureCaretPainted` (or a click) re-establishes a
    // real one.
    if (!this.#domSelectionPainted) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const container = this.surface().nativeElement;
    if (!container.contains(range.commonAncestorContainer)) {
      this.selection.domRect.set(null);
      return;
    }
    // A DOM selection living inside a component block belongs to the
    // component; the editor's logical selection stays where it was.
    if (this.#insideComponentBlock(range.commonAncestorContainer)) return;
    // While a drag-selection hovers a component block, the pointer clamp owns
    // the logical selection — the DOM range is Blink's over- or under-shoot.
    if (this.#selectionDragOverVoid !== null) {
      this.#applyVoidDragClamp();
      return;
    }
    // Our own under-paint from a drag that ended on a component block: the
    // range stops at the block's boundary but the logical selection owns the
    // block, so adopting the range here would quietly drop it from the
    // selection and spare it from the next edit. Any *other* range means the
    // user has moved on, and the record goes.
    if (this.#voidPaint) {
      const painted = this.#voidPaint;
      if (
        range.startContainer === painted.start &&
        range.startOffset === painted.startOffset &&
        range.endContainer === painted.end &&
        range.endOffset === painted.endOffset
      ) {
        this.selection.updateRect(container);
        return;
      }
      this.#voidPaint = null;
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
    // Pasting into a component block's own inputs is the component's business.
    if (this.#insideComponentBlock(event.target)) return;
    event.preventDefault();

    this.#ensureCaretPainted();
    this.#syncLogicalSelectionFromDOM();

    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const html = clipboard.getData('text/html');
    const plainText = clipboard.getData('text/plain');

    // Pasting into a whitespace-preserving block (code): parsing the
    // clipboard's HTML flavor collapses whitespace — line breaks and
    // indentation vanish — while the plain-text flavor carries the code
    // verbatim but no coloring. Take the text from text/plain, then ride the
    // HTML flavor's marks (the source editor's syntax colors) on top of it
    // where the two flavors' characters align; if they don't, plain text
    // wins. Either way it is one transaction, range replacement and caret
    // placement included.
    const codeTargetType = plainText ? this.#pasteWhitespaceTargetType() : null;
    if (plainText && codeTargetType) {
      const text = dedentPastedCode(plainText.replace(/\r\n?/g, '\n'));
      const styled = html ? alignStyledCode(text, htmlToAst(html, this.engine.blocks, this.engine.inlines, this.sanitize())) : null;
      if (styled) this.engine.insertFragment([{ type: codeTargetType, content: styled }]);
      else this.engine.insertText(text);
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
   * The type of the paste target when it is a single whitespace-preserving
   * text block (a code block): the caret — or the whole selection — sits
   * inside one row whose behavior declares `preserveWhitespace`. Null when
   * the selection reaches into other blocks, which fall back to the
   * fragment path.
   */
  #pasteWhitespaceTargetType(): string | null {
    if (this.engine.selectedBlock() !== null) return null;
    const sel = this.selection.active();
    if (!sel) return null;
    const cd = this.engine.columnar;
    if (!cd.rows) return null;
    const a = pointAt(cd, Math.min(sel.from, sel.to));
    if (cd.kindOf(a.row) !== RowKind.Text) return null;
    if (sel.from !== sel.to && pointAt(cd, Math.max(sel.from, sel.to)).row !== a.row) return null;
    const type = cd.typeOf(a.row);
    return this.engine.blocks.get(type)?.preserveWhitespace === true ? type : null;
  }

  onDOMBlur() {
    this.onTouched();
  }
  onDOMFocus() {}

  onKeyDown(event: KeyboardEvent) {
    if (this.readonly()) return;
    if (this.#composing) return;
    // Focus inside a component block: the component owns its whole keymap.
    if (this.#insideComponentBlock(event.target)) return;
    // Keyboard input takes selection authority back from any finished drag.
    this.#selectionDragAnchor = null;
    this.#selectionDragOverVoid = null;
    // The keystroke is about to read or extend the DOM selection, so the caret
    // has to exist there first. Bare modifier presses are not interactions —
    // holding Shift must not yank the viewport back to the caret.
    if (!MODIFIER_KEYS.has(event.key)) this.#ensureCaretPainted();

    const slash = this.slashMenu();
    if (slash?.isOpen()) {
      if (event.key === 'ArrowDown') return event.preventDefault(), slash.move(1);
      if (event.key === 'ArrowUp') return event.preventDefault(), slash.move(-1);
      if (event.key === 'Enter' || event.key === 'Tab') return event.preventDefault(), slash.confirm();
      if (event.key === 'Escape') return event.preventDefault(), slash.close();
    }

    // Escape collapses back to one cursor; plain caret navigation ends
    // multi-cursor mode too, since the browser only moves the native caret and
    // leaving the others behind would strand them where the user is not.
    if (this.selection.isMulti()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.selection.clearSecondary();
        this.#render();
        return;
      }
      if (NAVIGATION_KEYS.has(event.key) && !event.altKey) this.selection.clearSecondary();
    }

    // Block reordering: the code-editor line-move gesture, in both flavors —
    // Alt+Arrow (VS Code) and Cmd/Ctrl+Shift+Arrow (Sublime), the same pair
    // `sh-code`'s keymap presets bind. Handled before the selected-block
    // keys so a selected void block moves instead of navigating away.
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const altMove = event.altKey && !event.shiftKey && !event.metaKey && !event.ctrlKey;
      const sublimeMove = (event.metaKey || event.ctrlKey) && event.shiftKey && !event.altKey;
      if (altMove || sublimeMove) {
        event.preventDefault();
        if (this.engine.moveSelectedBlocks(event.key === 'ArrowUp' ? -1 : 1)) this.#render();
        return;
      }
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
        } else if (targetRow < cd.rows) {
          // The neighbor is another void (stacked components, image over hr):
          // selection hops block to block instead of being dropped. At the
          // document edge the same block simply stays selected.
          this.engine.selectBlock(targetIdx);
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

  /** The behavior when `el` is a custom component block's wrapper element. */
  #componentBehaviorFor(el: Element | null | undefined): BaseComponentBlockBehavior | null {
    const type = (el as HTMLElement | null)?.dataset?.['shBlock'];
    if (!type) return null;
    const behavior = this.engine.blocks.get(type);
    return behavior instanceof BaseComponentBlockBehavior ? behavior : null;
  }

  /**
   * True when `target` sits inside a custom component block. Those blocks own
   * their interior completely — every key, click, clipboard and composition
   * event belongs to the component (an embedded editor keeps its whole
   * keymap), so the editor's handlers bail out on this test.
   */
  #insideComponentBlock(target: EventTarget | Node | null): boolean {
    if (!(target instanceof Node)) return false;
    const container = this.surface().nativeElement;
    if (!container.contains(target)) return false;
    let el: HTMLElement | null = target.nodeType === Node.ELEMENT_NODE ? (target as HTMLElement) : target.parentElement;
    while (el && el !== container && el.parentElement !== container) el = el.parentElement;
    return !!el && el !== container && !!this.#componentBehaviorFor(el);
  }

  #parseWrapperAttrs(raw: string): Record<string, unknown> {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  /**
   * Bring live components in line with the mounted wrappers: destroy refs
   * whose wrapper left the DOM, mount components into wrappers that appeared,
   * and refresh each survivor's index and attrs signals. Runs after every DOM
   * patch, including virtualization window moves.
   */
  #syncComponentBlocks() {
    if (typeof window === 'undefined') return;
    for (const [el, entry] of this.#componentBlocks) {
      if (!el.isConnected) {
        entry.ref.destroy();
        this.#componentBlocks.delete(el);
      }
    }
    const children = this.surface().nativeElement.children;
    for (let i = 0; i < children.length; i++) {
      const el = children[i] as HTMLElement;
      const behavior = this.#componentBehaviorFor(el);
      if (!behavior) continue;
      const index = this.#winStart + i;
      const entry = this.#componentBlocks.get(el);
      if (!entry) {
        this.#mountComponentBlock(el, behavior, index);
        continue;
      }
      if (entry.index() !== index) entry.index.set(index);
      const raw = el.dataset['shAttrs'] ?? '';
      if (raw !== entry.lastAttrsJson) {
        entry.lastAttrsJson = raw;
        entry.attrs.set(this.#parseWrapperAttrs(raw));
      }
    }
  }

  #mountComponentBlock(el: HTMLElement, behavior: BaseComponentBlockBehavior, index: number) {
    const rawAttrs = el.dataset['shAttrs'] ?? '';
    const indexSig = signal(index);
    const attrsSig = signal(this.#parseWrapperAttrs(rawAttrs));
    const ctx: ShipEditorBlockContext = {
      attrs: attrsSig.asReadonly(),
      index: indexSig.asReadonly(),
      selected: computed(() => this.engine.selectedBlock() === indexSig()),
      readonly: this.readonly,
      updateAttrs: (patch) => {
        this.engine.updateBlockAttrs(indexSig(), patch);
        this.#render();
      },
      select: () => this.engine.selectBlock(indexSig()),
      remove: () => {
        this.engine.deleteBlock(indexSig());
        this.#render();
      },
    };
    // A behavior may render static fallback content inside the wrapper (a
    // sheet block serializes its real <table> there); the live component
    // supersedes it.
    el.replaceChildren();
    // Angular applies the component's static host class by *replacing* the
    // host element's class attribute — put the behavior-rendered classes back
    // afterwards.
    const renderedClasses = el.className;
    const ref = createComponent(behavior.component, {
      environmentInjector: this.#envInjector,
      elementInjector: Injector.create({
        providers: [{ provide: SHIP_EDITOR_BLOCK_CONTEXT, useValue: ctx }],
        parent: this.#injector,
      }),
      hostElement: el,
    });
    for (const c of renderedClasses.split(/\s+/)) if (c) el.classList.add(c);
    this.#appRef.attachView(ref.hostView);
    ref.changeDetectorRef.detectChanges();
    this.#componentBlocks.set(el, { ref, type: behavior.type, index: indexSig, attrs: attrsSig, lastAttrsJson: rawAttrs });
  }

  /**
   * A live component block never has its wrapper replaced by the HTML differ
   * — Angular owns the wrapper's interior, and outerHTML comparisons against
   * the behavior's empty wrapper would tear the component down on every
   * render. Sync the freshly rendered wrapper's own attributes onto the live
   * element instead. False means `el` hosts no live component (or the block
   * changed type, in which case the component is destroyed here) and the
   * caller's replacement path should run.
   */
  #patchComponentBlockInPlace(el: HTMLElement, html: string): boolean {
    const entry = this.#componentBlocks.get(el);
    if (!entry) return false;
    const next = this.#htmlToElement(html) as HTMLElement | null;
    if (!next || next.dataset?.['shBlock'] !== entry.type) {
      // The wrapper is the component's Angular host element, so destroying the
      // component takes it out of the DOM too. The caller still has to put the
      // replacement somewhere, and `replaceWith` on a detached node is a silent
      // no-op — the block would just vanish, leaving the DOM one element short
      // of the AST with every later block shifted up. Put the wrapper back
      // where it was so the caller can replace it normally.
      const parent = el.parentNode;
      const before = el.nextSibling;
      entry.ref.destroy();
      this.#componentBlocks.delete(el);
      if (parent && !el.isConnected) parent.insertBefore(el, before);
      return false;
    }
    // Copy attributes additively — Angular host bindings may have put their
    // own classes and attributes on the wrapper, and removing those would
    // break the component.
    for (const attr of Array.from(next.attributes)) {
      if (attr.name === 'class') {
        next.classList.forEach((c) => el.classList.add(c));
      } else if (el.getAttribute(attr.name) !== attr.value) {
        el.setAttribute(attr.name, attr.value);
      }
    }
    if (!next.dataset['shAttrs'] && el.dataset['shAttrs']) delete el.dataset['shAttrs'];
    return true;
  }

  #render() {
    this.selection.suppress();
    this.patchDOM();
    const sel = this.selection.active();
    if (sel && this.#virtualOn && sel.from === sel.to) {
      this.#virtualSelectAll = false;
      this.#scrollCaretIntoView(sel.from);
    }
    // While focus lives inside a component block (its updateAttrs triggered
    // this render), repainting the editor's DOM selection would steal the
    // component's focus mid-interaction.
    if (sel && !this.#insideComponentBlock(this.#document.activeElement)) this.restoreDOMSelection(sel);
    this.#paintSecondaryCursors();
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

    if (container !== this.#lastSurface) {
      // Fresh template DOM — the first render, or a view re-created in place
      // (dev HMR replaces the template under a surviving component instance).
      // Nothing previously rendered survives, whatever the hints claim, and
      // per-element state has to be re-applied.
      this.#lastSurface = container;
      hints.length = 0;
      hints.push({ kind: 'all' });
      if (this.#virtualOn) container.style.overflowAnchor = 'none';
    }

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
        if (this.#patchComponentBlockInPlace(el, html)) {
          // Live component wrapper synced in place; its interior is Angular's.
        } else if (el.outerHTML !== html) {
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
        // Where the splice overlaps itself (blocks replaced in position),
        // reconcile element-wise: a live component wrapper survives an attrs
        // update (replaceBlocksOp is structural) instead of being torn down.
        const overlap = Math.min(hint.remove, hint.insert);
        for (let i = 0; i < overlap; i++) {
          const el = container.children[hint.at + i] as HTMLElement | undefined;
          if (!el) {
            full = true;
            break;
          }
          const html = this.engine.renderBlockHtml(hint.at + i);
          if (this.#patchComponentBlockInPlace(el, html)) continue;
          if (el.outerHTML !== html) {
            const next = this.#htmlToElement(html);
            if (next) el.replaceWith(next);
            else full = true;
          }
        }
        for (let i = overlap; i < hint.remove; i++) container.children[hint.at + overlap]?.remove();
        const before = container.children[hint.at + overlap] ?? null;
        for (let i = overlap; i < hint.insert; i++) {
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
        } else if (this.#patchComponentBlockInPlace(el, html)) {
          // Live component wrapper synced in place.
        } else if (el.outerHTML !== html) {
          const next = this.#htmlToElement(html);
          if (next) el.replaceWith(next);
        }
      }
      while (container.children.length > count) container.lastElementChild?.remove();
    }

    this.#syncComponentBlocks();
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
      this.#repaintSelectionAfterWindowMove();
    });
  };

  /**
   * Re-project the logical selection after a window move that did not come
   * through `#render`.
   *
   * Scrolling rebuilds or splices the mounted slice, and either way the
   * native selection's nodes are gone — a rebuilt window replaces even the
   * elements that stayed in range, and `#dropDOMSelectionIfUnmounting`
   * clears ranges whose blocks left. The logical selection is untouched and
   * still authoritative, so the caret must be painted back onto the new
   * nodes; without this, scrolling silently loses the caret and the next
   * keystroke has nowhere to land.
   *
   * Only repaints while the editor already owns focus: scrolling past an
   * unfocused editor must never pull the selection away from whatever else
   * holds it, and a focused component block owns its own selection.
   */
  #repaintSelectionAfterWindowMove() {
    if (typeof window === 'undefined') return;
    const sel = this.selection.active();
    if (!sel) return;
    const active = this.#document.activeElement;
    if (!active || !this.surface().nativeElement.contains(active)) return;
    if (this.#insideComponentBlock(active)) return;
    this.selection.suppress();
    this.restoreDOMSelection(sel);
    this.#paintSecondaryCursors();
    this.selection.unsuppress();
  }

  // -------------------------------------------------------------------------
  // Secondary cursors.
  //
  // A contenteditable gets exactly one native selection range, so only the
  // primary cursor is the browser's. The rest are painted by the editor:
  // non-collapsed ones through the CSS Custom Highlight API (no DOM inserted,
  // so the text nodes the editing path depends on stay untouched), collapsed
  // ones as drawn carets.
  //
  // Only the mounted window can be painted — an off-window cursor has no nodes
  // to point at — which is the same rule `restoreDOMSelection` already applies
  // to the primary, and why this has to re-run on every window move.
  // -------------------------------------------------------------------------

  /**
   * Drawn carets, in body coordinates — every cursor while several are live,
   * the primary included.
   *
   * The native caret keeps a blink phase that nothing can read or align to, so
   * a drawn caret can never be kept in step with it. Rather than show two
   * cursors blinking against each other, the native one is hidden while
   * multi-cursor is active (`.multi-cursor` sets `caret-color: transparent`)
   * and all of them are drawn here, sharing one animation.
   */
  readonly drawnCarets = signal<{ top: number; left: number; height: number; primary: boolean }[]>([]);

  #paintSecondaryCursors() {
    if (typeof window === 'undefined') return;
    if (!this.selection.secondary().length) {
      if (this.drawnCarets().length) this.drawnCarets.set([]);
      this.#setSecondaryHighlight([]);
      return;
    }
    const container = this.surface().nativeElement;
    const body = container.parentElement;
    const cd = this.engine.columnar;
    if (!body || !cd.rows) return;

    const blockCount = this.engine.blockCount();
    const winFrom = cd.startOf(cd.rowOfTopLevel(Math.min(this.#winStart, blockCount)));
    const endBlock = Math.min(this.#winEnd, blockCount);
    const winTo = endBlock >= blockCount ? cd.size : cd.startOf(cd.rowOfTopLevel(endBlock));

    const primary = this.selection.active();
    const isPrimary = (sel: LogicalSelection) => !!primary && sel.from === primary.from && sel.to === primary.to;

    const bodyRect = body.getBoundingClientRect();
    const carets: { top: number; left: number; height: number; primary: boolean }[] = [];
    const ranges: Range[] = [];
    for (const sel of logicalRangesInSpan(this.selection.ranges(), winFrom, winTo)) {
      const range = this.#domRangeFor(sel);
      if (!range) continue;
      if (sel.from === sel.to) {
        const rect = range.getBoundingClientRect();
        carets.push({
          top: rect.top - bodyRect.top,
          left: rect.left - bodyRect.left,
          height: rect.height || parseFloat(getComputedStyle(container).lineHeight) || 20,
          primary: isPrimary(sel),
        });
      } else if (!isPrimary(sel)) {
        // The primary's own range is already painted by the native selection.
        ranges.push(range);
      }
    }
    this.drawnCarets.set(carets);
    this.#setSecondaryHighlight(ranges);
  }

  /**
   * Rewind the shared blink clock so every caret is solid the moment the
   * selection moves — and so a cursor opened mid-cycle starts in phase.
   */
  #restartCaretBlink() {
    const body = this.surface().nativeElement.parentElement;
    const layer = body?.querySelector('.sh-editor-caret-layer') as HTMLElement | null;
    if (!layer?.getAnimations) return;
    for (const animation of layer.getAnimations()) animation.currentTime = 0;
  }

  /**
   * Publish the secondary selection ranges as a CSS highlight.
   *
   * The registry is global and keyed by name; one focused editor owns the
   * name at a time, and an editor with no secondaries releases it.
   */
  #setSecondaryHighlight(ranges: Range[]) {
    // Absent on the server and in jsdom, and on browsers without the API — in
    // every one of those the extra selections simply do not paint, while the
    // model, the editing behaviour and the drawn carets are unaffected.
    if (typeof CSS === 'undefined' || typeof window === 'undefined') return;
    const registry = (CSS as unknown as { highlights?: Map<string, unknown> }).highlights;
    const ctor = (window as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    if (!registry || !ctor) return;
    if (!ranges.length) registry.delete(SECONDARY_HIGHLIGHT);
    else registry.set(SECONDARY_HIGHLIGHT, new ctor(...ranges));
  }

  /**
   * Put the caret back on real DOM before an interaction that will read or
   * extend the DOM selection.
   *
   * Scrolling can carry the caret's block out of the mounted window, and a
   * focused contenteditable with no DOM selection is exactly the state where
   * Blink synthesizes one at the top of the editing host. Adopting that would
   * silently move the caret into a block the user never chose and land the
   * edit there. Scrolling the caret back into view first restores the
   * invariant — and is what every editor does when you scroll away and type.
   *
   * Deliberately not called from `selectionchange`: merely scrolling past the
   * caret must not yank the viewport back, only editing must.
   */
  #ensureCaretPainted() {
    if (this.#domSelectionPainted || !this.#virtualOn) return;
    const sel = this.selection.active();
    if (!sel) return;
    const active = this.#document.activeElement;
    if (!active || !this.surface().nativeElement.contains(active)) return;
    if (this.#insideComponentBlock(active)) return;
    this.selection.suppress();
    this.#scrollCaretIntoView(sel.from);
    this.restoreDOMSelection(sel);
    this.selection.unsuppress();
  }

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
        if (this.#patchComponentBlockInPlace(el, html)) {
          // Live component wrapper synced in place.
        } else if (el.outerHTML !== html) {
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
      this.#syncComponentBlocks();
      return;
    }

    // Block 0's theoretical top in client coordinates: the current inline
    // padding already contains prefix(#winStart), so the base padding alone
    // offsets from the surface's border box.
    const surfaceRect = container.getBoundingClientRect();
    const origin = surfaceRect.top + this.#basePadTop;
    const { top: vpTop, bottom: vpBottom } = this.#viewportEdges();
    const ds = heights.indexAt(vpTop - VIRTUAL_OVERSCAN_PX - origin);
    const de = Math.min(count, heights.indexAt(vpBottom + VIRTUAL_OVERSCAN_PX - origin) + 1);

    const prevStart = this.#winStart;
    const prevEnd = this.#winEnd;
    const overlapStart = Math.max(ds, prevStart);
    const overlapEnd = Math.min(de, this.#winEnd);
    const mismatch = container.children.length !== this.#winEnd - prevStart;

    // A window rebuild would tear down live component blocks with it; keep a
    // handle on the outgoing children so same-type wrappers can be carried
    // into the new window instead of remounted.
    const prevChildren = this.#componentBlocks.size ? (Array.from(container.children) as HTMLElement[]) : null;

    const renderRange = (from: number, to: number): DocumentFragment => {
      const fragment = this.#document.createDocumentFragment();
      for (let i = from; i < to; i++) {
        const html = this.engine.renderBlockHtml(i);
        const prev = prevChildren && i >= prevStart && i < prevEnd ? prevChildren[i - prevStart] : undefined;
        if (prev && this.#componentBlocks.has(prev) && this.#patchComponentBlockInPlace(prev, html)) {
          fragment.appendChild(prev);
          continue;
        }
        const el = this.#htmlToElement(html);
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

    // Anchor: measuring re-prices blocks — prepended ones go from estimate
    // to measured, and pre-lock the rolling average re-prices everything
    // unmeasured — which moves the padding and with it all content relative
    // to the unchanged scrollTop. Without compensation a long jump into
    // unmeasured territory can leave the viewport showing nothing but
    // spacer. The anchor is the first surviving block (or, on a rebuilt
    // window, the block the scroll position chose): whatever the re-pricing
    // does, that block must keep its intended position on screen.
    const anchor = rebuilt ? ds : overlapStart;
    const anchorPrefixBefore = heights.prefixHeight(anchor);
    // A degenerate layout — a hidden tab, a not-yet-sized pane — reports
    // nonsense: text wrapped in a zero-width surface measures enormous
    // heights, and the estimate would lock onto them. Measure real layouts
    // only; the resize/scroll listeners re-measure once geometry exists.
    if (surfaceRect.width >= 60) {
      const children = container.children;
      for (let k = 0; k < children.length; k++) {
        const el = children[k] as HTMLElement;
        const next = children[k + 1] as HTMLElement | undefined;
        const height = next ? next.offsetTop - el.offsetTop : el.offsetHeight;
        if (height > 0) heights.measure(ds + k, height);
      }
    }
    this.#setVirtualPadding(container, heights.prefixHeight(ds), heights.total() - heights.prefixHeight(de));
    // The ≥1px guard keeps sub-pixel drift from feeding back into the scroll
    // position: an adjustment fires a scroll event, which schedules another
    // update.
    const shift = heights.prefixHeight(anchor) - anchorPrefixBefore;
    if (Math.abs(shift) >= 1) this.#adjustScroll(shift);

    this.#syncComponentBlocks();
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

  /** The DOM node/offset a block point addresses, or null when it has none. */
  #domPosFor(bp: BlockPoint): { node: Node; offset: number } | null {
    const container = this.surface().nativeElement;
    const cd = this.engine.columnar;
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
  }

  /**
   * A DOM Range for a logical selection, or null when it has no mounted nodes.
   * Used to paint secondary cursors, which never touch the native selection.
   */
  #domRangeFor(sel: LogicalSelection): Range | null {
    const cd = this.engine.columnar;
    if (!cd.rows || typeof document === 'undefined') return null;
    const isCollapsed = sel.from === sel.to;
    let startBp = blockPointAt(cd, sel.from);
    let endBp = isCollapsed ? startBp : blockPointAt(cd, sel.to);

    if (this.#virtualOn) {
      if (isCollapsed) {
        if (startBp.blockIndex < this.#winStart || startBp.blockIndex >= this.#winEnd) return null;
      } else {
        const start = this.#clampToWindow(startBp, 'start');
        const end = this.#clampToWindow(endBp, 'end');
        if (!start || !end) return null;
        startBp = start;
        endBp = end;
      }
    }

    try {
      const start = this.#domPosFor(startBp);
      if (!start) return null;
      const range = document.createRange();
      range.setStart(start.node, start.offset);
      if (isCollapsed) {
        range.collapse(true);
        return range;
      }
      const end = this.#domPosFor(endBp);
      if (!end) return null;
      range.setEnd(end.node, end.offset);
      return range;
    } catch {
      return null;
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
        if (startBp.blockIndex < this.#winStart || startBp.blockIndex >= this.#winEnd) {
          this.#domSelectionPainted = false;
          return;
        }
      } else {
        const start = this.#clampToWindow(startBp, 'start');
        const end = this.#clampToWindow(endBp, 'end');
        if (!start || !end) {
          this.#domSelectionPainted = false;
          return;
        }
        startBp = start;
        endBp = end;
      }
    }

    try {
      const range = document.createRange();
      const getPos = (bp: BlockPoint) => this.#domPosFor(bp);

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
          this.#domSelectionPainted = true;
          return;
        }
        domSel?.removeAllRanges();
        domSel?.addRange(range);
        this.#domSelectionPainted = true;
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

