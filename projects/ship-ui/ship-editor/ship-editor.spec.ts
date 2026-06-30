import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipEditor, ShipEditorDocument, ShipEditorInlineNode } from './ship-editor';
import { ShipA11yKeybindingsService } from '../ship-a11y-keybindings/ship-a11y-keybindings.service';


if (typeof window !== 'undefined') {
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = function () {
      return {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => {},
      } as DOMRect;
    };
  }
  if (!Range.prototype.intersectsNode) {
    Range.prototype.intersectsNode = function () {
      return true;
    };
  }
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function () {};
  }
  if (!HTMLElement.prototype.hidePopover) {
    HTMLElement.prototype.hidePopover = function () {};
  }
}


let mockRangeInstance: Range | null = null;
const mockSelection = {
  rangeCount: 0,
  getRangeAt(idx: number) {
    if (idx === 0 && mockRangeInstance) return mockRangeInstance;
    throw new Error('Index out of bounds');
  },
  removeAllRanges() {
    mockRangeInstance = null;
    this.rangeCount = 0;
  },
  addRange(r: Range) {
    mockRangeInstance = r;
    this.rangeCount = 1;
  },
  get isCollapsed() {
    return !mockRangeInstance || mockRangeInstance.collapsed;
  },
  get anchorNode() {
    return mockRangeInstance ? mockRangeInstance.startContainer : null;
  },
  get focusNode() {
    return mockRangeInstance ? mockRangeInstance.endContainer : null;
  },
};

if (typeof window !== 'undefined') {
  window.getSelection = () => mockSelection as any;
}

@Component({
  template: `
    <sh-editor
      [(value)]="value"
      [format]="format()"
      [placeholder]="placeholder()"
      [readonly]="readonly()"
      [toolbar]="toolbar()"></sh-editor>
  `,
  standalone: true,
  imports: [ShipEditor],
})
class TestHostComponent {
  value = signal<string | ShipEditorDocument | null>('Initial content');
  format = signal<'json' | 'html' | 'markdown'>('html');
  placeholder = signal('Type here...');
  readonly = signal(false);
  toolbar = signal(true);

  editorComponent = viewChild.required(ShipEditor);
}

describe('ShipEditor', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let comp: ShipEditor;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    comp = host.editorComponent();
  });

  it('should create the editor component', () => {
    expect(comp).toBeTruthy();
    const container = fixture.nativeElement.querySelector('.sh-editor-container');
    expect(container).toBeTruthy();
  });

  it('should render correct view mode elements', async () => {
    
    expect(comp.viewMode()).toBe('design');
    let editorContent = fixture.nativeElement.querySelector('.sh-editor-content');
    expect(editorContent).toBeTruthy();
    expect(editorContent.getAttribute('contenteditable')).toBe('true');

    
    host.readonly.set(true);
    fixture.detectChanges();
    expect(editorContent.getAttribute('contenteditable')).toBe('false');

    
    comp.viewMode.set('code');
    fixture.detectChanges();
    await fixture.whenStable();

    let codeArea = fixture.nativeElement.querySelector('.sh-editor-code');
    expect(codeArea).toBeTruthy();
  });

  it('should handle ControlValueAccessor changes', async () => {
    
    expect(comp.editorRef()?.nativeElement.innerHTML).toContain('Initial content');

    
    comp.editorRef()!.nativeElement.innerHTML = '<p>Updated content</p>';
    comp.editorRef()!.nativeElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.value()).toBe('<p>Updated content</p>');
  });

  it('should handle word and character counts', async () => {
    host.value.set('Hello world from sparkle UI');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.charCount()).toBe(27);
    expect(comp.wordCount()).toBe(5);

    host.value.set('');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.charCount()).toBe(0);
    expect(comp.wordCount()).toBe(0);
  });

  it('should format HTML to Markdown and Markdown to HTML conversions', async () => {
    
    host.format.set('markdown');
    fixture.detectChanges();
    await fixture.whenStable();

    
    host.value.set('**Bold** and *Italic*');
    fixture.detectChanges();
    await fixture.whenStable();

    
    expect(comp.getHTML()).toContain('<strong>Bold</strong> and <em>Italic</em>');

    
    comp.setMarkdown('# Heading 1\n\nSome text');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.getHTML()).toContain('<h1>Heading 1</h1>');
    expect(comp.getHTML()).toContain('<p>Some text</p>');
    expect(comp.getMarkdown()).toBe('# Heading 1\n\nSome text');
  });

  it('should handle HTML to JSON and JSON to HTML conversions', async () => {
    
    host.format.set('json');
    fixture.detectChanges();
    await fixture.whenStable();

    const jsonVal: ShipEditorDocument = [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Section Title' }],
      },
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'This is details.' }],
      },
    ];
    
    host.value.set(jsonVal);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(comp.getHTML()).toContain('<h2>Section Title</h2>');
    expect(comp.getHTML()).toContain('<p>This is details.</p>');

    comp.setHTML('<h3>New Subtitle</h3><p>New text</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const expectedJson = comp.getJSON();
    expect(expectedJson[0].type).toBe('heading');
    expect(expectedJson[0].attrs?.level).toBe(3);
    expect(expectedJson[1].type).toBe('paragraph');
  });

  it('should open link and image modals', () => {
    expect(comp.showLinkModal()).toBe(false);
    comp.openLinkModal();
    fixture.detectChanges();
    expect(comp.showLinkModal()).toBe(true);

    expect(comp.showImageModal()).toBe(false);
    comp.openImageModal();
    fixture.detectChanges();
    expect(comp.showImageModal()).toBe(true);
  });

  it('should trigger slash commands popup menu', () => {
    
    const textNode = document.createTextNode('/h');
    comp.editorRef()?.nativeElement.appendChild(textNode);
    
    const range = document.createRange();
    range.setStart(textNode, 2);
    range.setEnd(textNode, 2);
    mockSelection.addRange(range);

    expect(comp.showSlashMenu()).toBe(false);

    
    comp.editorRef()?.nativeElement.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'h' }));
    fixture.detectChanges();

    
    expect(comp.showSlashMenu()).toBe(true);
    expect(comp.slashSearchQuery()).toBe('h');
    expect(comp.filteredCommands().length).toBeGreaterThan(0);
    
    expect(comp.filteredCommands().some(c => c.id === 'h1')).toBe(true);
  });

  it('should intercept enter to split block in onBeforeInput', async () => {
    host.value.set('<p>Hello World</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    // Place caret in the middle: "Hello |World"
    const range = document.createRange();
    range.setStart(txtNode, 6);
    range.setEnd(txtNode, 6);
    mockSelection.addRange(range);

    const event = new InputEvent('beforeinput', {
      inputType: 'insertParagraph',
      cancelable: true,
      bubbles: true,
    });
    const spy = vi.spyOn(event, 'preventDefault');

    editorEl.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalled();
    const state = comp.documentState();
    expect(state.length).toBe(2);
    expect((state[0].content?.[0] as ShipEditorInlineNode).text).toBe('Hello ');
    expect((state[1].content?.[0] as ShipEditorInlineNode).text).toBe('World');
  });

  it('should intercept backspace to merge blocks in onBeforeInput', async () => {
    host.value.set('<p>Hello </p><p>World</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const paragraphs = editorEl.querySelectorAll('p');
    const p2 = paragraphs[1];
    const txtNode2 = p2.childNodes[0] as Text;

    // Place caret at start of second paragraph: "|World"
    const range = document.createRange();
    range.setStart(txtNode2, 0);
    range.setEnd(txtNode2, 0);
    mockSelection.addRange(range);

    const event = new InputEvent('beforeinput', {
      inputType: 'deleteContentBackward',
      cancelable: true,
      bubbles: true,
    });
    const spy = vi.spyOn(event, 'preventDefault');

    editorEl.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalled();
    const state = comp.documentState();
    expect(state.length).toBe(1);
    expect((state[0].content?.[0] as ShipEditorInlineNode).text).toBe('Hello ');
    expect((state[0].content?.[1] as ShipEditorInlineNode).text).toBe('World');
  });

  it('should handle formatting keybindings via keybinding service in onKeyDown', async () => {
    const kbService = TestBed.inject(ShipA11yKeybindingsService);
    const matchesSpy = vi.spyOn(kbService, 'matches').mockImplementation((ev, action) => action === 'editor.bold');
    const formatSpy = vi.spyOn(comp, 'formatText');

    const event = new KeyboardEvent('keydown', { key: 'b', ctrlKey: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');

    comp.onKeyDown(event);
    expect(matchesSpy).toHaveBeenCalledWith(event, 'editor.bold');
    expect(preventSpy).toHaveBeenCalled();
    expect(formatSpy).toHaveBeenCalledWith('bold');

    matchesSpy.mockRestore();
    formatSpy.mockRestore();
  });

  it('should preserve selection range when applyInlineStyle is called', async () => {
    host.value.set('<p>Hello World</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    // Select "World": from offset 6 to 11
    const range = document.createRange();
    range.setStart(txtNode, 6);
    range.setEnd(txtNode, 11);
    mockSelection.addRange(range);

    // Call applyInlineStyle
    comp.applyInlineStyle('strong');
    fixture.detectChanges();
    await fixture.whenStable();

    // Give setTimeout(..., 0) time to run
    await new Promise(resolve => setTimeout(resolve, 10));

    // Selection should still be "World" (which is now inside a strong tag)
    const activeRange = mockSelection.getRangeAt(0);
    expect(activeRange).toBeTruthy();
    expect(activeRange.collapsed).toBe(false);
    expect(activeRange.startContainer.textContent).toBe('World');
    expect(activeRange.startOffset).toBe(0);
    expect(activeRange.endContainer.textContent).toBe('World');
    expect(activeRange.endOffset).toBe(5);

    // Call applyInlineStyle to UNBOLD
    comp.applyInlineStyle('strong');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Selection should be back to "Hello World" with offset 6 to 11
    const activeRange2 = mockSelection.getRangeAt(0);
    expect(activeRange2).toBeTruthy();
    expect(activeRange2.collapsed).toBe(false);
    expect(activeRange2.startContainer.textContent).toBe('Hello World');
    expect(activeRange2.startOffset).toBe(6);
    expect(activeRange2.endContainer.textContent).toBe('Hello World');
    expect(activeRange2.endOffset).toBe(11);
  });

  it('should handle applying bold and italic, then removing bold correctly', async () => {
    host.value.set('<p>Hello World</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    // Select "World": from offset 6 to 11
    const range = document.createRange();
    range.setStart(txtNode, 6);
    range.setEnd(txtNode, 11);
    mockSelection.addRange(range);

    // Call Bold
    comp.applyInlineStyle('strong');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Call Italic
    comp.applyInlineStyle('em');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // Now it should be both bold and italic
    const htmlBefore = comp.getHTML();
    expect(htmlBefore).toContain('World');

    // Call Bold again to UNBOLD
    comp.applyInlineStyle('strong');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // It should now only be italic
    const htmlAfter = comp.getHTML();
    expect(htmlAfter).not.toContain('<strong>World</strong>');
    expect(htmlAfter).not.toContain('<b>World</b>');
    expect(htmlAfter).toContain('<em>World</em>');

    // Selection should be preserved on "World" (inside <em> tag)
    const activeRange = mockSelection.getRangeAt(0);
    expect(activeRange).toBeTruthy();
    expect(activeRange.collapsed).toBe(false);
    expect(activeRange.startContainer.textContent).toBe('World');
    expect(activeRange.startOffset).toBe(0);
    expect(activeRange.endContainer.textContent).toBe('World');
    expect(activeRange.endOffset).toBe(5);
  });

  it('should support undo and redo operations, restoring the AST and selection logically', async () => {
    host.value.set('<p>Initial Text</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    // Set selection: "Text"
    const range = document.createRange();
    range.setStart(txtNode, 8);
    range.setEnd(txtNode, 12);
    mockSelection.addRange(range);

    // Apply inline style bold (strong) -> this should save history state
    comp.applyInlineStyle('strong');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(comp.getHTML()).toContain('<strong>Text</strong>');

    // Perform undo
    comp.undo();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // It should be reverted back to initial text
    expect(comp.getHTML()).not.toContain('<strong>');
    expect(comp.getHTML()).toContain('Initial Text');

    // Selection should be restored to "Text" (offset 8 to 12)
    const restoredRange = mockSelection.getRangeAt(0);
    expect(restoredRange).toBeTruthy();
    expect(restoredRange.startContainer.textContent).toBe('Initial Text');
    expect(restoredRange.startOffset).toBe(8);
    expect(restoredRange.endContainer.textContent).toBe('Initial Text');
    expect(restoredRange.endOffset).toBe(12);

    // Perform redo
    comp.redo();
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    // It should be bolded again
    expect(comp.getHTML()).toContain('<strong>Text</strong>');

    // Selection should be preserved on "Text" inside the strong tag
    const redoneRange = mockSelection.getRangeAt(0);
    expect(redoneRange).toBeTruthy();
    expect(redoneRange.startContainer.textContent).toBe('Text');
    expect(redoneRange.startOffset).toBe(0);
    expect(redoneRange.endContainer.textContent).toBe('Text');
    expect(redoneRange.endOffset).toBe(4);
  });

  it('should convert block type using AST operations and preserve selection', async () => {
    host.value.set('<p>Some Content</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    // Set selection: "Content"
    const range = document.createRange();
    range.setStart(txtNode, 5);
    range.setEnd(txtNode, 12);
    mockSelection.addRange(range);

    // Convert paragraph to heading 3
    comp.setBlockType('h3');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(comp.getHTML()).toContain('<h3>Some Content</h3>');
    expect(editorEl.querySelectorAll('h3').length).toBe(1);
    expect(editorEl.querySelectorAll('p').length).toBe(0);

    // Selection should be preserved on "Content"
    const activeRange = mockSelection.getRangeAt(0);
    expect(activeRange).toBeTruthy();
    expect(activeRange.startContainer.textContent).toBe('Some Content');
    expect(activeRange.startOffset).toBe(5);
    expect(activeRange.endOffset).toBe(12);
  });

  it('should toggle block type to ordered list and unwrap it back without duplicates', async () => {
    host.value.set('<h1>Ship WYSIWYG Editor</h1>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const h1 = editorEl.querySelector('h1')!;
    const txtNode = h1.childNodes[0] as Text;

    // Set selection
    const range = document.createRange();
    range.setStart(txtNode, 5);
    range.setEnd(txtNode, 12);
    mockSelection.addRange(range);

    // Convert heading 1 to ordered list
    comp.toggleList('ol');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(editorEl.querySelectorAll('ol').length).toBe(1);
    expect(editorEl.querySelectorAll('li').length).toBe(1);
    expect(editorEl.querySelectorAll('h1').length).toBe(0);

    // Toggle list back to paragraph
    comp.toggleList('ol');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(editorEl.querySelectorAll('ol').length).toBe(0);
    expect(editorEl.querySelectorAll('li').length).toBe(0);
    expect(editorEl.querySelectorAll('p').length).toBe(1);
    expect(comp.getHTML()).toContain('<p>Ship WYSIWYG Editor</p>');
  });

  it('should toggle and untoggle text alignment correctly', async () => {
    comp.setHTML('<p>Aligned text</p>');
    fixture.detectChanges();
    await fixture.whenStable();

    const editorEl = comp.editorRef()!.nativeElement;
    const p = editorEl.querySelector('p')!;
    const txtNode = p.childNodes[0] as Text;

    const range = document.createRange();
    range.setStart(txtNode, 0);
    range.setEnd(txtNode, 12);
    mockSelection.addRange(range);

    comp.setAlign('center');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(comp.getHTML()).toContain('<p style="text-align: center;">Aligned text</p>');

    comp.setAlign('center');
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(comp.getHTML()).toBe('<p>Aligned text</p>');
  });
});

