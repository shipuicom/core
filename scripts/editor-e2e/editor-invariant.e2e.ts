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

  test('image resize: dragging the SE handle sets width, preserves aspect ratio, is undoable', async ({ page }) => {
    const { errors } = await openEditor(page);
    // A data-URL image (400×300, 4:3) loads instantly and has a deterministic size.
    await page.evaluate(() => {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='#4f8cff'/></svg>";
      const src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
        { type: 'image', attrs: { src, alt: 'demo', mode: 'content', size: 'auto' }, content: [] },
      ]);
    });
    const img = page.locator('.sh-editor-content img');
    await expect(img).toHaveCount(1);
    await img.click(); // select + focus the surface (so undo reaches the editor)
    const se = page.locator('.sh-editor-resize-se');
    await expect(se).toBeVisible();

    // Drag the bottom-right handle 200px to the left → shrink. hover() scrolls the
    // handle on-screen and waits for its position to settle (the frame re-anchors
    // on a microtask) before we press, so the mousedown lands on it reliably.
    const before = await img.evaluate((el) => Math.round(el.getBoundingClientRect().width));
    await se.hover();
    const box = (await se.boundingBox())!;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.down();
    await page.mouse.move(cx - 200, cy - 150, { steps: 8 });
    await page.mouse.up();

    // Width shrank, persisted to the AST + rendered attrs, aspect ratio held (4:3).
    const after = await img.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        w: Math.round(r.width),
        aspect: r.height / r.width,
        attr: Number(el.getAttribute('width')),
        ast: (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.document()[1].attrs.width,
      };
    });
    const ctx = JSON.stringify({ before, after });
    expect(after.w, ctx).toBeLessThan(before - 100); // the drag shrank it
    expect(after.ast, ctx).toBe(after.attr); // AST width == rendered width attribute
    expect(Math.abs(after.attr - after.w), ctx).toBeLessThanOrEqual(1); // matches the measured box
    expect(after.aspect, ctx).toBeCloseTo(0.75, 2); // 4:3 aspect ratio preserved

    // The resize is a single undoable transaction.
    await page.keyboard.press('ControlOrMeta+z');
    const astAfterUndo = await page.evaluate(
      () => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.document()[1].attrs.width ?? null
    );
    expect(astAfterUndo).toBeNull();

    await expectInvariant(page, 'after image resize');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image resize (opt-in edge handles): right edge stretches width, freezes height, undoable', async ({ page }) => {
    const { errors } = await openEditor(page);
    // Enable the mid-edge handles + insert a compact, left-aligned image (custom
    // mode, 240px wide) so the right-edge stretch is deterministic.
    await page.evaluate(() => {
      (window as any).ng.getComponent(document.querySelector('app-editors-exp')!).imageEdgeResize.set(true);
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='#4f8cff'/></svg>";
      const src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([
        { type: 'paragraph', content: [{ type: 'text', text: 'x' }] },
        { type: 'image', attrs: { src, alt: 'demo', mode: 'custom', size: 'auto', width: 240 }, content: [] },
      ]);
    });
    const img = page.locator('.sh-editor-content img');
    await expect(img).toHaveCount(1);
    await img.click();
    const e = page.locator('.sh-editor-resize-e'); // right mid-edge (only present when opted in)
    await expect(e).toBeVisible();

    const before = await img.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    });
    await e.hover();
    const box = (await e.boundingBox())!;
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();

    // The AST is the source of truth (committed once on mouseup).
    const after = await page.evaluate(() => {
      const attrs = (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.document()[1].attrs;
      return { astW: attrs.width, astH: attrs.height };
    });
    const ctx = JSON.stringify({ before, after });
    expect(after.astW, ctx).toBeGreaterThan(before.w + 100); // width stretched
    expect(after.astH, ctx).toBe(before.h); // height frozen (not scaled) → non-aspect stretch
    // The projected <img> renders at the committed size (poll past the patch swap).
    await expect.poll(() => img.evaluate((el) => Math.round(el.getBoundingClientRect().width))).toBe(after.astW);
    await expect.poll(() => img.evaluate((el) => Math.round(el.getBoundingClientRect().height))).toBe(after.astH);

    // Undo restores the pre-stretch width and drops the explicit height.
    await page.keyboard.press('ControlOrMeta+z');
    const undone = await page.evaluate(() => {
      const a = (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.document()[1].attrs;
      return { w: a.width, h: a.height ?? null };
    });
    expect(undone).toEqual({ w: 240, h: null });

    await expectInvariant(page, 'after edge resize');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image resize: handles hide in full-width (theater) mode', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.evaluate(() => {
      const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='#4f8cff'/></svg>";
      const src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'image', attrs: { src, alt: 'demo', mode: 'content', size: 'auto' }, content: [] }]);
    });
    const setMode = (mode: string) =>
      page.evaluate((m) => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.updateSelectedImage({ mode: m }), mode);

    await page.locator('.sh-editor-content img').click();
    const se = page.locator('.sh-editor-resize-se');
    await expect(se).toBeVisible(); // content mode → resizable
    await setMode('theater');
    await expect(se).toBeHidden(); // full-width → no handles
    await setMode('content');
    await expect(se).toBeVisible(); // and back
    await expectInvariant(page, 'theater resize toggle');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('image upload hook: a picked file is uploaded via the handler and its URL inserted', async ({ page }) => {
    const { errors } = await openEditor(page);
    const editor = page.locator('sh-editor').first();
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: 'caption' }] }]);
    });
    await editor.locator('.sh-editor-content > p').first().click();

    // Open the insert-image popover and pick a file. The showcase's demo handler
    // "uploads" it (async) and returns a URL seeded by the file name, rather than
    // inlining a data: URL — so the inserted src proves the hook ran.
    await editor.locator('sh-editor-toolbar button[aria-label="Insert Image"]').dispatchEvent('mousedown');
    await editor
      .locator('sh-editor-image-popover input[type=file]')
      .setInputFiles({ name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) });

    const img = editor.locator('.sh-editor-content img');
    await expect(img).toHaveCount(1);
    await expect(img).toHaveAttribute('src', 'https://picsum.photos/seed/photo.png/480/320');
    await expectInvariant(page, 'after image upload');
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

  test('image drag-to-reorder: dragging an image moves it, showing a drop line', async ({ page }) => {
    const { errors } = await openEditor(page);
    const editor = page.locator('sh-editor').first();
    await page.evaluate(() => {
      (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.reset([
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Heading' }] },
        { type: 'image', attrs: { src: 'https://picsum.photos/60', mode: 'content', size: 'auto' }, content: [] },
        { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
      ]);
    });
    await expect(editor.locator('.sh-editor-content img[draggable="true"]')).toHaveCount(1);

    // Drive the native drag: start on the image, hover the lower half of "First"
    // (drop after it → gap 3), then drop. The drop line shows during the hover.
    const result = await page.evaluate(() => {
      const ed = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      const surface = document.querySelector('.sh-editor-content')!;
      const img = surface.querySelector('img')!;
      const first = surface.children[2] as HTMLElement; // "First"
      const rect = first.getBoundingClientRect();
      const y = rect.top + rect.height * 0.75;
      const dt = new DataTransfer();
      const ev = (type: string, extra: object = {}) =>
        new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: dt, ...extra });
      img.dispatchEvent(ev('dragstart'));
      surface.dispatchEvent(ev('dragover', { clientY: y }));
      const lineShown = ed.dropIndicator() !== null;
      surface.dispatchEvent(ev('drop', { clientY: y }));
      img.dispatchEvent(ev('dragend'));
      return {
        lineShown,
        lineCleared: ed.dropIndicator() === null,
        order: ed.engine.document().map((b: { type: string }) => b.type),
        selected: ed.engine.selectedBlock(),
      };
    });

    expect(result.lineShown).toBe(true);
    expect(result.lineCleared).toBe(true);
    // image moved from index 1 to after "First" (index 2)
    expect(result.order).toEqual(['heading', 'paragraph', 'image', 'paragraph']);
    expect(result.selected).toBe(2); // stays selected at its new index
    await expect(editor.locator('.sh-editor-content img')).toHaveCount(1);
    await expectInvariant(page, 'after image drag-reorder');
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

  test('float layout: list/quote/callout sit beside a floated image, never under it', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.reset([
        { type: 'image', attrs: { src: 'https://picsum.photos/id/1062/220/160', alt: 'x', mode: 'float', size: 'small' }, content: [] },
        { type: 'bullet-list', content: [{ type: 'list-item', content: [{ type: 'text', text: 'item beside the float' }] }] },
        { type: 'quote', content: [{ type: 'text', text: 'quote beside the float, not under it' }] },
        { type: 'info-callout', content: [{ type: 'text', text: 'callout beside the float, not under it' }] },
      ]);
    });
    await page.waitForSelector('.sh-editor-content img.sh-editor-img-float');

    // Each block container establishes a BFC, so its box starts at/after the
    // floated image's right edge instead of its border/background sliding under.
    const geom = await page.evaluate(() => {
      const surface = document.querySelector('.sh-editor-content')!;
      const imgRight = surface.querySelector('img')!.getBoundingClientRect().right;
      const at = (sel: string) => {
        const el = surface.querySelector(sel) as HTMLElement;
        return { left: el.getBoundingClientRect().left, display: getComputedStyle(el).display };
      };
      return {
        imgRight,
        ul: at('ul'),
        quote: at('blockquote:not(.sh-editor-callout)'),
        callout: at('blockquote.sh-editor-callout'),
      };
    });
    for (const key of ['ul', 'quote', 'callout'] as const) {
      expect(geom[key].display, `${key} establishes a BFC`).toBe('flow-root');
      expect(geom[key].left, `${key} sits beside the float`).toBeGreaterThanOrEqual(geom.imgRight - 1);
    }
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('parity: metrics footer, placeholder, and source-view round-trip', async ({ page }) => {
    const { errors } = await openEditor(page);
    // The showcase mounts two editors; scope every query to the first (the one
    // with metrics/placeholder/source wired up).
    const editor = page.locator('sh-editor').first();
    const reset = (doc: unknown) =>
      page.evaluate((d) => (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.reset(d), doc);

    // Metrics footer counts the live document.
    const stats = editor.locator('.sh-editor-stats');
    await reset([{ type: 'paragraph', content: [{ type: 'text', text: 'one two three' }] }]);
    await expect(stats).toContainText('3 words');
    await expect(stats).toContainText('13 characters');

    // Placeholder shows only while the document is empty.
    await reset([{ type: 'paragraph', content: [{ type: 'text', text: '' }] }]);
    await expect(editor.locator('.sh-editor-placeholder')).toBeVisible();
    await expect(stats).toContainText('0 words');
    await reset([{ type: 'paragraph', content: [{ type: 'text', text: 'x' }] }]);
    await expect(editor.locator('.sh-editor-placeholder')).toHaveCount(0);

    // Source view: toggle shows serialized HTML; editing it and toggling back
    // re-parses into the AST.
    await reset([{ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] }]);
    const sourceToggle = editor.locator('button[aria-label="Toggle Source View"]');
    await sourceToggle.click();
    const source = editor.locator('.sh-editor-source');
    await expect(source).toBeVisible();
    await expect(source).toHaveValue('<h2>Title</h2>');
    await expect(editor.locator('.sh-editor-content')).toBeHidden();

    await source.fill('<p>edited in source</p><blockquote>and a quote</blockquote>');
    await sourceToggle.click();
    await expect(source).toHaveCount(0);
    await expect(editor.locator('.sh-editor-content > p')).toContainText('edited in source');
    await expect(editor.locator('.sh-editor-content > blockquote')).toContainText('and a quote');
    await expectInvariant(page, 'after source-view round-trip');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('style toolbar: real-click opens controls, applies to + prefills from the selection', async ({ page }) => {
    const { errors } = await openEditor(page);
    const editor = page.locator('sh-editor').first();
    const fontSelect = page.locator('.sh-editor-style-font');
    const sizeSelect = page.locator('.sh-editor-style-size');

    // Reset to a known single paragraph. Reset is async, so wait for the render.
    const resetRow = async () => {
      await page.evaluate(() => {
        const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
        comp.engine.reset([{ type: 'paragraph', content: [{ type: 'text', text: 'Style row here' }] }]);
      });
      await expect(editor.locator('.sh-editor-content > p').first()).toHaveText('Style row here');
    };

    // Select the word "Style" (chars 0..5) with a real DOM + logical selection;
    // the logical selection survives focus moving to the toolbar controls.
    const selectStyleWord = async () => {
      await page.evaluate(() => {
        const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
        const surface = document.querySelector('.sh-editor-content')! as HTMLElement;
        surface.focus();
        // "Style" is the first text node however it ends up wrapped (span, strong…).
        const p = surface.querySelector('p')!;
        const text = document.createTreeWalker(p, NodeFilter.SHOW_TEXT).nextNode()!;
        const range = document.createRange();
        range.setStart(text, 0);
        range.setEnd(text, 5);
        const sel = window.getSelection()!;
        sel.removeAllRanges();
        sel.addRange(range);
        comp.engine.selection.live.set({
          start: { blockIndex: 0, inlineIndex: 0, offset: 0 },
          end: { blockIndex: 0, inlineIndex: 0, offset: 5 },
          isCollapsed: false,
        });
      });
    };

    // ── Bug 1: the Font select opens on a REAL click (no isOpen.set()). ──
    await resetRow();
    await selectStyleWord();
    await fontSelect.locator('sh-form-field[trigger]').click();
    await expect(fontSelect.locator('li.option').first()).toBeVisible();
    await fontSelect.locator('li.option', { hasText: 'Georgia' }).click();
    await expect(editor.locator('.sh-editor-content span[style*="font-family: Georgia"]')).toHaveCount(1);

    // ── Bug 1: the Size select opens on a real click; a preset applies. ──
    await selectStyleWord();
    await sizeSelect.locator('sh-form-field[trigger]').click();
    await expect(sizeSelect.locator('li.option').first()).toBeVisible();
    await sizeSelect.locator('li.option', { hasText: '28' }).click();
    await expect(editor.locator('.sh-editor-content span[style*="font-size: 28px"]')).toHaveCount(1);

    // ── Bug 2: the selects prefill from the style at the cursor. Driven by REAL
    // caret moves so the editor's selection→render→prefill path runs end to end. ──
    // Click into the styled word "Style" → both controls reflect its font + size.
    await editor.locator('.sh-editor-content span[style*="Georgia"]').click();
    await expect(fontSelect.locator('.selected-value')).toContainText('Georgia');
    await expect(sizeSelect.locator('.selected-value')).toContainText('28');
    // Walk the caret rightward into the unstyled tail " row here" — both fall back
    // to the "Default" option so the controls are never blank.
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect(fontSelect.locator('.selected-value')).toHaveText('Default');
    await expect(sizeSelect.locator('.selected-value')).toHaveText('Default');

    // ── Regression: a plain toolbar mark button still applies to the selection
    // after removing the blanket mousedown preventDefault. ──
    await selectStyleWord();
    await page.locator('sh-editor-toolbar button[aria-label="Bold"]').click();
    await expect(editor.locator('.sh-editor-content strong')).toHaveCount(1);

    // ── Bug 2: the text-color swatch prefills from the selection. Applying a
    // color used to update the swatch's [value] during render → NG0600 (caught
    // by the console-error assertion below); the swatch is now seeded off-render. ──
    const swatchColor = () =>
      page.evaluate(() =>
        getComputedStyle(document.querySelector('sh-color-picker-input.patch .color-indicator')!)
          .getPropertyValue('--indicator-color')
          .trim()
      );
    await selectStyleWord();
    await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      comp.engine.applyStyle({ color: '#3366ff' });
    });
    // Caret inside the colored run → the swatch reflects it; in the tail → resets.
    await editor.locator('.sh-editor-content span[style*="Georgia"]').click();
    await expect.poll(swatchColor).toBe('#3366ff');
    for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowRight');
    await expect.poll(swatchColor).toBe('#111111');

    // ── Bug 1: a patch color swatch opens the picker popover on a real click. ──
    await selectStyleWord();
    const textSwatch = editor.locator('sh-color-picker-input.patch').first();
    await textSwatch.locator('.color-indicator').click();
    await expect
      .poll(() =>
        page.evaluate(() => (window as any).ng.getComponent(document.querySelector('sh-color-picker-input.patch')!).isOpen())
      )
      .toBe(true);
    await expect(editor.locator('sh-color-picker-input.patch')).toHaveCount(2);

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
