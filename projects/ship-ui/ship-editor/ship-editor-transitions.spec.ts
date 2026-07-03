// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
  ShipEditorDocument,
  ShipEditorRegistry,
  formatDocRange,
  getJSONText,
  htmlToJSON,
  jsonToHTML,
  parseInlineNodes,
  registerDefaultExtensions,
  setBlockTypeInDoc,
  toggleListInDoc,
} from './ship-editor-core';

// Ensure defaults are registered before each test
beforeEach(() => {
  ShipEditorRegistry.clear();
  registerDefaultExtensions();

  // Register 'callout' extension for testing cross-actions as mentioned by the user
  ShipEditorRegistry.registerBlock({
    type: 'callout',
    toHTML: (block, contentHtml) => {
      const severity = block.attrs?.['severity'] || 'info';
      return `<div class="callout callout-${severity}">${contentHtml}</div>`;
    },
    parseHTML: (el) => {
      if (el.tagName.toLowerCase() === 'div' && el.classList.contains('callout')) {
        let severity = 'info';
        if (el.classList.contains('callout-warning')) severity = 'warning';
        else if (el.classList.contains('callout-error')) severity = 'error';

        return {
          type: 'callout',
          attrs: { severity },
          content: parseInlineNodes(el),
        };
      }
      return null;
    },
  });
});

describe('ShipEditor: Block Type Transitions (Exhaustive)', () => {
  const createDoc = (type: string, text: string, attrs: any = {}): ShipEditorDocument => [
    { type, attrs, content: [{ type: 'text', text }] },
  ];

  const getSelection = () => ({
    start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
    end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
  });

  describe('Transitions from Paragraph', () => {
    it('should convert paragraph to heading 1', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 1 });
      expect(res?.doc[0].type).toBe('heading');
      expect(res?.doc[0].attrs?.level).toBe(1);
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<h1>Hello</h1>');
    });

    it('should convert paragraph to quote', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'quote', {});
      expect(res?.doc[0].type).toBe('quote');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<blockquote>Hello</blockquote>');
    });

    it('should convert paragraph to code-block', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'code-block', { language: 'ts' });
      expect(res?.doc[0].type).toBe('code-block');
      expect(res?.doc[0].attrs?.language).toBe('ts');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<pre><code class="language-ts">Hello</code></pre>');
    });

    it('should convert paragraph to callout (info)', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'callout', { severity: 'info' });
      expect(res?.doc[0].type).toBe('callout');
      expect(res?.doc[0].attrs?.['severity']).toBe('info');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<div class="callout callout-info">Hello</div>');
    });
  });

  describe('Transitions from Heading', () => {
    it('should convert heading 1 to paragraph', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should convert heading 1 to heading 2', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 2 });
      expect(res?.doc[0].type).toBe('heading');
      expect(res?.doc[0].attrs?.level).toBe(2);
      expect(jsonToHTML(res!.doc)).toBe('<h2>Hello</h2>');
    });

    it('should convert heading 1 to quote', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'quote', {});
      expect(res?.doc[0].type).toBe('quote');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<blockquote>Hello</blockquote>');
    });

    it('should convert heading 1 to callout (info)', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'callout', { severity: 'info' });
      expect(res?.doc[0].type).toBe('callout');
      expect(res?.doc[0].attrs?.['severity']).toBe('info');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<div class="callout callout-info">Hello</div>');
    });
  });

  describe('Transitions from Quote', () => {
    it('should convert quote to paragraph', () => {
      const doc = createDoc('quote', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should convert quote to heading 1', () => {
      const doc = createDoc('quote', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 1 });
      expect(res?.doc[0].type).toBe('heading');
      expect(res?.doc[0].attrs?.level).toBe(1);
      expect(jsonToHTML(res!.doc)).toBe('<h1>Hello</h1>');
    });
  });

  describe('Transitions from Code Block', () => {
    it('should convert code-block to paragraph', () => {
      const doc = createDoc('code-block', 'const a = 1;', { language: 'ts' });
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('const a = 1;');
      expect(jsonToHTML(res!.doc)).toBe('<p>const a = 1;</p>');
    });
  });

  describe('Transitions from Callout', () => {
    it('should convert callout to paragraph', () => {
      const doc = createDoc('callout', 'Hello', { severity: 'info' });
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should convert callout to heading 1', () => {
      const doc = createDoc('callout', 'Hello', { severity: 'info' });
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 1 });
      expect(res?.doc[0].type).toBe('heading');
      expect(res?.doc[0].attrs?.level).toBe(1);
      expect(jsonToHTML(res!.doc)).toBe('<h1>Hello</h1>');
    });
  });

  describe('Transitions from/to Info Callout (built-in)', () => {
    it('should convert paragraph to info-callout', () => {
      const doc = createDoc('paragraph', 'Important note');
      const res = setBlockTypeInDoc(doc, getSelection(), 'info-callout', {});
      expect(res?.doc[0].type).toBe('info-callout');
      expect(getJSONText(res!.doc).trim()).toBe('Important note');
      const html = jsonToHTML(res!.doc);
      expect(html).toContain('sh-editor-callout');
      expect(html).toContain('sh-editor-callout-info');
      expect(html).toContain('💡');
      expect(html).toContain('Important note');
    });

    it('should round-trip info-callout through HTML', () => {
      const html =
        '<blockquote class="sh-editor-callout sh-editor-callout-info"><span class="sh-editor-callout-icon" contenteditable="false">💡</span>Check this out</blockquote>';
      const parsed = htmlToJSON(html);
      expect(parsed.length).toBe(1);
      expect(parsed[0].type).toBe('info-callout');
      expect(getJSONText(parsed).trim()).toBe('Check this out');
      // Re-serialize and re-parse to verify full round-trip
      const reHtml = jsonToHTML(parsed);
      expect(reHtml).toContain('sh-editor-callout-info');
      expect(reHtml).toContain('💡');
      const reParsed = htmlToJSON(reHtml);
      expect(reParsed[0].type).toBe('info-callout');
      expect(getJSONText(reParsed).trim()).toBe('Check this out');
    });

    it('should convert info-callout to paragraph', () => {
      const doc = createDoc('info-callout', 'Note');
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(jsonToHTML(res!.doc)).toBe('<p>Note</p>');
    });

    it('should convert info-callout to quote', () => {
      const doc = createDoc('info-callout', 'Note');
      const res = setBlockTypeInDoc(doc, getSelection(), 'quote', {});
      expect(res?.doc[0].type).toBe('quote');
      expect(jsonToHTML(res!.doc)).toBe('<blockquote>Note</blockquote>');
    });

    it('should convert quote to info-callout', () => {
      const doc = createDoc('quote', 'A wise saying');
      const res = setBlockTypeInDoc(doc, getSelection(), 'info-callout', {});
      expect(res?.doc[0].type).toBe('info-callout');
      expect(getJSONText(res!.doc).trim()).toBe('A wise saying');
    });

    it('should detoggle info-callout back to paragraph', () => {
      const doc = createDoc('info-callout', 'Note');
      const res = setBlockTypeInDoc(doc, getSelection(), 'info-callout', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(jsonToHTML(res!.doc)).toBe('<p>Note</p>');
    });
  });

  describe('Transitions from Lists', () => {
    it('should convert bullet-list to paragraph (unwrapping)', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
          ],
        },
      ];
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      expect(res?.doc.length).toBe(2);
      expect(res?.doc[0].type).toBe('paragraph');
      expect(res?.doc[1].type).toBe('paragraph');
      expect(getJSONText([res!.doc[0]]).trim()).toBe('Item 1');
      expect(getJSONText([res!.doc[1]]).trim()).toBe('Item 2');
      expect(jsonToHTML(res!.doc)).toBe('<p>Item 1</p><p>Item 2</p>');
    });

    it('should convert bullet-list to ordered-list', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'bullet-list',
          content: [{ type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] }],
        },
      ];
      const res = toggleListInDoc(doc, getSelection(), 'ol');
      expect(res?.doc[0].type).toBe('ordered-list');
      expect(jsonToHTML(res!.doc)).toBe('<ol><li>Item 1</li></ol>');
    });

    it('should convert paragraph to bullet-list', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = toggleListInDoc(doc, getSelection(), 'ul');
      expect(res?.doc[0].type).toBe('bullet-list');
      const items = res!.doc[0].content as any[];
      expect(items[0].type).toBe('list-item');
      expect(getJSONText([items[0]]).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<ul><li>Hello</li></ul>');
    });

    it('should convert multiple paragraphs into a single list', () => {
      const doc: ShipEditorDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Third' }] },
      ];
      const multiSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 2, inlineIndex: 0, offset: 5 },
      };
      const res = toggleListInDoc(doc, multiSelection, 'ul');
      expect(res).not.toBeNull();
      // All 3 paragraphs should become 1 list with 3 items
      expect(res!.doc.length).toBe(1);
      expect(res!.doc[0].type).toBe('bullet-list');
      const items = res!.doc[0].content as any[];
      expect(items.length).toBe(3);
      expect(items[0].content[0].text).toBe('First');
      expect(items[1].content[0].text).toBe('Second');
      expect(items[2].content[0].text).toBe('Third');
      expect(jsonToHTML(res!.doc)).toBe('<ul><li>First</li><li>Second</li><li>Third</li></ul>');
    });

    it('should merge paragraph + existing list into one list', () => {
      const doc: ShipEditorDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'New item' }] },
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'Existing item' }] }] },
      ];
      const multiSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
      };
      const res = toggleListInDoc(doc, multiSelection, 'ul');
      expect(res).not.toBeNull();
      // Should merge into 1 list with 2 items
      expect(res!.doc.length).toBe(1);
      expect(res!.doc[0].type).toBe('bullet-list');
      const items = res!.doc[0].content as any[];
      expect(items.length).toBe(2);
      expect(items[0].content[0].text).toBe('New item');
      expect(items[1].content[0].text).toBe('Existing item');
    });

    it('should preserve inline marks when converting multi-block to list', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Bold ', marks: [{ type: 'bold' }] },
            { type: 'text', text: 'text' },
          ],
        },
        { type: 'paragraph', content: [{ type: 'text', text: 'Plain text' }] },
      ];
      const multiSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 10 },
      };
      const res = toggleListInDoc(doc, multiSelection, 'ol');
      expect(res).not.toBeNull();
      expect(res!.doc.length).toBe(1);
      expect(res!.doc[0].type).toBe('ordered-list');
      expect(jsonToHTML(res!.doc)).toBe('<ol><li><strong>Bold </strong>text</li><li>Plain text</li></ol>');
    });

    it('should NOT merge adjacent blocks on setBlockType when full selection spills', () => {
      // Paragraph followed by a heading. Full-select spills into block 1.
      const doc: ShipEditorDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'First block' }] },
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Second block' }] },
      ];
      const spillSelection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 0 },
      };
      const res = setBlockTypeInDoc(doc, spillSelection, 'quote', {});
      expect(res).not.toBeNull();
      // Should still have 2 blocks — only block 0 converted
      expect(res!.doc.length).toBe(2);
      expect(res!.doc[0].type).toBe('quote');
      expect(res!.doc[1].type).toBe('heading');
      expect(getJSONText([res!.doc[0]]).trim()).toBe('First block');
      expect(getJSONText([res!.doc[1]]).trim()).toBe('Second block');
    });
  });

  describe('Block Toggle (Detoggle to Paragraph)', () => {
    it('should detoggle heading 1 back to paragraph', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 1 });
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should NOT detoggle heading 1 when converting to heading 2', () => {
      const doc = createDoc('heading', 'Hello', { level: 1 });
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 2 });
      expect(res?.doc[0].type).toBe('heading');
      expect(res?.doc[0].attrs?.level).toBe(2);
      expect(jsonToHTML(res!.doc)).toBe('<h2>Hello</h2>');
    });

    it('should detoggle quote back to paragraph', () => {
      const doc = createDoc('quote', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'quote', {});
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Hello');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should detoggle code-block back to paragraph', () => {
      const doc = createDoc('code-block', 'const x = 1;', { language: 'ts' });
      const res = setBlockTypeInDoc(doc, getSelection(), 'code-block', { language: 'ts' });
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('const x = 1;');
      expect(jsonToHTML(res!.doc)).toBe('<p>const x = 1;</p>');
    });

    it('should detoggle callout back to paragraph', () => {
      const doc = createDoc('callout', 'Important note', { severity: 'info' });
      const res = setBlockTypeInDoc(doc, getSelection(), 'callout', { severity: 'info' });
      expect(res?.doc[0].type).toBe('paragraph');
      expect(getJSONText(res!.doc).trim()).toBe('Important note');
      expect(jsonToHTML(res!.doc)).toBe('<p>Important note</p>');
    });

    it('should detoggle bullet-list to multiple paragraphs', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'bullet-list',
          content: [
            { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
            { type: 'list-item', content: [{ type: 'text', text: 'Item 3' }] },
          ],
        },
      ];
      const res = toggleListInDoc(doc, getSelection(), 'ul');
      // Detoggling same list type should unwrap into multiple paragraphs
      expect(res?.doc.length).toBe(3);
      expect(res?.doc[0].type).toBe('paragraph');
      expect(res?.doc[1].type).toBe('paragraph');
      expect(res?.doc[2].type).toBe('paragraph');
      expect(getJSONText([res!.doc[0]]).trim()).toBe('Item 1');
      expect(getJSONText([res!.doc[1]]).trim()).toBe('Item 2');
      expect(getJSONText([res!.doc[2]]).trim()).toBe('Item 3');
      expect(jsonToHTML(res!.doc)).toBe('<p>Item 1</p><p>Item 2</p><p>Item 3</p>');
    });

    it('should NOT detoggle paragraph (already paragraph)', () => {
      const doc = createDoc('paragraph', 'Hello');
      const res = setBlockTypeInDoc(doc, getSelection(), 'paragraph', {});
      // paragraph → paragraph should stay as paragraph (no toggle)
      expect(res?.doc[0].type).toBe('paragraph');
      expect(jsonToHTML(res!.doc)).toBe('<p>Hello</p>');
    });

    it('should preserve text alignment when detoggling', () => {
      const doc: ShipEditorDocument = [
        { type: 'heading', attrs: { level: 1, align: 'center' }, content: [{ type: 'text', text: 'Centered' }] },
      ];
      const res = setBlockTypeInDoc(doc, getSelection(), 'heading', { level: 1 });
      expect(res?.doc[0].type).toBe('paragraph');
      expect(res?.doc[0].attrs?.align).toBe('center');
      expect(jsonToHTML(res!.doc)).toBe('<p style="text-align: center;">Centered</p>');
    });
  });

  describe('Inline Mark Transitions', () => {
    it('should apply bold to text', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'bold', 'add');
      expect(jsonToHTML(res)).toBe('<p><strong>Hello</strong></p>');
    });

    it('should toggle bold on text', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] }],
        },
      ];
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'bold', 'toggle');
      expect(jsonToHTML(res)).toBe('<p>Hello</p>');
    });

    it('should apply multiple marks (bold + italic)', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      let res = formatDocRange(doc, selection.start, selection.end, 'bold', 'add');
      res = formatDocRange(res, selection.start, selection.end, 'italic', 'add');
      // Order of marks depends on implementation, usually reverse of application or as defined in registry
      // Based on inlineToHTML implementation, it iterates through node.marks
      expect(jsonToHTML(res)).toBe('<p><em><strong>Hello</strong></em></p>');
    });

    it('should apply code mark', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'code', 'add');
      expect(jsonToHTML(res)).toBe('<p><code>Hello</code></p>');
    });

    it('should apply link mark', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'link', 'add', { href: 'https://google.com' });
      expect(jsonToHTML(res)).toBe('<p><a href="https://google.com">Hello</a></p>');
    });

    it('should partially apply bold to text', () => {
      const doc = createDoc('paragraph', 'Hello World');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'bold', 'add');
      expect(jsonToHTML(res)).toBe('<p><strong>Hello</strong> World</p>');
    });

    it('should split existing bold text when removing bold partially', () => {
      const doc: ShipEditorDocument = [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello World', marks: [{ type: 'bold' }] }],
        },
      ];
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'bold', 'remove');
      expect(jsonToHTML(res)).toBe('<p>Hello<strong> World</strong></p>');
    });

    it('should apply underline mark', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'underline', 'add');
      expect(jsonToHTML(res)).toBe('<p><u>Hello</u></p>');
    });

    it('should apply strike mark', () => {
      const doc = createDoc('paragraph', 'Hello');
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'strike', 'add');
      expect(jsonToHTML(res)).toBe('<p><s>Hello</s></p>');
    });

    it('should apply bold across multiple blocks', () => {
      const doc: ShipEditorDocument = [
        { type: 'paragraph', content: [{ type: 'text', text: 'Para 1' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Para 2' }] },
      ];
      const selection = {
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 1, inlineIndex: 0, offset: 6 },
      };
      const res = formatDocRange(doc, selection.start, selection.end, 'bold', 'add');
      expect(jsonToHTML(res)).toBe('<p><strong>Para 1</strong></p><p><strong>Para 2</strong></p>');
    });
  });
});
