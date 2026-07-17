// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { escapeAttr, isSafeUrl, normalizeDocument, sanitizeDocumentUrls, sanitizeHtmlToBody } from './editor-sanitize';
import { astToHtml, htmlToAst, markdownToAst } from './editor-serializers';
import * as B from './standard-behaviors';
import { HeadingBehavior, ImageBehavior, LinkBehavior, ParagraphBehavior } from './standard-behaviors';
import { ASTBlockNode, ASTMark } from './editor.types';

/** Minimal behavior maps for exercising the full htmlToAst ingest path. */
function makeMaps() {
  const blocks = new Map<string, any>();
  [
    new B.ParagraphBehavior(), new B.HeadingBehavior(), new B.QuoteBehavior(), new B.CodeBlockBehavior(),
    new B.HrBehavior(), new B.ImageBehavior(), new B.BulletListBehavior(), new B.OrderedListBehavior(), new B.ListItemBehavior(),
  ].forEach((b) => blocks.set(b.type, b));
  const inlines = new Map<string, any>();
  [new B.BoldBehavior(), new B.ItalicBehavior(), new B.LinkBehavior(), new B.InlineCodeBehavior()].forEach((m) =>
    inlines.set(m.type, m)
  );
  return { blocks, inlines };
}

/**
 * Step 1 of the sanitization plan — render hardening.
 *
 * The AST is projected to live DOM and serialized into the bound `value` on
 * every render. A hostile AST can also arrive via `value` with `format='json'`,
 * skipping HTML parsing entirely, so the render path itself must be safe. These
 * tests pin the primitives and every behavior that interpolates an attribute.
 */

describe('escapeAttr', () => {
  it('escapes the characters that could break out of a double-quoted attribute', () => {
    expect(escapeAttr(`x" onerror="alert(1)`)).toBe('x&quot; onerror=&quot;alert(1)');
    expect(escapeAttr(`a'b`)).toBe('a&#39;b');
    expect(escapeAttr('<b>&')).toBe('&lt;b&gt;&amp;');
  });

  it('coerces nullish to an empty string', () => {
    expect(escapeAttr(null)).toBe('');
    expect(escapeAttr(undefined)).toBe('');
  });
});

describe('isSafeUrl', () => {
  it('allows benign schemes and scheme-less URLs', () => {
    for (const url of [
      'https://example.com/x',
      'http://example.com',
      'mailto:a@b.com',
      'tel:+123',
      '/relative/path',
      'relative',
      '#anchor',
      '?q=1',
      '//protocol-relative.example',
    ]) {
      expect(isSafeUrl(url), url).toBe(true);
    }
  });

  it('rejects dangerous and obfuscated schemes', () => {
    for (const url of [
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      '  javascript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>alert(1)</script>',
      '',
    ]) {
      expect(isSafeUrl(url), url).toBe(false);
    }
  });

  it('allows data:image/* only when opted in', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo=';
    expect(isSafeUrl(png)).toBe(false);
    expect(isSafeUrl(png, { allowDataImage: true })).toBe(true);
    // A non-image data URL stays rejected even with the image opt-in.
    expect(isSafeUrl('data:text/html,<script>1</script>', { allowDataImage: true })).toBe(false);
  });
});

describe('behavior render hardening (JSON-bypass sinks)', () => {
  const link = new LinkBehavior();
  const image = new ImageBehavior();
  const heading = new HeadingBehavior();
  const paragraph = new ParagraphBehavior();
  const mark = (href: unknown): ASTMark => ({ type: 'link', attrs: { href } });
  const block = (attrs: Record<string, unknown>): ASTBlockNode => ({ type: 'image', attrs, content: [] });

  it('LinkBehavior rewrites an unsafe href to # and preserves a safe one', () => {
    expect(link.renderHTML(mark('javascript:alert(1)'), 'x')).toBe('<a href="#">x</a>');
    expect(link.renderHTML(mark('https://ok.example'), 'x')).toBe('<a href="https://ok.example">x</a>');
  });

  it('ImageBehavior escapes src/alt and drops an unsafe src, with no attribute breakout', () => {
    const html = image.renderHTML(block({ src: 'x" onerror="alert(1)', alt: '"><script>', mode: 'x', size: 'y' }));
    // Parse it the way the browser would and prove the payload stayed inert: the
    // escaped quotes keep everything inside the `src` value, so no handler
    // attribute and no <script> element materialize.
    const el = document.createElement('div');
    el.innerHTML = html;
    const img = el.querySelector('img')!;
    expect(img).toBeTruthy();
    expect(el.querySelector('script')).toBeNull();
    expect(img.getAttribute('onerror')).toBeNull();
    expect(Array.from(img.attributes).map((a) => a.name).sort()).toEqual(['alt', 'class', 'contenteditable', 'draggable', 'src']);
    expect(img.getAttribute('src')).toBe('x" onerror="alert(1)'); // whole payload is the src value
    expect(img.getAttribute('class')).toBe('sh-editor-img-content'); // unknown mode falls back
  });

  it('ImageBehavior keeps a safe/data-image src and known mode/size', () => {
    const html = image.renderHTML(block({ src: 'data:image/png;base64,AAAA', alt: 'a', mode: 'custom', size: 'large' }));
    expect(html).toContain('src="data:image/png;base64,AAAA"');
    expect(html).toContain('class="sh-editor-img-custom sh-editor-img-size-large"');
    expect(image.renderHTML(block({ src: 'javascript:alert(1)', alt: '', mode: 'content', size: 'auto' }))).toContain(
      'src=""'
    );
  });

  it('ImageBehavior renders a custom width (attr + inline style) and round-trips it via parseDOM', () => {
    const html = image.renderHTML(block({ src: 'data:image/png;base64,AAAA', alt: 'a', mode: 'content', size: 'auto', width: 320 }));
    expect(html).toContain('width="320"');
    expect(html).toContain('style="width:320px"');
    // parseDOM reads the width back off the (sanitize-safe) width attribute.
    const el = document.createElement('div');
    el.innerHTML = html;
    expect(image.parseDOM(el.querySelector('img')!)?.attrs?.['width']).toBe(320);
    // No width attr when unset, and non-positive / non-numeric widths are ignored.
    expect(image.renderHTML(block({ src: 'data:image/png;base64,AAAA', alt: '', mode: 'content', size: 'auto' }))).not.toContain('width=');
    expect(image.renderHTML(block({ src: 'data:image/png;base64,AAAA', alt: '', mode: 'content', size: 'auto', width: 0 }))).not.toContain('width=');
    expect(image.renderHTML(block({ src: 'data:image/png;base64,AAAA', alt: '', mode: 'content', size: 'auto', width: 'junk' }))).not.toContain('width=');
    const plain = document.createElement('div');
    plain.innerHTML = '<img src="data:image/png;base64,AAAA" class="sh-editor-img-content">';
    expect(image.parseDOM(plain.querySelector('img')!)?.attrs?.['width']).toBeUndefined();
  });

  it('HeadingBehavior clamps an injected level and drops an unsafe align', () => {
    const html = heading.renderHTML({ type: 'heading', attrs: { level: '1><img src=x onerror=alert(1)>', align: 'right;background:url(x)' }, content: [] }, 'H');
    expect(html).toBe('<h1>H</h1>');
    expect(heading.renderHTML({ type: 'heading', attrs: { level: 3, align: 'center' }, content: [] }, 'H')).toBe(
      '<h3 style="text-align: center">H</h3>'
    );
  });

  it('ParagraphBehavior only emits an allow-listed text-align', () => {
    expect(paragraph.renderHTML({ type: 'paragraph', attrs: { align: 'right' }, content: [] }, 'p')).toBe(
      '<p style="text-align: right">p</p>'
    );
    expect(paragraph.renderHTML({ type: 'paragraph', attrs: { align: 'url(x);evil' }, content: [] }, 'p')).toBe('<p>p</p>');
  });
});

describe('sanitizeHtmlToBody (inbound scrub)', () => {
  const clean = (html: string) => sanitizeHtmlToBody(html)!.innerHTML;

  it('strips inline event handlers but keeps the element and safe attrs', () => {
    expect(clean('<img src="/a.png" onerror="alert(1)" alt="x">')).toBe('<img src="/a.png" alt="x">');
    expect(clean('<p onclick="steal()">hi</p>')).toBe('<p>hi</p>');
  });

  it('drops script/style/iframe subtrees entirely (no text leak)', () => {
    expect(clean('<p>a</p><script>alert(1)</script><p>b</p>')).toBe('<p>a</p><p>b</p>');
    expect(clean('<style>body{}</style><p>x</p>')).toBe('<p>x</p>');
    expect(clean('<iframe src="evil"></iframe><p>x</p>')).toBe('<p>x</p>');
  });

  it('unwraps unknown tags but preserves their text/children', () => {
    expect(clean('<section><p>hi</p></section>')).toBe('<p>hi</p>');
  });

  it('neutralizes dangerous URLs on href/src', () => {
    expect(clean('<a href="javascript:alert(1)">x</a>')).toBe('<a href="#">x</a>');
    expect(clean('<img src="javascript:alert(1)" alt="">')).toBe('<img src="" alt="">');
    expect(clean('<a href="https://ok.example">x</a>')).toBe('<a href="https://ok.example">x</a>');
  });

  it('keeps text-align and allow-listed inline styles, drops the rest', () => {
    // Safe character formatting survives ingest (jsdom may normalize hex→rgb,
    // so assert on the property rather than the exact serialization).
    const a = clean('<p style="color:red;text-align:center">t</p>');
    expect(a).toContain('text-align: center');
    expect(a).toContain('color: red');
    const b = clean('<span style="font-size:20px;color:#ff0000">t</span>');
    expect(b).toContain('font-size: 20px');
    expect(b).toMatch(/color: (#ff0000|rgb\(255, 0, 0\))/);
  });

  it('drops injection-shaped and non-allow-listed style declarations', () => {
    // The dangerous url()/scheme is always gone; a harmless longhand reset may remain.
    expect(clean('<p style="background:url(javascript:alert(1))">t</p>')).not.toContain('url(');
    expect(clean('<span style="color:red;behavior:url(x.htc)">t</span>')).not.toContain('behavior');
    expect(clean('<span style="font-size:20px;position:fixed">t</span>')).not.toContain('position');
    expect(clean('<span style="color:expression(alert(1))">t</span>')).not.toContain('expression');
  });

  it('returns null when there is no HTML', () => {
    expect(sanitizeHtmlToBody('')).toBeNull();
  });
});

describe('htmlToAst end-to-end ingest', () => {
  it('parses an onerror image inertly and yields a clean image node', () => {
    const { blocks, inlines } = makeMaps();
    const doc = htmlToAst('<img src="x" onerror="alert(1)" alt="a">', blocks, inlines);
    expect(doc).toHaveLength(1);
    expect(doc[0].type).toBe('image');
    expect(JSON.stringify(doc[0])).not.toMatch(/onerror/i);
  });

  it('drops a script and keeps the surrounding paragraphs', () => {
    const { blocks, inlines } = makeMaps();
    const doc = htmlToAst('<p>a</p><script>alert(1)</script><p>b</p>', blocks, inlines);
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'paragraph']);
    expect(JSON.stringify(doc)).not.toMatch(/alert/i);
  });

  it('strips javascript: from a pasted link', () => {
    const { blocks, inlines } = makeMaps();
    const doc = htmlToAst('<p><a href="javascript:alert(1)">x</a></p>', blocks, inlines);
    expect(JSON.stringify(doc)).not.toMatch(/javascript:/i);
  });
});

describe('markdown ingest (I2)', () => {
  it('neutralizes a breakout/javascript payload in a markdown image', () => {
    const { blocks, inlines } = makeMaps();
    const doc = markdownToAst('![a" onerror=alert(1)](javascript:alert(2))', blocks, inlines);
    const json = JSON.stringify(doc);
    expect(doc[0].type).toBe('image');
    expect(doc[0].attrs!['src']).toBe(''); // javascript: rejected
    expect(json).not.toMatch(/javascript:/i);
    // The alt is stored as inert text; no handler survives into the DOM.
    const el = document.createElement('div');
    el.innerHTML = doc.map((b) => (blocks.get(b.type) as any).renderHTML(b)).join('');
    expect(el.querySelector('[onerror]')).toBeNull();
  });

  it('keeps a safe markdown image', () => {
    const { blocks, inlines } = makeMaps();
    const doc = markdownToAst('![cat](https://ok.example/cat.png)', blocks, inlines);
    expect(doc[0].attrs!['src']).toBe('https://ok.example/cat.png');
  });
});

describe('sanitizeDocumentUrls (I3 — JSON value path)', () => {
  it('neutralizes dangerous href/src in a hostile AST and preserves safe ones', () => {
    const hostile = [
      { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'y', marks: [{ type: 'link', attrs: { href: 'https://ok.example' } }] }] },
      { type: 'image', attrs: { src: 'javascript:alert(2)' }, content: [] },
      { type: 'image', attrs: { src: 'data:image/png;base64,AAAA' }, content: [] },
      { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'z', marks: [{ type: 'link', attrs: { href: 'vbscript:1' } }] }] }] },
    ];
    const clean = sanitizeDocumentUrls(hostile);
    expect(clean[0].content[0].marks[0].attrs.href).toBe('#');
    expect(clean[1].content[0].marks[0].attrs.href).toBe('https://ok.example');
    expect(clean[2].attrs.src).toBe('');
    expect(clean[3].attrs.src).toBe('data:image/png;base64,AAAA');
    expect(clean[4].content[0].content[0].marks[0].attrs.href).toBe('#'); // nested list item
    // Original input is not mutated (works on a clone).
    expect(hostile[0].content[0].marks![0].attrs.href).toBe('javascript:alert(1)');
  });
});

describe('normalizeDocument (JSON schema guard)', () => {
  const render = (doc: any) => {
    const { blocks, inlines } = makeMaps();
    return astToHtml(doc, blocks, inlines);
  };

  it('falls back to an empty paragraph for garbage input', () => {
    for (const garbage of [null, undefined, 42, 'str', {}, [], [null], [42], ['x'], [{ no: 'type' }]]) {
      const doc = normalizeDocument(garbage as any);
      expect(doc).toEqual([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
      expect(() => render(doc)).not.toThrow();
    }
  });

  it('coerces malformed nodes and drops unsalvageable ones', () => {
    const hostile = [
      { type: 'paragraph', content: null }, // content not an array
      { type: 'paragraph', content: [{ type: 'text', text: 42 }, { type: 'text', text: 'ok' }] }, // numeric text dropped
      { type: 'paragraph', content: [{ type: 'text', text: 'm', marks: [null, { noType: 1 }, { type: 'bold' }] }] },
      { type: 'heading', attrs: 'not-an-object', content: [{ type: 'text', text: 'h' }] },
      { type: 12, content: [] }, // non-string type dropped entirely
    ];
    const doc = normalizeDocument(hostile as any) as any[];
    expect(doc.map((b) => b.type)).toEqual(['paragraph', 'paragraph', 'paragraph', 'heading']);
    expect(doc[0].content).toEqual([{ type: 'text', text: '' }]); // empty paragraph convention
    expect(doc[1].content).toEqual([{ type: 'text', text: 'ok' }]);
    expect(doc[2].content[0].marks).toEqual([{ type: 'bold' }]); // invalid marks filtered
    expect(doc[3].attrs).toBeUndefined();
    expect(() => render(doc)).not.toThrow();
  });

  it('normalizes container items and flattens over-deep nesting', () => {
    const input = [
      {
        type: 'bullet-list',
        content: [
          { type: 'list-item', content: [{ type: 'text', text: 'ok' }] },
          { type: 'list-item', content: [] }, // empty item healed
          { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'too deep' }] }] },
          'garbage',
        ],
      },
    ];
    const doc = normalizeDocument(input as any) as any[];
    const items = doc[0].content;
    expect(items.every((it: any) => Array.isArray(it.content) && it.content.length >= 1)).toBe(true);
    expect(() => render(doc)).not.toThrow();
  });

  it('is wired into the value path together with URL scrubbing', () => {
    const hostile = [
      { type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
    ];
    const doc = sanitizeDocumentUrls(normalizeDocument(hostile as any));
    expect((doc as any)[0].content[0].marks[0].attrs.href).toBe('#');
  });
});

describe('sanitize option (opt-out & allow-list extension)', () => {
  it('option=false parses inertly but skips the scrub (trusted content)', () => {
    const body = sanitizeHtmlToBody('<img src="x" onerror="y"><script>1</script>', false)!;
    // Not scrubbed: the handler attribute and script node are retained...
    expect(body.querySelector('[onerror]')).not.toBeNull();
    // ...but parsing was inert — the script never executed (no throw, no side effect).
    expect(body.querySelector('script')).not.toBeNull();
  });

  it('extends the tag/attribute allow-list for custom behaviors', () => {
    const withExt = sanitizeHtmlToBody('<figure><figcaption>c</figcaption></figure>', { tags: ['figure', 'figcaption'] })!;
    expect(withExt.innerHTML).toBe('<figure><figcaption>c</figcaption></figure>');
    // Without the extension the same markup is unwrapped to its text.
    expect(sanitizeHtmlToBody('<figure><figcaption>c</figcaption></figure>')!.innerHTML).toBe('c');
    // Attribute extension keeps a custom attr while still dropping handlers.
    const attrExt = sanitizeHtmlToBody('<p data-id="1" onclick="x">t</p>', { attrs: { p: ['data-id'] } })!;
    expect(attrExt.innerHTML).toBe('<p data-id="1">t</p>');
  });
});
