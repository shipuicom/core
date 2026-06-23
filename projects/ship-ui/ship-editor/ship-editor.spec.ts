import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipEditor, ShipEditorDocument } from './ship-editor';


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
});
