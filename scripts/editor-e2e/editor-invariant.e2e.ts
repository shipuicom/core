import { Page, expect, test } from '@playwright/test';

/**
 * The editor's core invariant, under REAL browser events: after every edit the
 * DOM is a pure projection of the AST — block-per-block text identity. The
 * unit/fuzz suites prove the engine; this proves the layer they can't reach
 * (beforeinput handling, patchDOM, caret restore, composition) against actual
 * Chromium input, keyboard shortcuts, and CDP-driven IME composition.
 *
 * Deterministic: storms use mulberry32 with fixed seeds.
 */

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rnd: () => number, n: number) => Math.floor(rnd() * n);

/** DOM text per block vs AST text per block, read in one atomic evaluate. */
async function readInvariant(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('sh-editor')!;
    const comp = (window as any).ng.getComponent(host);
    const surface = host.querySelector('.sh-editor-content')!;
    const domTexts = Array.from(surface.children).map((c) => c.textContent ?? '');
    const astTexts = comp.engine
      .document()
      .map((b: any) =>
        (b.content ?? [])
          .map((n: any) => (typeof n.text === 'string' ? n.text : (n.content ?? []).map((x: any) => x.text ?? '').join('')))
          .join('')
      );
    return { domTexts, astTexts, canUndo: comp.engine.canUndo(), version: comp.engine.version() };
  });
}

/**
 * The invariant is convergent, not instantaneous: undo via the keybinding path
 * renders through Angular's effect scheduler, so DOM and AST may diverge for a
 * microtask. Poll until they agree (or fail loudly with both sides).
 */
async function expectInvariant(page: Page, context: string) {
  await expect
    .poll(
      async () => {
        const { domTexts, astTexts } = await readInvariant(page);
        return JSON.stringify(domTexts) === JSON.stringify(astTexts)
          ? 'converged'
          : `DOM=${JSON.stringify(domTexts)}\nAST=${JSON.stringify(astTexts)}`;
      },
      { message: `${context}: DOM ≡ AST`, timeout: 3_000 }
    )
    .toBe('converged');
}

async function openEditor(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/editors-exp');
  const surface = page.locator('.sh-editor-content').first();
  await surface.waitFor();
  // Place the caret at the start of the intro paragraph.
  await surface.locator('p').first().click();
  return { surface, errors };
}

test.describe('DOM ≡ AST invariant', () => {
  test('typing storm: text, Enter, Backspace, Delete, arrows', async ({ page }) => {
    const { errors } = await openEditor(page);
    const rnd = mulberry32(1);
    const words = ['ship', 'editor', 'fuzz', 'storm', 'The quick fox!', 'æøå üñî'];

    for (let step = 0; step < 60; step++) {
      const roll = rnd();
      if (roll < 0.45) await page.keyboard.type(words[pick(rnd, words.length)]);
      else if (roll < 0.6) await page.keyboard.press('Enter');
      else if (roll < 0.75) {
        for (let i = 0, n = 1 + pick(rnd, 4); i < n; i++) await page.keyboard.press('Backspace');
      } else if (roll < 0.85) await page.keyboard.press('Delete');
      else {
        const key = ['ArrowLeft', 'ArrowRight', 'ArrowDown'][pick(rnd, 3)];
        for (let i = 0, n = 1 + pick(rnd, 6); i < n; i++) await page.keyboard.press(key);
      }
      if (step % 5 === 4) await expectInvariant(page, `seed1 step ${step}`);
    }
    await expectInvariant(page, 'seed1 final');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('mark storm: shift-selections + bold/italic/underline shortcuts', async ({ page }) => {
    const { errors } = await openEditor(page);
    const rnd = mulberry32(2);

    await page.keyboard.type('marking storm baseline text ');
    for (let step = 0; step < 30; step++) {
      const roll = rnd();
      if (roll < 0.4) await page.keyboard.type('x'.repeat(1 + pick(rnd, 3)));
      else if (roll < 0.8) {
        // select a few chars leftward and toggle a mark on the range
        for (let i = 0, n = 1 + pick(rnd, 5); i < n; i++) await page.keyboard.press('Shift+ArrowLeft');
        await page.keyboard.press(['ControlOrMeta+b', 'ControlOrMeta+i', 'ControlOrMeta+u'][pick(rnd, 3)]);
        await page.keyboard.press('ArrowRight'); // collapse
      } else {
        // stored marks: toggle at the collapsed caret, then type
        await page.keyboard.press('ControlOrMeta+b');
        await page.keyboard.type('B');
      }
      if (step % 5 === 4) await expectInvariant(page, `seed2 step ${step}`);
    }
    await expectInvariant(page, 'seed2 final');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('undo/redo storm returns to a consistent projection', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.keyboard.type('alpha');
    await page.keyboard.press('Enter');
    await page.keyboard.type('beta');
    await page.keyboard.press('Enter');
    await page.keyboard.type('gamma');
    await expectInvariant(page, 'after typing');
    const before = await readInvariant(page);

    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ControlOrMeta+z');
      await expectInvariant(page, `undo #${i}`);
    }
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('ControlOrMeta+Shift+z');
      await expectInvariant(page, `redo #${i}`);
    }
    const after = await readInvariant(page);
    expect(after.astTexts, 'redo-all restores the pre-undo document').toEqual(before.astTexts);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('REAL IME composition via CDP lands once, in the right block', async ({ page }) => {
    const { surface, errors } = await openEditor(page);
    // Caret mid-paragraph: after "Welcome! " in the intro block.
    await page.evaluate(() => {
      const surfaceEl = document.querySelector('.sh-editor-content')!;
      const p = surfaceEl.querySelectorAll(':scope > *')[1]!; // intro paragraph
      const textNode = document.createTreeWalker(p, NodeFilter.SHOW_TEXT).nextNode()!;
      const range = document.createRange();
      range.setStart(textNode, 9);
      range.collapse(true);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
    });

    const cdp = await page.context().newCDPSession(page);
    // Chromium fires genuine compositionstart/update + insertCompositionText
    // beforeinput events for imeSetComposition, and compositionend on commit.
    await cdp.send('Input.imeSetComposition', { text: 'n', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.imeSetComposition', { text: 'ni', selectionStart: 2, selectionEnd: 2 });
    await cdp.send('Input.imeSetComposition', { text: '你', selectionStart: 1, selectionEnd: 1 });
    await cdp.send('Input.insertText', { text: '你好' });
    await page.waitForTimeout(120); // let compositionend reconcile run

    const { domTexts, astTexts } = await readInvariant(page);
    expect(domTexts).toEqual(astTexts);
    const joined = astTexts.join('\n');
    expect(joined).toContain('你好');
    expect(joined.match(/你好/g), 'composed exactly once').toHaveLength(1);
    // Composition is undoable (reconcile commits a transaction)
    await page.keyboard.press('ControlOrMeta+z');
    await expectInvariant(page, 'undo after composition');
    expect((await readInvariant(page)).astTexts.join('')).not.toContain('你好');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
