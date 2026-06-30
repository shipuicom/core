import { describe, it, expect, beforeEach } from 'vitest';
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
  ShipEditorBlock,
  ShipEditorRegistry,
  registerDefaultExtensions,
  mapDOMPositionToLogical,
  mapLogicalToDOMPosition,
  splitBlock,
  mergeBlocks,
  getJSONText,
  setBlockTypeInDoc,
  toggleListInDoc,
  parseInlineNodes,
  formatDocRange,
  clearDocRangeFormatting,
  areMarksEqual,
  parseImageClassNames,
  toggleMarkInBlockContent,
  getBlockRelativeOffset,
  getLogicalFromBlockRelative,
  parseInlineMarkdown,
  LogicalPosition,
} from './ship-editor-core';

// Use global document which is available in Vitest test environment (JSDOM/Happy-DOM)
const testDoc = typeof document !== 'undefined' ? document : (globalThis as any).document;

// Ensure defaults are registered before each test (registry no longer auto-initializes)
beforeEach(() => {
  ShipEditorRegistry.clear();
  registerDefaultExtensions();
});

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

  it('should mutate nested list items correctly', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
        ],
      },
    ];

    // Insert text into list item 1 (index 1)
    const updated = insertText(doc, { blockIndex: 0, listItemIndex: 1, inlineIndex: 0, offset: 6 }, '!');
    const list = updated[0].content as ShipEditorBlock[];
    const item2 = list[1].content as ShipEditorInlineNode[];
    expect(item2[0].text).toBe('Item 2!');

    // Apply mark to list item 0 (index 0)
    const marked = applyMark(updated, { type: 'bold' }, { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 0 }, { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 6 });
    const listMarked = marked[0].content as ShipEditorBlock[];
    const item1 = listMarked[0].content as ShipEditorInlineNode[];
    expect(item1[0].marks).toEqual([{ type: 'bold' }]);
  });
});

describe('ShipEditor Core: Custom Mark Extensions & Registry', () => {
  it('should register and render a custom mark extension', () => {
    // Register custom mark 'highlight'
    ShipEditorRegistry.registerMark({
      type: 'highlight',
      tagName: 'mark',
      className: 'sh-highlight'
    });

    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello', marks: [{ type: 'highlight' }] }
        ]
      }
    ];

    expect(jsonToHTML(doc)).toBe('<p><mark class="sh-highlight">Hello</mark></p>');

    // Test parsing back
    const parsed = htmlToJSON('<p><mark class="sh-highlight">Hello</mark></p>', testDoc);
    const inlineNode = parsed[0].content?.[0] as ShipEditorInlineNode;
    expect(inlineNode.marks).toEqual([{ type: 'highlight' }]);

    // Clean up custom registry after test
    ShipEditorRegistry.clear();
    registerDefaultExtensions();
  });
});

describe('ShipEditor Core: Selection Mapping Helpers', () => {
  it('should map DOM positions to LogicalPosition and back', () => {
    if (typeof document === 'undefined') return;

    const container = document.createElement('div');
    container.innerHTML = '<p>Hello <strong>World</strong></p><ul><li>First</li><li>Second</li></ul>';
    document.body.appendChild(container);

    const p = container.children[0] as HTMLElement;
    const txtHello = p.childNodes[0] as Text; // "Hello "
    const strong = p.childNodes[1] as HTMLElement; // <strong>
    const txtWorld = strong.childNodes[0] as Text; // "World"

    // Map DOM position inside "World" to logical
    const logical1 = mapDOMPositionToLogical(container, txtWorld, 2);
    expect(logical1).toEqual({
      blockIndex: 0,
      listItemIndex: undefined,
      inlineIndex: 1,
      offset: 2
    });

    // Map back
    const docMock: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Hello ' },
          { type: 'text', text: 'World', marks: [{ type: 'bold' }] }
        ]
      }
    ];
    const dom1 = mapLogicalToDOMPosition(container, logical1!, docMock);
    expect(dom1?.node).toBe(txtWorld);
    expect(dom1?.offset).toBe(2);

    // Test lists
    const ul = container.children[1] as HTMLElement;
    const li2 = ul.children[1] as HTMLElement;
    const txtSecond = li2.childNodes[0] as Text; // "Second"

    const logical2 = mapDOMPositionToLogical(container, txtSecond, 4);
    expect(logical2).toEqual({
      blockIndex: 1,
      listItemIndex: 1,
      inlineIndex: 0,
      offset: 4
    });

    const docMockList: ShipEditorDocument = [
      { type: 'paragraph', content: [] },
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'First' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'Second' }] }
        ]
      }
    ];
    const dom2 = mapLogicalToDOMPosition(container, logical2!, docMockList);
    expect(dom2?.node).toBe(txtSecond);
    expect(dom2?.offset).toBe(4);

    document.body.removeChild(container);
  });
});

describe('ShipEditor Core: splitBlock and mergeBlocks', () => {
  it('should split a paragraph in the middle', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello World' }],
      },
    ];
    const { doc: newDoc, newPosition } = splitBlock(doc, {
      blockIndex: 0,
      inlineIndex: 0,
      offset: 6,
    });

    expect(newDoc.length).toBe(2);
    expect((newDoc[0].content as ShipEditorInlineNode[])[0].text).toBe('Hello ');
    expect((newDoc[1].content as ShipEditorInlineNode[])[0].text).toBe('World');
    expect(newPosition).toEqual({
      blockIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });
  });

  it('should split a list item and insert a new item', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
        ],
      },
    ];
    const { doc: newDoc, newPosition } = splitBlock(doc, {
      blockIndex: 0,
      listItemIndex: 0,
      inlineIndex: 0,
      offset: 5,
    });

    const list = newDoc[0].content as ShipEditorBlock[];
    expect(list.length).toBe(2);
    expect((list[0].content as ShipEditorInlineNode[])[0].text).toBe('Item ');
    expect((list[1].content as ShipEditorInlineNode[])[0].text).toBe('1');
    expect(newPosition).toEqual({
      blockIndex: 0,
      listItemIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });
  });

  it('should exit a list when splitting an empty list item', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list-item', content: [] },
        ],
      },
    ];
    const { doc: newDoc, newPosition } = splitBlock(doc, {
      blockIndex: 0,
      listItemIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });

    expect(newDoc.length).toBe(2);
    expect(newDoc[0].type).toBe('bullet-list');
    expect((newDoc[0].content as ShipEditorBlock[]).length).toBe(1);
    expect(newDoc[1].type).toBe('paragraph');
    expect(newPosition).toEqual({
      blockIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });
  });

  it('should merge two paragraphs', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Para 1' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Para 2' }] },
    ];
    const { doc: newDoc, newPosition } = mergeBlocks(doc, {
      blockIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });

    expect(newDoc.length).toBe(1);
    expect((newDoc[0].content as ShipEditorInlineNode[]).length).toBe(2);
    expect((newDoc[0].content as ShipEditorInlineNode[])[0].text).toBe('Para 1');
    expect((newDoc[0].content as ShipEditorInlineNode[])[1].text).toBe('Para 2');
    expect(newPosition).toEqual({
      blockIndex: 0,
      inlineIndex: 0,
      offset: 6,
    });
  });

  it('should merge a list item into a preceding list item', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
        ],
      },
    ];
    const { doc: newDoc, newPosition } = mergeBlocks(doc, {
      blockIndex: 0,
      listItemIndex: 1,
      inlineIndex: 0,
      offset: 0,
    });

    const list = newDoc[0].content as ShipEditorBlock[];
    expect(list.length).toBe(1);
    expect((list[0].content as ShipEditorInlineNode[]).length).toBe(2);
    expect((list[0].content as ShipEditorInlineNode[])[0].text).toBe('Item 1');
    expect((list[0].content as ShipEditorInlineNode[])[1].text).toBe('Item 2');
    expect(newPosition).toEqual({
      blockIndex: 0,
      listItemIndex: 0,
      inlineIndex: 0,
      offset: 6,
    });
  });

  it('should merge first list item into preceding paragraph', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Paragraph' }] },
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item' }] },
        ],
      },
    ];
    const { doc: newDoc, newPosition } = mergeBlocks(doc, {
      blockIndex: 1,
      listItemIndex: 0,
      inlineIndex: 0,
      offset: 0,
    });

    expect(newDoc.length).toBe(1);
    expect(newDoc[0].type).toBe('paragraph');
    expect((newDoc[0].content as ShipEditorInlineNode[])[0].text).toBe('Paragraph');
    expect((newDoc[0].content as ShipEditorInlineNode[])[1].text).toBe('Item');
    expect(newPosition).toEqual({
      blockIndex: 0,
      inlineIndex: 0,
      offset: 9,
    });
  });
});

describe('ShipEditor Core: Block Type & List Transformations', () => {
  it('setBlockTypeInDoc should switch flat paragraph type to heading', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Heading Text' }] },
    ];
    const res = setBlockTypeInDoc(doc, {
      start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
      end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
    }, 'heading', { level: 1 });

    expect(res).not.toBeNull();
    expect(res!.doc.length).toBe(1);
    expect(res!.doc[0].type).toBe('heading');
    expect(res!.doc[0].attrs?.level).toBe(1);
  });

  it('setBlockTypeInDoc should unwrap lists to flat paragraphs', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item 1' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'Item 2' }] },
        ],
      },
    ];
    const res = setBlockTypeInDoc(doc, {
      start: { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 0 },
      end: { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 0 },
    }, 'paragraph', {});

    expect(res).not.toBeNull();
    expect(res!.doc.length).toBe(2);
    expect(res!.doc[0].type).toBe('paragraph');
    expect(res!.doc[1].type).toBe('paragraph');
    expect(getJSONText([res!.doc[0]])).toBe('Item 1');
    expect(getJSONText([res!.doc[1]])).toBe('Item 2');
    expect(res!.selectionShift?.start.blockIndex).toBe(0);
  });

  it('toggleListInDoc should wrap a paragraph into a bullet list', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'ListItem Text' }] },
    ];
    const res = toggleListInDoc(doc, {
      start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
      end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
    }, 'ul');

    expect(res).not.toBeNull();
    expect(res!.doc.length).toBe(1);
    expect(res!.doc[0].type).toBe('bullet-list');
    const items = res!.doc[0].content as ShipEditorBlock[];
    expect(items.length).toBe(1);
    expect(items[0].type).toBe('list-item');
    expect(getJSONText([items[0]])).toBe('ListItem Text');
    expect(res!.selectionShift?.start).toEqual({ blockIndex: 0, listItemIndex: 0 });
  });

  it('toggleListInDoc should unwrap list to paragraphs when toggling own type', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'Item' }] },
        ],
      },
    ];
    const res = toggleListInDoc(doc, {
      start: { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 0 },
      end: { blockIndex: 0, listItemIndex: 0, inlineIndex: 0, offset: 0 },
    }, 'ul');

    expect(res).not.toBeNull();
    expect(res!.doc.length).toBe(1);
    expect(res!.doc[0].type).toBe('paragraph');
    expect(getJSONText([res!.doc[0]])).toBe('Item');
  });
});

describe('ShipEditor Core: Custom Block Extensions & Registry', () => {
  it('should register, serialize, and parse a custom block extension', () => {
    // Register custom block 'callout'
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
            content: parseInlineNodes(el)
          };
        }
        return null;
      }
    });

    const doc: ShipEditorDocument = [
      {
        type: 'callout',
        attrs: { severity: 'warning' },
        content: [{ type: 'text', text: 'Be careful!' }]
      }
    ];

    // Serialization test
    expect(jsonToHTML(doc)).toBe('<div class="callout callout-warning">Be careful!</div>');

    // Parsing test
    const parsed = htmlToJSON('<div class="callout callout-warning">Be careful!</div>', testDoc);
    expect(parsed.length).toBe(1);
    expect(parsed[0]).toEqual({
      type: 'callout',
      attrs: { severity: 'warning' },
      content: [{ type: 'text', text: 'Be careful!' }]
    });

    // Clean up
    ShipEditorRegistry.clear();
    registerDefaultExtensions();
  });

  it('should register a block extension with keybinding', () => {
    ShipEditorRegistry.clear();
    registerDefaultExtensions();

    ShipEditorRegistry.registerBlock({
      type: 'callout',
      keybinding: 'editor.callout',
      onKeyAction: (_editor) => {
        // Custom action
        return true;
      },
      toHTML: (_block, contentHtml) => `<div class="callout">${contentHtml}</div>`,
      parseHTML: (el) => {
        if (el.tagName.toLowerCase() === 'div' && el.classList.contains('callout')) {
          return { type: 'callout', content: parseInlineNodes(el) };
        }
        return null;
      },
    });

    const blocks = ShipEditorRegistry.getAllBlocks();
    const calloutExt = blocks.find((b) => b.type === 'callout');
    expect(calloutExt).toBeDefined();
    expect(calloutExt!.keybinding).toBe('editor.callout');
    expect(calloutExt!.onKeyAction).toBeTypeOf('function');

    // Clean up
    ShipEditorRegistry.clear();
    registerDefaultExtensions();
  });
});



describe('ShipEditor Core: formatDocRange & clearDocRangeFormatting', () => {
  it('should toggle bold on a single-block selection', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    // Toggle ON
    const bolded = formatDocRange(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 5 },
      'bold',
      'toggle'
    );
    const nodes1 = bolded[0].content as ShipEditorInlineNode[];
    // The first part ("Hello") should be bold
    expect(nodes1.some(n => n.text === 'Hello' && n.marks?.some(m => m.type === 'bold'))).toBe(true);

    // Toggle OFF (apply again to the same range)
    const unbolded = formatDocRange(
      bolded,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 5 },
      'bold',
      'toggle'
    );
    const nodes2 = unbolded[0].content as ShipEditorInlineNode[];
    // No node should have bold after toggle off
    expect(nodes2.every(n => !n.marks || !n.marks.some(m => m.type === 'bold'))).toBe(true);
  });

  it('should add bold across multiple blocks', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
    ];

    const result = formatDocRange(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 1, inlineIndex: 0, offset: 6 },
      'bold',
      'add'
    );

    const block0 = result[0].content as ShipEditorInlineNode[];
    const block1 = result[1].content as ShipEditorInlineNode[];
    expect(block0.some(n => n.marks?.some(m => m.type === 'bold'))).toBe(true);
    expect(block1.some(n => n.marks?.some(m => m.type === 'bold'))).toBe(true);
  });

  it('should remove a mark explicitly', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Bold text', marks: [{ type: 'bold' }] }],
      },
    ];

    const result = formatDocRange(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 9 },
      'bold',
      'remove'
    );
    const nodes = result[0].content as ShipEditorInlineNode[];
    expect(nodes.every(n => !n.marks || !n.marks.some(m => m.type === 'bold'))).toBe(true);
  });

  it('clearDocRangeFormatting should strip all marks from a range', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Styled', marks: [{ type: 'bold' }, { type: 'italic' }, { type: 'underline' }] },
        ],
      },
    ];

    const result = clearDocRangeFormatting(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 6 }
    );

    const nodes = result[0].content as ShipEditorInlineNode[];
    expect(nodes.every(n => !n.marks || n.marks.length === 0)).toBe(true);
  });

  it('clearDocRangeFormatting should leave content without marks unchanged', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Plain text' }] },
    ];

    const result = clearDocRangeFormatting(
      doc,
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 10 }
    );

    const nodes = result[0].content as ShipEditorInlineNode[];
    expect(getJSONText(result)).toBe('Plain text');
    expect(nodes.every(n => !n.marks || n.marks.length === 0)).toBe(true);
  });
});

describe('ShipEditor Core: areMarksEqual', () => {
  it('should return true for two undefined mark arrays', () => {
    expect(areMarksEqual(undefined, undefined)).toBe(true);
  });

  it('should return false when one is undefined', () => {
    expect(areMarksEqual([{ type: 'bold' }], undefined)).toBe(false);
    expect(areMarksEqual(undefined, [{ type: 'bold' }])).toBe(false);
  });

  it('should return false for different lengths', () => {
    expect(areMarksEqual([{ type: 'bold' }], [{ type: 'bold' }, { type: 'italic' }])).toBe(false);
  });

  it('should return true for same marks in any order', () => {
    expect(areMarksEqual(
      [{ type: 'bold' }, { type: 'italic' }],
      [{ type: 'italic' }, { type: 'bold' }]
    )).toBe(true);
  });

  it('should compare link marks with different hrefs', () => {
    expect(areMarksEqual(
      [{ type: 'link', attrs: { href: 'https://a.com' } }],
      [{ type: 'link', attrs: { href: 'https://b.com' } }]
    )).toBe(false);

    expect(areMarksEqual(
      [{ type: 'link', attrs: { href: 'https://a.com', target: '_blank' } }],
      [{ type: 'link', attrs: { href: 'https://a.com', target: '_blank' } }]
    )).toBe(true);
  });
});

describe('ShipEditor Core: parseImageClassNames', () => {
  it('should parse content mode (default)', () => {
    const { mode, size } = parseImageClassNames('');
    expect(mode).toBe('content');
    expect(size).toBe('auto');
  });

  it('should parse theater mode', () => {
    const { mode } = parseImageClassNames('sh-editor-img-theater');
    expect(mode).toBe('theater');
  });

  it('should parse float mode with small size', () => {
    const { mode, size } = parseImageClassNames('sh-editor-img-float sh-editor-img-size-small');
    expect(mode).toBe('float');
    expect(size).toBe('small');
  });

  it('should parse custom mode with medium size', () => {
    const { mode, size } = parseImageClassNames('sh-editor-img-custom sh-editor-img-size-medium');
    expect(mode).toBe('custom');
    expect(size).toBe('medium');
  });

  it('should parse large size', () => {
    const { size } = parseImageClassNames('sh-editor-img-float sh-editor-img-size-large');
    expect(size).toBe('large');
  });

  it('should handle auto mode class', () => {
    const { mode } = parseImageClassNames('sh-editor-img-auto');
    expect(mode).toBe('custom');
  });
});

// ────────────────────────────────────────────────────────────────
// 4.1 – New core tests for previously untested areas
// ────────────────────────────────────────────────────────────────

describe('ShipEditor Core: toggleMarkInBlockContent', () => {
  it('should add bold to a single-node range', () => {
    const content: ShipEditorInlineNode[] = [
      { type: 'text', text: 'hello world' },
    ];
    const result = toggleMarkInBlockContent(
      content,
      { inlineIndex: 0, offset: 6 },
      { inlineIndex: 0, offset: 11 },
      'strong',
      true
    );
    expect(result.length).toBe(2);
    expect(result[0].text).toBe('hello ');
    expect(result[0].marks).toBeUndefined();
    expect(result[1].text).toBe('world');
    expect(result[1].marks).toEqual([{ type: 'strong', attrs: undefined }]);
  });

  it('should remove bold from a partially bolded range', () => {
    const content: ShipEditorInlineNode[] = [
      { type: 'text', text: 'hello ', marks: [{ type: 'strong' }] },
      { type: 'text', text: 'world' },
    ];
    const result = toggleMarkInBlockContent(
      content,
      { inlineIndex: 0, offset: 0 },
      { inlineIndex: 1, offset: 5 },
      'strong',
      false
    );
    const hasStrong = result.some((n) => n.marks?.some((m) => m.type === 'strong'));
    expect(hasStrong).toBe(false);
  });

  it('should add mark spanning across multiple inline nodes', () => {
    const content: ShipEditorInlineNode[] = [
      { type: 'text', text: 'aaa' },
      { type: 'text', text: 'bbb' },
      { type: 'text', text: 'ccc' },
    ];
    // Mark from middle of first node to middle of last
    const result = toggleMarkInBlockContent(
      content,
      { inlineIndex: 0, offset: 1 },
      { inlineIndex: 2, offset: 2 },
      'em',
      true
    );
    // "a" should be unmarked, "aa" + "bbb" + "cc" should be italic, "c" unmarked
    const italicText = result.filter((n) => n.marks?.some((m) => m.type === 'em')).map((n) => n.text).join('');
    expect(italicText).toBe('aabbbcc');
  });

  it('should handle overlapping marks (add italic to already-bold text)', () => {
    const content: ShipEditorInlineNode[] = [
      { type: 'text', text: 'bold text', marks: [{ type: 'strong' }] },
    ];
    const result = toggleMarkInBlockContent(
      content,
      { inlineIndex: 0, offset: 0 },
      { inlineIndex: 0, offset: 9 },
      'em',
      true
    );
    expect(result.length).toBe(1);
    expect(result[0].marks).toEqual([
      { type: 'strong' },
      { type: 'em', attrs: undefined },
    ]);
  });

  it('should update attrs on existing mark type', () => {
    const content: ShipEditorInlineNode[] = [
      { type: 'text', text: 'link text', marks: [{ type: 'link', attrs: { href: 'https://old.com' } }] },
    ];
    const result = toggleMarkInBlockContent(
      content,
      { inlineIndex: 0, offset: 0 },
      { inlineIndex: 0, offset: 9 },
      'link',
      true,
      { href: 'https://new.com' }
    );
    expect(result[0].marks![0].attrs).toEqual({ href: 'https://new.com' });
  });
});

describe('ShipEditor Core: getBlockRelativeOffset / getLogicalFromBlockRelative roundtrip', () => {
  const doc: ShipEditorDocument = [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: ' World' },
        { type: 'text', text: '!' },
      ],
    },
  ];

  it('should compute correct relative offset for position in first node', () => {
    const pos: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 3 };
    expect(getBlockRelativeOffset(pos, doc)).toBe(3);
  });

  it('should compute correct relative offset for position in second node', () => {
    const pos: LogicalPosition = { blockIndex: 0, inlineIndex: 1, offset: 2 };
    // 5 ("Hello") + 2 = 7
    expect(getBlockRelativeOffset(pos, doc)).toBe(7);
  });

  it('should compute correct relative offset for position at end of last node', () => {
    const pos: LogicalPosition = { blockIndex: 0, inlineIndex: 2, offset: 1 };
    // 5 + 6 + 1 = 12
    expect(getBlockRelativeOffset(pos, doc)).toBe(12);
  });

  it('should roundtrip: getLogicalFromBlockRelative(getBlockRelativeOffset(pos)) === pos', () => {
    const positions: LogicalPosition[] = [
      { blockIndex: 0, inlineIndex: 0, offset: 0 },
      { blockIndex: 0, inlineIndex: 0, offset: 3 },
      { blockIndex: 0, inlineIndex: 1, offset: 2 },
      { blockIndex: 0, inlineIndex: 2, offset: 1 },
    ];
    for (const pos of positions) {
      const charOffset = getBlockRelativeOffset(pos, doc);
      const result = getLogicalFromBlockRelative(pos.blockIndex, pos.listItemIndex, charOffset, doc);
      expect(result.blockIndex).toBe(pos.blockIndex);
      expect(result.inlineIndex).toBe(pos.inlineIndex);
      expect(result.offset).toBe(pos.offset);
    }
  });

  it('should handle position at the very end of the block', () => {
    // total text = "Hello World!" = 12 chars
    const result = getLogicalFromBlockRelative(0, undefined, 12, doc);
    expect(result.inlineIndex).toBe(2);
    expect(result.offset).toBe(1); // end of "!"
  });

  it('should handle empty block', () => {
    const emptyDoc: ShipEditorDocument = [
      { type: 'paragraph', content: [] },
    ];
    const result = getLogicalFromBlockRelative(0, undefined, 0, emptyDoc);
    expect(result).toEqual({ blockIndex: 0, listItemIndex: undefined, inlineIndex: 0, offset: 0 });
  });
});

describe('ShipEditor Core: parseInlineMarkdown edge cases', () => {
  it('should parse nested bold+italic ***text***', () => {
    const result = parseInlineMarkdown('***hello***');
    // Bold is processed first: **bold** → <strong>, then * wraps
    // ***hello*** → *<strong>hello</strong>* → <em><strong>hello</strong></em>
    expect(result).toContain('<strong>');
    expect(result).toContain('hello');
  });

  it('should parse bold with __underscores__', () => {
    expect(parseInlineMarkdown('__bold__')).toBe('<strong>bold</strong>');
  });

  it('should parse inline code', () => {
    expect(parseInlineMarkdown('use `code` here')).toBe('use <code>code</code> here');
  });

  it('should parse strikethrough', () => {
    expect(parseInlineMarkdown('~~deleted~~')).toBe('<s>deleted</s>');
  });

  it('should parse images in markdown', () => {
    expect(parseInlineMarkdown('![alt](http://img.png)')).toBe('<img src="http://img.png" alt="alt">');
  });

  it('should parse links', () => {
    expect(parseInlineMarkdown('[click](https://link.com)')).toBe('<a href="https://link.com">click</a>');
  });

  it('should escape HTML within markdown text', () => {
    const result = parseInlineMarkdown('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;script&gt;');
  });
});

describe('ShipEditor Core: getJSONText edge cases', () => {
  it('should extract text from code blocks', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'code-block',
        content: [
          { type: 'text', text: 'const x = 1;\nconst y = 2;' },
        ],
      },
    ];
    const text = getJSONText(doc);
    expect(text).toBe('const x = 1;\nconst y = 2;');
  });

  it('should extract text from deeply nested lists', () => {
    const doc: ShipEditorDocument = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'item one' }] },
          { type: 'list-item', content: [{ type: 'text', text: 'item two' }] },
        ],
      },
    ];
    const text = getJSONText(doc);
    expect(text).toContain('item one');
    expect(text).toContain('item two');
  });

  it('should return empty string for empty doc', () => {
    expect(getJSONText([])).toBe('');
  });

  it('should join multiple blocks with spaces', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'first' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'second' }] },
    ];
    const text = getJSONText(doc);
    expect(text).toBe('first second');
  });
});

describe('ShipEditor Core: escapeHTML edge cases', () => {
  it('should handle emoji content', () => {
    const input = '🎉 Hello & goodbye 🥳';
    const result = escapeHTML(input);
    expect(result).toBe('🎉 Hello &amp; goodbye 🥳');
  });

  it('should handle unicode characters', () => {
    expect(escapeHTML('café & résumé')).toBe('café &amp; résumé');
  });

  it('should handle empty string', () => {
    expect(escapeHTML('')).toBe('');
  });

  it('should handle string with only special chars', () => {
    expect(escapeHTML('<>&"\'')).toBe('&lt;&gt;&amp;&quot;&#039;');
  });
});

/**
 * Hotkey Toggle Simulation Tests
 *
 * These tests simulate the exact same logic path that the ShipEditor component
 * uses when a hotkey toggles inline formatting:
 *
 * 1. Start with a document
 * 2. Select a range (logical positions)
 * 3. Apply formatting via formatDocRange (toggle mode)
 * 4. Compute the restored selection using getBlockRelativeOffset + getLogicalFromBlockRelative
 * 5. Apply the SAME formatting again (should toggle OFF)
 * 6. Verify the formatting was removed
 *
 * This validates the core logic that caused the "toggle fails without re-selecting" bug.
 */
describe('ShipEditor Core: Hotkey toggle simulation', () => {
  /**
   * Helper: simulates one formatting toggle cycle.
   * Takes a doc, a selection range, and a mark type.
   * Returns the new doc AND the restored selection positions (as if
   * getLogicalFromBlockRelative was used to map back after re-render).
   */
  function simulateToggle(
    doc: ShipEditorDocument,
    start: LogicalPosition,
    end: LogicalPosition,
    markType: string,
  ) {
    // Compute block-relative character offsets BEFORE formatting
    const startOffset = getBlockRelativeOffset(start, doc);
    const endOffset = getBlockRelativeOffset(end, doc);

    // Apply formatting
    const newDoc = formatDocRange(structuredClone(doc), start, end, markType, 'toggle');

    // Restore selection using getLogicalFromBlockRelative (same as runTransaction)
    const restoredStart = getLogicalFromBlockRelative(
      start.blockIndex, start.listItemIndex, startOffset, newDoc,
    );
    const restoredEnd = getLogicalFromBlockRelative(
      end.blockIndex, end.listItemIndex, endOffset, newDoc,
    );

    return { doc: newDoc, start: restoredStart, end: restoredEnd };
  }

  it('should toggle bold on and off without re-selecting', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    // Select "World" (offset 6..11)
    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    // Toggle ON
    const after1 = simulateToggle(doc, start, end, 'bold');
    expect(jsonToHTML(after1.doc)).toContain('<strong>World</strong>');

    // Toggle OFF using the restored selection (no manual re-select)
    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'bold');
    expect(jsonToHTML(after2.doc)).not.toContain('<strong>');
    expect(jsonToHTML(after2.doc)).toContain('Hello World');
  });

  it('should toggle italic on and off without re-selecting', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    const after1 = simulateToggle(doc, start, end, 'italic');
    expect(jsonToHTML(after1.doc)).toContain('<em>World</em>');

    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'italic');
    expect(jsonToHTML(after2.doc)).not.toContain('<em>');
    expect(jsonToHTML(after2.doc)).toContain('Hello World');
  });

  it('should toggle underline on and off without re-selecting', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Some text here' }] },
    ];

    // Select "text" (offset 5..9)
    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 5 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 9 };

    const after1 = simulateToggle(doc, start, end, 'underline');
    expect(jsonToHTML(after1.doc)).toContain('<u>text</u>');

    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'underline');
    expect(jsonToHTML(after2.doc)).not.toContain('<u>');
    expect(jsonToHTML(after2.doc)).toContain('Some text here');
  });

  it('should toggle strikethrough on and off without re-selecting', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Some text here' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 5 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 9 };

    const after1 = simulateToggle(doc, start, end, 'strike');
    expect(jsonToHTML(after1.doc)).toContain('<s>text</s>');

    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'strike');
    expect(jsonToHTML(after2.doc)).not.toContain('<s>');
    expect(jsonToHTML(after2.doc)).toContain('Some text here');
  });

  it('should apply bold then italic, then remove bold only (preserving italic)', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    // Apply bold
    const after1 = simulateToggle(doc, start, end, 'bold');
    expect(jsonToHTML(after1.doc)).toContain('<strong>World</strong>');

    // Apply italic (stacked on bold)
    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'italic');
    const html2 = jsonToHTML(after2.doc);
    expect(html2).toContain('World');

    // Remove bold only
    const after3 = simulateToggle(after2.doc, after2.start, after2.end, 'bold');
    const html3 = jsonToHTML(after3.doc);
    expect(html3).not.toContain('<strong>');
    expect(html3).not.toContain('<b>');
    expect(html3).toContain('<em>World</em>');
  });

  it('should chain bold+italic+underline then remove each one by one', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    // Apply bold
    const s1 = simulateToggle(doc, start, end, 'bold');
    // Apply italic
    const s2 = simulateToggle(s1.doc, s1.start, s1.end, 'italic');
    // Apply underline
    const s3 = simulateToggle(s2.doc, s2.start, s2.end, 'underline');

    expect(jsonToHTML(s3.doc)).toContain('World');

    // Remove underline
    const s4 = simulateToggle(s3.doc, s3.start, s3.end, 'underline');
    expect(jsonToHTML(s4.doc)).not.toContain('<u>');

    // Remove italic
    const s5 = simulateToggle(s4.doc, s4.start, s4.end, 'italic');
    expect(jsonToHTML(s5.doc)).not.toContain('<em>');

    // Remove bold
    const s6 = simulateToggle(s5.doc, s5.start, s5.end, 'bold');
    expect(jsonToHTML(s6.doc)).not.toContain('<strong>');
    expect(jsonToHTML(s6.doc)).toContain('Hello World');
  });

  it('should preserve correct selection positions after toggle on', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    const after = simulateToggle(doc, start, end, 'bold');

    // After bolding "World", the doc becomes ["Hello "(len=6), <strong>"World"(len=5)</strong>]
    // getLogicalFromBlockRelative uses <= len, so offset 6 stays in node 0 (at its boundary).
    // This is equivalent to inlineIndex 1, offset 0 for DOM purposes.
    expect(after.start.blockIndex).toBe(0);
    expect(after.start.inlineIndex).toBe(0);
    expect(after.start.offset).toBe(6);

    // End offset 11 maps to: node 0 (len=6), remaining=5, node 1 (len=5), 5<=5 → inlineIndex 1, offset 5
    expect(after.end.blockIndex).toBe(0);
    expect(after.end.inlineIndex).toBe(1);
    expect(after.end.offset).toBe(5);
  });

  it('should preserve correct selection positions after toggle off', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 11 };

    // Toggle ON
    const after1 = simulateToggle(doc, start, end, 'bold');
    // Toggle OFF
    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'bold');

    // After removing bold, text merges back to "Hello World" (single inline node, len=11)
    // Start offset 6 → inlineIndex 0, offset 6
    expect(after2.start.blockIndex).toBe(0);
    expect(after2.start.inlineIndex).toBe(0);
    expect(after2.start.offset).toBe(6);

    // End offset 11 → inlineIndex 0, offset 11 (at the very end, <= len)
    expect(after2.end.blockIndex).toBe(0);
    expect(after2.end.inlineIndex).toBe(0);
    expect(after2.end.offset).toBe(11);
  });

  it('should handle toggle at exact word boundary (end of text node)', () => {
    // This was the original bug: getLogicalFromBlockRelative jumped to the
    // next node when remaining === len, causing the cursor to leak into the
    // wrong inline node. Fixed by using remaining <= len.
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'Hello World' }] },
    ];

    // Select exactly "Hello " (offset 0..6) — boundary at end of first node after split
    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 0 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 6 };

    const after1 = simulateToggle(doc, start, end, 'bold');
    expect(jsonToHTML(after1.doc)).toContain('<strong>Hello </strong>');

    // The end position should stay within the bold node, NOT leak into "World"
    expect(after1.end.inlineIndex).toBe(0);
    expect(after1.end.offset).toBe(6);

    // Toggle off should work
    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'bold');
    expect(jsonToHTML(after2.doc)).not.toContain('<strong>');
    expect(jsonToHTML(after2.doc)).toContain('Hello World');
  });

  it('should handle toggle on middle portion of text', () => {
    const doc: ShipEditorDocument = [
      { type: 'paragraph', content: [{ type: 'text', text: 'The quick brown fox' }] },
    ];

    // Select "quick" (offset 4..9)
    const start: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 4 };
    const end: LogicalPosition = { blockIndex: 0, inlineIndex: 0, offset: 9 };

    const after1 = simulateToggle(doc, start, end, 'bold');
    expect(jsonToHTML(after1.doc)).toContain('<strong>quick</strong>');

    // Toggle off
    const after2 = simulateToggle(after1.doc, after1.start, after1.end, 'bold');
    expect(jsonToHTML(after2.doc)).not.toContain('<strong>');
    expect(jsonToHTML(after2.doc)).toContain('The quick brown fox');
  });
});
