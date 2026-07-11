import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  output,
  PLATFORM_ID,
  Provider,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ShipColor, shipComponentClasses } from '@ship-ui/core';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipKbd } from '@ship-ui/core/ship-kbd';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

import {
  blockToHTML,
  CaretState,
  clearDocRangeFormatting,
  cloneBlock,
  cloneDoc,
  codeBlockBlockExtension,
  configureExtension,
  defaultBlockExtensions,
  EditorSelection,
  EditorSelectionState,
  escapeHTML,
  formatDocRange,
  getJSONText,
  headingBlockExtension,
  htmlToJSON,
  htmlToMarkdown,
  imageBlockExtension,
  infoCalloutBlockExtension,
  inlineToHTML,
  isVoidBlock,
  jsonToHTML,
  LogicalPosition,
  mapDOMPositionToLogical,
  markdownToHTML,
  mergeBlockForward,
  mergeBlocks,
  normalizeASTPaste,
  paragraphBlockExtension,
  parseImageClassNames,
  quoteBlockExtension,
  registerDefaultExtensions,
  sanitizeHTML,
  setBlockTypeInDoc,
  ShipEditorBlock,
  ShipEditorBlockContext,
  ShipEditorBlockExtension,
  ShipEditorCommand,
  ShipEditorDocument,
  ShipEditorInlineNode,
  ShipEditorInstance,
  ShipEditorMark,
  ShipEditorMarkExtension,
  ShipEditorRegistry,
  ShipEditorValue,
  splitBlock,
  toggleListInDoc,
} from './ship-editor-core';

export {
  CaretState,
  codeBlockBlockExtension,
  configureExtension,
  defaultBlockExtensions,
  EditorSelection,
  EditorSelectionState,
  headingBlockExtension,
  imageBlockExtension,
  infoCalloutBlockExtension,
  LogicalPosition,
  mergeBlocks,
  paragraphBlockExtension,
  quoteBlockExtension,
  registerDefaultExtensions,
  ShipEditorBlock,
  ShipEditorBlockExtension,
  ShipEditorCommand,
  ShipEditorDocument,
  ShipEditorInlineNode,
  ShipEditorInstance,
  ShipEditorMark,
  ShipEditorMarkExtension,
  ShipEditorRegistry,
  ShipEditorValue,
  splitBlock,
};

const SHIP_EDITOR_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ShipEditor),
  multi: true,
};

@Component({
  selector: 'sh-editor',
  standalone: true,
  styleUrl: './ship-editor.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipTooltip, ShipIcon, ShipKbd, ShipMenu],
  providers: [SHIP_EDITOR_VALUE_ACCESSOR, ShipEditorRegistry],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[class.sh-editor-readonly]': 'readonly()',
    '[class.sh-editor-focused]': 'isFocused()',
  },
  templateUrl: './ship-editor.html',
})
export class ShipEditor implements ControlValueAccessor, OnDestroy, AfterViewInit, ShipEditorInstance {
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);
  #isBrowser = isPlatformBrowser(this.#platformId);
  #keybindings = inject(ShipA11yKeybindingsService);
  #injector = inject(Injector);
  #registry = inject(ShipEditorRegistry);

  editorRef = viewChild<ElementRef<HTMLDivElement>>('editorRef');
  codeEditorRef = viewChild<ElementRef<HTMLTextAreaElement>>('codeEditorRef');
  uploadBtn = viewChild<ElementRef<HTMLButtonElement>>('uploadBtn');
  imageInput = viewChild<ElementRef<HTMLInputElement>>('imageInput');
  linkInput = viewChild<ElementRef<HTMLInputElement>>('linkInput');

  value = model<string | ShipEditorDocument | null>('');
  format = input<'json' | 'html' | 'markdown'>('html');
  placeholder = input<string>('Type your content here...');
  readonly = input<boolean>(false);
  toolbar = input<boolean>(true);
  color = input<ShipColor | null>(null);
  variant = input<'base' | 'type-b' | null>('base');
  customCommands = input<ShipEditorCommand[]>([]);

  showSlashMenu = signal<boolean>(false);
  slashSearchQuery = signal<string>('');
  slashMenuTop = signal<number>(0);
  slashMenuLeft = signal<number>(0);

  #lastValueWrittenFromDOM: ShipEditorValue | undefined = undefined;
  #lastEditorElement: HTMLDivElement | null = null;
  #historyStack: {
    doc: ShipEditorDocument;
    docVersion: number;
    selection: {
      start: LogicalPosition;
      end: LogicalPosition | null;
      isCollapsed: boolean;
    } | null;
  }[] = [];
  #historyIndex = -1;
  #maxHistorySize = 100;
  #docVersion = 0;
  #isInternalDOMUpdate = false;
  #typingTimeout: ReturnType<typeof setTimeout> | undefined;
  #valueUpdateTimeout: ReturnType<typeof setTimeout> | undefined;

  defaultCommands = computed<ShipEditorCommand[]>(() => [
    {
      id: 'paragraph',
      label: 'Normal Text',
      icon: 'paragraph',
      description: 'Start writing with plain text',
      action: (editor) => editor.selectBlockType('p'),
    },
    {
      id: 'h1',
      label: 'Heading 1',
      icon: 'text-h-one',
      description: 'Big section heading',
      action: (editor) => editor.selectBlockType('h1'),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      icon: 'text-h-two',
      description: 'Medium section heading',
      action: (editor) => editor.selectBlockType('h2'),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      icon: 'text-h-three',
      description: 'Small section heading',
      action: (editor) => editor.selectBlockType('h3'),
    },
    {
      id: 'bullet-list',
      label: 'Bullet List',
      icon: 'list-bullets',
      description: 'Create a simple bullet list',
      action: (editor) => editor.formatText('insertUnorderedList'),
    },
    {
      id: 'ordered-list',
      label: 'Numbered List',
      icon: 'list-numbers',
      description: 'Create a list with numbering',
      action: (editor) => editor.formatText('insertOrderedList'),
    },
    {
      id: 'quote',
      label: 'Quote',
      icon: 'quotes',
      description: 'Capture a quote',
      action: (editor) => editor.selectBlockType('blockquote'),
    },
    {
      id: 'info-callout',
      label: 'Info Callout',
      icon: 'lightbulb',
      description: 'Highlight important information',
      action: (editor) => editor.selectBlockType('info-callout'),
    },
    {
      id: 'code-block',
      label: 'Code Block',
      icon: 'code',
      description: 'Write code snippets',
      action: (editor) => editor.selectBlockType('pre'),
    },
    {
      id: 'image',
      label: 'Image',
      icon: 'image',
      description: 'Insert an image from URL or upload',
      action: (editor) => editor.openImageModal(),
    },
    {
      id: 'link',
      label: 'Link',
      icon: 'link',
      description: 'Insert a hyperlink',
      action: (editor) => editor.openLinkModal(),
    },
  ]);

  slashCommands = input<boolean | string[]>(true);

  allCommands = computed<ShipEditorCommand[]>(() => [...this.defaultCommands(), ...this.customCommands()]);

  enabledCommands = computed<ShipEditorCommand[]>(() => {
    const sc = this.slashCommands();
    if (sc === false) return [];

    if (Array.isArray(sc)) {
      return this.allCommands().filter((cmd) => sc.includes(cmd.id));
    }

    return this.allCommands();
  });

  hasSlashCommands = computed(() => !this.readonly() && this.enabledCommands().length > 0);

  filteredCommands = computed<ShipEditorCommand[]>(() => {
    const query = this.slashSearchQuery().toLowerCase().trim();
    if (!query) return this.enabledCommands();
    return this.enabledCommands().filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(query) ||
        (cmd.description && cmd.description.toLowerCase().includes(query)) ||
        cmd.id.toLowerCase().includes(query)
    );
  });

  showFormats = input<boolean>(true);
  showBlocks = input<boolean>(true);
  showLists = input<boolean>(true);
  showAlignments = input<boolean>(true);
  showInsertions = input<boolean>(true);
  showHistory = input<boolean>(true);

  customUpload = input<boolean>(false);
  imageUploadEnabled = input<boolean>(true);
  imageUpload = output<File>();

  /**
   * Block extensions to use. Defaults to the built-in set.
   * Override to customize behavior or add custom blocks.
   *
   * @example
   * ```typescript
   * import { defaultBlockExtensions, configureExtension, imageBlockExtension } from 'ship-ui/ship-editor';
   *
   * myExtensions = [
   *   ...defaultBlockExtensions.filter(e => e.type !== 'image'),
   *   configureExtension(imageBlockExtension, { defaultMode: 'content', defaultSize: 'auto' }),
   * ];
   * ```
   */
  extensions = input<ShipEditorBlockExtension[]>(defaultBlockExtensions);

  #selectedImage = signal<HTMLImageElement | null>(null);
  imgMode = signal<'content' | 'theater' | 'float' | 'custom'>('content');
  imgSize = signal<'auto' | 'small' | 'medium' | 'large'>('auto');

  /** Tracks the DOM element with an extension-driven activeClassName applied. */
  #activeBlockEl: HTMLElement | null = null;

  viewMode = signal<'design' | 'code'>('design');
  isFocused = signal<boolean>(false);
  showLinkModal = signal<boolean>(false);
  showImageModal = signal<boolean>(false);
  rawCodeValue = signal<string>('');
  showBlockMenu = signal<boolean>(false);

  isBold = signal<boolean>(false);
  isItalic = signal<boolean>(false);
  isUnderline = signal<boolean>(false);
  isStrike = signal<boolean>(false);
  align = signal<'left' | 'center' | 'right'>('left');
  activeBlock = signal<string>('p');
  canUndo = signal<boolean>(false);
  canRedo = signal<boolean>(false);

  #savedRange: Range | null = null;
  #savedLogicalSelection: { start: LogicalPosition; end: LogicalPosition } | null = null;
  /** When true, `onSelectionChange` won't overwrite `#savedLogicalSelection`.
   *  Locked when the editor loses focus (modals, blur) and unlocked only by
   *  explicit user interaction (mousedown, keyboard input). */
  #selectionLocked = false;
  #previousDocState: ShipEditorDocument = [];

  documentState = signal<ShipEditorDocument>([]);

  getBlockInlineHTML(block: any): string {
    return inlineToHTML((block?.content as ShipEditorInlineNode[]) || []) || '<br>';
  }

  getCodeText(block: ShipEditorBlock): string {
    return ((block.content as ShipEditorInlineNode[]) || []).map((node) => node.text || '').join('');
  }

  getImageClass(block: ShipEditorBlock): string {
    const mode = block.attrs?.mode || 'content';
    const size = block.attrs?.size || 'auto';
    if (mode === 'content' || mode === 'theater') {
      return `sh-editor-img-${mode}`;
    }
    return `sh-editor-img-${mode} sh-editor-img-size-${size}`;
  }

  #saveAndRestoreSelection(action: () => void) {
    if (!this.#isBrowser || this.viewMode() === 'code') {
      action();
      return;
    }

    const editor = this.editorRef()?.nativeElement;
    const saved = editor ? EditorSelection.read(editor) : null;

    action();

    // Synchronous caret restoration — the action uses innerHTML which is
    // synchronous, so the new DOM nodes are immediately available.
    if (saved && editor) {
      EditorSelection.apply(editor, this.documentState(), saved.start, saved.end);
    }
  }

  charCount = signal<number>(0);
  wordCount = signal<number>(0);

  onChange: (value: ShipEditorValue) => void = () => {};
  onTouched: () => void = () => {};

  hostClasses = shipComponentClasses('editor', {
    color: this.color,
    variant: this.variant,
    readonly: this.readonly,
  });

  #isWriting = false;
  #lastFormat: 'json' | 'html' | 'markdown' | null = null;

  /** Set the document state and increment the version counter for history deduplication. */
  #setDocumentState(doc: ShipEditorDocument) {
    this.#docVersion++;
    this.documentState.set(doc);

    // Update word/char counts from the AST. This is the single source of truth for
    // programmatic doc changes (transactions, undo, paste, etc.). The onDOMInput()
    // handler provides instant counts from editor.textContent during typing.
    const text = getJSONText(doc)
      .replace(/\u00a0/g, ' ')
      .trim();
    this.charCount.set(text.length);
    this.wordCount.set(text === '' ? 0 : text.split(/\s+/).filter((w) => w.length > 0).length);
  }

  /** Run a callback while suppressing feedback loops (DOM→model→DOM cycles). */
  #runWithoutFeedback(fn: () => void) {
    this.#isWriting = true;
    try {
      fn();
    } finally {
      this.#isWriting = false;
    }
  }

  /**
   * Unified state commit: AST → signals → serialized value → DOM.
   * Every document mutation should go through this single path to keep
   * state, value, and DOM in sync and avoid forgotten guards.
   */
  #commitDocument(
    newDoc: ShipEditorDocument,
    options?: {
      /** Wrap in #runWithoutFeedback to suppress DOM→model→DOM loops. */
      suppressFeedback?: boolean;
      /** Set #isInternalDOMUpdate to block stale selectionchange events. */
      guardSelectionChange?: boolean;
      /** Preserve scroll position across the DOM re-render. */
      preserveScroll?: boolean;
      /** Skip DOM render (caller handles it or no editor ref). */
      skipRender?: boolean;
    }
  ) {
    const opts = {
      suppressFeedback: false,
      guardSelectionChange: false,
      preserveScroll: false,
      skipRender: false,
      ...options,
    };

    if (opts.guardSelectionChange) this.#isInternalDOMUpdate = true;

    const oldDoc = this.#previousDocState;

    const commit = () => {
      this.#setDocumentState(newDoc);
      this.#updateValueFromState();

      if (!opts.skipRender) {
        const editor = this.editorRef()?.nativeElement;
        if (editor) {
          const scrollTop = opts.preserveScroll ? editor.scrollTop : undefined;
          const scrollLeft = opts.preserveScroll ? editor.scrollLeft : undefined;

          // Use incremental patching when we have a previous state to diff against
          // and the editor already has children (not a first render).
          if (oldDoc.length > 0 && editor.children.length > 0) {
            this.#patchDOM(oldDoc, newDoc);
          } else {
            this.#renderHTMLToDOM(jsonToHTML(newDoc, this.#registry));
          }

          if (scrollTop !== undefined) editor.scrollTop = scrollTop;
          if (scrollLeft !== undefined) editor.scrollLeft = scrollLeft;
        }
      }

      this.#previousDocState = newDoc;
    };

    if (opts.suppressFeedback) {
      this.#runWithoutFeedback(commit);
    } else {
      commit();
    }
  }

  /**
   * Serialize an AST to the current format and push to the value signal.
   * Centralises the format-branching logic used by #updateValueFromState,
   * setHTML, setMarkdown, and setJSON.
   */
  #serializeASTToValue(ast: ShipEditorDocument): ShipEditorValue {
    const currentFormat = this.format();

    if (currentFormat === 'json') {
      this.value.set(ast);
      this.#lastValueWrittenFromDOM = ast;
      this.onChange(ast);
      this.rawCodeValue.set(JSON.stringify(ast, null, 2));
      return ast;
    } else {
      const html = jsonToHTML(ast, this.#registry);
      if (currentFormat === 'html') {
        this.value.set(html);
        this.#lastValueWrittenFromDOM = html;
        this.onChange(html);
        return html;
      } else if (currentFormat === 'markdown') {
        const md = htmlToMarkdown(html, this.#document, this.#registry);
        this.value.set(md);
        this.#lastValueWrittenFromDOM = md;
        this.onChange(md);
        this.rawCodeValue.set(md);
        return md;
      }
    }
    return null;
  }

  #linkModalFocusEffect = effect(() => {
    if (this.showLinkModal()) {
      const linkInput = this.linkInput();
      if (linkInput) {
        linkInput.nativeElement.focus();
      }
    }
  });

  #imageModalFocusEffect = effect(() => {
    if (this.showImageModal()) {
      // Defer focus to next render so Angular has rendered the @if block
      afterNextRender(
        () => {
          const imageInput = this.imageInput();
          if (imageInput) {
            imageInput.nativeElement.focus();
          }
        },
        { injector: this.#injector }
      );
    }
  });

  #valueSyncEffect = effect(() => {
    const val = this.value();
    const editor = this.editorRef()?.nativeElement;

    if (editor && editor !== this.#lastEditorElement) {
      this.#lastEditorElement = editor;
      this.#lastValueWrittenFromDOM = undefined;
    }

    if (val === this.#lastValueWrittenFromDOM) return;
    this.#syncModelToDOM(val);
  });

  #formatSwitchEffect = effect(() => {
    const fmt = this.format();
    const prev = this.#lastFormat;
    this.#lastFormat = fmt;

    if (prev !== null && prev !== fmt) {
      const val = this.value();

      let html = '';
      if (prev === 'html' && typeof val === 'string') {
        html = val;
      } else if (prev === 'markdown' && typeof val === 'string') {
        html = markdownToHTML(val, this.#registry);
      } else if (prev === 'json' && Array.isArray(val)) {
        html = jsonToHTML(val, this.#registry);
      }

      let newValue: ShipEditorValue = '';
      if (fmt === 'html') {
        newValue = html;
      } else if (fmt === 'markdown') {
        newValue = htmlToMarkdown(html, this.#document, this.#registry);
      } else if (fmt === 'json') {
        newValue = htmlToJSON(html, this.#document, this.#registry);
      }

      this.#runWithoutFeedback(() => {
        this.value.set(newValue);
        this.#lastValueWrittenFromDOM = newValue;
        this.onChange(newValue);

        if (fmt === 'markdown' && typeof newValue === 'string') {
          this.rawCodeValue.set(newValue);
        } else if (fmt === 'json' && Array.isArray(newValue)) {
          this.rawCodeValue.set(JSON.stringify(newValue, null, 2));
        } else {
          this.rawCodeValue.set(html);
        }

        const ast = htmlToJSON(html, this.#document, this.#registry);
        this.#saveAndRestoreSelection(() => {
          this.#setDocumentState(ast);
        });
      });
    }
  });

  // Word/char counts are updated synchronously in #setDocumentState() (for programmatic
  // changes) and in onDOMInput() (for instant typing feedback). No async effect needed.

  #toolbarVisibilityEffect = effect(() => {
    this.showFormats();
    this.showBlocks();
    this.showLists();
    this.showAlignments();
    this.showInsertions();
    this.showHistory();
    this.toolbar();
    this.readonly();
    this.#initializeToolbarTabindexes();
  });

  constructor() {
    // Register mark extensions once (these aren't configurable via input yet)
    this.#registry.registerDefaultMarks();

    // Register block extensions from the input — defaults to defaultBlockExtensions
    effect(() => {
      const exts = this.extensions();
      this.#registry.clearBlocks();
      exts.forEach((ext) => this.#registry.registerBlock(ext));
    });
  }

  ngAfterViewInit() {
    this.#syncModelToDOM(this.value());
    this.#registry.getAllBlocks().forEach((ext) => ext.onInit?.(this));
    this.#registry.getAllMarks().forEach((ext) => ext.onInit?.(this));
  }

  ngOnDestroy() {
    this.#savedRange = null;
    if (this.#valueUpdateTimeout) {
      clearTimeout(this.#valueUpdateTimeout);
    }
    this.#registry.getAllBlocks().forEach((ext) => ext.onDestroy?.(this));
    this.#registry.getAllMarks().forEach((ext) => ext.onDestroy?.(this));
  }

  writeValue(obj: ShipEditorValue): void {
    this.#runWithoutFeedback(() => {
      this.value.set(obj);
      this.#syncModelToDOM(obj);
    });
  }

  registerOnChange(fn: (value: ShipEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(_isDisabled: boolean): void {
    // CVA disabled state not supported — use the [readonly] signal input instead
  }

  #stripCompiledMarkup(html: string): string {
    if (!html) return '';
    let clean = html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s*_ngcontent-[a-z0-9-]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?/gi, '')
      .replace(/\s*_nghost-[a-z0-9-]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?/gi, '')
      .replace(/\s*ng-[a-z0-9-]+(?:="[^"]*"|='[^']*'|=[^\s>]+)?/gi, '')
      .replace(/\s*data-block-index="[0-9]+"/gi, '')
      .replace(/\s*data-item-index="[0-9]+"/gi, '');

    clean = clean.replace(/class="([^"]*)sh-editor-active-block([^"]*)"/gi, (match, p1, p2) => {
      const remaining = (p1 + p2).replace(/\s+/g, ' ').trim();
      return remaining ? `class="${remaining}"` : '';
    });

    // Remove any trailing spaces inside tag brackets (e.g. <p > -> <p>)
    clean = clean.replace(/\s+(?=>)/g, '');

    return clean;
  }

  /** Decorate a single block DOM element with data attributes and extension hooks. */
  #decorateBlockEl(el: Element, doc: ShipEditorDocument, idx: number) {
    el.setAttribute('data-block-index', idx.toString());
    const tag = el.tagName.toLowerCase();
    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll(':scope > li'));
      items.forEach((item, itemIdx) => {
        item.setAttribute('data-item-index', itemIdx.toString());
      });
    }

    const block = doc[idx];
    if (block) {
      const ext = this.#registry.getBlock(block.type);
      if (ext?.onBlockRender) {
        ext.onBlockRender(el as HTMLElement, block, idx);
      }
    }
  }

  /** Full innerHTML render — used for initial load and external value sets. */
  #renderHTMLToDOM(html: string) {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    editor.innerHTML = html;

    const doc = this.documentState();
    Array.from(editor.children).forEach((child, idx) => {
      this.#decorateBlockEl(child, doc, idx);
    });
  }

  /**
   * Incremental block-level DOM patching.
   *
   * Diffs oldDoc vs newDoc using reference equality (===) on block objects.
   * Only blocks that changed get their DOM element replaced; unchanged blocks
   * keep the same DOM node, so selection Ranges pointing at them stay valid.
   */
  #patchDOM(oldDoc: ShipEditorDocument, newDoc: ShipEditorDocument) {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const maxLen = Math.max(oldDoc.length, newDoc.length);

    for (let i = 0; i < maxLen; i++) {
      const oldBlock = oldDoc[i];
      const newBlock = newDoc[i];
      const existingEl = editor.children[i] as Element | undefined;

      if (!newBlock && existingEl) {
        // Block was removed
        existingEl.remove();
        // After removal, don't increment — the next element slides into [i]
        continue;
      }

      if (!oldBlock && newBlock) {
        // Block was added
        const el = this.#blockToElement(newBlock);
        this.#decorateBlockEl(el, newDoc, i);
        editor.appendChild(el);
        continue;
      }

      if (oldBlock !== newBlock && newBlock) {
        // Block changed — replace just this element
        const el = this.#blockToElement(newBlock);
        this.#decorateBlockEl(el, newDoc, i);
        if (existingEl) {
          existingEl.replaceWith(el);
        } else {
          editor.appendChild(el);
        }
        continue;
      }

      // Same reference — DOM node survives, just update the index attribute
      // in case blocks before it were added/removed.
      if (existingEl) {
        existingEl.setAttribute('data-block-index', i.toString());
      }
    }

    // Remove any trailing DOM elements if newDoc is shorter
    while (editor.children.length > newDoc.length) {
      editor.lastElementChild?.remove();
    }
  }

  /** Convert a single block to a DOM element. */
  #blockToElement(block: ShipEditorBlock): Element {
    const html = blockToHTML(block, this.#registry);
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstElementChild || document.createElement('p');
  }

  #syncModelToDOM(val: ShipEditorValue) {
    let ast: ShipEditorDocument = [];
    let html = '';

    if (val === null || val === undefined || val === '') {
      ast = [{ type: 'paragraph', content: [] }];
      html = '<p><br></p>';
    } else if (Array.isArray(val)) {
      ast = val;
      html = jsonToHTML(val, this.#registry);
    } else if (typeof val === 'string') {
      if (this.format() === 'markdown') {
        html = markdownToHTML(val, this.#registry);
      } else {
        html = val;
      }
      ast = htmlToJSON(html, this.#document, this.#registry);
    }

    const isNewValue = val !== this.#lastValueWrittenFromDOM;

    if (this.format() === 'markdown' && typeof val === 'string') {
      this.rawCodeValue.set(val);
    } else if (this.format() === 'json' && Array.isArray(val)) {
      this.rawCodeValue.set(JSON.stringify(val, null, 2));
    } else {
      this.rawCodeValue.set(html);
    }

    this.#lastValueWrittenFromDOM = val;

    this.#saveAndRestoreSelection(() => {
      this.#setDocumentState(ast);
      this.#renderHTMLToDOM(html);
      this.#previousDocState = ast;
    });

    if (isNewValue) {
      this.#historyStack = [];
      this.#historyIndex = -1;
    }
    if (this.#historyStack.length === 0) {
      this.#saveHistory();
    }
    this.#updateHistoryStates();
  }

  #updateValueFromDOM() {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const rawHtml = editor.innerHTML;
    // Phase 1: Build AST (Internal State) - Fast
    const initialAst = htmlToJSON(rawHtml, this.#document, this.#registry);
    let cleanHtml = this.#stripCompiledMarkup(jsonToHTML(initialAst, this.#registry));

    if (cleanHtml === '' || cleanHtml === '<br>' || cleanHtml === '<p><br></p>') {
      cleanHtml = '';
    }

    const ast = htmlToJSON(cleanHtml, this.#document, this.#registry);

    this.#runWithoutFeedback(() => {
      this.#saveAndRestoreSelection(() => {
        this.#setDocumentState(ast);
      });

      // Phase 2: Serialize & Emit Value - Debounced for performance
      if (this.#valueUpdateTimeout) {
        clearTimeout(this.#valueUpdateTimeout);
      }

      const format = this.format();
      // Heuristic: Use longer debounce for heavy markdown serialization on large docs
      const isHeavy = format === 'markdown' && rawHtml.length > 5000;
      const emitDelay = isHeavy ? 800 : 200;

      this.#valueUpdateTimeout = setTimeout(() => {
        this.#lastValueWrittenFromDOM = this.#serializeASTToValue(ast);
        this.#saveHistory();
      }, emitDelay);
    });
  }

  onDOMInput() {
    // User is actively typing — unlock the selection.
    // Keep locked if a modal is open (shouldn't happen, but safety guard).
    if (!this.showImageModal() && !this.showLinkModal()) {
      this.#selectionLocked = false;
    }
    // Update internal metrics (character and word tracking) instantly via local evaluations
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      const textContent = editor.textContent || '';
      this.charCount.set(textContent.length);
      this.wordCount.set(textContent.trim() === '' ? 0 : textContent.trim().split(/\s+/).length);

      // Run extension onBlockRender for image blocks after browser-native DOM mutations
      const imgExt = this.#registry.getBlock('image');
      if (imgExt?.onBlockRender) {
        const imgs = editor.querySelectorAll('img');
        imgs.forEach((img) => {
          const blockEl = img.closest('[data-block-index]') as HTMLElement;
          if (blockEl) {
            const idx = parseInt(blockEl.getAttribute('data-block-index') || '0', 10);
            imgExt.onBlockRender!(blockEl, { type: 'image' }, idx);
          }
        });
      }
    }

    const selection = window.getSelection();
    let saveImmediately = false;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType === 3) {
        // Node.TEXT_NODE
        const char = textNode.textContent?.charAt(range.startOffset - 1);
        if (char && /[\s.,!?;/]/.test(char)) {
          saveImmediately = true;
        }
      }
    }

    if (this.#typingTimeout) {
      clearTimeout(this.#typingTimeout);
    }

    const delay = saveImmediately ? 50 : 500;
    this.#typingTimeout = setTimeout(() => {
      this.#updateValueFromDOM();
    }, delay);
  }

  onDOMFocusOut(event: FocusEvent) {
    const relatedTarget = event.relatedTarget as HTMLElement | null;
    const editor = this.editorRef()?.nativeElement;

    // If focus moved to a toolbar button or any element inside our editor component,
    // immediately refocus the contenteditable to keep the selection alive.
    // BUT: don't refocus when a modal is open — the modal should trap focus.
    if (relatedTarget && editor && !this.showImageModal() && !this.showLinkModal()) {
      const hostEl = editor.closest('sh-editor');
      if (hostEl?.contains(relatedTarget)) {
        // Schedule refocus on the next microtask so Angular's click handler
        // still fires on the toolbar button.
        queueMicrotask(() => editor.focus());
        return;
      }
    }

    // Genuine blur — focus left the editor entirely.
    this.isFocused.set(false);
    this.#selectionLocked = true;
    this.onTouched();

    // Clear selection so text doesn't appear selected when editor is unfocused.
    const selection = window.getSelection();
    if (selection && editor?.contains(selection.anchorNode)) {
      selection.removeAllRanges();
    }

    // Flush any pending debounced updates immediately on blur
    if (this.#typingTimeout) {
      clearTimeout(this.#typingTimeout);
      this.#updateValueFromDOM();
    }

    // We also need to ensure the Phase 2 (serialization) is flushed
    if (this.#valueUpdateTimeout) {
      clearTimeout(this.#valueUpdateTimeout);
      const ast = this.documentState();
      this.#lastValueWrittenFromDOM = this.#serializeASTToValue(ast);
    }
  }

  onBeforeInput(event: InputEvent) {
    if (this.readonly() || this.viewMode() === 'code') return;

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const position = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
    if (!position) return;

    const type = event.inputType;

    if (type === 'insertParagraph' || type === 'insertLineBreak') {
      event.preventDefault();

      // Delegate to extension onBlockKeydown if the block type has one
      const currentBlock = this.documentState()[position.blockIndex];
      if (currentBlock) {
        const ext = this.#registry.getBlock(currentBlock.type);
        if (ext?.onBlockKeydown) {
          const editorEl = this.editorRef()?.nativeElement;
          const blockEl = editorEl?.children[position.blockIndex] as HTMLElement;
          const ctx: ShipEditorBlockContext = {
            position,
            blockEl,
            doc: this.documentState(),
          };
          const result = ext.onBlockKeydown(event, ctx);
          if (result !== false) {
            this.#updateStateAndCaret(result.doc, result.position);
            return;
          }
        }
      }

      const doc = this.documentState();
      const { doc: newDoc, newPosition } = splitBlock(doc, position);
      this.#updateStateAndCaret(newDoc, newPosition);
    } else if (type === 'deleteContentBackward') {
      // Backspace
      // Intercept if caret is at the start of a block
      if (position.inlineIndex === 0 && position.offset === 0) {
        event.preventDefault();
        const doc = this.documentState();
        const { doc: newDoc, newPosition } = mergeBlocks(doc, position);
        this.#updateStateAndCaret(newDoc, newPosition);
      }
    } else if (type === 'deleteContentForward') {
      // Delete key — merge with the next block when caret is at the end.
      // Only intercept at block boundaries; let the browser handle mid-block deletes.
      const doc = this.documentState();
      const block = doc[position.blockIndex];
      if (block) {
        const content = (Array.isArray(block.content) ? block.content : []) as ShipEditorInlineNode[];
        const lastIdx = Math.max(0, content.length - 1);
        const lastLen = content[lastIdx]?.text?.length || 0;
        const isAtEnd = position.inlineIndex >= lastIdx && position.offset >= lastLen;
        if (isAtEnd) {
          const result = mergeBlockForward(doc, position);
          event.preventDefault();
          this.#updateStateAndCaret(result.doc, result.newPosition);
        }
      }
    }
  }

  #updateStateAndCaret(newDoc: ShipEditorDocument, newPosition: LogicalPosition) {
    this.#commitDocument(newDoc, { preserveScroll: true });

    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      // Synchronous caret restoration — #commitDocument uses innerHTML which
      // is synchronous, so the new DOM nodes are immediately available.
      EditorSelection.apply(editor, this.documentState(), newPosition, null, { scrollIntoView: true });
      this.onSelectionChange();
    }
  }

  #updateValueFromState() {
    this.#runWithoutFeedback(() => {
      this.#serializeASTToValue(this.documentState());
    });
  }

  onCodeInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.rawCodeValue.set(textarea.value);
  }

  onCodeBlur(event: Event) {
    this.isFocused.set(false);
    const textarea = event.target as HTMLTextAreaElement;
    const codeVal = textarea.value;

    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();

      if (currentFormat === 'html') {
        this.value.set(codeVal);
        this.onChange(codeVal);
      } else if (currentFormat === 'markdown') {
        this.value.set(codeVal);
        this.onChange(codeVal);
      } else if (currentFormat === 'json') {
        try {
          const parsed = JSON.parse(codeVal);
          this.value.set(parsed);
          this.onChange(parsed);
        } catch {
          /* JSON parse error in code view — ignored */
        }
      }
    });
    this.onTouched();
  }

  /** Command registry for formatText(). Keys are lowercase-normalized. */
  readonly #formatCommands: ReadonlyMap<string, (value?: string) => void> = new Map([
    ['bold', () => this.applyInlineStyle('strong')],
    ['italic', () => this.applyInlineStyle('em')],
    ['underline', () => this.applyInlineStyle('u')],
    ['strikethrough', () => this.applyInlineStyle('s')],
    ['undo', () => this.undo()],
    ['redo', () => this.redo()],
    ['insertunorderedlist', () => this.toggleList('ul')],
    ['insertorderedlist', () => this.toggleList('ol')],
    ['inserthorizontalrule', () => this.insertHorizontalRule()],
    ['removeformat', () => this.removeFormat()],
    ['justifyleft', () => this.setAlign('left')],
    ['justifycenter', () => this.setAlign('center')],
    ['justifyright', () => this.setAlign('right')],
    ['formatblock', (v?: string) => this.setBlockType(v ?? '')],
  ]);

  /** Resolve a format command by name (case-insensitive). */
  #getFormatCommand(command: string): ((value?: string) => void) | undefined {
    return this.#formatCommands.get(command.toLowerCase());
  }

  formatText(command: string, value: string = '') {
    if (this.readonly()) return;
    if (this.viewMode() === 'code') return;

    this.#getFormatCommand(command)?.(value);
  }

  runTransaction(
    action: (
      doc: ShipEditorDocument,
      selection: { start: LogicalPosition; end: LogicalPosition }
    ) =>
      | {
          doc?: ShipEditorDocument;
          selectionShift?: {
            start: { blockIndex: number; listItemIndex?: number };
            end: { blockIndex: number; listItemIndex?: number };
          };
        }
      | ShipEditorDocument
      | void
      | null
  ) {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    // When the selection is locked (editor blurred / modal open), the DOM
    // selection is unreliable (browser defaults to position 0 on re-focus).
    // Use the saved logical selection which was captured before the lock.
    // When unlocked (normal editing), the live DOM selection is authoritative.
    let startLogical: LogicalPosition;
    let endLogical: LogicalPosition;

    if (this.#selectionLocked && this.#savedLogicalSelection) {
      startLogical = this.#savedLogicalSelection.start;
      endLogical = this.#savedLogicalSelection.end;
    } else {
      const sel = EditorSelection.read(editor);
      if (sel) {
        startLogical = sel.start;
        endLogical = sel.end ?? sel.start;
      } else if (this.#savedLogicalSelection) {
        startLogical = this.#savedLogicalSelection.start;
        endLogical = this.#savedLogicalSelection.end;
      } else {
        return;
      }
    }

    const docBefore = this.documentState();

    // Core functions (formatDocRange, splitBlock, etc.) handle structural sharing internally.
    // No need to deep-clone the entire doc upfront.
    const result = action(docBefore, { start: startLogical, end: endLogical });
    if (result === null) return;

    let newDoc: ShipEditorDocument;
    let targetSelectionShift:
      | {
          start: { blockIndex: number; listItemIndex?: number };
          end: { blockIndex: number; listItemIndex?: number };
        }
      | undefined = undefined;

    if (Array.isArray(result)) {
      newDoc = result;
    } else if (result && typeof result === 'object') {
      newDoc = result.doc || docBefore;
      targetSelectionShift = result.selectionShift;
    } else {
      newDoc = docBefore;
    }

    this.#saveHistory();
    this.#commitDocument(newDoc, { guardSelectionChange: true });

    // Map selection from pre-mutation to post-mutation coordinates and restore.
    const docAfter = this.documentState();
    const mapped = EditorSelection.mapAcrossMutation(
      startLogical,
      endLogical,
      docBefore,
      docAfter,
      targetSelectionShift
    );
    EditorSelection.apply(editor, docAfter, mapped.start, mapped.end);

    // Immediately capture the just-applied selection so rapid toolbar clicks
    // always have a known-good saved state, even if onSelectionChange hasn't
    // fired yet due to the #isInternalDOMUpdate guard.
    this.#savedRange = EditorSelection.saveRange(editor);
    this.#savedLogicalSelection = { start: mapped.start, end: mapped.end };

    this.#saveHistory();
    // Clear the guard so our explicit onSelectionChange() call can save the
    // correct selection range and update formatting state signals.
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
    // Re-activate the guard to block any browser-queued selectionchange events
    // that fire because innerHTML destroyed the old DOM nodes. These stale events
    // would otherwise overwrite #savedRange with a collapsed/wrong range.
    // The guard is cleared on the next microtask, after those events have passed.
    this.#isInternalDOMUpdate = true;
    queueMicrotask(() => {
      this.#isInternalDOMUpdate = false;
    });
  }

  applyInlineStyle(tag: string) {
    let markType = '';
    const cleanTag = tag.toLowerCase();
    if (cleanTag === 'strong' || cleanTag === 'b') markType = 'bold';
    else if (cleanTag === 'em' || cleanTag === 'i') markType = 'italic';
    else if (cleanTag === 'u') markType = 'underline';
    else if (cleanTag === 's' || cleanTag === 'del') markType = 'strike';
    else if (cleanTag === 'code') markType = 'code';

    // Fall back to registry: look up mark type by tagName for custom extensions
    if (!markType) {
      const ext = this.#registry.getAllMarks().find((m) => m.tagName === cleanTag);
      if (ext) markType = ext.type;
    }

    if (!markType) return;

    this.runTransaction((doc, selection) => {
      return formatDocRange(doc, selection.start, selection.end, markType, 'toggle');
    });
  }

  toggleLink(url: string) {
    this.runTransaction((doc, selection) => {
      if (!url) {
        return formatDocRange(doc, selection.start, selection.end, 'link', 'remove');
      } else {
        return formatDocRange(doc, selection.start, selection.end, 'link', 'add', { href: url, target: '_blank' });
      }
    });
  }

  setBlockType(tag: string) {
    this.runTransaction((doc, selection) => {
      const targetTag = tag.toLowerCase();
      let newType: ShipEditorBlock['type'] = 'paragraph';
      let newAttrs: Record<string, any> = {};

      if (targetTag === 'p') {
        newType = 'paragraph';
      } else if (targetTag.startsWith('h') && targetTag.length === 2 && !isNaN(parseInt(targetTag.substring(1)))) {
        newType = 'heading';
        newAttrs = { level: parseInt(targetTag.substring(1)) };
      } else if (targetTag === 'blockquote') {
        newType = 'quote';
      } else if (targetTag === 'info-callout') {
        newType = 'info-callout';
      } else if (targetTag === 'pre') {
        newType = 'code-block';
        newAttrs = { language: '' };
      } else {
        // Fallback: look up the type in the registry (supports custom blocks like 'callout')
        const registeredBlock = this.#registry.getBlock(targetTag);
        if (registeredBlock) {
          newType = registeredBlock.type;
        }
      }

      const res = setBlockTypeInDoc(doc, selection, newType, newAttrs);
      if (!res) return null;

      return {
        doc: res.doc,
        selectionShift: res.selectionShift,
      };
    });
  }

  toggleList(listType: 'ul' | 'ol') {
    this.runTransaction((doc, selection) => {
      const res = toggleListInDoc(doc, selection, listType);
      if (!res) return null;

      return {
        doc: res.doc,
        selectionShift: res.selectionShift,
      };
    });
  }

  insertHorizontalRule() {
    this.runTransaction((doc, selection) => {
      const { doc: splitDoc } = splitBlock(doc, selection.start);
      const hrBlock: ShipEditorBlock = { type: 'hr' };
      splitDoc.splice(selection.start.blockIndex + 1, 0, hrBlock);

      return {
        doc: splitDoc,
        selectionShift: {
          start: { blockIndex: selection.start.blockIndex + 2, listItemIndex: undefined },
          end: { blockIndex: selection.start.blockIndex + 2, listItemIndex: undefined },
        },
      };
    });
  }

  setAlign(direction: 'left' | 'center' | 'right') {
    this.runTransaction((doc, selection) => {
      const block = doc[selection.start.blockIndex];
      if (block) {
        if (!block.attrs) block.attrs = {};
        if (block.attrs.align === direction) {
          delete block.attrs.align;
        } else {
          block.attrs.align = direction;
        }
      }
    });
  }

  removeFormat() {
    this.runTransaction((doc, selection) => {
      return clearDocRangeFormatting(doc, selection.start, selection.end);
    });
  }

  undo() {
    if (this.#historyIndex <= 0) return;
    this.#historyIndex--;
    this.#restoreHistoryState(this.#historyStack[this.#historyIndex]);
  }

  redo() {
    if (this.#historyIndex >= this.#historyStack.length - 1) return;
    this.#historyIndex++;
    this.#restoreHistoryState(this.#historyStack[this.#historyIndex]);
  }

  #saveHistory() {
    if (!this.#isBrowser) return;
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const doc = this.documentState();

    const selectionState = EditorSelection.read(editor);

    if (this.#historyIndex >= 0 && this.#historyStack[this.#historyIndex].docVersion === this.#docVersion) {
      if (selectionState) {
        this.#historyStack[this.#historyIndex].selection = selectionState;
      }
      return;
    }

    if (this.#historyIndex < this.#historyStack.length - 1) {
      this.#historyStack = this.#historyStack.slice(0, this.#historyIndex + 1);
    }

    this.#historyStack.push({
      doc: cloneDoc(doc),
      docVersion: this.#docVersion,
      selection: selectionState,
    });
    if (this.#historyStack.length > this.#maxHistorySize) {
      this.#historyStack.shift();
    } else {
      this.#historyIndex++;
    }

    this.#updateHistoryStates();
  }

  #restoreHistoryState(state: {
    doc: ShipEditorDocument;
    selection: {
      start: LogicalPosition;
      end: LogicalPosition | null;
      isCollapsed: boolean;
    } | null;
  }) {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const docCopy = cloneDoc(state.doc);
    this.#commitDocument(docCopy, { suppressFeedback: true });

    const sel = state.selection;
    if (sel) {
      // Synchronous caret restoration — DOM is already updated by #commitDocument.
      EditorSelection.apply(editor, this.documentState(), sel.start, sel.end);
    }
    this.#updateHistoryStates();
  }

  toggleViewMode() {
    const nextMode = this.viewMode() === 'design' ? 'code' : 'design';
    this.viewMode.set(nextMode);

    // Wait for Angular to render the toggled @if block, then sync and focus
    afterNextRender(
      () => {
        if (nextMode === 'design') {
          const editor = this.editorRef()?.nativeElement;
          if (editor) {
            this.#syncModelToDOM(this.value());
            editor.focus();
          }
        } else {
          const codeEditor = this.codeEditorRef()?.nativeElement;
          if (codeEditor) {
            codeEditor.focus();
          }
        }
        this.#updateHistoryStates();
      },
      { injector: this.#injector }
    );
  }

  #updateHistoryStates() {
    if (!this.#isBrowser || this.viewMode() === 'code') {
      this.canUndo.set(false);
      this.canRedo.set(false);
      return;
    }
    this.canUndo.set(this.#historyIndex > 0);
    this.canRedo.set(this.#historyIndex < this.#historyStack.length - 1);
  }

  #restoreSelection() {
    if (!this.#isBrowser) return;
    const editor = this.editorRef()?.nativeElement;
    if (!editor || !this.#savedRange) return;

    // Only restore if the selection is not already inside the editor
    // (i.e. focus was lost to a toolbar button or modal).
    const currentSel = EditorSelection.read(editor);
    if (!currentSel) {
      editor.focus();
      EditorSelection.restoreRange(this.#savedRange);
    }
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    if (!this.#isBrowser) return;
    this.#updateHistoryStates();
    if (this.readonly() || this.viewMode() === 'code') return;

    // During internal DOM updates (e.g. after formatting), the browser fires
    // selectionchange because the old nodes are destroyed. Skip saving the range
    // here — runTransaction will restore the correct selection asynchronously.
    if (this.#isInternalDOMUpdate) return;

    const editorEl = this.editorRef()?.nativeElement;
    if (!editorEl) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editorEl.contains(range.commonAncestorContainer)) return;

    // Save selection range for modal operations.
    // Skip when locked — the editor lost focus (modal/blur) and the browser's
    // selectionchange on re-focus would clobber the correct saved position.
    if (!this.#selectionLocked) {
      this.#savedRange = EditorSelection.saveRange(editorEl);
      const logicalSel = EditorSelection.read(editorEl);
      if (logicalSel) {
        this.#savedLogicalSelection = {
          start: logicalSel.start,
          end: logicalSel.end ?? logicalSel.start,
        };
      }
    }

    // DOM tree traversal for formatting active states
    let current: Node | null = range.commonAncestorContainer;
    let bold = false;
    let italic = false;
    let underline = false;
    let strike = false;
    let textAlign: 'left' | 'center' | 'right' = 'left';

    while (current && current !== editorEl) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const el = current as HTMLElement;
        const tag = el.tagName.toLowerCase();

        if (tag === 'strong' || tag === 'b') bold = true;
        if (tag === 'em' || tag === 'i') italic = true;
        if (tag === 'u') underline = true;
        if (tag === 's' || tag === 'del') strike = true;

        if (['p', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'li'].includes(tag)) {
          const alignValue = el.style.textAlign || window.getComputedStyle(el).textAlign;
          if (alignValue === 'center') textAlign = 'center';
          else if (alignValue === 'right') textAlign = 'right';
          else textAlign = 'left';
        }
      }
      current = current.parentNode;
    }

    this.isBold.set(bold);
    this.isItalic.set(italic);
    this.isUnderline.set(underline);
    this.isStrike.set(strike);
    this.align.set(textAlign);

    // Active block traverse
    let node: Node | null = selection.anchorNode;
    let blockType = 'p';
    while (node && node !== editorEl) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as HTMLElement).tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'blockquote', 'pre', 'ul', 'ol', 'li'].includes(tag)) {
          // Differentiate info-callout from plain blockquote
          if (tag === 'blockquote' && (node as HTMLElement).classList.contains('sh-editor-callout')) {
            blockType = 'info-callout';
          } else {
            blockType = tag;
          }
          break;
        }
      }
      node = node.parentNode;
    }
    this.activeBlock.set(blockType);

    // Track active block class for paragraph placeholders
    const activeBlocks = editorEl.querySelectorAll('.sh-editor-active-block');
    activeBlocks.forEach((b) => b.classList.remove('sh-editor-active-block'));

    let activeNode: HTMLElement | null = selection.anchorNode as HTMLElement;
    if (activeNode) {
      if (activeNode.nodeType === Node.TEXT_NODE) {
        activeNode = activeNode.parentElement;
      }
      while (activeNode && activeNode !== editorEl) {
        if (activeNode.parentElement === editorEl) {
          activeNode.classList.add('sh-editor-active-block');
          break;
        }
        activeNode = activeNode.parentElement;
      }
    }

    // Extension-driven activeClassName — add/remove on the active block's DOM element
    const topLevelBlock = activeNode;
    if (this.#activeBlockEl && this.#activeBlockEl !== topLevelBlock) {
      // Remove previous active class
      const prevIdx = this.#activeBlockEl.getAttribute('data-block-index');
      if (prevIdx !== null) {
        const prevBlock = this.documentState()[parseInt(prevIdx, 10)];
        if (prevBlock) {
          const prevExt = this.#registry.getBlock(prevBlock.type);
          if (prevExt?.activeClassName) {
            this.#activeBlockEl.classList.remove(prevExt.activeClassName);
          }
        }
      }
      this.#activeBlockEl = null;
    }
    if (topLevelBlock && topLevelBlock !== editorEl) {
      const blockIdx = topLevelBlock.getAttribute('data-block-index');
      if (blockIdx !== null) {
        const block = this.documentState()[parseInt(blockIdx, 10)];
        if (block) {
          const ext = this.#registry.getBlock(block.type);
          if (ext?.activeClassName) {
            topLevelBlock.classList.add(ext.activeClassName);
            this.#activeBlockEl = topLevelBlock;
          }
        }
      }
    }
  }

  // --- MODALS (LINK & IMAGE) ---

  openLinkModal() {
    if (!this.#selectionLocked) {
      this.#selectionLocked = true;
    }
    this.editorRef()?.nativeElement?.blur();
    this.showLinkModal.set(true);
  }

  applyLink(url: string) {
    this.showLinkModal.set(false);
    if (!url) {
      this.#restoreAfterModalCancel();
      return;
    }
    this.toggleLink(url);
  }

  cancelLinkModal() {
    this.showLinkModal.set(false);
    this.#restoreAfterModalCancel();
  }

  openImageModal() {
    if (!this.#selectionLocked) {
      this.#selectionLocked = true;
    }
    this.editorRef()?.nativeElement?.blur();
    this.showImageModal.set(true);
  }

  applyImage(url: string) {
    this.showImageModal.set(false);
    if (!url) {
      this.#restoreAfterModalCancel();
      return;
    }
    this.insertImage(url);
  }

  cancelImageModal() {
    this.showImageModal.set(false);
    this.#restoreAfterModalCancel();
  }

  /**
   * After a modal is cancelled, restore focus to the editor at the saved
   * position so the user can continue editing where they left off.
   */
  #restoreAfterModalCancel() {
    const editor = this.editorRef()?.nativeElement;
    if (editor && this.#savedLogicalSelection) {
      const pos = this.#savedLogicalSelection.start;
      this.#selectionLocked = false;
      editor.focus();
      EditorSelection.apply(editor, this.documentState(), pos, null, { scrollIntoView: true });
    } else {
      this.#selectionLocked = false;
    }
    this.#savedLogicalSelection = null;
  }

  // --- IMAGE FILE HANDLING & LAYOUT OVERLAYS ---

  #selectImage(img: HTMLImageElement) {
    this.#selectedImage.set(img);
    const { mode, size } = parseImageClassNames(img.className || '');
    this.imgMode.set(mode);
    this.imgSize.set(size);
  }

  #updateImageBlock(updater: (block: ShipEditorBlock) => void) {
    const img = this.#selectedImage();
    if (!img) return;

    const blockIndexAttr = img.getAttribute('data-block-index');
    if (blockIndexAttr === null) return;
    const blockIndex = parseInt(blockIndexAttr, 10);

    const doc = this.documentState();
    const newDoc = [...doc];
    newDoc[blockIndex] = cloneBlock(doc[blockIndex]);
    const block = newDoc[blockIndex];
    const editor = this.editorRef()?.nativeElement;

    if (block && block.type === 'image') {
      updater(block);

      this.#saveHistory();
      this.#commitDocument(newDoc, { guardSelectionChange: true });

      // Synchronous — #commitDocument uses innerHTML so the new DOM is ready.
      const newImg = this.editorRef()?.nativeElement.querySelector(
        `img[data-block-index="${blockIndex}"]`
      ) as HTMLImageElement;
      if (newImg) {
        newImg.focus();
        this.#selectedImage.set(newImg);
      }
      this.#saveHistory();
      this.#isInternalDOMUpdate = false;
    }
  }

  selectedImage = this.#selectedImage.asReadonly();

  @HostListener('focusin', ['$event'])
  onComponentFocusIn(event: FocusEvent) {
    if (!this.#isBrowser) return;
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      this.#selectImage(target as HTMLImageElement);
    }
  }

  @HostListener('click', ['$event'])
  onComponentClick(event: MouseEvent) {
    if (!this.#isBrowser) return;
    const target = event.target as HTMLElement;

    if (target && !target.closest('.sh-editor-dropdown')) {
      this.showBlockMenu.set(false);
    }

    if (target && target.tagName === 'IMG') {
      (target as HTMLElement).focus();
      const selection = window.getSelection();
      if (selection) {
        const range = this.#document.createRange();
        range.selectNode(target);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      this.#selectedImage.set(target as HTMLImageElement);
      this.#selectImage(target as HTMLImageElement);
    } else {
      // If clicking inside image context toolbar, don't dismiss
      if (target && target.closest('.sh-editor-img-context-toolbar')) {
        return;
      }
      this.#selectedImage.set(null);
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.#isBrowser) return;
    if (this.readonly()) return;

    // When an image is selected, only handle image-specific hotkeys — block all text formatting
    if (this.#selectedImage()) {
      if (this.#handleImageKeyDown(event)) return;
      // Escape deselects the image
      if (event.key === 'Escape') {
        event.preventDefault();
        this.#selectedImage.set(null);
        return;
      }
      // Arrow keys navigate to the adjacent block
      const goBack = event.key === 'ArrowUp' || event.key === 'ArrowLeft';
      const goForward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      if (goBack || goForward) {
        event.preventDefault();
        const img = this.#selectedImage()!;
        const blockIndexAttr = img.getAttribute('data-block-index');
        if (blockIndexAttr !== null) {
          const blockIndex = parseInt(blockIndexAttr, 10);
          const doc = this.documentState();
          const targetIndex = goBack ? Math.max(0, blockIndex - 1) : Math.min(doc.length - 1, blockIndex + 1);
          const targetBlock = doc[targetIndex];
          // Only move if the target block is not the image itself
          if (targetIndex !== blockIndex && targetBlock && targetBlock.type !== 'image') {
            this.#selectedImage.set(null);
            // Place caret in the target block
            const editorEl = this.editorRef()?.nativeElement;
            if (editorEl) {
              const blockEl = editorEl.children[targetIndex] as HTMLElement;
              if (blockEl) {
                blockEl.focus();
                const sel = window.getSelection();
                if (sel) {
                  const range = this.#document.createRange();
                  if (goBack) {
                    // Place caret at end of previous block
                    range.selectNodeContents(blockEl);
                    range.collapse(false);
                  } else {
                    // Place caret at start of next block
                    range.selectNodeContents(blockEl);
                    range.collapse(true);
                  }
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }
          }
        }
        return;
      }
      // Block all other modifier shortcuts (bold, italic, etc.) so they don't apply to nothing
      if (event.metaKey || event.ctrlKey) {
        return;
      }
      return;
    }

    // Registry-driven mark keybindings — custom marks with `keybinding` get shortcuts automatically
    for (const markExt of this.#registry.getAllMarks()) {
      if (markExt.keybinding && this.#keybindings.matches(event, markExt.keybinding)) {
        event.preventDefault();
        if (markExt.onKeyAction) {
          markExt.onKeyAction(this);
        } else {
          this.applyInlineStyle(markExt.tagName);
        }
        return;
      }
    }
    // Registry-driven block keybindings — custom blocks with `keybinding` get shortcuts automatically
    for (const blockExt of this.#registry.getAllBlocks()) {
      if (blockExt.keybinding && this.#keybindings.matches(event, blockExt.keybinding)) {
        event.preventDefault();
        if (blockExt.onKeyAction) {
          blockExt.onKeyAction(this);
        } else {
          this.setBlockType(blockExt.type);
        }
        return;
      }
    }
    // Non-mark keybindings (link modal, undo, redo)
    if (this.#keybindings.matches(event, 'editor.link')) {
      event.preventDefault();
      this.openLinkModal();
      return;
    }
    if (this.#keybindings.matches(event, 'editor.undo')) {
      event.preventDefault();
      this.formatText('undo');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.redo')) {
      event.preventDefault();
      this.formatText('redo');
      return;
    }

    // Heading shortcuts (Ctrl+Alt+0/1/2/3)
    if (this.#keybindings.matches(event, 'editor.heading1')) {
      event.preventDefault();
      this.setBlockType('h1');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.heading2')) {
      event.preventDefault();
      this.setBlockType('h2');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.heading3')) {
      event.preventDefault();
      this.setBlockType('h3');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.paragraph')) {
      event.preventDefault();
      this.setBlockType('p');
      return;
    }

    // Text alignment (Ctrl+Shift+L/E/R)
    if (this.#keybindings.matches(event, 'editor.alignLeft')) {
      event.preventDefault();
      this.setAlign('left');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.alignCenter')) {
      event.preventDefault();
      this.setAlign('center');
      return;
    }
    if (this.#keybindings.matches(event, 'editor.alignRight')) {
      event.preventDefault();
      this.setAlign('right');
      return;
    }

    // Remove formatting (Ctrl+\)
    if (this.#keybindings.matches(event, 'editor.removeFormat')) {
      event.preventDefault();
      this.removeFormat();
      return;
    }

    // Horizontal rule (Ctrl+Shift+-)
    if (this.#keybindings.matches(event, 'editor.horizontalRule')) {
      event.preventDefault();
      this.insertHorizontalRule();
      return;
    }

    if (this.viewMode() === 'design') {
      if (this.#handleBlockKeyDown(event)) return;

      // Tab handling for lists and indentation
      if (event.key === 'Tab') {
        event.preventDefault();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const editor = this.editorRef()?.nativeElement;
        if (!editor) return;

        const pos = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
        if (pos) {
          if (event.shiftKey) {
            this.outdent(pos);
          } else {
            this.indent(pos);
          }
        }
        return;
      }
    }
  }

  #handleBlockKeyDown(event: KeyboardEvent): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    const anchorNode = selection.anchorNode;
    if (!anchorNode) return false;

    const editorEl = this.editorRef()?.nativeElement;
    if (!editorEl) return false;

    let currentBlock: HTMLElement | null = null;
    if (anchorNode.nodeType === Node.TEXT_NODE) {
      currentBlock = anchorNode.parentElement;
    } else {
      currentBlock = anchorNode as HTMLElement;
    }

    // Traverse up to find blockquote, pre, or li
    let blockquoteEl: HTMLElement | null = null;
    let preEl: HTMLElement | null = null;
    let liEl: HTMLElement | null = null;

    let node: HTMLElement | null = currentBlock;
    while (node && node !== editorEl) {
      const tagName = node.tagName.toLowerCase();
      if (tagName === 'blockquote') {
        blockquoteEl = node;
      } else if (tagName === 'pre') {
        preEl = node;
      } else if (tagName === 'li') {
        liEl = node;
      }
      node = node.parentElement;
    }

    const position = mapDOMPositionToLogical(editorEl, range.startContainer, range.startOffset);
    if (!position) return false;

    // Delegate to extension onBlockKeydown before generic block-level handling
    const doc = this.documentState();
    const currentBlockData = doc[position.blockIndex];
    if (currentBlockData) {
      const ext = this.#registry.getBlock(currentBlockData.type);
      if (ext?.onBlockKeydown) {
        const blockEl = editorEl.children[position.blockIndex] as HTMLElement;
        const ctx: ShipEditorBlockContext = { position, blockEl, doc };
        const result = ext.onBlockKeydown(event, ctx);
        if (result !== false) {
          event.preventDefault();
          this.#updateStateAndCaret(result.doc, result.position);
          return true;
        }
      }
    }

    // 1. Exit block with Ctrl+Enter or Cmd+Enter
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      if (preEl || blockquoteEl || liEl) {
        event.preventDefault();

        const doc = this.documentState();
        const newDoc = [...doc];

        const emptyP: ShipEditorBlock = { type: 'paragraph', content: [] };
        newDoc.splice(position.blockIndex + 1, 0, emptyP);

        const newPos: LogicalPosition = {
          blockIndex: position.blockIndex + 1,
          inlineIndex: 0,
          offset: 0,
        };

        this.#updateStateAndCaret(newDoc, newPos);
        return true;
      }
    }

    // 2. Double enter on empty blockquote or list item
    if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
      if (blockquoteEl || liEl) {
        const doc = this.documentState();
        const currentBlock = doc[position.blockIndex];

        let isEmpty = false;
        if (liEl && typeof position.listItemIndex === 'number' && currentBlock) {
          const items = currentBlock.content as ShipEditorBlock[];
          const item = items[position.listItemIndex];
          isEmpty = getJSONText([item]).trim() === '';
        } else if (blockquoteEl && currentBlock) {
          isEmpty = getJSONText([currentBlock]).trim() === '';
        }

        if (isEmpty) {
          event.preventDefault();
          const newDoc = [...doc];
          let newPos: LogicalPosition;

          if (liEl && typeof position.listItemIndex === 'number') {
            newDoc[position.blockIndex] = cloneBlock(doc[position.blockIndex]);
            const listBlock = newDoc[position.blockIndex];
            const items = listBlock.content as ShipEditorBlock[];
            if (items.length <= 1) {
              newDoc.splice(position.blockIndex, 1, { type: 'paragraph', content: [] });
              newPos = {
                blockIndex: position.blockIndex,
                inlineIndex: 0,
                offset: 0,
              };
            } else {
              items.splice(position.listItemIndex, 1);
              newDoc.splice(position.blockIndex + 1, 0, { type: 'paragraph', content: [] });
              newPos = {
                blockIndex: position.blockIndex + 1,
                inlineIndex: 0,
                offset: 0,
              };
            }
          } else {
            newDoc.splice(position.blockIndex, 1, { type: 'paragraph', content: [] });
            newPos = {
              blockIndex: position.blockIndex,
              inlineIndex: 0,
              offset: 0,
            };
          }

          this.#updateStateAndCaret(newDoc, newPos);
          return true;
        }
      }
    }

    // 3. Arrow into adjacent image block
    const isForward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
    const isBackward = event.key === 'ArrowUp' || event.key === 'ArrowLeft';

    if (isForward || isBackward) {
      const doc = this.documentState();
      const blockIndex = position.blockIndex;
      const currentBlockData = doc[blockIndex];

      // Check if caret is at the boundary of the current block
      let atBoundary = false;

      if (isForward) {
        // At end of block: check if offset is at the end of the last inline node
        const blockText = currentBlockData ? getJSONText([currentBlockData]) : '';
        const totalLength = blockText.length;
        // For right/down, we need to be at the very end of the block content
        const topLevelBlock = editorEl.children[blockIndex] as HTMLElement;
        if (topLevelBlock) {
          const textContent = topLevelBlock.textContent || '';
          // Caret is at end if: at the last text position in the DOM block
          if (range.collapsed) {
            const rangeClone = range.cloneRange();
            rangeClone.selectNodeContents(topLevelBlock);
            rangeClone.setStart(range.endContainer, range.endOffset);
            atBoundary = rangeClone.toString().length === 0;
          }
        }
      } else {
        // At start of block: offset is 0 at the very beginning
        if (range.collapsed) {
          const topLevelBlock = editorEl.children[blockIndex] as HTMLElement;
          if (topLevelBlock) {
            const rangeClone = range.cloneRange();
            rangeClone.selectNodeContents(topLevelBlock);
            rangeClone.setEnd(range.startContainer, range.startOffset);
            atBoundary = rangeClone.toString().length === 0;
          }
        }
      }

      if (atBoundary) {
        const targetIndex = isForward ? blockIndex + 1 : blockIndex - 1;
        const targetBlock = doc[targetIndex];

        if (targetBlock && targetBlock.type === 'image') {
          event.preventDefault();
          const imgEl = editorEl.querySelector(`img[data-block-index="${targetIndex}"]`) as HTMLImageElement;
          if (imgEl) {
            imgEl.focus();
            this.#selectImage(imgEl);
          }
          return true;
        }
      }
    }

    return false;
  }

  #handleImageKeyDown(event: KeyboardEvent): boolean {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return false;

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return false;

    // Check if a focused image is the active element inside the editor
    const activeEl = this.#document.activeElement;
    const isImgFocused = activeEl instanceof HTMLImageElement && editor.contains(activeEl);
    const selectedImg = this.#selectedImage();

    if (isImgFocused || selectedImg) {
      const img = isImgFocused ? (activeEl as HTMLImageElement) : selectedImg;
      if (img && editor.contains(img)) {
        event.preventDefault();

        // Find the block index of the image to position the caret after deletion
        const blockEl = img.closest('[data-block-index]') as HTMLElement | null;
        const blockIdx = blockEl ? parseInt(blockEl.getAttribute('data-block-index') || '0', 10) : -1;

        this.deleteImage(img);

        // Place caret at the block that took the deleted image's position,
        // or the previous block if we deleted the last one.
        const doc = this.documentState();
        const targetIdx = Math.min(blockIdx, doc.length - 1);
        if (targetIdx >= 0) {
          const targetBlock = doc[targetIdx];
          if (targetBlock && !isVoidBlock(targetBlock)) {
            const pos: LogicalPosition = { blockIndex: targetIdx, inlineIndex: 0, offset: 0 };
            EditorSelection.apply(editor, doc, pos, null, { scrollIntoView: true });
          }
        }
        return true;
      }
    }
    return false;
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    if (!this.#isBrowser) return;
    if (this.readonly() || this.viewMode() === 'code') return;

    const sc = this.slashCommands();
    if (sc === false || (Array.isArray(sc) && sc.length === 0)) {
      this.showSlashMenu.set(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.showSlashMenu.set(false);
      return;
    }

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    const editorEl = this.editorRef()?.nativeElement;
    if (!editorEl || !editorEl.contains(textNode)) {
      this.showSlashMenu.set(false);
      return;
    }

    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent || '';
      const offset = range.startOffset;
      const textBeforeCaret = text.substring(0, offset);
      const match = textBeforeCaret.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);

      if (match) {
        this.showSlashMenu.set(true);
        this.slashSearchQuery.set(match[1]);

        this.#updateSlashMenuPosition(range);
        return;
      }
    }

    this.showSlashMenu.set(false);
  }

  executeCommand(cmd: ShipEditorCommand) {
    // Flush any pending typing debounce so the AST is current before
    // the command operates on it — prevents stale-state race conditions.
    if (this.#typingTimeout) {
      clearTimeout(this.#typingTimeout);
      this.#typingTimeout = undefined;
      this.#updateValueFromDOM();
      this.#saveHistory();
    }

    this.#restoreSelection();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType === Node.TEXT_NODE) {
        const text = textNode.textContent || '';
        const offset = range.startOffset;
        const textBeforeCaret = text.substring(0, offset);
        const match = textBeforeCaret.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
        if (match) {
          const slashIndex = textBeforeCaret.lastIndexOf('/');
          if (slashIndex !== -1) {
            // Compute the logical position from the DOM BEFORE deleting.
            // This is more reliable than re-reading the selection after
            // #updateValueFromDOM which can produce stale positions.
            const editor = this.editorRef()?.nativeElement;
            const blockEl = (textNode.parentElement)?.closest('[data-block-index]') as HTMLElement | null;
            const blockIndex = blockEl
              ? parseInt(blockEl.getAttribute('data-block-index') || '0', 10)
              : (editor ? Array.from(editor.children).indexOf(textNode.parentElement!) : 0);

            range.setStart(textNode, slashIndex);
            range.setEnd(textNode, offset);
            range.deleteContents();

            // Collapse selection to the deletion point so runTransaction
            // reads the correct cursor position (not a stale offset).
            selection.collapseToStart();

            // Sync the AST from the DOM so the slash text is gone from the document state
            this.#updateValueFromDOM();

            // Use the block index we captured from the DOM before deletion.
            // This avoids any round-trip issues from DOM→AST→selection mapping.
            this.#savedLogicalSelection = {
              start: { blockIndex, inlineIndex: 0, offset: slashIndex },
              end: { blockIndex, inlineIndex: 0, offset: slashIndex },
            };
            this.#selectionLocked = true;
          }
        }
      }
    }

    this.showSlashMenu.set(false);
    cmd.action(this);
  }

  #updateSlashMenuPosition(range: Range) {
    const editorEl = this.editorRef()?.nativeElement;
    if (!editorEl) return;

    const editorRect = editorEl.getBoundingClientRect();
    const rect = range.getBoundingClientRect();

    let top = 0;
    let left = 0;

    if (rect.top === 0 && rect.left === 0) {
      let parentNode = range.startContainer as HTMLElement;
      if (parentNode.nodeType === Node.TEXT_NODE) {
        parentNode = parentNode.parentElement as HTMLElement;
      }
      const parentRect = parentNode.getBoundingClientRect();
      top = parentRect.bottom - editorRect.top + editorEl.scrollTop + 4;
      left = parentRect.left - editorRect.left;
    } else {
      top = rect.bottom - editorRect.top + editorEl.scrollTop + 4;
      left = rect.left - editorRect.left;
    }

    this.slashMenuTop.set(top);
    this.slashMenuLeft.set(left);
  }

  getBlockLabel(): string {
    const block = this.activeBlock();
    if (block === 'h1') return 'Heading 1';
    if (block === 'h2') return 'Heading 2';
    if (block === 'h3') return 'Heading 3';
    if (block === 'blockquote') return 'Quote';
    if (block === 'info-callout') return 'Info Callout';
    if (block === 'pre') return 'Code Block';
    return 'Normal text';
  }

  toggleBlockMenu() {
    if (this.readonly()) return;
    this.showBlockMenu.update((v) => !v);
  }

  selectBlockType(tag: string) {
    this.setBlockType(tag);
    this.showBlockMenu.set(false);
  }

  onToolbarKeyDown(event: KeyboardEvent) {
    event.stopPropagation();

    if (!this.#isBrowser) return;
    const target = event.target as HTMLElement;
    const toolbarEl = target.closest('.sh-editor-toolbar');
    if (!toolbarEl) return;

    const items = Array.from(toolbarEl.querySelectorAll('.sh-editor-btn, .sh-editor-dropdown-trigger')).filter((el) => {
      const btn = el as HTMLButtonElement;
      return !btn.disabled && el.getAttribute('disabled') === null;
    }) as HTMLElement[];

    if (items.length === 0) return;

    const currentIndex = items.indexOf(target);
    if (currentIndex === -1) return;

    const isGroupJump = event.ctrlKey || event.altKey || event.metaKey;

    if (this.#keybindings.matches(event, 'editor-toolbar.next')) {
      event.preventDefault();
      if (isGroupJump) {
        const currentGroup = target.closest('.sh-editor-toolbar-group');
        if (currentGroup) {
          const groups = Array.from(toolbarEl.querySelectorAll('.sh-editor-toolbar-group')) as HTMLElement[];
          const groupIndex = groups.indexOf(currentGroup as HTMLElement);
          if (groupIndex !== -1) {
            for (let i = 1; i <= groups.length; i++) {
              const nextGroupIndex = (groupIndex + i) % groups.length;
              const groupItems = Array.from(
                groups[nextGroupIndex].querySelectorAll('.sh-editor-btn, .sh-editor-dropdown-trigger')
              ).filter((el) => {
                const btn = el as HTMLButtonElement;
                return !btn.disabled && el.getAttribute('disabled') === null && (el as HTMLElement).offsetWidth > 0;
              }) as HTMLElement[];
              if (groupItems.length > 0) {
                groupItems[0].focus();
                break;
              }
            }
          }
        }
      } else {
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex].focus();
      }
    } else if (this.#keybindings.matches(event, 'editor-toolbar.prev')) {
      event.preventDefault();
      if (isGroupJump) {
        const currentGroup = target.closest('.sh-editor-toolbar-group');
        if (currentGroup) {
          const groups = Array.from(toolbarEl.querySelectorAll('.sh-editor-toolbar-group')) as HTMLElement[];
          const groupIndex = groups.indexOf(currentGroup as HTMLElement);
          if (groupIndex !== -1) {
            for (let i = 1; i <= groups.length; i++) {
              const prevGroupIndex = (groupIndex - i + groups.length) % groups.length;
              const groupItems = Array.from(
                groups[prevGroupIndex].querySelectorAll('.sh-editor-btn, .sh-editor-dropdown-trigger')
              ).filter((el) => {
                const btn = el as HTMLButtonElement;
                return !btn.disabled && el.getAttribute('disabled') === null && (el as HTMLElement).offsetWidth > 0;
              }) as HTMLElement[];
              if (groupItems.length > 0) {
                groupItems[0].focus();
                break;
              }
            }
          }
        }
      } else {
        const nextIndex = (currentIndex - 1 + items.length) % items.length;
        items[nextIndex].focus();
      }
    } else if (this.#keybindings.matches(event, 'editor-toolbar.home')) {
      event.preventDefault();
      items[0].focus();
    } else if (this.#keybindings.matches(event, 'editor-toolbar.end')) {
      event.preventDefault();
      items[items.length - 1].focus();
    }
  }

  onToolbarFocusIn(event: FocusEvent) {
    if (!this.#isBrowser) return;
    const target = event.target as HTMLElement;
    const toolbarEl = target.closest('.sh-editor-toolbar');
    if (!toolbarEl) return;

    const items = Array.from(toolbarEl.querySelectorAll('.sh-editor-btn, .sh-editor-dropdown-trigger')).filter((el) => {
      const btn = el as HTMLButtonElement;
      return !btn.disabled && el.getAttribute('disabled') === null;
    }) as HTMLElement[];

    items.forEach((item) => {
      if (item === target) {
        item.setAttribute('tabindex', '0');
      } else {
        item.setAttribute('tabindex', '-1');
      }
    });
  }

  #initializeToolbarTabindexes() {
    if (!this.#isBrowser) return;
    afterNextRender(
      () => {
        const toolbarEl = this.editorRef()?.nativeElement?.parentElement?.querySelector('.sh-editor-toolbar');
        if (!toolbarEl) return;
        const items = Array.from(toolbarEl.querySelectorAll('.sh-editor-btn, .sh-editor-dropdown-trigger')).filter(
          (el) => {
            const btn = el as HTMLButtonElement;
            return !btn.disabled && el.getAttribute('disabled') === null;
          }
        ) as HTMLElement[];

        items.forEach((item, idx) => {
          item.setAttribute('tabindex', idx === 0 ? '0' : '-1');
        });
      },
      { injector: this.#injector }
    );
  }

  setImageMode(mode: 'content' | 'theater' | 'float' | 'custom') {
    this.#updateImageBlock((block) => {
      if (!block.attrs) block.attrs = {};
      block.attrs.mode = mode;
      if (mode === 'content' || mode === 'theater') {
        delete block.attrs.size;
        this.imgSize.set('auto');
      }
      this.imgMode.set(mode);
    });
  }

  setImageSize(size: 'auto' | 'small' | 'medium' | 'large') {
    this.#updateImageBlock((block) => {
      if (!block.attrs) block.attrs = {};
      block.attrs.size = size;
      this.imgSize.set(size);
    });
  }

  deleteImage(imgEl?: HTMLImageElement) {
    const img = imgEl || this.#selectedImage();
    if (!img) return;

    // Find block index from the img's data attribute or its parent wrapper
    let blockIndex = -1;
    const directAttr = img.getAttribute('data-block-index');
    if (directAttr !== null) {
      blockIndex = parseInt(directAttr, 10);
    } else {
      const blockEl = img.closest('[data-block-index]') as HTMLElement | null;
      if (blockEl) {
        blockIndex = parseInt(blockEl.getAttribute('data-block-index') || '-1', 10);
      }
    }
    if (blockIndex < 0) return;

    const doc = this.documentState();
    const newDoc = [...doc];
    newDoc.splice(blockIndex, 1);

    this.#saveHistory();
    this.#commitDocument(newDoc, { guardSelectionChange: true });
    this.#selectedImage.set(null);

    // Synchronous — DOM is already updated by #commitDocument.
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.#handleImageUpload(input.files[0]);
      this.showImageModal.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    if (!this.#isBrowser) return;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        event.preventDefault();
        this.#handleImageUpload(file);
      }
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.#isBrowser) return;

    // User is actively clicking — unlock the selection so onSelectionChange
    // can save the new position the user is establishing.
    // BUT: keep it locked if a modal is open — the user might click through
    // the dialog backdrop and we must preserve the saved insertion point.
    if (!this.showImageModal() && !this.showLinkModal()) {
      this.#selectionLocked = false;
    }

    // Triple click detection
    if (event.detail === 3) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const editor = this.editorRef()?.nativeElement;
        if (editor) {
          const blockEl = (
            range.startContainer.nodeType === 1
              ? (range.startContainer as HTMLElement)
              : range.startContainer.parentElement
          )?.closest('[data-block-index]');
          if (blockEl) {
            // Constrain selection to this block
            const newRange = document.createRange();
            newRange.selectNodeContents(blockEl);
            selection.removeAllRanges();
            selection.addRange(newRange);
            event.preventDefault();
          }
        }
      }
    }

    // Delegate to onBlockClick if applicable
    const editorEl = this.editorRef()?.nativeElement;
    if (editorEl) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const position = mapDOMPositionToLogical(editorEl, range.startContainer, range.startOffset);
        if (position) {
          const doc = this.documentState();
          const block = doc[position.blockIndex];
          if (block) {
            const ext = this.#registry.getBlock(block.type);
            if (ext?.onBlockClick) {
              const blockEl = editorEl.children[position.blockIndex] as HTMLElement;
              ext.onBlockClick(event, { position, blockEl, doc });
            }
          }
        }
      }
    }

    // Clear image selection if clicking away (but not when clicking the image toolbar)
    const target = event.target as HTMLElement;
    if (!target.closest('img') && !target.closest('.sh-editor-img-context-toolbar')) {
      this.#selectedImage.set(null);
    }
  }

  @HostListener('dragend', ['$event'])
  onDragEnd(event: DragEvent) {
    if (!this.#isBrowser) return;
    // Force sync after native D&D
    this.#updateValueFromDOM();
  }

  @HostListener('paste', ['$event'])
  async onPaste(event: ClipboardEvent) {
    if (!this.#isBrowser) return;
    if (this.readonly() || this.viewMode() === 'code') return;

    const clipboardData = event.clipboardData;
    if (!clipboardData) return;

    event.preventDefault();

    const items = clipboardData.items;
    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    // Case 1: Interleaved paste or multi-item paste
    // We prioritize HTML but also look for direct image files in the clipboard
    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          hasImage = true;
          this.#handleImageUpload(file);
        }
      }
    }

    if (hasImage && !html) return; // Already handled by image uploads

    // Case 2: Process HTML or Plain Text
    const content = html || text;
    if (!content) return;

    const cleanHtml = html ? sanitizeHTML(html) : escapeHTML(text).replace(/\n/g, '<br>');
    const ast = normalizeASTPaste(htmlToJSON(cleanHtml, this.#document, this.#registry));

    this.runTransaction((doc, selection) => {
      const position = selection.start;
      const currentBlock = doc[position.blockIndex];

      let newDoc: ShipEditorDocument;

      if (currentBlock && currentBlock.type === 'paragraph' && getJSONText([currentBlock]).trim() === '') {
        // Replace empty paragraph
        newDoc = [...doc];
        newDoc.splice(position.blockIndex, 1, ...ast);
      } else {
        // Split and insert
        const { doc: splitDoc } = splitBlock(doc, position);
        splitDoc.splice(position.blockIndex + 1, 0, ...ast);

        // If the split left an empty block before the paste (cursor was at start), remove it
        const leftBlock = splitDoc[position.blockIndex];
        if (leftBlock && leftBlock.type === 'paragraph' && getJSONText([leftBlock]).trim() === '') {
          splitDoc.splice(position.blockIndex, 1);
        }

        newDoc = splitDoc;
      }

      // Move caret to end of pasted content
      const lastPastedBlockIdx = Math.min(newDoc.length - 1, position.blockIndex + ast.length - 1);
      return {
        doc: newDoc,
        selectionShift: {
          start: { blockIndex: lastPastedBlockIdx },
          end: { blockIndex: lastPastedBlockIdx },
        },
      };
    });
  }

  #handleImageUpload(file: File) {
    if (this.customUpload()) {
      this.imageUpload.emit(file);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        this.insertImage(base64Url);
      };
      reader.readAsDataURL(file);
    }
  }

  insertImage(url: string) {
    if (!url) return;

    this.runTransaction((doc, selection) => {
      const position = selection.start;
      const currentBlock = doc[position.blockIndex];

      // Read image defaults from the image extension's config in the registry
      const imageExt = this.#registry.getBlock('image');
      const defaultMode = imageExt?.config?.['defaultMode'] || 'custom';
      const defaultSize = imageExt?.config?.['defaultSize'] || 'medium';

      const imgBlock: ShipEditorBlock = {
        type: 'image',
        attrs: {
          src: url,
          alt: 'Image',
          mode: defaultMode,
          size: defaultSize,
        },
      };

      let imgBlockIndex: number;
      let newDoc: ShipEditorDocument;

      if (currentBlock && currentBlock.type === 'paragraph' && getJSONText([currentBlock]).trim() === '') {
        // Replace the empty paragraph with the image
        newDoc = [...doc];
        newDoc.splice(position.blockIndex, 1, imgBlock);
        imgBlockIndex = position.blockIndex;
      } else {
        const { doc: splitDoc } = splitBlock(doc, position);
        splitDoc.splice(position.blockIndex + 1, 0, imgBlock);
        newDoc = splitDoc;
        imgBlockIndex = position.blockIndex + 1;
      }

      return {
        doc: newDoc,
        selectionShift: {
          start: { blockIndex: imgBlockIndex, listItemIndex: undefined },
          end: { blockIndex: imgBlockIndex, listItemIndex: undefined },
        },
      };
    });

    // Focus and select the newly inserted image by its block index
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      // Find the image block element by data-block-index, fall back to last img
      const doc = this.documentState();
      const idx = doc.findIndex((b) => b.type === 'image' && b.attrs?.['src'] === url);
      const blockEl = idx >= 0 ? editor.querySelector(`[data-block-index="${idx}"]`) : null;
      const img = blockEl?.querySelector('img') as HTMLImageElement | null;
      const fallbackImg = img || (editor.querySelector('img:last-of-type') as HTMLImageElement | null);

      if (fallbackImg) {
        fallbackImg.focus();
        this.#selectImage(fallbackImg);
      }
    }
  }

  // --- PUBLIC API METHODS ---

  getHTML(): string {
    if (this.viewMode() === 'code') {
      const textarea = this.codeEditorRef()?.nativeElement;
      const val = textarea ? textarea.value : this.rawCodeValue();
      if (this.format() === 'markdown') {
        return markdownToHTML(val, this.#registry);
      } else if (this.format() === 'json') {
        try {
          return jsonToHTML(JSON.parse(val), this.#registry);
        } catch (e) {
          return '';
        }
      }
      return this.#stripCompiledMarkup(val);
    }
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      return this.#stripCompiledMarkup(editor.innerHTML);
    }
    return jsonToHTML(this.documentState(), this.#registry);
  }

  getMarkdown(): string {
    if (this.viewMode() === 'code') {
      const textarea = this.codeEditorRef()?.nativeElement;
      const val = textarea ? textarea.value : this.rawCodeValue();
      if (this.format() === 'markdown') {
        return val;
      }
      const html = this.getHTML();
      return htmlToMarkdown(html, this.#document, this.#registry);
    }
    const html = this.getHTML();
    return htmlToMarkdown(html, this.#document, this.#registry);
  }

  getJSON(): ShipEditorDocument {
    if (this.viewMode() === 'code') {
      const textarea = this.codeEditorRef()?.nativeElement;
      const val = textarea ? textarea.value : this.rawCodeValue();
      if (this.format() === 'json') {
        try {
          return JSON.parse(val);
        } catch (e) {
          return [];
        }
      }
      const html = this.getHTML();
      return htmlToJSON(html, this.#document);
    }
    const html = this.getHTML();
    return htmlToJSON(html, this.#document);
  }

  setHTML(html: string) {
    const ast = htmlToJSON(html, this.#document);
    this.#runWithoutFeedback(() => {
      this.#serializeASTToValue(ast);
      this.#syncModelToDOM(this.value());
    });
  }

  setMarkdown(md: string) {
    const html = markdownToHTML(md);
    const ast = htmlToJSON(html, this.#document);
    this.#runWithoutFeedback(() => {
      this.#serializeASTToValue(ast);
      this.#syncModelToDOM(this.value());
    });
  }

  setJSON(json: ShipEditorDocument) {
    this.#runWithoutFeedback(() => {
      this.#serializeASTToValue(json);
      this.#syncModelToDOM(this.value());
    });
  }

  // --- INDENT / OUTDENT LOGIC ---

  indent(pos: LogicalPosition) {
    this.runTransaction((doc) => {
      const block = doc[pos.blockIndex];
      if (!block) return null;

      if (typeof pos.listItemIndex === 'number') {
        // Nested list logic: indent current item into a sub-list of the previous item
        const items = block.content as ShipEditorBlock[];
        if (pos.listItemIndex > 0) {
          const newDoc = [...doc];
          newDoc[pos.blockIndex] = cloneBlock(block);
          const clonedItems = (newDoc[pos.blockIndex].content as ShipEditorBlock[]);
          const currentItem = clonedItems[pos.listItemIndex];
          const prevItem = clonedItems[pos.listItemIndex - 1];

          // Move current item into prevItem's sublist (or create one)
          if (!prevItem.content) prevItem.content = [];
          const prevContent = prevItem.content as any[];

          // Check if the last node in prevItem is already a list of same type
          let subList = prevContent[prevContent.length - 1];
          if (!subList || (subList.type !== 'bullet-list' && subList.type !== 'ordered-list')) {
            subList = { type: block.type, content: [] };
            prevContent.push(subList);
          }

          (subList.content as ShipEditorBlock[]).push(currentItem);
          clonedItems.splice(pos.listItemIndex, 1);

          return {
            doc: newDoc,
            selectionShift: {
              start: { blockIndex: pos.blockIndex, listItemIndex: pos.listItemIndex - 1, inlineIndex: 0, offset: 0 },
              end: { blockIndex: pos.blockIndex, listItemIndex: pos.listItemIndex - 1, inlineIndex: 0, offset: 0 },
            },
          };
        }
      } else if (block.type === 'paragraph') {
        // Simple indent: convert to bullet list (standard behavior in many editors)
        const newDoc = [...doc];
        newDoc.splice(pos.blockIndex, 1, {
          type: 'bullet-list',
          content: [block],
        });
        return newDoc;
      }
      return null;
    });
  }

  outdent(pos: LogicalPosition) {
    this.runTransaction((doc) => {
      const block = doc[pos.blockIndex];
      if (!block) return null;

      if (typeof pos.listItemIndex === 'number') {
        // Outdent current item: move it up one level
        const newDoc = [...doc];
        newDoc[pos.blockIndex] = cloneBlock(block);
        const items = newDoc[pos.blockIndex].content as ShipEditorBlock[];
        const currentItem = { ...items[pos.listItemIndex], type: 'paragraph' as const };

        // If we are at the top level of a list, turn into paragraph
        items.splice(pos.listItemIndex, 1);
        newDoc.splice(pos.blockIndex + 1, 0, currentItem);

        if (items.length === 0) {
          newDoc.splice(pos.blockIndex, 1);
        }

        return {
          doc: newDoc,
          selectionShift: {
            start: { blockIndex: pos.blockIndex },
            end: { blockIndex: pos.blockIndex },
          },
        };
      }
      return null;
    });
  }

  clear() {
    this.value.set('');
    this.#lastValueWrittenFromDOM = '';
    this.rawCodeValue.set('');
    this.onChange('');
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      editor.innerHTML = '<p><br></p>';
    }
  }
}
