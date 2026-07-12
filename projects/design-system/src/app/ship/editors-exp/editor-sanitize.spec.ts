// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { escapeAttr, isSafeUrl, sanitizeHtmlToBody } from './editor-sanitize';
import { htmlToAst } from './editor-serializers';
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
    expect(Array.from(img.attributes).map((a) => a.name).sort()).toEqual(['alt', 'class', 'src']);
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
    expect(clean('<span style="color:red">t</span>')).toBe('<span>t</span>');
  });

  it('neutralizes dangerous URLs on href/src', () => {
    expect(clean('<a href="javascript:alert(1)">x</a>')).toBe('<a href="#">x</a>');
    expect(clean('<img src="javascript:alert(1)" alt="">')).toBe('<img src="" alt="">');
    expect(clean('<a href="https://ok.example">x</a>')).toBe('<a href="https://ok.example">x</a>');
  });

  it('scrubs style down to an allow-listed text-align', () => {
    expect(clean('<p style="color:red;text-align:center">t</p>')).toBe('<p style="text-align: center;">t</p>');
    expect(clean('<p style="background:url(x)">t</p>')).toBe('<p>t</p>');
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
