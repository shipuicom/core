import { describe, it, expect } from 'vitest';
import {
  escapeHTML,
  jsonToHTML,
  htmlToJSON,
  htmlToMarkdown,
  markdownToHTML,
  insertText,
  deleteRange,
  applyMark,
  removeMark,
  ShipEditorDocument,
  ShipEditorInlineNode,
} from './ship-editor-core';

// Use global document which is available in Vitest test environment (JSDOM/Happy-DOM)
const testDoc = typeof document !== 'undefined' ? document : (globalThis as any).document;

describe('ShipEditor Core: HTML Escaping', () => {
  it('should escape HTML characters correctly', () => {
    expect(escapeHTML('<script>alert("hello")</script>')).toBe(
      '&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt;'
    );
    expect(escapeHTML("Click & drag 'me'")).toBe(
      'Click &amp; drag &#039;me&#039;'
    );
  });
});

describe('ShipEditor Core: JSON => HTML Conversion', () => {
  it('should convert an empty document to empty string', () => {
    expect(jsonToHTML([])).toBe('');
  });

  it('should format paragraphs with alignments', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        attrs: { align: 'center' },
        content: [{ type: 'text', text: 'Aligned center' }],
      },
      {
        type: 'paragraph',
        attrs: { align: 'right' },
        content: [{ type: 'text', text: 'Aligned right' }],
      },
    ];
    expect(jsonToHTML(doc)).toBe('<p style="text-align: center;">Aligned center</p><p style="text-align: right;">Aligned right</p>');
  });

  it('should format headings level 1 to 6', () => {
    const doc: ShipEditorDocument = [1, 2, 3, 4, 5, 6].map((level) => ({
      type: 'heading',
      attrs: { level },
      content: [{ type: 'text', text: `H${level}` }],
    }));
    expect(jsonToHTML(doc)).toBe(
      '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>'
    );
  });

  it('should format code blocks with languages', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'code-block',
        attrs: { language: 'typescript' },
        content: [{ type: 'text', text: 'const a = 123;' }],
      },
    ];
    expect(jsonToHTML(doc)).toBe('<pre><code class="language-typescript">const a = 123;</code></pre>');
  });

  it('should format quotes, hr, and images', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'quote',
        content: [{ type: 'text', text: 'This is a quote' }],
      },
      { type: 'hr' },
      {
        type: 'image',
        attrs: { src: 'pic.png', alt: 'picture', mode: 'float', size: 'small' },
      },
    ];
    expect(jsonToHTML(doc)).toBe(
      '<blockquote>This is a quote</blockquote><hr><img src="pic.png" alt="picture" class="sh-editor-img-float sh-editor-img-size-small">'
    );
  });

  it('should format lists with bullet/ordered configurations', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
        ],
      },
    ];
    expect(jsonToHTML(doc)).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
  });

  it('should wrap inline nodes with multiple nested marks', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'text',
            marks: [
              { type: 'bold' },
              { type: 'italic' },
              { type: 'underline' },
              { type: 'strike' },
              { type: 'code' },
              { type: 'link', attrs: { href: 'https://shipui.com', target: '_blank' } },
            ],
          },
        ],
      },
    ];
    // Order of marks execution: bold, italic, underline, strike, code, link
    expect(jsonToHTML(doc)).toBe(
      '<p><a href="https://shipui.com" target="_blank"><code><s><u><em><strong>text</strong></em></u></s></code></a></p>'
    );
  });
});

describe('ShipEditor Core: HTML => JSON Conversion', () => {
  it('should parse simple paragraphs and headings', () => {
    const html = '<h1>H1 Title</h1><p>Normal paragraph text</p>';
    const expected = [
      {
        type: 'heading',
        attrs: { level: 1, align: undefined },
        content: [{ type: 'text', text: 'H1 Title' }],
      },
      {
        type: 'paragraph',
        attrs: { align: undefined },
        content: [{ type: 'text', text: 'Normal paragraph text' }],
      },
    ];
    expect(htmlToJSON(html, testDoc)).toEqual(expected);
  });

  it('should parse text-align styles correctly', () => {
    const html = '<p style="text-align: right;">Right aligned</p>';
    const json = htmlToJSON(html, testDoc);
    expect(json[0].attrs?.align).toBe('right');
  });

  it('should parse formatted lists', () => {
    const html = '<ul><li><strong>Bold Item</strong></li><li>Regular Item</li></ul>';
    const expected = [
      {
        type: 'bullet-list',
        content: [
          {
            type: 'list-item',
            content: [{ type: 'text', text: 'Bold Item', marks: [{ type: 'bold' }] }],
          },
          {
            type: 'list-item',
            content: [{ type: 'text', text: 'Regular Item' }],
          },
        ],
      },
    ];
    expect(htmlToJSON(html, testDoc)).toEqual(expected);
  });

  it('should parse images with size and mode classes', () => {
    const html = '<img src="test.jpg" alt="test" class="sh-editor-img-float sh-editor-img-size-large">';
    const json = htmlToJSON(html, testDoc);
    expect(json[0]).toEqual({
      type: 'image',
      attrs: {
        src: 'test.jpg',
        alt: 'test',
        mode: 'float',
        size: 'large',
      },
    });
  });

  it('should fall back unknown nodes to paragraph blocks', () => {
    const html = '<span>Bare inline content</span>';
    const json = htmlToJSON(html, testDoc);
    expect(json[0].type).toBe('paragraph');
    const firstNode = json[0].content?.[0] as ShipEditorInlineNode;
    expect(firstNode.text).toBe('Bare inline content');
  });
});

describe('ShipEditor Core: HTML <=> Markdown Conversions', () => {
  it('should convert HTML headers to markdown', () => {
    expect(htmlToMarkdown('<h1>Title 1</h1><h2>Title 2</h2>', testDoc)).toBe(
      '# Title 1\n\n## Title 2'
    );
  });

  it('should convert HTML lists to markdown', () => {
    const html = '<ul><li>Item A</li><li>Item B</li></ul>';
    expect(htmlToMarkdown(html, testDoc)).toBe('* Item A\n* Item B');
  });

  it('should convert HTML links & bold/italic combinations to markdown', () => {
    const html = '<p>This is <strong>**very** important</strong> and <em>italicized</em></p>';
    expect(htmlToMarkdown(html, testDoc)).toBe('This is ****very** important** and *italicized*');
  });

  it('should convert markdown headers to HTML', () => {
    expect(markdownToHTML('# H1\n\n### H3')).toBe('<h1>H1</h1><h3>H3</h3>');
  });

  it('should convert markdown code blocks to HTML', () => {
    const md = '```javascript\nconsole.log(42);\n```';
    expect(markdownToHTML(md)).toBe('<pre><code class="language-javascript">console.log(42);</code></pre>');
  });

  it('should convert markdown lists to HTML', () => {
    const md = '* Item 1\n* Item 2\n\n1. First\n2. Second';
    expect(markdownToHTML(md)).toBe(
      '<ul><li>Item 1</li><li>Item 2</li></ul><ol><li>First</li><li>Second</li></ol>'
    );
  });
});

describe('ShipEditor Core: AST Mutation API', () => {
  it('should insert text into an empty or populated inline block', () => {
    // Empty block case
    const doc1: ShipEditorDocument = [{ type: 'paragraph', content: [] }];
    const updated1 = insertText(doc1, { blockIndex: 0, inlineIndex: 0, offset: 0 }, 'Start');
    const node1 = updated1[0].content?.[0] as ShipEditorInlineNode;
    expect(node1.text).toBe('Start');

    // Middle of text insertion
    const doc2: ShipEditorDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Before After' }] }];
    const updated2 = insertText(doc2, { blockIndex: 0, inlineIndex: 0, offset: 7 }, 'and ');
    const node2 = updated2[0].content?.[0] as ShipEditorInlineNode;
    expect(node2.text).toBe('Before and After');
  });

  it('should clamp insertion offset to length of text', () => {
    const doc: ShipEditorDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'abc' }] }];
    const updated = insertText(doc, { blockIndex: 0, inlineIndex: 0, offset: 99 }, 'def');
    const node = updated[0].content?.[0] as ShipEditorInlineNode;
    expect(node.text).toBe('abcdef');
  });

  it('should delete a range inside a single text block', () => {
    const doc: ShipEditorDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello Bold World' }] }];
    const updated = deleteRange(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 5 },
      { blockIndex: 0, inlineIndex: 0, offset: 10 }
    );
    const node = updated[0].content?.[0] as ShipEditorInlineNode;
    expect(node.text).toBe('Hello World');
  });

  it('should clean up empty inline nodes after deletion', () => {
    const doc: ShipEditorDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'abc' }] }];
    const updated = deleteRange(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 3 }
    );
    expect(updated[0].content?.length).toBe(0);
  });

  it('should apply inline marks without duplicates', () => {
    const doc: ShipEditorDocument = [{ type: 'paragraph', content: [{ type: 'text', text: 'styled' }] }];
    const firstApply = applyMark(doc, { type: 'bold' }, { blockIndex: 0, inlineIndex: 0, offset: 0 }, { blockIndex: 0, inlineIndex: 0, offset: 6 });
    const node1 = firstApply[0].content?.[0] as ShipEditorInlineNode;
    expect(node1.marks).toEqual([{ type: 'bold' }]);

    // Try applying again (should not duplicate)
    const secondApply = applyMark(firstApply, { type: 'bold' }, { blockIndex: 0, inlineIndex: 0, offset: 0 }, { blockIndex: 0, inlineIndex: 0, offset: 6 });
    const node2 = secondApply[0].content?.[0] as ShipEditorInlineNode;
    expect(node2.marks).toEqual([{ type: 'bold' }]);
  });

  it('should remove marks and cleanup marks array when empty', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'styled', marks: [{ type: 'bold' }, { type: 'italic' }] }],
      },
    ];

    const removeOne = removeMark(doc, 'bold', { blockIndex: 0, inlineIndex: 0, offset: 0 }, { blockIndex: 0, inlineIndex: 0, offset: 6 });
    const node1 = removeOne[0].content?.[0] as ShipEditorInlineNode;
    expect(node1.marks).toEqual([{ type: 'italic' }]);

    const removeAll = removeMark(removeOne, 'italic', { blockIndex: 0, inlineIndex: 0, offset: 0 }, { blockIndex: 0, inlineIndex: 0, offset: 6 });
    const node2 = removeAll[0].content?.[0] as ShipEditorInlineNode;
    expect(node2.marks).toBeUndefined();
  });
});
