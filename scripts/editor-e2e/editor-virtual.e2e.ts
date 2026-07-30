import { Page, expect, test } from '@playwright/test';

/**
 * Viewport virtualization under real browser conditions: past the auto
 * threshold only a window of blocks exists in the DOM, with padding standing
 * in for the rest. The invariant changes shape here — the DOM must equal the
 * *visible window* of the AST, and the window must follow the scroll.
 *
 * Every block carries its index in its text, so the mounted range can be
 * located in the AST without reaching into the component's private state.
 */

const BLOCKS = 3000;

async function openEditor(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/editors');
  await page.locator('sh-tabs button[value="examples"]').click();
  const surface = page.locator('.sh-editor-content').first();
  await surface.waitFor();
  return { surface, errors };
}

/** Load `count` indexed paragraphs into the first editor. */
async function loadBigDoc(page: Page, count: number) {
  await page.evaluate((n) => {
    const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
    const doc = Array.from({ length: n }, (_, i) => ({
      type: 'paragraph',
      content: [{ type: 'text', text: `Block ${i} with enough words to fill a line` }],
    }));
    comp.engine.reset(doc);
  }, count);
  await expect.poll(() => page.evaluate(() => document.querySelector('.sh-editor-content')!.children.length)).toBeGreaterThan(0);
}

/** Scroll the page's scroll container so the editor content at `fraction` is in view. */
async function scrollEditorTo(page: Page, fraction: number) {
  await page.evaluate((f) => {
    const main = document.querySelector('main')!;
    const surface = document.querySelector('.sh-editor-content')! as HTMLElement;
    const surfaceTopInMain = surface.getBoundingClientRect().top + main.scrollTop - main.getBoundingClientRect().top;
    main.scrollTop = surfaceTopInMain + surface.scrollHeight * f - 200;
  }, fraction);
}

function mountedState(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('sh-editor')!;
    const comp = (window as any).ng.getComponent(host);
    const surface = host.querySelector('.sh-editor-content')! as HTMLElement;
    const style = getComputedStyle(surface);
    const texts = Array.from(surface.children).map((el) => el.textContent ?? '');
    return {
      mounted: texts.length,
      blocks: comp.engine.blockCount() as number,
      first: texts[0] ?? '',
      last: texts[texts.length - 1] ?? '',
      padTop: parseFloat(style.paddingTop),
      padBottom: parseFloat(style.paddingBottom),
    };
  });
}

/** DOM ≡ the mounted window of the AST, located via the per-block index stamp. */
async function expectWindowInvariant(page: Page, context: string) {
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const host = document.querySelector('sh-editor')!;
          const comp = (window as any).ng.getComponent(host);
          const surface = host.querySelector('.sh-editor-content')!;
          const domTexts = Array.from(surface.children).map((el) => el.textContent ?? '');
          if (!domTexts.length) return 'no blocks mounted';
          const m = /^Block (\d+)\b/.exec(domTexts[0]);
          if (!m) return `unindexed first block: ${domTexts[0].slice(0, 40)}`;
          const start = Number(m[1]);
          const astTexts = comp.engine
            .document()
            .slice(start, start + domTexts.length)
            .map((b: any) => (b.content ?? []).map((n: any) => n.text ?? '').join(''));
          return JSON.stringify(domTexts) === JSON.stringify(astTexts)
            ? 'converged'
            : `window@${start}\nDOM=${JSON.stringify(domTexts.slice(0, 3))}…\nAST=${JSON.stringify(astTexts.slice(0, 3))}…`;
        }),
      { message: `${context}: DOM ≡ window of AST`, timeout: 3_000 }
    )
    .toBe('converged');
}

test.describe('viewport virtualization', () => {
  test('a large document mounts only a window, with padding standing in for the rest', async ({ page }) => {
    const { errors } = await openEditor(page);
    await loadBigDoc(page, BLOCKS);

    const state = await mountedState(page);
    expect(state.blocks).toBe(BLOCKS);
    expect(state.mounted).toBeLessThan(200); // a window, not the document
    expect(state.padBottom).toBeGreaterThan(10_000); // the unmounted tail is real estate
    await expectWindowInvariant(page, 'after load');

    // Small documents stay fully mounted with no virtual padding.
    await page.evaluate(() => {
      (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.reset([
        { type: 'paragraph', content: [{ type: 'text', text: 'Block 0 tiny' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Block 1 tiny' }] },
      ]);
    });
    await expect.poll(() => page.evaluate(() => document.querySelector('.sh-editor-content')!.children.length)).toBe(2);
    const small = await mountedState(page);
    expect(small.padBottom).toBeLessThan(100);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('the window follows the scroll to the middle and the end', async ({ page }) => {
    const { errors } = await openEditor(page);
    await loadBigDoc(page, BLOCKS);

    await scrollEditorTo(page, 0.5);
    await expect
      .poll(async () => (await mountedState(page)).first, { message: 'window reaches the middle' })
      .toMatch(/^Block 1[234]\d\d\b/);
    await expectWindowInvariant(page, 'mid-scroll');

    await scrollEditorTo(page, 1);
    await expect
      .poll(async () => (await mountedState(page)).last, { message: 'window reaches the end' })
      .toContain(`Block ${BLOCKS - 1}`);
    await expectWindowInvariant(page, 'bottom');

    await scrollEditorTo(page, 0);
    await expect.poll(async () => (await mountedState(page)).first).toContain('Block 0');
    await expectWindowInvariant(page, 'back at the top');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('typing, Enter, and undo work on a block deep in the document', async ({ page }) => {
    const { errors } = await openEditor(page);
    await loadBigDoc(page, BLOCKS);
    await scrollEditorTo(page, 0.5);
    await expect.poll(async () => (await mountedState(page)).mounted).toBeGreaterThan(5);

    // Caret at the end of a mounted mid-document block, via a real click.
    const targetIndex = await page.evaluate(() => {
      const surface = document.querySelector('.sh-editor-content')!;
      const el = surface.children[Math.floor(surface.children.length / 2)] as HTMLElement;
      const index = Number(/^Block (\d+)\b/.exec(el.textContent ?? '')![1]);
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      (surface as HTMLElement).focus();
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      return index;
    });

    await page.keyboard.type(' TYPED');
    const typed = await page.evaluate(
      (i) =>
        (window as any).ng
          .getComponent(document.querySelector('sh-editor')!)
          .engine.blockAt(i)
          .content.map((n: any) => n.text)
          .join(''),
      targetIndex
    );
    expect(typed).toContain('TYPED');
    await expectWindowInvariant(page, 'after typing at depth');

    await page.keyboard.press('Enter');
    await page.keyboard.type('new block');
    const counts = await page.evaluate((i) => {
      const engine = (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine;
      return { blocks: engine.blockCount(), split: engine.blockAt(i + 1).content.map((n: any) => n.text).join('') };
    }, targetIndex);
    expect(counts.blocks).toBe(BLOCKS + 1);
    expect(counts.split).toBe('new block');
    await expectWindowInvariant(page, 'after Enter at depth');

    // Every keystroke is its own transaction: 9 for "new block", 1 for Enter.
    for (let i = 0; i < 10; i++) await page.keyboard.press('ControlOrMeta+z');
    await expect
      .poll(() => page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.blockCount()))
      .toBe(BLOCKS);
    await expectWindowInvariant(page, 'after undo');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('long jumps through varied-height content keep the viewport filled', async ({ page }) => {
    const { errors } = await openEditor(page);
    // Strongly varied heights: tall code blocks and headings between the
    // paragraphs. A long jump lands in unmeasured territory, where the
    // estimate re-prices on measure — without scroll-anchor compensation the
    // window used to land below the viewport, leaving it blank.
    await page.evaluate((n) => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      const doc = Array.from({ length: n }, (_, i) => {
        if (i % 8 === 0) {
          return {
            type: 'code-block',
            content: [{ type: 'text', text: `Block ${i}\nfunction demo() {\n\treturn ${i};\n}\n// filler\n// filler` }],
          };
        }
        if (i % 13 === 0) {
          return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: `Block ${i} heading` }] };
        }
        return { type: 'paragraph', content: [{ type: 'text', text: `Block ${i} with a line of prose` }] };
      });
      comp.engine.reset(doc);
    }, BLOCKS);
    await expect.poll(() => page.evaluate(() => document.querySelector('.sh-editor-content')!.children.length)).toBeGreaterThan(0);

    const viewportFilled = () =>
      page.evaluate(() => {
        const surface = document.querySelector('.sh-editor-content')!;
        const vp = document.querySelector('main')!.getBoundingClientRect();
        return Array.from(surface.children).some((el) => {
          const rect = el.getBoundingClientRect();
          return rect.bottom > vp.top && rect.top < vp.bottom;
        });
      });

    for (const fraction of [0.4, 0.85, 0.1]) {
      await scrollEditorTo(page, fraction);
      await expect.poll(viewportFilled, { message: `viewport filled after jump to ${fraction}` }).toBe(true);
      await expectWindowInvariant(page, `varied heights @ ${fraction}`);
    }
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('select-all copies the whole document from the model, not the mounted slice', async ({ page }) => {
    const { errors } = await openEditor(page);
    await loadBigDoc(page, BLOCKS);
    await scrollEditorTo(page, 0);
    await page.locator('.sh-editor-content > p').first().click();

    await page.keyboard.press('ControlOrMeta+a');
    const selection = await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      return { ...comp.selection.active(), size: comp.engine.columnar.size };
    });
    expect(selection.from).toBe(0);
    expect(selection.to).toBe(selection.size);

    const copied = await page.evaluate(() => {
      const surface = document.querySelector('.sh-editor-content')! as HTMLElement;
      const dt = new DataTransfer();
      const evt = new ClipboardEvent('copy', { clipboardData: dt, bubbles: true, cancelable: true });
      surface.dispatchEvent(evt);
      return { prevented: evt.defaultPrevented, html: dt.getData('text/html'), text: dt.getData('text/plain') };
    });
    expect(copied.prevented).toBe(true);
    expect(copied.html).toContain('Block 0 ');
    expect(copied.html).toContain(`Block ${BLOCKS - 1} `);
    expect(copied.text).toContain(`Block ${BLOCKS - 1} `);

    // The full-document selection also deletes as one unit.
    await page.keyboard.press('Backspace');
    await expect
      .poll(() => page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.blockCount()))
      .toBe(1);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
