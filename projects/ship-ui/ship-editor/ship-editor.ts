import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
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
  BlockKeydownContext,
  CaretState,
  clearDocRangeFormatting,
  cloneDoc,
  formatDocRange,
  getBlockRelativeOffset,
  getJSONText,
  getLogicalFromBlockRelative,
  htmlToJSON,
  htmlToMarkdown,
  inlineToHTML,
  insertText,
  jsonToHTML,
  LogicalPosition,
  mapDOMPositionToLogical,
  mapLogicalToDOMPosition,
  markdownToHTML,
  mergeBlocks,
  parseImageClassNames,
  registerDefaultExtensions,
  setBlockTypeInDoc,
  ShipEditorBlock,
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
  LogicalPosition,
  mergeBlocks,
  registerDefaultExtensions,
  ShipEditorBlock,
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
  providers: [SHIP_EDITOR_VALUE_ACCESSOR],
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
    const selection = window.getSelection();
    let savedStartPos: LogicalPosition | null = null;
    let savedEndPos: LogicalPosition | null = null;
    let isCollapsed = true;
    let isInside = false;

    if (editor && selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        isInside = true;
        isCollapsed = range.collapsed;
        savedStartPos = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
        if (!isCollapsed) {
          savedEndPos = mapDOMPositionToLogical(editor, range.endContainer, range.endOffset);
        }
      }
    }

    action();

    if (isInside && savedStartPos && editor && selection) {
      setTimeout(() => {
        const startDom = mapLogicalToDOMPosition(editor, savedStartPos!, this.documentState());
        if (startDom) {
          try {
            const newRange = this.#document.createRange();
            newRange.setStart(startDom.node, startDom.offset);
            if (!isCollapsed && savedEndPos) {
              const endDom = mapLogicalToDOMPosition(editor, savedEndPos, this.documentState());
              if (endDom) {
                newRange.setEnd(endDom.node, endDom.offset);
              } else {
                newRange.collapse(true);
              }
            } else {
              newRange.collapse(true);
            }
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch { /* Selection out of bounds after DOM mutation */ }
        }
      }, 0);
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
  }

  /** Run a callback while suppressing feedback loops (DOM→model→DOM cycles). */
  #runWithoutFeedback(fn: () => void) {
    this.#isWriting = true;
    try { fn(); }
    finally { this.#isWriting = false; }
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
      setTimeout(() => {
        const uploadBtn = this.uploadBtn();
        const imageInput = this.imageInput();

        if (this.imageUploadEnabled()) {
          if (uploadBtn) {
            uploadBtn.nativeElement.focus();
          }
        } else {
          if (imageInput) {
            imageInput.nativeElement.focus();
          }
        }
      });
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
        html = markdownToHTML(val);
      } else if (prev === 'json' && Array.isArray(val)) {
        html = jsonToHTML(val);
      }

      let newValue: ShipEditorValue = '';
      if (fmt === 'html') {
        newValue = html;
      } else if (fmt === 'markdown') {
        newValue = htmlToMarkdown(html, this.#document);
      } else if (fmt === 'json') {
        newValue = htmlToJSON(html, this.#document);
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

        const ast = htmlToJSON(html, this.#document);
        this.#saveAndRestoreSelection(() => {
          this.#setDocumentState(ast);
        });
      });
    }
  });

  #wordCountEffect = effect(() => {
    const doc = this.documentState();
    const text = getJSONText(doc).replace(/\u00a0/g, ' ').trim();

    this.charCount.set(text.length);
    this.wordCount.set(text === '' ? 0 : text.split(/\s+/).filter((w) => w.length > 0).length);
  });

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
    registerDefaultExtensions();
  }

  ngAfterViewInit() {
    this.#syncModelToDOM(this.value());
  }

  ngOnDestroy() {
    this.#savedRange = null;
    if (this.#typingTimeout) {
      clearTimeout(this.#typingTimeout);
    }
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

  #renderHTMLToDOM(html: string) {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    editor.innerHTML = html;

    const doc = this.documentState();
    const children = Array.from(editor.children);
    children.forEach((child, idx) => {
      child.setAttribute('data-block-index', idx.toString());
      const tag = child.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        const items = Array.from(child.querySelectorAll(':scope > li'));
        items.forEach((item, itemIdx) => {
          item.setAttribute('data-item-index', itemIdx.toString());
        });
      }

      // Call extension onBlockRender hook for post-render DOM enhancements
      const block = doc[idx];
      if (block) {
        const ext = ShipEditorRegistry.getBlock(block.type);
        if (ext?.onBlockRender) {
          ext.onBlockRender(child as HTMLElement, block, idx);
        }
      }
    });
  }

  #syncModelToDOM(val: ShipEditorValue) {
    let ast: ShipEditorDocument = [];
    let html = '';

    if (val === null || val === undefined || val === '') {
      ast = [{ type: 'paragraph', content: [] }];
      html = '<p><br></p>';
    } else if (Array.isArray(val)) {
      ast = val;
      html = jsonToHTML(val);
    } else if (typeof val === 'string') {
      if (this.format() === 'markdown') {
        html = markdownToHTML(val);
      } else {
        html = val;
      }
      ast = htmlToJSON(html, this.#document);
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
    const initialAst = htmlToJSON(rawHtml, this.#document);
    let cleanHtml = this.#stripCompiledMarkup(jsonToHTML(initialAst));

    if (cleanHtml === '' || cleanHtml === '<br>' || cleanHtml === '<p><br></p>') {
      cleanHtml = '';
    }

    const ast = htmlToJSON(cleanHtml, this.#document);

    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();

      this.#saveAndRestoreSelection(() => {
        if (currentFormat === 'html') {
          this.value.set(cleanHtml);
          this.#lastValueWrittenFromDOM = cleanHtml;
          this.onChange(cleanHtml);
        } else if (currentFormat === 'markdown') {
          const md = htmlToMarkdown(cleanHtml, this.#document);
          this.value.set(md);
          this.#lastValueWrittenFromDOM = md;
          this.onChange(md);
          this.rawCodeValue.set(md);
        } else if (currentFormat === 'json') {
          this.value.set(ast);
          this.#lastValueWrittenFromDOM = ast;
          this.onChange(ast);
          this.rawCodeValue.set(JSON.stringify(ast, null, 2));
        }

        this.#setDocumentState(ast);
      });
    });
  }

  onDOMInput() {
    // Run extension onBlockRender for image blocks after browser-native DOM mutations
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      const imgExt = ShipEditorRegistry.getBlock('image');
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
    this.#updateValueFromDOM();

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

    if (saveImmediately) {
      this.#saveHistory();
    } else {
      this.#typingTimeout = setTimeout(() => {
        this.#saveHistory();
      }, 500);
    }
  }

  onDOMBlur() {
    this.isFocused.set(false);
    this.onTouched();
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
        const ext = ShipEditorRegistry.getBlock(currentBlock.type);
        if (ext?.onBlockKeydown) {
          const editorEl = this.editorRef()?.nativeElement;
          const blockEl = editorEl?.children[position.blockIndex] as HTMLElement;
          const ctx: BlockKeydownContext = {
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
    }
  }

  #updateStateAndCaret(newDoc: ShipEditorDocument, newPosition: LogicalPosition) {
    this.#setDocumentState(newDoc);
    this.#updateValueFromState();

    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      // Preserve scroll position across the full DOM re-render to prevent
      // visible jumps — especially noticeable when typing inside large code blocks.
      const scrollTop = editor.scrollTop;
      const scrollLeft = editor.scrollLeft;
      this.#renderHTMLToDOM(jsonToHTML(newDoc));
      editor.scrollTop = scrollTop;
      editor.scrollLeft = scrollLeft;

      setTimeout(() => {
        const domPos = mapLogicalToDOMPosition(editor, newPosition, this.documentState());
        if (domPos) {
          const selection = window.getSelection();
          if (selection) {
            try {
              const newRange = this.#document.createRange();
              newRange.setStart(domPos.node, domPos.offset);
              newRange.collapse(true);
              selection.removeAllRanges();
              selection.addRange(newRange);

              // Scroll the caret into view if it ended up outside the visible area
              // (e.g. pressing Enter at the very bottom of a long code block).
              const caretRect = newRange.getBoundingClientRect();
              const editorRect = editor.getBoundingClientRect();
              if (caretRect.bottom > editorRect.bottom) {
                editor.scrollTop += caretRect.bottom - editorRect.bottom + 4;
              } else if (caretRect.top < editorRect.top) {
                editor.scrollTop -= editorRect.top - caretRect.top + 4;
              }
            } catch { /* Caret position out of range after DOM mutation */ }
          }
        }
        this.onSelectionChange();
      }, 0);
    }
  }

  #updateValueFromState() {
    const ast = this.documentState();
    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();

      if (currentFormat === 'json') {
        this.value.set(ast);
        this.#lastValueWrittenFromDOM = ast;
        this.onChange(ast);
        this.rawCodeValue.set(JSON.stringify(ast, null, 2));
      } else {
        const html = jsonToHTML(ast);
        if (currentFormat === 'html') {
          this.value.set(html);
          this.#lastValueWrittenFromDOM = html;
          this.onChange(html);
        } else if (currentFormat === 'markdown') {
          const md = htmlToMarkdown(html, this.#document);
          this.value.set(md);
          this.#lastValueWrittenFromDOM = md;
          this.onChange(md);
          this.rawCodeValue.set(md);
        }
      }
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
        } catch { /* JSON parse error in code view — ignored */ }
      }
    });
    this.onTouched();
  }

  /** Valid commands for formatText(). Case-insensitive to match template usage. */
  static readonly FORMAT_COMMANDS: Record<string, (editor: ShipEditor, value?: string) => void> = {
    bold: (e) => e.applyInlineStyle('strong'),
    italic: (e) => e.applyInlineStyle('em'),
    underline: (e) => e.applyInlineStyle('u'),
    strikethrough: (e) => e.applyInlineStyle('s'),
    undo: (e) => e.undo(),
    redo: (e) => e.redo(),
    insertunorderedlist: (e) => e.toggleList('ul'),
    insertorderedlist: (e) => e.toggleList('ol'),
    inserthorizontalrule: (e) => e.insertHorizontalRule(),
    removeformat: (e) => e.removeFormat(),
    justifyleft: (e) => e.setAlign('left'),
    justifycenter: (e) => e.setAlign('center'),
    justifyright: (e) => e.setAlign('right'),
    formatblock: (e, v) => e.setBlockType(v ?? ''),
  };

  formatText(command: string, value: string = '') {
    if (this.readonly()) return;
    if (this.viewMode() === 'code') return;

    const handler = ShipEditor.FORMAT_COMMANDS[command.toLowerCase()];
    if (handler) {
      handler(this, value);
    }
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
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    const startLogical = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
    const endLogical = mapDOMPositionToLogical(editor, range.endContainer, range.endOffset);
    if (!startLogical || !endLogical) return;

    const docBefore = this.documentState();
    const startOffset = getBlockRelativeOffset(startLogical, docBefore);
    const endOffset = getBlockRelativeOffset(endLogical, docBefore);

    const docClone = cloneDoc(docBefore);
    const result = action(docClone, { start: startLogical, end: endLogical });
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
      newDoc = result.doc || docClone;
      targetSelectionShift = result.selectionShift;
    } else {
      newDoc = docClone;
    }

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    this.#setDocumentState(newDoc);
    this.#updateValueFromState();

    if (editor) {
      this.#renderHTMLToDOM(jsonToHTML(newDoc));
    }

    // Restore selection synchronously — innerHTML is sync so the new DOM nodes
    // are immediately available. Using setTimeout caused a gap where Angular's
    // change detection could re-render and destroy the restored selection.
    const docAfter = this.documentState();

    const targetStartBlockIdx = targetSelectionShift
      ? targetSelectionShift.start.blockIndex
      : startLogical.blockIndex;
    const targetStartListItemIdx = targetSelectionShift
      ? targetSelectionShift.start.listItemIndex
      : startLogical.listItemIndex;
    const targetEndBlockIdx = targetSelectionShift ? targetSelectionShift.end.blockIndex : endLogical.blockIndex;
    const targetEndListItemIdx = targetSelectionShift
      ? targetSelectionShift.end.listItemIndex
      : endLogical.listItemIndex;

    const startLogicalAfter = getLogicalFromBlockRelative(
      targetStartBlockIdx,
      targetStartListItemIdx,
      startOffset,
      docAfter
    );
    const endLogicalAfter = getLogicalFromBlockRelative(targetEndBlockIdx, targetEndListItemIdx, endOffset, docAfter);

    const startDom = mapLogicalToDOMPosition(editor, startLogicalAfter, docAfter);
    const endDom = mapLogicalToDOMPosition(editor, endLogicalAfter, docAfter);

    if (startDom && endDom) {
      try {
        const newRange = this.#document.createRange();
        newRange.setStart(startDom.node, startDom.offset);
        newRange.setEnd(endDom.node, endDom.offset);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch { /* Selection range out of bounds after formatting */ }
    }

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
      const ext = ShipEditorRegistry.getAllMarks().find((m) => m.tagName === cleanTag);
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
      } else if (targetTag === 'pre') {
        newType = 'code-block';
        newAttrs = { language: '' };
      }

      const res = setBlockTypeInDoc(doc, selection, newType, newAttrs);
      if (!res) return null;

      // Update docClone in-place to match res.doc
      doc.length = 0;
      doc.push(...res.doc);

      return {
        selectionShift: res.selectionShift,
      };
    });
  }

  toggleList(listType: 'ul' | 'ol') {
    this.runTransaction((doc, selection) => {
      const res = toggleListInDoc(doc, selection, listType);
      if (!res) return null;

      // Update docClone in-place to match res.doc
      doc.length = 0;
      doc.push(...res.doc);

      return {
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

    let selectionState: {
      start: LogicalPosition;
      end: LogicalPosition | null;
      isCollapsed: boolean;
    } | null = null;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        const start = mapDOMPositionToLogical(editor, range.startContainer, range.startOffset);
        if (start) {
          const isCollapsed = range.collapsed;
          const end = isCollapsed ? null : mapDOMPositionToLogical(editor, range.endContainer, range.endOffset);
          selectionState = { start, end, isCollapsed };
        }
      }
    }

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

    this.#runWithoutFeedback(() => {
      const docCopy = cloneDoc(state.doc);
      this.#setDocumentState(docCopy);
      this.#updateValueFromState();
      this.#renderHTMLToDOM(jsonToHTML(docCopy));
    });

    const sel = state.selection;
    if (sel) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (selection) {
          try {
            const startDom = mapLogicalToDOMPosition(editor, sel.start, this.documentState());
            if (startDom) {
              const range = this.#document.createRange();
              range.setStart(startDom.node, startDom.offset);
              if (!sel.isCollapsed && sel.end) {
                const endDom = mapLogicalToDOMPosition(editor, sel.end, this.documentState());
                if (endDom) {
                  range.setEnd(endDom.node, endDom.offset);
                } else {
                  range.collapse(true);
                }
              } else {
                range.collapse(true);
              }
              selection.removeAllRanges();
              selection.addRange(range);
            }
          } catch (e) {
            // Fallback
          }
        }
      }, 0);
    }
    this.#updateHistoryStates();
  }

  toggleViewMode() {
    const nextMode = this.viewMode() === 'design' ? 'code' : 'design';
    this.viewMode.set(nextMode);

    // Give time to render then sync and focus
    setTimeout(() => {
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
    });
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
    const selection = window.getSelection();
    const editor = this.editorRef()?.nativeElement;
    if (selection && this.#savedRange && editor) {
      let isInside = false;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
          isInside = true;
        }
      }
      if (!isInside) {
        editor.focus();
        try {
          selection.removeAllRanges();
          selection.addRange(this.#savedRange);
        } catch { /* Selection restore failed — fallback ignored */ }
      }
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

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const editorEl = this.editorRef()?.nativeElement;
    if (!editorEl || !editorEl.contains(range.commonAncestorContainer)) {
      return;
    }

    // Save selection range for modal operations
    this.#savedRange = range.cloneRange();

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
          blockType = tag;
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
          const prevExt = ShipEditorRegistry.getBlock(prevBlock.type);
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
          const ext = ShipEditorRegistry.getBlock(block.type);
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
    // Back up current selection before focus shifts to modal
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.#savedRange = selection.getRangeAt(0).cloneRange();
    }
    this.showLinkModal.set(true);
  }

  applyLink(url: string) {
    this.showLinkModal.set(false);
    if (!url) return;

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    // Restore selection range
    const selection = window.getSelection();
    if (selection && this.#savedRange) {
      selection.removeAllRanges();
      selection.addRange(this.#savedRange);
    }

    editor.focus();
    this.toggleLink(url);
  }

  openImageModal() {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.#savedRange = selection.getRangeAt(0).cloneRange();
    }
    this.showImageModal.set(true);
  }

  applyImage(url: string) {
    this.showImageModal.set(false);
    this.insertImage(url);
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
    const newDoc = cloneDoc(doc);
    const block = newDoc[blockIndex];
    const editor = this.editorRef()?.nativeElement;

    if (block && block.type === 'image') {
      updater(block);

      this.#saveHistory();
      this.#isInternalDOMUpdate = true;
      this.#setDocumentState(newDoc);
      this.#updateValueFromState();

      if (editor) {
        this.#renderHTMLToDOM(jsonToHTML(newDoc));
      }

      setTimeout(() => {
        const newImg = this.editorRef()?.nativeElement.querySelector(
          `img[data-block-index="${blockIndex}"]`
        ) as HTMLImageElement;
        if (newImg) {
          newImg.focus();
          this.#selectedImage.set(newImg);
        }
        this.#saveHistory();
        this.#isInternalDOMUpdate = false;
      }, 50);
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
      // If clicking inside image toolbar itself, don't dismiss
      if (target && target.closest('.sh-editor-img-toolbar')) {
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
          const targetIndex = goBack
            ? Math.max(0, blockIndex - 1)
            : Math.min(doc.length - 1, blockIndex + 1);
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
    for (const markExt of ShipEditorRegistry.getAllMarks()) {
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
    for (const blockExt of ShipEditorRegistry.getAllBlocks()) {
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
      const ext = ShipEditorRegistry.getBlock(currentBlockData.type);
      if (ext?.onBlockKeydown) {
        const blockEl = editorEl.children[position.blockIndex] as HTMLElement;
        const ctx: BlockKeydownContext = { position, blockEl, doc };
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
        const newDoc = cloneDoc(doc);

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
          const newDoc = cloneDoc(doc);
          let newPos: LogicalPosition;

          if (liEl && typeof position.listItemIndex === 'number') {
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
          const imgEl = editorEl.querySelector(
            `img[data-block-index="${targetIndex}"]`
          ) as HTMLImageElement;
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
    const img = this.#selectedImage();
    if (img && (event.key === 'Backspace' || event.key === 'Delete')) {
      const activeEl = this.#document.activeElement;
      if (
        activeEl === img ||
        window.getSelection()?.anchorNode === img ||
        window.getSelection()?.focusNode === img ||
        window.getSelection()?.anchorNode?.contains(img)
      ) {
        event.preventDefault();
        this.deleteImage();
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
            range.setStart(textNode, slashIndex);
            range.setEnd(textNode, offset);
            selection.removeAllRanges();
            selection.addRange(range);
            range.deleteContents();
            // Sync the AST from the DOM so the slash text is gone from the document state
            this.#updateValueFromDOM();
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
    setTimeout(() => {
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
    });
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

  deleteImage() {
    const img = this.#selectedImage();
    if (!img) return;

    const blockIndexAttr = img.getAttribute('data-block-index');
    if (blockIndexAttr === null) return;
    const blockIndex = parseInt(blockIndexAttr, 10);

    const doc = this.documentState();
    const newDoc = cloneDoc(doc);
    newDoc.splice(blockIndex, 1);

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;
    this.#setDocumentState(newDoc);
    this.#updateValueFromState();
    this.#selectedImage.set(null);

    setTimeout(() => {
      this.#saveHistory();
      this.#isInternalDOMUpdate = false;
      this.onSelectionChange();
    }, 0);
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

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (!this.#isBrowser) return;
    const items = event.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            this.#handleImageUpload(file);
          }
        }
      }
    }
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

      const imgBlock: ShipEditorBlock = {
        type: 'image',
        attrs: {
          src: url,
          alt: 'Image',
          mode: 'content',
          size: 'auto',
        },
      };

      let imgBlockIndex: number;

      if (currentBlock && currentBlock.type === 'paragraph' && getJSONText([currentBlock]).trim() === '') {
        // Replace the empty paragraph with the image
        doc.splice(position.blockIndex, 1, imgBlock);
        imgBlockIndex = position.blockIndex;
      } else {
        const { doc: splitDoc } = splitBlock(doc, position);
        splitDoc.splice(position.blockIndex + 1, 0, imgBlock);

        doc.length = 0;
        doc.push(...splitDoc);
        imgBlockIndex = position.blockIndex + 1;
      }

      return {
        selectionShift: {
          start: { blockIndex: imgBlockIndex, listItemIndex: undefined },
          end: { blockIndex: imgBlockIndex, listItemIndex: undefined },
        },
      };
    });

    // After the DOM is rendered, focus and select the inserted image
    setTimeout(() => {
      const editor = this.editorRef()?.nativeElement;
      if (!editor) return;
      const imgs = editor.querySelectorAll('img') as NodeListOf<HTMLImageElement>;
      const lastImg = imgs[imgs.length - 1];
      if (lastImg) {
        lastImg.focus();
        this.#selectImage(lastImg);
      }
    }, 50);
  }

  // --- PUBLIC API METHODS ---

  getHTML(): string {
    if (this.viewMode() === 'code') {
      const textarea = this.codeEditorRef()?.nativeElement;
      const val = textarea ? textarea.value : this.rawCodeValue();
      if (this.format() === 'markdown') {
        return markdownToHTML(val);
      } else if (this.format() === 'json') {
        try {
          return jsonToHTML(JSON.parse(val));
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
    return jsonToHTML(this.documentState());
  }

  getMarkdown(): string {
    if (this.viewMode() === 'code') {
      const textarea = this.codeEditorRef()?.nativeElement;
      const val = textarea ? textarea.value : this.rawCodeValue();
      if (this.format() === 'markdown') {
        return val;
      }
      const html = this.getHTML();
      return htmlToMarkdown(html, this.#document);
    }
    const html = this.getHTML();
    return htmlToMarkdown(html, this.#document);
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
    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();
      if (currentFormat === 'html') {
        this.value.set(html);
        this.onChange(html);
      } else if (currentFormat === 'markdown') {
        const md = htmlToMarkdown(html, this.#document);
        this.value.set(md);
        this.onChange(md);
      } else if (currentFormat === 'json') {
        const json = htmlToJSON(html, this.#document);
        this.value.set(json);
        this.onChange(json);
      }
      this.#syncModelToDOM(this.value());
    });
  }

  setMarkdown(md: string) {
    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();
      if (currentFormat === 'markdown') {
        this.value.set(md);
        this.onChange(md);
      } else if (currentFormat === 'html') {
        const html = markdownToHTML(md);
        this.value.set(html);
        this.onChange(html);
      } else if (currentFormat === 'json') {
        const html = markdownToHTML(md);
        const json = htmlToJSON(html, this.#document);
        this.value.set(json);
        this.onChange(json);
      }
      this.#syncModelToDOM(this.value());
    });
  }

  setJSON(json: ShipEditorDocument) {
    this.#runWithoutFeedback(() => {
      const currentFormat = this.format();
      if (currentFormat === 'json') {
        this.value.set(json);
        this.onChange(json);
      } else if (currentFormat === 'html') {
        const html = jsonToHTML(json);
        this.value.set(html);
        this.onChange(html);
      } else if (currentFormat === 'markdown') {
        const html = jsonToHTML(json);
        const md = htmlToMarkdown(html, this.#document);
        this.value.set(md);
        this.onChange(md);
      }
      this.#syncModelToDOM(this.value());
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
