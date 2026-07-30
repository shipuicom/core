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
