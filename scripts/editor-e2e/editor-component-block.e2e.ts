import { Page, expect, test } from '@playwright/test';

/**
 * Custom component blocks (BaseComponentBlockBehavior) under real browser
 * input. The demo page seeds two of them: a counter widget and a "code pad"
 * textarea, both persisting state through block attrs.
 *
 * Contract under test:
 * - clicks pass through to the component (no block-selection hijack)
 * - while focus is inside the component the editor intercepts nothing —
 *   typing, shortcuts, slash trigger all stay in the component
 * - arrowing from adjacent text selects the block (border), where the
 *   standard void keybindings apply (arrows navigate, Backspace deletes)
 * - a live component survives attrs updates and undo/redo without remount
 */

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

const counter = (page: Page) => page.locator('[data-sh-block="demo-counter"]');
const pad = (page: Page) => page.locator('[data-sh-block="demo-code-pad"]');

const docTypes = (page: Page) =>
  page.evaluate(() =>
    (window as any).ng
      .getComponent(document.querySelector('sh-editor')!)
      .engine.document()
      .map((b: any) => b.type)
  );

test.describe('custom component blocks', () => {
  test('clicks pass through: the counter increments and its element survives the attrs update', async ({ page }) => {
    const { errors } = await openEditor(page);
    const el = counter(page);
    await expect(el.locator('strong')).toHaveText('3');

    const handle = await el.elementHandle();
    await el.getByRole('button', { name: '+' }).click();
    await expect(el.locator('strong')).toHaveText('4');
    // No block-selection hijack on the click…
    await expect(el).not.toHaveClass(/sh-editor-block-selected/);
    // …and the wrapper element (with the live component) was patched, not replaced.
    expect(await page.evaluate((h) => h!.isConnected, handle)).toBe(true);

    // The new count is in the serialized document.
    const html = await page.evaluate(() =>
      (window as any).ng.getComponent(document.querySelector('sh-editor')!).engine.serialize('html')
    );
    expect(html).toContain('&quot;count&quot;:4');
    expect(errors).toEqual([]);
  });

  test('focus inside the component owns every key: typing, slash, and Cmd+B stay in the pad', async ({ page }) => {
    const { errors } = await openEditor(page);
    // Everything except the code pad itself must come out untouched.
    const docExceptPad = () =>
      page.evaluate(() =>
        JSON.stringify(
          (window as any).ng
            .getComponent(document.querySelector('sh-editor')!)
            .engine.document()
            .filter((b: any) => b.type !== 'demo-code-pad')
        )
      );
    const before = await docExceptPad();
    const ta = pad(page).locator('textarea');
    await ta.click();
    await ta.press('End');
    await ta.pressSequentially(' /bold', { delay: 10 });
    await ta.press('ControlOrMeta+b');

    // Everything landed in the textarea.
    await expect(ta).toHaveValue(/\/bold/);
    // The editor's slash menu never opened (the popup div only exists while
    // open — the sh-editor-slash-menu host element always exists) and the
    // document gained no blocks.
    await expect(page.locator('.sh-editor-slash-menu')).toHaveCount(0);
    const types = await docTypes(page);
    expect(types.filter((t: string) => t === 'demo-code-pad')).toHaveLength(1);
    // The rest of the document is byte-identical — no text inserted, no marks
    // toggled by the swallowed keys…
    expect(await docExceptPad()).toBe(before);
    // …while the pad's own attrs carry the typed text.
    const padAttrs = await page.evaluate(() =>
      (window as any).ng
        .getComponent(document.querySelector('sh-editor')!)
        .engine.document()
        .find((b: any) => b.type === 'demo-code-pad')?.attrs
    );
    expect(String(padAttrs?.code)).toContain('/bold');
    expect(errors).toEqual([]);
  });

  test('keyboard: arrows select the block, hop void-to-void, Backspace deletes, undo restores', async ({ page }) => {
    const { errors, surface } = await openEditor(page);
    // Caret at the end of the paragraph right above the counter widget.
    const intro = surface.locator('p', { hasText: 'Custom component blocks' });
    await intro.click();
    await page.keyboard.press('End');

    await page.keyboard.press('ArrowDown');
    await expect(counter(page)).toHaveClass(/sh-editor-block-selected/);

    // Down again: the neighbor is the code pad (another void) — selection hops.
    await page.keyboard.press('ArrowDown');
    await expect(counter(page)).not.toHaveClass(/sh-editor-block-selected/);
    await expect(pad(page)).toHaveClass(/sh-editor-block-selected/);

    // Up: back onto the counter.
    await page.keyboard.press('ArrowUp');
    await expect(counter(page)).toHaveClass(/sh-editor-block-selected/);

    // Backspace deletes the selected block; undo brings it back, state intact.
    await page.keyboard.press('Backspace');
    await expect(counter(page)).toHaveCount(0);
    await page.keyboard.press('ControlOrMeta+z');
    await expect(counter(page)).toHaveCount(1);
    await expect(counter(page).locator('strong')).toHaveText('3');
    expect(errors).toEqual([]);
  });

  test('click fall-through: dead space selects the block, controls stay interactive', async ({ page }) => {
    const { errors } = await openEditor(page);
    const el = counter(page);
    // A click on non-interactive content falls through and selects the block.
    await el.locator('.demo-block-label').click();
    await expect(el).toHaveClass(/sh-editor-block-selected/);
    // A click on a control interacts (and the mousedown drops block selection).
    await el.getByRole('button', { name: '+' }).click();
    await expect(el.locator('strong')).toHaveText('4');
    await expect(el).not.toHaveClass(/sh-editor-block-selected/);
    expect(errors).toEqual([]);
  });

  test('Escape inside the pad hands control back via context.select()', async ({ page }) => {
    const { errors } = await openEditor(page);
    const ta = pad(page).locator('textarea');
    await ta.click();
    await page.keyboard.press('Escape');
    await expect(pad(page)).toHaveClass(/sh-editor-block-selected/);
    // Now in block-selected state the editor keybindings apply again.
    await page.keyboard.press('ArrowUp');
    await expect(counter(page)).toHaveClass(/sh-editor-block-selected/);
    expect(errors).toEqual([]);
  });

  test('dragging into the first of two adjacent blocks selects only that block', async ({ page }) => {
    const { errors, surface } = await openEditor(page);
    const intro = surface.locator('p', { hasText: 'Custom component blocks' });
    await pad(page).scrollIntoViewIfNeeded();
    await expect(intro).toBeInViewport();
    const from = (await intro.boundingBox())!;
    const to = (await counter(page).boundingBox())!;
    // Real drag from the paragraph above into the middle of the first block.
    // Without pointer clamping, Blink has no valid position inside or between
    // the adjacent non-selectable islands and jumps the range past both.
    await page.mouse.move(from.x + 40, from.y + 8);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(counter(page)).toHaveClass(/sh-editor-void-in-selection/);
    await expect(pad(page)).not.toHaveClass(/sh-editor-void-in-selection/);
    expect(errors).toEqual([]);
  });

  test('a selection sweeping across the components paints the void highlight', async ({ page }) => {
    const { errors, surface } = await openEditor(page);
    const intro = surface.locator('p', { hasText: 'Custom component blocks' });
    const tail = surface.locator('p', { hasText: 'Try changing the storage format' });
    // Anchor the caret at the start of the paragraph above the components,
    // then Shift+Click below them — the native selection extension sweeps
    // across both component blocks.
    await intro.click();
    await page.keyboard.press('Home');
    await tail.scrollIntoViewIfNeeded();
    await tail.click({ modifiers: ['Shift'] });
    await expect(counter(page)).toHaveClass(/sh-editor-void-in-selection/);
    await expect(pad(page)).toHaveClass(/sh-editor-void-in-selection/);
    expect(errors).toEqual([]);
  });
});

/**
 * Replacing a live component block with an ordinary one.
 *
 * A component block's wrapper *is* the Angular component's host element, so
 * destroying the component takes the wrapper out of the DOM with it. The
 * render pass then tried to swap that wrapper for the new block's element —
 * but `replaceWith` on an already-detached node is a silent no-op, so the
 * replacement was dropped: the DOM came out one element short, every later
 * block shifted up, and because the child count still matched the block count
 * the reconciler's own safety net never noticed. From there the DOM and the
 * AST disagreed and clicks mapped to the wrong block.
 */
test.describe('component block replacement', () => {
  /** The AST's block types beside the DOM's, in a directly comparable shape. */
  function state(page: Page) {
    return page.evaluate(() => {
      const host = document.querySelector('sh-editor')!;
      const comp = (window as any).ng.getComponent(host);
      const surface = host.querySelector('.sh-editor-content')!;
      const tagToType: Record<string, string> = {
        H1: 'heading', H2: 'heading', H3: 'heading', P: 'paragraph',
        UL: 'bullet-list', OL: 'ordered-list', BLOCKQUOTE: 'quote', HR: 'hr', PRE: 'code-block',
      };
      return {
        astTypes: comp.engine.document().map((b: any) => b.type),
        domTypes: Array.from(surface.children).map(
          (el: any) => el.getAttribute('data-sh-block') ?? tagToType[el.tagName] ?? el.tagName
        ),
        astTexts: comp.engine.document().map((b: any) => (b.content ?? []).map((n: any) => n.text ?? '').join('')),
      };
    });
  }

  test('a new document replaces component blocks instead of dropping their elements', async ({ page }) => {
    const { errors } = await openEditor(page);
    const before = await state(page);
    expect(before.astTypes).toContain('demo-counter');
    expect(before.domTypes).toEqual(before.astTypes);

    // A document with plain paragraphs where the components used to be.
    await page.evaluate(() => {
      (window as any).ng
        .getComponent(document.querySelector('sh-editor')!)
        .value.set('<h1>T</h1><p>a</p><ul><li>x</li></ul><blockquote>q</blockquote><hr><p>b</p><p><br></p><p>c</p>');
    });
    await page.waitForTimeout(400);

    const after = await state(page);
    expect(after.astTypes).not.toContain('demo-counter');
    expect(after.astTypes).not.toContain('demo-code-pad');
    // The point: nothing left behind, nothing silently dropped.
    expect(after.domTypes).toEqual(after.astTypes);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('a slash command in an empty paragraph edits that paragraph, not another block', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.evaluate(() => {
      (window as any).ng
        .getComponent(document.querySelector('sh-editor')!)
        .value.set('<h1>Title</h1><p>intro</p><hr><p>lead in</p><p><br></p><p>tail</p>');
    });
    await page.waitForTimeout(400);

    const target = await page.evaluate(() => {
      const comp = (window as any).ng.getComponent(document.querySelector('sh-editor')!);
      const surface = document.querySelector('.sh-editor-content') as HTMLElement;
      const idx = comp.engine
        .document()
        .findIndex((b: any) => b.type === 'paragraph' && (b.content ?? []).map((n: any) => n.text ?? '').join('') === '');
      const range = document.createRange();
      range.selectNodeContents(surface.children[idx] as HTMLElement);
      range.collapse(true);
      surface.focus();
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
      return idx;
    });

    await page.keyboard.type('/code');
    const typed = await state(page);
    // The query must land in the block holding the caret. When the DOM and the
    // AST disagree it maps elsewhere — into the heading, in the case that
    // first surfaced this.
    expect(typed.astTexts[target]).toBe('/code');
    expect(typed.astTexts[0]).toBe('Title');

    await expect
      .poll(() =>
        page.evaluate(() => !!(window as any).ng.getComponent(document.querySelector('sh-editor')!).slashMenu()?.isOpen())
      )
      .toBe(true);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);

    const after = await state(page);
    // A block command converts the paragraph in place; the tail is untouched.
    expect(after.astTypes[target]).toBe('code-block');
    expect(after.astTexts[after.astTexts.length - 1]).toBe('tail');
    expect(after.domTypes).toEqual(after.astTypes);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

/**
 * Ending a drag-selection over a component block.
 *
 * Blink cannot put a selection endpoint inside a `contenteditable="false"`
 * island, so the native range runs on to the end of the editing host. The
 * logical selection is clamped to the component, but the native range is what
 * the next `beforeinput` re-derives from once the drag state is released — so
 * an unrepainted overshoot meant one keystroke deleted every block through the
 * end of the document.
 */
test.describe('drag-selection ending on a component block', () => {
  test('the painted range stops at the component, and typing spares what follows', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.setViewportSize({ width: 1400, height: 1100 });
    await page.waitForTimeout(300);

    const boxes = await page.evaluate(() =>
      Array.from(document.querySelector('.sh-editor-content')!.children).map((el: any) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })
    );
    const typesBefore = await docTypes(page);
    const counterIndex = typesBefore.indexOf('demo-counter');
    expect(counterIndex).toBeGreaterThan(0);

    // Sweep from the list down into the counter block.
    await page.mouse.move(boxes[2].x + 20, boxes[2].y + 5);
    await page.mouse.down();
    await page.mouse.move(
      boxes[counterIndex].x + boxes[counterIndex].w / 2,
      boxes[counterIndex].y + boxes[counterIndex].h / 2,
      { steps: 25 }
    );
    await page.mouse.up();
    await page.waitForTimeout(300);

    const painted = await page.evaluate((idx) => {
      const surface = document.querySelector('.sh-editor-content')!;
      const sel = window.getSelection()!;
      const range = sel.rangeCount ? sel.getRangeAt(0) : null;
      return Array.from(surface.children).map((el, i) => (range ? range.intersectsNode(el) : false)).slice(idx);
    }, counterIndex);
    // Nothing from the component onwards is inside the painted range.
    expect(painted).toEqual(painted.map(() => false));

    await page.keyboard.type('X');
    await page.waitForTimeout(300);

    const typesAfter = await docTypes(page);
    // The selection reached the counter, so typing replaces it — but nothing
    // past the drag's end may be touched. That over-reach was the data loss:
    // one keystroke used to take every block through the end of the document.
    expect(typesAfter).toContain('demo-code-pad');
    expect(typesAfter[typesAfter.length - 1]).toBe('paragraph');
    expect(typesAfter.length).toBeGreaterThan(3);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('Backspace deletes the component the drag selected, and only that one', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.setViewportSize({ width: 1400, height: 1100 });
    await page.waitForTimeout(300);

    const boxes = await page.evaluate(() =>
      Array.from(document.querySelector('.sh-editor-content')!.children).map((el: any) => {
        const r = el.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })
    );
    const before = await docTypes(page);
    const ci = before.indexOf('demo-counter');

    await page.mouse.move(boxes[2].x + 20, boxes[2].y + 5);
    await page.mouse.down();
    await page.mouse.move(boxes[ci].x + boxes[ci].w / 2, boxes[ci].y + boxes[ci].h / 2, { steps: 25 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    // The block the drag reached is highlighted, so Backspace has to take it.
    await expect(counter(page)).toHaveClass(/sh-editor-void-in-selection/);

    await page.keyboard.press('Backspace');
    await page.waitForTimeout(400);

    const after = await docTypes(page);
    expect(after).not.toContain('demo-counter');
    // ...but the component *after* it was never selected and must survive: its
    // start sits exactly on the range's exclusive end.
    expect(after).toContain('demo-code-pad');
    expect(after[after.length - 1]).toBe('paragraph');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
