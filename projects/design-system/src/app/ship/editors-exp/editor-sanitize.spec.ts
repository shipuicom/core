// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { escapeAttr, isSafeUrl } from './editor-sanitize';
import { HeadingBehavior, ImageBehavior, LinkBehavior, ParagraphBehavior } from './standard-behaviors';
import { ASTBlockNode, ASTMark } from './editor.types';

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
