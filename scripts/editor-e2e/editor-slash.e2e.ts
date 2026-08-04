import { Page, expect, test } from '@playwright/test';

/**
 * Slash-command inserts.
 *
 * A component block arrives through two ops in one render batch: the query
 * text is deleted from the paragraph, then a void block is inserted in its
 * place. The first op queues a `block` hint naming its block by index, and
 * that index is resolved against the AST when the DOM is painted rather than
 * when the hint was recorded — so the insert used to shift the block out from
 * under it. The stale hint repainted the paragraph's element as the new
 * component, and the splice then inserted that component a second time: one
 * block in the model, two widgets on screen.
 */

async function openEditor(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/editors');
  await page.locator('sh-tabs button[value="examples"]').click();
  await page.locator('.sh-editor-content').first().waitFor();
  await page.waitForTimeout(800);
  return { errors };
}

/** The AST's block types beside what the DOM actually mounted, for comparison. */
function state(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('sh-editor')!;
    const comp = (window as any).ng.getComponent(host);
    const surface = host.querySelector('.sh-editor-content')!;
    const tagToType: Record<string, string> = {
      H1: 'heading',
      H2: 'heading',
      P: 'paragraph',
      UL: 'bullet-list',
      OL: 'ordered-list',
      BLOCKQUOTE: 'quote',
      HR: 'hr',
    };
    return {
      astTypes: comp.engine.document().map((b: any) => b.type),
      domTypes: Array.from(surface.children).map(
        (el: any) => el.getAttribute('data-sh-block') ?? tagToType[el.tagName] ?? el.tagName
      ),
      counterBlocks: comp.engine.document().filter((b: any) => b.type === 'demo-counter').length,
      counterWidgets: host.querySelectorAll('.demo-counter-row').length,
    };
  });
}

/** Caret to the end of the last block, then Enter for a fresh paragraph. */
async function caretOnFreshLine(page: Page) {
  await page.evaluate(() => {
    const surface = document.querySelector('.sh-editor-content') as HTMLElement;
    const el = surface.children[surface.children.length - 1] as HTMLElement;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const node = walker.nextNode()!;
    const range = document.createRange();
    range.setStart(node, node.textContent!.length);
    range.collapse(true);
    surface.focus();
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(range);
    document.dispatchEvent(new Event('selectionchange'));
  });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(150);
}

test.describe('slash-command component insert', () => {
  for (const confirm of ['Enter', 'click'] as const) {
    test(`inserts exactly one component block, confirmed by ${confirm}`, async ({ page }) => {
      const { errors } = await openEditor(page);
      const before = await state(page);

      await caretOnFreshLine(page);
      await page.keyboard.type('/counter');
      await expect
        .poll(() => page.evaluate(() => !!(window as any).ng.getComponent(document.querySelector('sh-editor')!).slashMenu()?.isOpen()))
        .toBe(true);

      if (confirm === 'Enter') await page.keyboard.press('Enter');
      else await page.evaluate(() => (document.querySelector('.sh-editor-slash-menu button') as HTMLElement).click());
      await page.waitForTimeout(400);

      const after = await state(page);
      // One block in the model...
      expect(after.counterBlocks).toBe(before.counterBlocks + 1);
      // ...and one widget on screen, not two.
      expect(after.counterWidgets).toBe(before.counterWidgets + 1);
      // The DOM is the AST, block for block — the invariant the stale hint broke.
      expect(after.domTypes).toEqual(after.astTypes);
      expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
    });
  }

  test('the inserted component survives typing in the paragraph after it', async ({ page }) => {
    const { errors } = await openEditor(page);
    await caretOnFreshLine(page);
    await page.keyboard.type('/counter');
    await expect
      .poll(() => page.evaluate(() => !!(window as any).ng.getComponent(document.querySelector('sh-editor')!).slashMenu()?.isOpen()))
      .toBe(true);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);

    // The insert selects the new block; Escape-free path: click into the
    // trailing paragraph and type, which is what a user does next.
    await page.evaluate(() => {
      const surface = document.querySelector('.sh-editor-content') as HTMLElement;
      const el = surface.children[surface.children.length - 1] as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      surface.focus();
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });
    await page.keyboard.type('after');
    await page.waitForTimeout(250);

    const after = await state(page);
    expect(after.counterWidgets).toBe(after.counterBlocks);
    expect(after.domTypes).toEqual(after.astTypes);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});

/**
 * The rendered text, block by block, beside the model's.
 *
 * Type checks alone missed a whole class of breakage here: the AST came out
 * right while the DOM showed the deleted `/code` query next to the new
 * component and had quietly overwritten the following paragraph.
 */
function textState(page: Page) {
  return page.evaluate(() => {
    const host = document.querySelector('sh-editor')!;
    const comp = (window as any).ng.getComponent(host);
    const surface = host.querySelector('.sh-editor-content')!;
    return {
      astTypes: comp.engine.document().map((b: any) => b.type),
      astTexts: comp.engine.document().map((b: any) => (b.content ?? []).map((n: any) => n.text ?? '').join('')),
      // A component block's interior belongs to Angular, so it reports as ''.
      domTexts: Array.from(surface.children).map((el: any) =>
        el.dataset?.shBlock ? '' : (el.textContent ?? '').replace(/ /g, ' ')
      ),
      domIsComponent: Array.from(surface.children).map((el: any) => !!el.dataset?.shBlock),
    };
  });
}

test.describe('slash-command insert into a paragraph mid-document', () => {
  test('the query is gone from the screen and the following paragraph survives', async ({ page }) => {
    const { errors } = await openEditor(page);
    await page.evaluate(() => {
      (window as any).ng
        .getComponent(document.querySelector('sh-editor')!)
        .value.set('<p>Custom blocks:</p><p><br></p><p>Try changing</p>');
    });
    await page.waitForTimeout(400);

    // Caret into the empty paragraph that has another paragraph after it.
    await page.evaluate(() => {
      const surface = document.querySelector('.sh-editor-content') as HTMLElement;
      const range = document.createRange();
      range.selectNodeContents(surface.children[1] as HTMLElement);
      range.collapse(true);
      surface.focus();
      const sel = window.getSelection()!;
      sel.removeAllRanges();
      sel.addRange(range);
      document.dispatchEvent(new Event('selectionchange'));
    });

    await page.keyboard.type('/code');
    await expect
      .poll(() =>
        page.evaluate(() => !!(window as any).ng.getComponent(document.querySelector('sh-editor')!).slashMenu()?.isOpen())
      )
      .toBe(true);
    // Second entry is the demo component block; the first is the built-in code block.
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const after = await textState(page);
    expect(after.astTypes).toEqual(['paragraph', 'demo-code-pad', 'paragraph', 'paragraph']);
    // The model and the screen have to agree — this is what actually broke.
    expect(after.domTexts).toEqual(after.astTexts);
    // Nothing on screen still shows the slash query...
    expect(after.domTexts.join('')).not.toContain('/code');
    // ...and the paragraph that followed the caret is still there.
    expect(after.domTexts).toContain('Try changing');
    expect(after.domIsComponent).toEqual([false, true, false, false]);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
