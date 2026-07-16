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
    // Read DOM text with soft breaks: a real <br> is a '\n' in the AST; a
    // padding <br> (data-sh-pad) is a zero-width caret shim.
    const domTextOf = (el: Element): string => {
      let out = '';
      const walk = (n: Node) => {
        if (n.nodeType === Node.TEXT_NODE) out += n.textContent ?? '';
        else if (n.nodeName === 'BR') {
          const br = n as HTMLElement;
          // Skip zero-width breaks: the trailing-break pad shim, and the
          // empty-block/item placeholder (a lone <br> in an otherwise-empty
          // block, which the AST represents as empty text).
          const placeholder = (br.parentElement?.textContent ?? '').trim() === '';
          if (!br.hasAttribute('data-sh-pad') && !placeholder) out += '\n';
        } else n.childNodes.forEach(walk);
      };
      el.childNodes.forEach(walk);
      return out;
    };
    const domTexts = Array.from(surface.children).map(domTextOf);
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

  test('link popover: Cmd+K applies, edits, and refuses unsafe URLs', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.keyboard.type('read the docs today');
    // Select the word "docs" (4 chars back from " today")
    for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowLeft');

    await page.keyboard.press('ControlOrMeta+k');
    const input = page.locator('sh-editor-link-popover input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused(); // typing goes straight into the URL field
    await input.fill('ship-ui.dev/docs'); // bare domain — normalized to https
    await page.keyboard.press('Enter');
    await expect(input).toBeHidden();
    await expectInvariant(page, 'after link apply');
    let ast = JSON.stringify(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.serialize('json')));
    expect(ast).toContain('"href":"https://ship-ui.dev/docs"');

    // Reopen with the caret inside the link: prefilled, and unsafe URLs refused
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('https://ship-ui.dev/docs');
    await input.fill('javascript:alert(1)');
    await page.keyboard.press('Enter');
    await expect(page.locator('sh-editor-link-popover [role=alert]')).toBeVisible();
    ast = JSON.stringify(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.serialize('json')));
    expect(ast).not.toContain('javascript:');

    // Remove unlinks the whole run
    await page.locator('sh-editor-link-popover button', { hasText: 'Remove' }).click();
    await expect(input).toBeHidden();
    await expectInvariant(page, 'after unlink');
    ast = JSON.stringify(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.serialize('json')));
    expect(ast).not.toContain('"href"');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('soft line break: Shift+Enter stays one block, Enter splits; caret is correct', async ({ page }) => {
    const { errors } = await openEditor(page);
    const astOf = () =>
      page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.document());

    // Start from a clean single empty paragraph and focus it.
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
    });
    await page.locator('.sh-editor-content > p').first().click();
    await page.keyboard.type('alpha');
    await page.keyboard.press('Shift+Enter'); // soft break — same paragraph
    await page.keyboard.type('beta');
    let ast = await astOf();
    expect(ast).toHaveLength(1); // ONE block
    expect(ast[0].content.map((n: any) => n.text).join('')).toBe('alpha\nbeta');
    // It renders a real <br>, and the caret sits after "beta" — typing continues there.
    expect(await page.locator('.sh-editor-content > p').first().locator('br').count()).toBe(1);
    await expectInvariant(page, 'after soft break');

    await page.keyboard.press('Enter'); // hard break — new paragraph now
    await page.keyboard.type('gamma');
    ast = await astOf();
    expect(ast).toHaveLength(2);
    expect(ast[1].content.map((n: any) => n.text).join('')).toBe('gamma');
    await expectInvariant(page, 'after hard break');

    // DOM→logical mapping across the <br>: physically place the caret at the
    // start of "beta" (immediately after the soft break) and confirm the synced
    // logical offset counts the break as one char (char 6 of "alpha\nbeta").
    const syncedOffset = await page.evaluate(() => {
      const p = document.querySelector('.sh-editor-content > p')!;
      const betaText = Array.from(p.childNodes).find(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent === 'beta'
      )!;
      const range = document.createRange();
      range.setStart(betaText, 0);
      range.collapse(true);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      const s = comp.selection.active();
      const content = comp.engine.document()[0].content;
      let chars = s.start.offset;
      for (let i = 0; i < s.start.inlineIndex; i++) chars += content[i].text.length;
      return chars;
    });
    expect(syncedOffset).toBe(6); // after "alpha\n", before "beta"

    // Backspace from there removes the soft break (not a character).
    await page.keyboard.press('Backspace');
    ast = await astOf();
    expect(ast[0].content.map((n: any) => n.text).join('')).toBe('alphabeta'); // break gone
    expect(await page.locator('.sh-editor-content > p').first().locator('br').count()).toBe(0);
    await expectInvariant(page, 'after break deletion');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image: insert via popover, contextual toolbar edits + deletes', async ({ page }) => {
    const { errors } = await openEditor(page);
    const attrOf = () =>
      page.evaluate(() => {
        const eng = (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine;
        return eng.selectedBlockNode()?.attrs ?? null;
      });

    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: 'caption' }] }]);
    });
    await page.locator('.sh-editor-content > p').first().click();

    // Toolbar image button → popover → URL → insert
    await page.locator('sh-editor-toolbar button[aria-label="Insert Image"]').dispatchEvent('mousedown');
    const urlInput = page.locator('sh-editor-image-popover input[type=text]');
    await expect(urlInput).toBeVisible();
    await urlInput.fill('https://picsum.photos/200');
    await page.keyboard.press('Enter');

    // Image inserted, selected (highlight), contextual toolbar shown.
    await expect(page.locator('.sh-editor-content img')).toHaveCount(1);
    await expect(page.locator('.sh-editor-content .sh-editor-block-selected')).toHaveCount(1);
    const toolbar = page.locator('.sh-editor-contextual-toolbar');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('button')).toHaveCount(4); // 3 modes + delete
    await expectInvariant(page, 'after image insert');
    expect(await attrOf()).toMatchObject({ mode: 'content' });

    // The selected image is wrapped in a NON-collapsed node selection (no text
    // caret blinking beside it), with focus kept on the editable surface.
    const selectionState = () =>
      page.evaluate(() => {
        const sel = window.getSelection();
        const img = document.querySelector('.sh-editor-content img');
        const r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
        return {
          collapsed: r ? r.collapsed : null,
          wrapsImg: !!(r && img && r.startContainer.contains(img) && !r.collapsed),
          surfaceFocused: document.activeElement?.classList.contains('sh-editor-content') ?? false,
        };
      });
    expect(await selectionState()).toMatchObject({ collapsed: false, wrapsImg: true, surfaceFocused: true });

    // Float mode → size buttons appear (3 modes + 3 sizes + delete)
    await toolbar.locator('button').nth(2).click();
    await expect(toolbar.locator('button')).toHaveCount(7);
    expect(await attrOf()).toMatchObject({ mode: 'float' });
    // The mode change swaps the <img> element; the selection highlight and node
    // selection must survive that patch (not just the initial insert).
    await expect(page.locator('.sh-editor-content .sh-editor-block-selected')).toHaveCount(1);
    expect(await selectionState()).toMatchObject({ collapsed: false, wrapsImg: true });

    // Float carries a size class the size buttons act on (content/theater don't);
    // switching size re-renders the class so the width actually changes.
    await expect(page.locator('.sh-editor-content img.sh-editor-img-float.sh-editor-img-size-medium')).toHaveCount(1);
    await toolbar.locator('button').nth(3).click(); // size: small
    await expect(page.locator('.sh-editor-content img.sh-editor-img-size-small')).toHaveCount(1);
    expect(await attrOf()).toMatchObject({ size: 'small' });

    // Backspace deletes the selected image (a node selection over a void block
    // fires no beforeinput, so this exercises the keydown delete path).
    await page.keyboard.press('Backspace');
    await expect(page.locator('.sh-editor-content img')).toHaveCount(0);
    await expect(toolbar).toBeHidden();
    await expectInvariant(page, 'after keyboard delete');

    // Re-insert and delete via the contextual toolbar's trash button too.
    await page.locator('sh-editor-toolbar button[aria-label="Insert Image"]').dispatchEvent('mousedown');
    await urlInput.fill('https://picsum.photos/201');
    await page.keyboard.press('Enter');
    await expect(page.locator('.sh-editor-content img')).toHaveCount(1);
    await toolbar.locator('button.danger').click();
    await expect(page.locator('.sh-editor-content img')).toHaveCount(0);
    await expect(toolbar).toBeHidden();
    await expectInvariant(page, 'after trash-button delete');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image: undoing the insert clears the selection instead of orphaning the highlight', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: 'para' }] }]);
      comp.engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 4 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 4 },
        isCollapsed: true,
      });
      comp.engine.insertImage({ src: 'https://picsum.photos/203', alt: '', mode: 'content', size: 'auto' });
    });
    await expect(page.locator('.sh-editor-content img')).toHaveCount(1);
    await expect(page.locator('.sh-editor-content .sh-editor-block-selected')).toHaveCount(1);

    // Undo removes the image; the highlight must not transfer to the paragraph
    // the image index now resolves to.
    await page.keyboard.press('ControlOrMeta+z');
    await expect(page.locator('.sh-editor-content img')).toHaveCount(0);
    await expect(page.locator('.sh-editor-content .sh-editor-block-selected')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.selectedBlock())).toBeNull();
    await expectInvariant(page, 'after undo of image insert');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image: arrowing out of the block above selects the image (no caret in the void)', async ({ page }) => {
    const { errors } = await openEditor(page);
    const selectedBlock = () =>
      page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.selectedBlock());

    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: 'above' }] }]);
      comp.engine.selection.live.set({
        start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        end: { blockIndex: 0, inlineIndex: 0, offset: 0 },
        isCollapsed: true,
      });
      comp.engine.insertImage({ src: 'https://picsum.photos/204', alt: '', mode: 'content', size: 'auto' });
      comp.engine.clearBlockSelection();
    });

    // Caret at the end of "above" (block 0), then ArrowRight → the image (block 1)
    // becomes the selected block rather than dropping a caret before it.
    await page.locator('.sh-editor-content > p').first().click();
    await page.keyboard.press('End');
    expect(await selectedBlock()).toBeNull();
    await page.keyboard.press('ArrowRight');
    expect(await selectedBlock()).toBe(1);
    await expect(page.locator('.sh-editor-content .sh-editor-block-selected')).toHaveCount(1);

    // A caret in the MIDDLE of the block above is not hijacked — ArrowRight there
    // just moves the caret. Seat the caret directly (offset 2 of "above") so the
    // check is deterministic and unaffected by the prior image selection.
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.clearBlockSelection();
      const surface = document.querySelector('.sh-editor-content') as HTMLElement;
      const textNode = surface.children[0].firstChild!;
      const range = document.createRange();
      range.setStart(textNode, 2);
      range.collapse(true);
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      surface.focus();
      sel.removeAllRanges();
      sel.addRange(range);
    });
    await page.keyboard.press('ArrowRight');
    expect(await selectedBlock()).toBeNull();
    await expectInvariant(page, 'after arrow-into-image');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('slash menu: "/" opens a filtered command list; Enter converts the block', async ({ page }) => {
    const { errors } = await openEditor(page);
    const blockText = () =>
      page.evaluate(() =>
        (window as any).ng
          .getComponent(document.querySelector('sh-editor')!)
          .engine.document()[0]
          .content.map((n: any) => n.text)
          .join('')
      );
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
    });
    await page.locator('.sh-editor-content > p').first().click();

    // "/" opens the menu with every behavior-declared command.
    await page.keyboard.type('/');
    const menu = page.locator('.sh-editor-slash-menu');
    await expect(menu).toBeVisible();
    await expect(menu.locator('button')).toHaveCount(10);

    // Typing filters; keyword/label substring match.
    await page.keyboard.type('quote');
    await expect(menu.locator('button')).toHaveCount(1);
    await expect(menu.locator('button')).toContainText('Quote');

    // Enter applies the highlighted command and strips the "/quote" trigger.
    await page.keyboard.press('Enter');
    await expect(menu).toBeHidden();
    await expect(page.locator('.sh-editor-content > blockquote')).toHaveCount(1);
    expect(await blockText()).toBe('');
    await expectInvariant(page, 'after slash convert to quote');

    // Escape dismisses the menu without altering the text.
    await page.keyboard.type('/head');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    expect(await blockText()).toBe('/head'); // text untouched
    await expectInvariant(page, 'after slash escape');
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
