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
import { htmlToAst, markdownToAst, parseDOMToAST } from './editor-serializers';
import { ASTBlockNode, ASTDocument, ASTInlineNode, ASTMark, LogicalPosition, LogicalSelection } from './editor.types';
import { EditorSelectionService } from './selection.service';
import * as Behaviors from './standard-behaviors';

@Component({
  selector: 'sh-editor',
  standalone: true,
  exportAs: 'shEditor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
          (input)="onDOMInput()"></div>
      </div>
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

  value = model<string | ASTDocument | null>(null);

  public engine = inject(EditorEngineService);
  public selection = inject(EditorSelectionService);
  keybindings = inject(ShipA11yKeybindingsService, { optional: true });

  #isWritingFromDOM = false;
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
      untracked(() => {
        if (!externalVal) this.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
        else if (this.format() === 'json' && Array.isArray(externalVal)) this.engine.reset(externalVal as ASTDocument);
        else {
          const doc =
            this.format() === 'markdown'
              ? markdownToAst(externalVal as string, this.engine.blocks, this.engine.inlines)
              : htmlToAst(externalVal as string, this.engine.blocks, this.engine.inlines);
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
      this.selection.suppress();
      this.patchDOM(doc);
      queueMicrotask(() => {
        this.selection.unsuppress();
        const currentSel = this.selection.active();
        if (currentSel) this.restoreDOMSelection(currentSel);
      });
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
    if (this.selection.isSuppressed() || typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    // Only update our logical selection when the browser selection is inside this editor
    if (this.surface().nativeElement.contains(range.commonAncestorContainer)) {
      this.selection.updateRect(this.surface().nativeElement);

      const startLogical = this.mapDOMToLogical(this.surface().nativeElement, range.startContainer, range.startOffset);
      const endLogical = range.collapsed
        ? startLogical
        : this.mapDOMToLogical(this.surface().nativeElement, range.endContainer, range.endOffset);

      if (startLogical && endLogical) {
        this.selection.live.set({ start: startLogical, end: endLogical, isCollapsed: range.collapsed });
      }
    } else {
      this.selection.domRect.set(null);
    }
  }

  onDOMInput() {
    const newDoc = parseDOMToAST(this.surface().nativeElement, this.engine.blocks, this.engine.inlines);
    this.#isWritingFromDOM = true;
    this.engine.document.set(newDoc);
  }

  onPaste(event: ClipboardEvent) {
    if (this.readonly()) return;
    event.preventDefault();

    const clipboard = event.clipboardData;
    if (!clipboard) return;

    const html = clipboard.getData('text/html');
    const plainText = clipboard.getData('text/plain');

    let fragment: ASTDocument;

    if (html) {
      fragment = htmlToAst(html, this.engine.blocks, this.engine.inlines);
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
  }

  onDOMBlur() {
    this.onTouched();
  }
  onDOMFocus() {}

  onKeyDown(event: KeyboardEvent) {
    if (this.readonly()) return;

    if (this.keybindings) {
      if (this.keybindings.matches(event, 'editor.undo')) {
        event.preventDefault();
        return this.engine.undo();
      }
      if (this.keybindings.matches(event, 'editor.redo')) {
        event.preventDefault();
        return this.engine.redo();
      }

      for (const block of this.engine.blocks.values()) {
        if (block.keybinding && this.keybindings.matches(event, block.keybinding)) {
          event.preventDefault();
          return this.engine.setBlockType(block.type);
        }
      }

      for (const inline of this.engine.inlines.values()) {
        if (inline.keybinding && this.keybindings.matches(event, inline.keybinding)) {
          event.preventDefault();
          return this.engine.toggleMark(inline.type);
        }
      }
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      if (this.engine.handleEscapeHatch()) event.preventDefault();
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      return this.engine.handleEnter();
    }

    if (event.key === 'Backspace') {
      event.preventDefault();
      return this.engine.handleBackspace();
    }

    if (event.key === 'Delete') {
      event.preventDefault();
      return this.engine.deleteForward();
    }

    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const sel = this.selection.active();
      if (sel && !sel.isCollapsed) {
        event.preventDefault();
        this.engine.insertText(event.key);
      }
    }
  }

  private patchDOM(doc: ASTDocument) {
    const container = this.surface().nativeElement;

    doc.forEach((block, index) => {
      const behavior = this.engine.blocks.get(block.type);
      if (!behavior) return;

      const newHTML =
        behavior.category === 'container'
          ? this.renderContainerBlock(block, behavior)
          : behavior.renderHTML(block, this.renderInlineContent(block.content as any));
      const existingEl = container.children[index] as HTMLElement;

      if (!existingEl) {
        const template = this.#document.createElement('template');
        template.innerHTML = newHTML;
        container.appendChild(template.content.firstElementChild!);
      } else if (existingEl.outerHTML !== newHTML) {
        const template = this.#document.createElement('template');
        template.innerHTML = newHTML;
        existingEl.replaceWith(template.content.firstElementChild!);
      }
    });

    while (container.children.length > doc.length) container.lastElementChild?.remove();
  }

  private renderInlineContent(nodes: ASTInlineNode[]): string {
    return nodes
      .map((n: any) => {
        let text = n.text || '';
        text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        n.marks?.forEach((mark: ASTMark) => {
          const inline = this.engine.inlines.get(mark.type);
          if (inline) text = inline.renderHTML(mark, text);
        });
        return text;
      })
      .join('');
  }

  private renderContainerBlock(block: ASTBlockNode, behavior: BaseBlockBehavior): string {
    const childrenHtml = (block.content as ASTBlockNode[])
      .map((child) => {
        const childBehavior = this.engine.blocks.get(child.type);
        if (!childBehavior) return '';
        const innerHtml = this.renderInlineContent(child.content as ASTInlineNode[]);
        return childBehavior.renderHTML(child, innerHtml);
      })
      .join('');
    return behavior.renderHTML(block, childrenHtml);
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

      const walker = document.createTreeWalker(targetEl, NodeFilter.SHOW_TEXT, null);
      let currentNode = walker.nextNode();
      let charOffset = 0;

      while (currentNode && currentNode !== node) {
        charOffset += currentNode.textContent?.length || 0;
        currentNode = walker.nextNode();
      }
      if (currentNode === node) charOffset += offset;

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

    const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, null);
    let currentNode = walker.nextNode();
    let charOffset = 0;

    while (currentNode && currentNode !== node) {
      charOffset += currentNode.textContent?.length || 0;
      currentNode = walker.nextNode();
    }
    if (currentNode === node) charOffset += offset;

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

          const walker = document.createTreeWalker(liEl, NodeFilter.SHOW_TEXT, null);
          let curr = walker.nextNode();
          let accum = 0;

          while (curr) {
            const len = curr.textContent?.length || 0;
            if (accum + len >= targetChar) return { node: curr, offset: targetChar - accum };
            accum += len;
            curr = walker.nextNode();
          }
          return { node: liEl, offset: 0 };
        } else {
          let targetChar = pos.offset;
          for (let i = 0; i < pos.inlineIndex; i++) targetChar += (blockAst?.content[i] as ASTInlineNode).text.length;

          if (behavior?.resolveDOMPosition && blockAst) {
            const result = behavior.resolveDOMPosition(blockEl, blockAst, targetChar);
            if (result) return result;
          }

          const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, null);
          let curr = walker.nextNode();
          let accum = 0;

          while (curr) {
            const len = curr.textContent?.length || 0;
            if (accum + len >= targetChar) return { node: curr, offset: targetChar - accum };
            accum += len;
            curr = walker.nextNode();
          }

          return { node: blockEl, offset: 0 };
        }
      };

      const start = getPos(sel.start);
      if (start) {
        if (start.node.nodeType === Node.ELEMENT_NODE) range.setStart(start.node, 0);
        else range.setStart(start.node, start.offset);

        if (sel.isCollapsed) range.collapse(true);
        else {
          const end = getPos(sel.end);
          if (end) {
            if (end.node.nodeType === Node.ELEMENT_NODE) range.setEnd(end.node, 0);
            else range.setEnd(end.node, end.offset);
          }
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
