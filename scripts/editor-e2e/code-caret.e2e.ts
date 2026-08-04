import { Page, expect, test } from '@playwright/test';

/**
 * Caret hit-testing in `<sh-code>`.
 *
 * The surface paints its own caret and selection, so a click is resolved by
 * arithmetic rather than by the browser's own caret placement — which means
 * the click has to be measured from exactly the origin the paint uses. It once
 * was not: rects are content-box relative and shifted by the content's left
 * padding in CSS, while the hit test measured from the border box, so the
 * padding read as a character and a half of text and clicking the left half of
 * the first character on a line put the caret after it.
 */

async function openCode(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/code');
  await page.locator('sh-code .sh-code-line').first().waitFor();
  // The virtualized instance is the second editor; wait for it to lay out too.
  await page.locator('sh-code').nth(1).locator('.sh-code-line').first().waitFor();
  return { errors };
}

/** Click `column` character widths into mounted line `line`, and report where the caret landed. */
async function clickAt(page: Page, editor: number, line: number, columnFraction: number) {
  return page.evaluate(
    ({ editor, line, columnFraction }) => {
      const el = document.querySelectorAll('sh-code')[editor] as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      const content = el.querySelector('.sh-code-content') as HTMLElement;
      const lineEl = content.querySelectorAll('.sh-code-line')[line] as HTMLElement;
      const rect = lineEl.getBoundingClientRect();
      content.dispatchEvent(
        new MouseEvent('mousedown', {
          bubbles: true,
          cancelable: true,
          button: 0,
          detail: 1,
          clientX: rect.left + columnFraction * comp.charWidth(),
          clientY: rect.top + rect.height / 2,
        })
      );
      (window as any).ng.applyChanges(comp);

      const head = comp.sel().ranges[0].head;
      const doc = comp.doc();
      let at = 0;
      for (let i = 0; i < doc.lines.length; i++) {
        const len = doc.lines[i].text.length;
        if (head <= at + len) return { line: i, column: head - at };
        at += len + 1;
      }
      return { line: -1, column: -1 };
    },
    { editor, line, columnFraction }
  );
}

test.describe('sh-code caret hit-testing', () => {
  test('a click on the first character of a line lands before it, not after', async ({ page }) => {
    const { errors } = await openCode(page);
    // The exact left edge, and anywhere in the character's left half.
    expect(await clickAt(page, 0, 0, 0.01)).toEqual({ line: 0, column: 0 });
    expect(await clickAt(page, 0, 0, 0.3)).toEqual({ line: 0, column: 0 });
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('the caret snaps to the nearest character boundary', async ({ page }) => {
    await openCode(page);
    // Past the middle of a character rounds forward, as every editor does.
    expect(await clickAt(page, 0, 0, 0.6)).toEqual({ line: 0, column: 1 });
    expect(await clickAt(page, 0, 0, 1.0)).toEqual({ line: 0, column: 1 });
    expect(await clickAt(page, 0, 0, 1.6)).toEqual({ line: 0, column: 2 });
    expect(await clickAt(page, 0, 0, 5.0)).toEqual({ line: 0, column: 5 });
  });

  test('a click left of the text clamps to the start of the line', async ({ page }) => {
    await openCode(page);
    expect(await clickAt(page, 0, 2, -2)).toEqual({ line: 2, column: 0 });
  });

  test('the painted caret lands where the click did', async ({ page }) => {
    await openCode(page);
    const drift = await page.evaluate(() => {
      const el = document.querySelector('sh-code') as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      const content = el.querySelector('.sh-code-content') as HTMLElement;
      const out: number[] = [];
      for (const [line, column] of [
        [0, 3],
        [2, 0],
        [4, 7],
      ]) {
        const rect = (content.querySelectorAll('.sh-code-line')[line] as HTMLElement).getBoundingClientRect();
        const x = rect.left + column * comp.charWidth();
        content.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            detail: 1,
            clientX: x + 0.1,
            clientY: rect.top + rect.height / 2,
          })
        );
        (window as any).ng.applyChanges(comp);
        const caret = el.querySelector('.sh-code-caret') as HTMLElement;
        out.push(Math.abs(caret.getBoundingClientRect().left - x));
      }
      return out;
    });
    for (const px of drift) expect(px).toBeLessThan(1);
  });

  test('the virtual window follows the scroll, not just the caret', async ({ page }) => {
    await openCode(page);
    // The window used to move only when something called into the component
    // directly — placing a caret, say — because the scroll listener could end
    // up bound to an element the view had already replaced. Scrolling alone
    // has to move it.
    const moved = await page.evaluate(async () => {
      const el = document.querySelectorAll('sh-code')[1] as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      const scroller = comp.scroller().nativeElement as HTMLElement;
      const before = comp.winStart();
      scroller.scrollTop = 20000;
      for (let i = 0; i < 40 && comp.winStart() === before; i++) await new Promise((r) => setTimeout(r, 50));
      (window as any).ng.applyChanges(comp);
      return { before, after: comp.winStart(), gutter: el.querySelector('.sh-code-gutter-line')?.textContent };
    });
    expect(moved.before).toBe(0);
    expect(moved.after).toBeGreaterThan(1000);
    // The gutter is the user-visible proof the mounted slice actually changed.
    expect(Number(moved.gutter)).toBe(moved.after + 1);
  });

  test('hit-testing stays exact deep inside a virtualized document', async ({ page }) => {
    await openCode(page);
    // The virtualized instance stands its off-window content up as padding, so
    // a deep window puts six figures of padding above the mounted lines — the
    // click's y has to be read in document coordinates, not viewport ones.
    const result = await page.evaluate(async () => {
      const el = document.querySelectorAll('sh-code')[1] as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      const scroller = el.querySelector('.sh-code-scroller') as HTMLElement;
      const content = el.querySelector('.sh-code-content') as HTMLElement;
      scroller.scrollTop = scroller.scrollHeight * 0.45;
      // The window moves on the component's own rAF/timeout path; wait for it
      // rather than guessing a delay.
      for (let i = 0; i < 40 && comp.winStart() === 0; i++) await new Promise((r) => setTimeout(r, 50));
      (window as any).ng.applyChanges(comp);

      const winStart = comp.winStart();
      const lines = content.querySelectorAll('.sh-code-line');
      const probes: { expected: number; got: number }[] = [];
      for (const mounted of [0, 5, 20]) {
        const rect = (lines[mounted] as HTMLElement).getBoundingClientRect();
        content.dispatchEvent(
          new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            button: 0,
            detail: 1,
            clientX: rect.left + 0.1,
            clientY: rect.top + rect.height / 2,
          })
        );
        (window as any).ng.applyChanges(comp);
        const head = comp.sel().ranges[0].head;
        const doc = comp.doc();
        let at = 0;
        let got = -1;
        for (let i = 0; i < doc.lines.length; i++) {
          const len = doc.lines[i].text.length;
          if (head <= at + len) {
            got = i;
            break;
          }
          at += len + 1;
        }
        probes.push({ expected: winStart + mounted, got });
      }
      return { winStart, probes };
    });
    expect(result.winStart).toBeGreaterThan(100);
    for (const probe of result.probes) expect(probe.got).toBe(probe.expected);
  });

  test('delete-line over the last two lines removes them cleanly, undo restores', async ({ page }) => {
    // The last line has no newline of its own and borrows the one above it —
    // deleting it together with its neighbour once emitted overlapping changes
    // that reordered the document instead of shrinking it.
    const { errors } = await openCode(page);
    const result = await page.evaluate(() => {
      const el = document.querySelector('sh-code') as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      const texts = () => comp.doc().lines.map((l: any) => l.text);
      const before: string[] = texts();
      const n = before.length;
      let start = 0;
      for (let i = 0; i < n - 2; i++) start += before[i].length + 1;
      const size = start + before[n - 2].length + 1 + before[n - 1].length;
      comp.sel.set({ ranges: [{ anchor: start, head: size }], primary: 0 });

      const isMac = /Mac|iP/.test(navigator.platform);
      const chord = (key: string) =>
        new KeyboardEvent('keydown', { key, shiftKey: key === 'k', metaKey: isMac, ctrlKey: !isMac, cancelable: true });
      comp.onKeyDown(chord('k'));
      const after: string[] = texts();
      comp.onKeyDown(chord('z'));
      return { before, after, restored: texts() as string[] };
    });
    expect(result.after).toEqual(result.before.slice(0, -2));
    expect(result.restored).toEqual(result.before);
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });

  test('a synchronous write-back from onChange is not dropped', async ({ page }) => {
    // A form subscriber normalizing in valueChanges writes back while the
    // editor's own update is still flushing; the external value must win.
    const { errors } = await openCode(page);
    const result = await page.evaluate(async () => {
      const el = document.querySelector('sh-code') as HTMLElement;
      const comp = (window as any).ng.getComponent(el);
      let writes = 0;
      comp.registerOnChange(() => {
        if (writes++ === 0) comp.writeValue('normalized');
      });
      comp.sel.set({ ranges: [{ anchor: 0, head: 0 }], primary: 0 });
      const isMac = /Mac|iP/.test(navigator.platform);
      comp.onKeyDown(new KeyboardEvent('keydown', { key: 'k', shiftKey: true, metaKey: isMac, ctrlKey: !isMac, cancelable: true }));
      await new Promise((r) => setTimeout(r, 100));
      (window as any).ng.applyChanges(comp);
      return {
        writes,
        text: comp.doc().lines.map((l: any) => l.text).join('\n'),
        value: comp.value(),
      };
    });
    expect(result.writes).toBeGreaterThan(0);
    expect(result.text).toBe('normalized');
    expect(result.value).toBe('normalized');
    expect(errors, `console/page errors: ${errors.join(' | ')}`).toEqual([]);
  });
});
