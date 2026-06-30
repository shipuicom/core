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
  OnInit,
  output,
  PLATFORM_ID,
  Provider,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ShipColor, shipComponentClasses } from '@ship-ui/core';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipMenu } from '@ship-ui/core/ship-menu';
import { ShipA11yKeybindingsService } from '@ship-ui/core/ship-a11y-keybindings';

import {
  CaretState,
  escapeHTML,
  getJSONText,
  getNodeByPath,
  getNodePath,
  getTextNodesInRange,
  htmlToJSON,
  htmlToMarkdown,
  isNodeWrappedInTag,
  jsonToHTML,
  markdownToHTML,
  ShipEditorBlock,
  ShipEditorCommand,
  ShipEditorDocument,
  ShipEditorInlineNode,
  ShipEditorMark,
  ShipEditorValue,
} from './ship-editor-core';

export {
  CaretState,
  ShipEditorBlock,
  ShipEditorCommand,
  ShipEditorDocument,
  ShipEditorInlineNode,
  ShipEditorMark,
  ShipEditorValue,
};

export interface ShipEditorHtmlDocument {
  execCommand(commandId: string, showUI?: boolean, value?: string): boolean;
  queryCommandState(commandId: string): boolean;
  queryCommandEnabled(commandId: string): boolean;
}


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
  imports: [ShipTooltip, ShipIcon, ShipMenu],
  providers: [SHIP_EDITOR_VALUE_ACCESSOR],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '[class.sh-editor-readonly]': 'readonly()',
    '[class.sh-editor-focused]': 'isFocused()',
  },
  templateUrl: './ship-editor.html',
})
export class ShipEditor implements ControlValueAccessor, OnInit, OnDestroy, AfterViewInit {
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);
  #isBrowser = isPlatformBrowser(this.#platformId);
  #elementRef = inject(ElementRef);
  #keybindings = inject(ShipA11yKeybindingsService);

  get #doc(): Document & ShipEditorHtmlDocument {
    return this.#document as unknown as Document & ShipEditorHtmlDocument;
  }

  
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
  #historyStack: { html: string; caret: CaretState | null }[] = [];
  #historyIndex = -1;
  #maxHistorySize = 100;
  #isInternalDOMUpdate = false;
  #typingTimeout: any;

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
  imgToolbarTop = signal<number>(0);
  imgToolbarLeft = signal<number>(0);
  imgMode = signal<'content' | 'theater' | 'float' | 'custom'>('content');
  imgSize = signal<'auto' | 'small' | 'medium' | 'large'>('auto');

  
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

  constructor() {
    
    effect(() => {
      if (this.showLinkModal()) {
        const linkInput = this.linkInput();
        if (linkInput) {
          linkInput.nativeElement.focus();
        }
      }
    });

    
    effect(() => {
      if (this.showImageModal()) {
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
      }
    });

    
    effect(() => {
      const val = this.value();
      const editor = this.editorRef()?.nativeElement;

      
      
      if (editor && editor !== this.#lastEditorElement) {
        this.#lastEditorElement = editor;
        this.#lastValueWrittenFromDOM = undefined;
      }

      if (val === this.#lastValueWrittenFromDOM) return;
      this.#syncModelToDOM(val);
    });

    
    effect(() => {
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

        
        this.#isWriting = true;
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

        const editor = this.editorRef()?.nativeElement;
        if (editor) {
          const normalizedHTML = html === '<p><br></p>' ? '' : html;
          const currentNormalized = editor.innerHTML === '<p><br></p>' ? '' : editor.innerHTML;
          if (normalizedHTML !== currentNormalized) {
            editor.innerHTML = html;
          }
          this.#ensureImagesFocusable();
        }

        this.#isWriting = false;
      }
    });

    
    effect(() => {
      const val = this.value();
      const fmt = this.format();
      let html = '';

      if (!val) {
        html = '';
      } else if (typeof val === 'string') {
        if (fmt === 'markdown') {
          html = markdownToHTML(val);
        } else {
          html = val;
        }
      } else if (Array.isArray(val)) {
        html = jsonToHTML(val);
      }

      const temp = this.#document.createElement('div');
      temp.innerHTML = html;
      const text = (temp.textContent || '').replace(/\u00a0/g, ' ').trim();

      this.charCount.set(text.length);
      this.wordCount.set(text === '' ? 0 : text.split(/\s+/).filter((w) => w.length > 0).length);
    });

    
    effect(() => {
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
  }

  ngOnInit() {
    
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
    this.#isWriting = true;
    this.value.set(obj);
    this.#syncModelToDOM(obj);
    this.#isWriting = false;
  }

  registerOnChange(fn: (value: ShipEditorValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    
  }

  

  #syncModelToDOM(val: ShipEditorValue) {
    let html = '';

    if (val === null || val === undefined || val === '') {
      html = '<p><br></p>';
    } else if (typeof val === 'string') {
      if (this.format() === 'markdown') {
        html = markdownToHTML(val);
      } else {
        html = val;
      }
    } else if (Array.isArray(val)) {
      html = jsonToHTML(val);
    } else {
      html = '<p><br></p>';
    }

    const isNewValue = val !== this.#lastValueWrittenFromDOM;

    
    if (this.format() === 'markdown' && typeof val === 'string') {
      this.rawCodeValue.set(val);
    } else if (this.format() === 'json' && Array.isArray(val)) {
      this.rawCodeValue.set(JSON.stringify(val, null, 2));
    } else {
      this.rawCodeValue.set(html);
    }

    
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      this.#lastValueWrittenFromDOM = val;
      
      const normalizedHTML = html === '<p><br></p>' ? '' : html;
      const currentNormalized = editor.innerHTML === '<p><br></p>' ? '' : editor.innerHTML;
      if (normalizedHTML !== currentNormalized) {
        editor.innerHTML = html;
      }
      this.#ensureImagesFocusable();

      if (isNewValue) {
        this.#historyStack = [];
        this.#historyIndex = -1;
      }
      if (this.#historyStack.length === 0) {
        this.#saveHistory();
      }
    }
    this.#updateHistoryStates();
  }

  

  #updateValueFromDOM() {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    let html = editor.innerHTML;
    
    if (html === '' || html === '<br>' || html === '<p><br></p>') {
      html = '';
    }

    this.#isWriting = true;
    const currentFormat = this.format();

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
    } else if (currentFormat === 'json') {
      const json = htmlToJSON(html, this.#document);
      this.value.set(json);
      this.#lastValueWrittenFromDOM = json;
      this.onChange(json);
      this.rawCodeValue.set(JSON.stringify(json, null, 2));
    }

    this.#isWriting = false;
  }

  

  onDOMInput() {
    this.#ensureImagesFocusable();
    this.#updateValueFromDOM();

    
    const selection = window.getSelection();
    let saveImmediately = false;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;
      if (textNode.nodeType === 3) { // Node.TEXT_NODE
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

  onCodeInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.rawCodeValue.set(textarea.value);
  }

  onCodeBlur(event: Event) {
    this.isFocused.set(false);
    const textarea = event.target as HTMLTextAreaElement;
    const codeVal = textarea.value;

    this.#isWriting = true;
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
      } catch (e) {
        
      }
    }

    this.#isWriting = false;
    this.onTouched();
  }

  

  formatText(command: string, value: string = '') {
    if (this.readonly()) return;
    if (this.viewMode() === 'code') return;

    const cmd = command.toLowerCase();

    if (cmd === 'bold') {
      this.applyInlineStyle('strong');
    } else if (cmd === 'italic') {
      this.applyInlineStyle('em');
    } else if (cmd === 'underline') {
      this.applyInlineStyle('u');
    } else if (cmd === 'strikethrough') {
      this.applyInlineStyle('s');
    } else if (cmd === 'undo') {
      this.undo();
    } else if (cmd === 'redo') {
      this.redo();
    } else if (cmd === 'insertunorderedlist') {
      this.toggleList('ul');
    } else if (cmd === 'insertorderedlist') {
      this.toggleList('ol');
    } else if (cmd === 'inserthorizontalrule') {
      this.insertHorizontalRule();
    } else if (cmd === 'removeformat') {
      this.removeFormat();
    } else if (cmd === 'justifyleft') {
      this.setAlign('left');
    } else if (cmd === 'justifycenter') {
      this.setAlign('center');
    } else if (cmd === 'justifyright') {
      this.setAlign('right');
    } else if (cmd === 'formatblock') {
      this.setBlockType(value);
    }
  }

  applyInlineStyle(tag: string) {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    const textNodes = getTextNodesInRange(range);
    if (textNodes.length === 0) {
      this.#isInternalDOMUpdate = false;
      return;
    }

    const tagName = tag.toUpperCase();
    const allWrapped = textNodes.every((node) => isNodeWrappedInTag(node, tag, editor));

    let finalStartNode: Node = range.startContainer;
    let finalStartOffset = range.startOffset;
    let finalEndNode: Node = range.endContainer;
    let finalEndOffset = range.endOffset;

    if (allWrapped) {
      const elementsToUnwrap = new Set<HTMLElement>();
      for (const node of textNodes) {
        let current: Node | null = node.parentNode;
        while (current && current !== editor) {
          if (current.nodeType === Node.ELEMENT_NODE && (current as HTMLElement).tagName === tagName) {
            elementsToUnwrap.add(current as HTMLElement);
          }
          current = current.parentNode;
        }
      }

      for (const el of elementsToUnwrap) {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
      }
    } else {
      for (const node of textNodes) {
        const isStart = node === range.startContainer;
        const isEnd = node === range.endContainer;

        let start = isStart ? range.startOffset : 0;
        let end = isEnd ? range.endOffset : node.textContent!.length;

        if (start >= end) continue;

        let targetNode = node;

        if (isStart && start > 0) {
          targetNode = node.splitText(start);
          if (isEnd) {
            finalEndNode = targetNode;
            finalEndOffset = end - start;
          }
          finalStartNode = targetNode;
          finalStartOffset = 0;

          end = end - start;
          start = 0;
        }

        if (isEnd && finalEndOffset < targetNode.textContent!.length) {
          targetNode.splitText(finalEndOffset);
          finalEndNode = targetNode;
          finalEndOffset = targetNode.textContent!.length;
          end = targetNode.textContent!.length;
        }

        if (!isNodeWrappedInTag(targetNode, tag, editor)) {
          const element = node.ownerDocument!.createElement(tag);
          targetNode.parentNode?.insertBefore(element, targetNode);
          element.appendChild(targetNode);
        }
      }
    }

    const newRange = this.#document.createRange();
    try {
      newRange.setStart(finalStartNode, finalStartOffset);
      newRange.setEnd(finalEndNode, finalEndOffset);
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch (e) {}

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  toggleLink(url: string) {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    let existingLink: HTMLAnchorElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'A') {
        existingLink = node as HTMLAnchorElement;
        break;
      }
      node = node.parentNode;
    }

    if (existingLink) {
      if (!url) {
        const parent = existingLink.parentNode;
        if (parent) {
          while (existingLink.firstChild) {
            parent.insertBefore(existingLink.firstChild, existingLink);
          }
          parent.removeChild(existingLink);
        }
      } else {
        existingLink.href = url;
      }
    } else if (url && !selection.isCollapsed) {
      const link = this.#document.createElement('a');
      link.href = url;
      link.target = '_blank';
      try {
        link.appendChild(range.extractContents());
        range.insertNode(link);

        const newRange = this.#document.createRange();
        newRange.selectNodeContents(link);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (e) {
        
      }
    }

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  setBlockType(tag: string) {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    let blockNode: HTMLElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.parentElement === editor) {
          blockNode = el;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!blockNode) {
      node = range.commonAncestorContainer;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          const tagName = el.tagName.toLowerCase();
          if (['p', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'ul', 'ol', 'li'].includes(tagName)) {
            blockNode = el;
            break;
          }
        }
        node = node.parentNode;
      }
    }

    if (blockNode) {
      const newBlock = this.#document.createElement(tag);
      newBlock.innerHTML = blockNode.innerHTML;
      if (blockNode.className) {
        newBlock.className = blockNode.className;
      }

      if (tag === 'pre') {
        newBlock.innerHTML = `<code>${blockNode.innerText || blockNode.innerHTML}</code>`;
      } else if (blockNode.tagName.toLowerCase() === 'pre' && tag !== 'pre') {
        const codeEl = blockNode.querySelector('code');
        if (codeEl) {
          newBlock.innerHTML = codeEl.innerHTML;
        }
      }

      // Ensure empty block has placeholder <br> so caret is visible and focusable
      if (!newBlock.innerHTML || newBlock.innerHTML === '<br>') {
        newBlock.innerHTML = '<br>';
      }

      const parent = blockNode.parentNode;
      if (parent) {
        parent.replaceChild(newBlock, blockNode);

        try {
          const newRange = this.#document.createRange();
          if (newBlock.textContent?.trim() === '') {
            newRange.setStart(newBlock, 0);
            newRange.collapse(true);
          } else {
            newRange.selectNodeContents(newBlock);
            newRange.collapse(false);
          }
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {}
      }
    } else {
      const newBlock = this.#document.createElement(tag);
      newBlock.appendChild(range.extractContents());
      range.insertNode(newBlock);
    }

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  toggleList(listType: 'ul' | 'ol') {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor?.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    let listNode: HTMLElement | null = null;
    let listTagName = '';
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (tag === 'ul' || tag === 'ol') {
          listNode = el;
          listTagName = tag;
          break;
        }
      }
      node = node.parentNode;
    }

    if (listNode) {
      if (listTagName === listType) {
        const parent = listNode.parentNode;
        if (parent) {
          const items = Array.from(listNode.querySelectorAll('li'));
          let lastP: HTMLElement | null = null;
          items.forEach((item) => {
            const p = this.#document.createElement('p');
            p.innerHTML = item.innerHTML;
            if (!p.innerHTML || p.innerHTML === '<br>') {
              p.innerHTML = '<br>';
            }
            parent.insertBefore(p, listNode);
            lastP = p;
          });
          parent.removeChild(listNode);

          if (lastP) {
            try {
              const newRange = this.#document.createRange();
              if ((lastP as HTMLElement).textContent?.trim() === '') {
                newRange.setStart(lastP, 0);
                newRange.collapse(true);
              } else {
                newRange.selectNodeContents(lastP);
                newRange.collapse(false);
              }
              selection.removeAllRanges();
              selection.addRange(newRange);
            } catch (e) {}
          }
        }
      } else {
        const newList = this.#document.createElement(listType);
        newList.innerHTML = listNode.innerHTML;
        const parent = listNode.parentNode;
        if (parent) {
          parent.replaceChild(newList, listNode);

          const firstItem = newList.querySelector('li');
          if (firstItem) {
            try {
              const newRange = this.#document.createRange();
              if (firstItem.textContent?.trim() === '') {
                newRange.setStart(firstItem, 0);
                newRange.collapse(true);
              } else {
                newRange.selectNodeContents(firstItem);
                newRange.collapse(false);
              }
              selection.removeAllRanges();
              selection.addRange(newRange);
            } catch (e) {}
          }
        }
      }
    } else {
      let blockNode: HTMLElement | null = null;
      let node: Node | null = range.commonAncestorContainer;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.parentElement === editor) {
            blockNode = el;
            break;
          }
        }
        node = node.parentNode;
      }

      if (blockNode) {
        const newList = this.#document.createElement(listType);
        const item = this.#document.createElement('li');
        item.innerHTML = blockNode.innerHTML;
        if (!item.innerHTML || item.innerHTML === '<br>') {
          item.innerHTML = '<br>';
        }
        newList.appendChild(item);

        const parent = blockNode.parentNode;
        if (parent) {
          parent.replaceChild(newList, blockNode);

          try {
            const newRange = this.#document.createRange();
            if (item.textContent?.trim() === '') {
              newRange.setStart(item, 0);
              newRange.collapse(true);
            } else {
              newRange.selectNodeContents(item);
              newRange.collapse(false);
            }
            selection.removeAllRanges();
            selection.addRange(newRange);
          } catch (e) {}
        }
      }
    }

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  insertHorizontalRule() {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    const hr = this.#document.createElement('hr');
    range.deleteContents();
    range.insertNode(hr);

    const p = this.#document.createElement('p');
    p.innerHTML = '<br>';
    if (hr.nextSibling) {
      hr.parentNode?.insertBefore(p, hr.nextSibling);
    } else {
      hr.parentNode?.appendChild(p);
    }

    const newRange = this.#document.createRange();
    newRange.setStart(p, 0);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  setAlign(direction: 'left' | 'center' | 'right') {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    let blockNode: HTMLElement | null = null;
    let node: Node | null = range.commonAncestorContainer;
    while (node && node !== editor) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['p', 'h1', 'h2', 'h3', 'blockquote', 'pre', 'li'].includes(tag)) {
          blockNode = el;
          break;
        }
      }
      node = node.parentNode;
    }

    if (blockNode) {
      blockNode.style.textAlign = direction;
    }

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
  }

  removeFormat() {
    if (this.readonly() || this.viewMode() === 'code') return;
    this.#restoreSelection();

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    this.#saveHistory();
    this.#isInternalDOMUpdate = true;

    const fragment = range.extractContents();
    const stripTags = ['strong', 'em', 'u', 's', 'a', 'b', 'i', 'span'];
    const container = this.#document.createElement('div');
    container.appendChild(fragment);

    stripTags.forEach((tag) => {
      const els = Array.from(container.querySelectorAll(tag));
      els.forEach((el) => {
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) {
            parent.insertBefore(el.firstChild, el);
          }
          parent.removeChild(el);
        }
      });
    });

    range.insertNode(container.firstChild || container);

    this.#updateValueFromDOM();
    this.#saveHistory();
    this.#isInternalDOMUpdate = false;
    this.onSelectionChange();
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

    const html = editor.innerHTML;
    if (this.#historyIndex >= 0 && this.#historyStack[this.#historyIndex].html === html) {
      return;
    }

    let caret: CaretState | null = null;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (editor.contains(range.commonAncestorContainer)) {
        caret = {
          startPath: getNodePath(editor, range.startContainer),
          startOffset: range.startOffset,
          endPath: getNodePath(editor, range.endContainer),
          endOffset: range.endOffset,
        };
      }
    }

    if (this.#historyIndex < this.#historyStack.length - 1) {
      this.#historyStack = this.#historyStack.slice(0, this.#historyIndex + 1);
    }

    this.#historyStack.push({ html, caret });
    if (this.#historyStack.length > this.#maxHistorySize) {
      this.#historyStack.shift();
    } else {
      this.#historyIndex++;
    }

    this.#updateHistoryStates();
  }

  #restoreHistoryState(state: { html: string; caret: CaretState | null }) {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    this.#isWriting = true;
    editor.innerHTML = state.html;
    this.#ensureImagesFocusable();
    this.#updateValueFromDOM();
    this.#isWriting = false;

    if (state.caret) {
      const startNode = getNodeByPath(editor, state.caret.startPath);
      const endNode = getNodeByPath(editor, state.caret.endPath);
      const selection = window.getSelection();
      if (selection) {
        try {
          const range = this.#document.createRange();
          range.setStart(startNode, state.caret.startOffset);
          range.setEnd(endNode, state.caret.endOffset);
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (e) {
          // Fallback
        }
      }
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
        } catch (e) {}
      }
    }
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    if (!this.#isBrowser) return;
    this.#updateHistoryStates();
    if (this.readonly() || this.viewMode() === 'code') return;

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

  selectedImage = this.#selectedImage.asReadonly();

  @HostListener('focusin', ['$event'])
  onComponentFocusIn(event: FocusEvent) {
    if (!this.#isBrowser) return;
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      this.#selectedImage.set(target as HTMLImageElement);
      const className = target.className || '';
      if (className.includes('sh-editor-img-theater')) {
        this.imgMode.set('theater');
      } else if (className.includes('sh-editor-img-float')) {
        this.imgMode.set('float');
      } else if (className.includes('sh-editor-img-custom') || className.includes('sh-editor-img-auto')) {
        this.imgMode.set('custom');
      } else {
        this.imgMode.set('content');
      }

      if (className.includes('sh-editor-img-size-small')) {
        this.imgSize.set('small');
      } else if (className.includes('sh-editor-img-size-medium')) {
        this.imgSize.set('medium');
      } else if (className.includes('sh-editor-img-size-large')) {
        this.imgSize.set('large');
      } else {
        this.imgSize.set('auto');
      }
      this.updateImgToolbarPosition();
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
      const className = target.className || '';
      if (className.includes('sh-editor-img-theater')) {
        this.imgMode.set('theater');
      } else if (className.includes('sh-editor-img-float')) {
        this.imgMode.set('float');
      } else if (className.includes('sh-editor-img-custom') || className.includes('sh-editor-img-auto')) {
        this.imgMode.set('custom');
      } else {
        this.imgMode.set('content');
      }

      if (className.includes('sh-editor-img-size-small')) {
        this.imgSize.set('small');
      } else if (className.includes('sh-editor-img-size-medium')) {
        this.imgSize.set('medium');
      } else if (className.includes('sh-editor-img-size-large')) {
        this.imgSize.set('large');
      } else {
        this.imgSize.set('auto');
      }
      this.updateImgToolbarPosition();
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

    if (this.viewMode() === 'design') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const anchorNode = selection.anchorNode;
        if (anchorNode) {
          const editorEl = this.editorRef()?.nativeElement;
          if (editorEl) {
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

            // 1. Exit block with Ctrl+Enter or Cmd+Enter
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
              const targetBlock = preEl || blockquoteEl || liEl;
              if (targetBlock) {
                event.preventDefault();
                const p = this.#document.createElement('p');
                p.innerHTML = '<br>';

                // If we are in a list item, we should insert the paragraph after the parent list (ul/ol)
                let insertAfterNode: HTMLElement = targetBlock;
                if (liEl) {
                  const listParent = liEl.closest('ul, ol') as HTMLElement;
                  if (listParent && editorEl.contains(listParent)) {
                    insertAfterNode = listParent;
                  }
                }

                insertAfterNode.parentNode?.insertBefore(p, insertAfterNode.nextSibling);

                // Focus the new paragraph
                const newRange = this.#document.createRange();
                newRange.setStart(p, 0);
                newRange.collapse(true);
                selection.removeAllRanges();
                selection.addRange(newRange);
                p.focus();

                this.#updateValueFromDOM();
                return;
              }
            }

            // 2. Double enter on empty blockquote or list item
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
              const targetBlock = blockquoteEl || liEl;
              if (targetBlock) {
                const text = targetBlock.textContent?.trim() || '';
                if (text === '') {
                  event.preventDefault();

                  const p = this.#document.createElement('p');
                  p.innerHTML = '<br>';

                  if (liEl) {
                    const listParent = liEl.closest('ul, ol') as HTMLElement;
                    if (listParent) {
                      if (listParent.children.length <= 1) {
                        listParent.parentNode?.replaceChild(p, listParent);
                      } else {
                        listParent.parentNode?.insertBefore(p, listParent.nextSibling);
                        liEl.remove();
                      }
                    }
                  } else {
                    targetBlock.parentNode?.replaceChild(p, targetBlock);
                  }

                  // Focus new paragraph
                  const newRange = this.#document.createRange();
                  newRange.setStart(p, 0);
                  newRange.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(newRange);
                  p.focus();

                  this.#updateValueFromDOM();
                  return;
                }
              }
            }

            // 3. Enter inside pre (code block) to insert newline instead of splitting tag
            if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
              if (preEl) {
                event.preventDefault();
                // Insert a newline character at current caret position
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const textNode = this.#document.createTextNode('\n');
                  range.insertNode(textNode);

                  // Move caret after the new line character
                  range.setStartAfter(textNode);
                  range.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(range);

                  this.#updateValueFromDOM();
                }
                return;
              }
            }
          }
        }
      }
    }

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
      }
    }
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

  #ensureImagesFocusable() {
    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;
    const imgs = editor.querySelectorAll('img');
    Array.from(imgs).forEach((img) => {
      if (!img.hasAttribute('tabindex')) {
        img.setAttribute('tabindex', '0');
      }
    });
  }

  @HostListener('scroll', ['$event'])
  onComponentScroll(event: Event) {
    if (this.#selectedImage()) {
      this.updateImgToolbarPosition();
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.#selectedImage()) {
      this.updateImgToolbarPosition();
    }
  }

  updateImgToolbarPosition() {
    const img = this.#selectedImage();
    const editorEl = this.editorRef()?.nativeElement;
    if (!img || !editorEl) return;

    const imgRect = img.getBoundingClientRect();
    const editorRect = editorEl.getBoundingClientRect();

    // Position toolbar just above the top-left edge of the image
    const top = imgRect.top - editorRect.top - 55 + editorEl.scrollTop;
    const left = imgRect.left - editorRect.left;

    this.imgToolbarTop.set(top);
    this.imgToolbarLeft.set(left);
  }

  setImageMode(mode: 'content' | 'theater' | 'float' | 'custom') {
    const img = this.#selectedImage();
    if (!img) return;

    img.classList.remove(
      'sh-editor-img-content',
      'sh-editor-img-theater',
      'sh-editor-img-float',
      'sh-editor-img-custom',
      'sh-editor-img-auto'
    );

    img.classList.add(`sh-editor-img-${mode}`);
    this.imgMode.set(mode);

    // If switching to content or theater (which do not support sizes), strip size classes
    if (mode === 'content' || mode === 'theater') {
      img.classList.remove(
        'sh-editor-img-size-auto',
        'sh-editor-img-size-small',
        'sh-editor-img-size-medium',
        'sh-editor-img-size-large'
      );
      this.imgSize.set('auto');
    }

    // Reposition overlay after CSS layout transition
    setTimeout(() => this.updateImgToolbarPosition(), 50);

    this.#updateValueFromDOM();
  }

  setImageSize(size: 'auto' | 'small' | 'medium' | 'large') {
    const img = this.#selectedImage();
    if (!img) return;

    img.classList.remove(
      'sh-editor-img-size-auto',
      'sh-editor-img-size-small',
      'sh-editor-img-size-medium',
      'sh-editor-img-size-large'
    );

    img.classList.add(`sh-editor-img-size-${size}`);
    this.imgSize.set(size);

    // Reposition overlay after CSS layout transition
    setTimeout(() => this.updateImgToolbarPosition(), 50);

    this.#updateValueFromDOM();
  }

  deleteImage() {
    const img = this.#selectedImage();
    if (img) {
      img.remove();
      this.#selectedImage.set(null);
      this.#updateValueFromDOM();
    }
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

    const editor = this.editorRef()?.nativeElement;
    if (!editor) return;

    // Restore selection range
    const selection = window.getSelection();
    if (selection && this.#savedRange) {
      selection.removeAllRanges();
      selection.addRange(this.#savedRange);
    }

    editor.focus();

    // Insert image markup with default content layout class
    const imgHtml = `<img src="${url}" class="sh-editor-img-content" alt="Image">`;
    const range = selection?.getRangeAt(0);
    if (range) {
      this.#saveHistory();
      this.#isInternalDOMUpdate = true;

      range.deleteContents();
      const el = this.#document.createElement('div');
      el.innerHTML = imgHtml;
      const child = el.firstChild;
      if (child) {
        range.insertNode(child);

        const newRange = this.#document.createRange();
        newRange.setStartAfter(child);
        newRange.collapse(true);
        selection?.removeAllRanges();
        selection?.addRange(newRange);
      }

      this.#updateValueFromDOM();
      this.#saveHistory();
      this.#isInternalDOMUpdate = false;
      this.onSelectionChange();
    }
  }

  // --- PUBLIC API METHODS ---

  getHTML(): string {
    const editor = this.editorRef()?.nativeElement;
    if (editor) {
      return editor.innerHTML;
    }
    // Fallback if not rendered
    const val = this.value();
    if (typeof val === 'string') {
      return this.format() === 'markdown' ? markdownToHTML(val) : val;
    }
    if (Array.isArray(val)) {
      return jsonToHTML(val);
    }
    return '';
  }

  getMarkdown(): string {
    const html = this.getHTML();
    return htmlToMarkdown(html, this.#document);
  }

  getJSON(): ShipEditorDocument {
    const html = this.getHTML();
    return htmlToJSON(html, this.#document);
  }

  setHTML(html: string) {
    this.#isWriting = true;
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
    this.#isWriting = false;
  }

  setMarkdown(md: string) {
    this.#isWriting = true;
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
    this.#isWriting = false;
  }

  setJSON(json: ShipEditorDocument) {
    this.#isWriting = true;
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
    this.#isWriting = false;
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
