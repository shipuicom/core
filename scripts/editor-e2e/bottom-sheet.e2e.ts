import { expect, test } from '@playwright/test';

/**
 * The bottom-sheet dialog type: bottom-anchored card, drag-dismiss with
 * velocity snap, and the editor's mobile sheet mode composed on top of it.
 */
test.describe('bottom-sheet dialog', () => {
  test.use({ viewport: { width: 402, height: 874 } });

  test('opens bottom-anchored with a drag handle, parks focus off inputs', async ({ page }) => {
    await page.goto('/dialogs/examples');
    await page.getByRole('button', { name: 'Open bottom sheet' }).click();

    const dialog = page.locator('dialog[shDialog]');
    await expect(dialog).toHaveClass(/bottom-sheet/);
    await expect(dialog.locator('.sheet-handle')).toBeVisible();

    // Wait out the entry animation, then the card must hug the bottom edge.
    await page.waitForTimeout(400);
    const geometry = await dialog.evaluate((el) => ({
      bottom: el.getBoundingClientRect().bottom,
      innerHeight: window.innerHeight,
    }));
    expect(Math.abs(geometry.bottom - geometry.innerHeight)).toBeLessThan(2);

    // showModal would focus the input inside — the sheet must not pop the
    // keyboard; focus parks on the handle instead.
    await expect(page.locator('.sheet-handle')).toBeFocused();

    // The page behind is scroll-locked while the dialog is open.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  });

  test('regular modal dialogs also lock page scroll while open', async ({ page }) => {
    await page.goto('/dialogs/examples');
    await page.getByRole('button', { name: 'Open Basic Dialog' }).click();
    await expect(page.locator('dialog[shDialog]')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('dialog[shDialog]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  });

  test('slide-down drag dismisses; a short drag snaps back', async ({ page }) => {
    await page.goto('/dialogs/examples');
    await page.getByRole('button', { name: 'Open bottom sheet' }).click();
    const handle = page.locator('.sheet-handle');
    await handle.waitFor();
    await page.waitForTimeout(400);

    // Short SLOW drag: stays open, snaps back (a fast flick of the same
    // distance would legitimately dismiss via the velocity threshold).
    let box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 8);
    await page.mouse.down();
    for (let i = 1; i <= 4; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + 8 + i * 8, { steps: 1 });
      await page.waitForTimeout(80);
    }
    await page.mouse.up();
    await page.waitForTimeout(400);
    await expect(page.locator('dialog[shDialog]')).toHaveCount(1);

    // Long drag: dismisses.
    box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + 8);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box.x + box.width / 2, box.y + 8 + i * 35, { steps: 1 });
    }
    await page.mouse.up();
    await page.waitForTimeout(600);
    await expect(page.locator('dialog[shDialog]')).toHaveCount(0);

    // Closing releases the page scroll lock.
    expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe('');
  });

  test('editor sheet mode: preview opens the sheet, edits sync back, toolbar pins to the card bottom', async ({
    page,
  }) => {
    await page.goto('/editors/examples');
    await page.getByRole('button', { name: 'Force sheet' }).click();

    const preview = page.locator('.sh-editor-sheet-preview-hit');
    await expect(preview).toHaveCount(1);
    await preview.click();

    const dialog = page.locator('dialog[shDialog]');
    await expect(dialog).toHaveClass(/bottom-sheet/);
    await page.waitForTimeout(400);

    // The bottom toolbar renders inside the sheet, pinned near the card's
    // bottom edge (the sheet itself hugs the viewport bottom on desktop).
    const toolbar = dialog.locator('sh-editor-toolbar[data-position="bottom"]');
    await expect(toolbar).toBeVisible();
    const pinned = await page.evaluate(() => {
      const dlg = document.querySelector('dialog[shDialog]')!;
      const tb = dlg.querySelector('sh-editor-toolbar[data-position="bottom"]')!;
      return dlg.getBoundingClientRect().bottom - tb.getBoundingClientRect().bottom;
    });
    expect(pinned).toBeLessThan(40); // only content padding/safe-area below it

    // Every action stays reachable: the toolbar row overflows horizontally
    // and scrolls instead of wrapping or clipping actions away.
    const scroll = await page.evaluate(() => {
      const inner = document.querySelector('dialog[shDialog] sh-editor-toolbar .sh-editor-toolbar-inner')!;
      const before = inner.scrollLeft;
      inner.scrollLeft = 10_000;
      const buttons = inner.querySelectorAll('button');
      const last = buttons[buttons.length - 1].getBoundingClientRect();
      const box = inner.getBoundingClientRect();
      return {
        overflows: inner.scrollWidth > inner.clientWidth,
        scrolled: inner.scrollLeft > before,
        lastReachable: last.right <= box.right + 1,
        buttonCount: buttons.length,
      };
    });
    expect(scroll.overflows).toBe(true);
    expect(scroll.scrolled).toBe(true);
    expect(scroll.lastReachable).toBe(true);
    expect(scroll.buttonCount).toBeGreaterThanOrEqual(17);

    // Type in the sheet, close with Escape, the preview shows the edit.
    await dialog.locator('sh-editor [contenteditable]').click();
    await page.keyboard.type(' ROUNDTRIP');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await expect(page.locator('dialog[shDialog]')).toHaveCount(0);
    await expect(page.locator('sh-editor-sheet')).toContainText('ROUNDTRIP');
  });
});
