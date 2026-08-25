import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { observeLiveRegions, ShipLiveCallback } from './live-regions';

describe('observeLiveRegions', () => {
  let teardown: (() => void) | null = null;
  let announcements: Array<{ text: string; politeness: string }>;
  const callback: ShipLiveCallback = (text, politeness) => announcements.push({ text, politeness });

  beforeEach(() => {
    vi.useFakeTimers();
    announcements = [];
  });

  afterEach(() => {
    teardown?.();
    teardown = null;
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  async function settle() {
    // Let the MutationObserver microtask deliver, then the 50 ms debounce fire.
    await Promise.resolve();
    vi.advanceTimersByTime(60);
  }

  function region(attrs: string): HTMLElement {
    document.body.innerHTML = `<div id="r" ${attrs}></div>`;
    return document.getElementById('r')!;
  }

  it('announces additions to a polite region', async () => {
    const el = region('aria-live="polite"');
    teardown = observeLiveRegions(document, callback);
    el.textContent = 'Saved';
    await settle();
    expect(announcements).toEqual([{ text: 'Saved', politeness: 'polite' }]);
  });

  it('treats role=alert as assertive and role=status as polite', async () => {
    const el = region('role="alert"');
    teardown = observeLiveRegions(document, callback);
    el.textContent = 'Error!';
    await settle();
    expect(announcements).toEqual([{ text: 'Error!', politeness: 'assertive' }]);
  });

  it('ignores aria-live="off" regions', async () => {
    const el = region('aria-live="off"');
    teardown = observeLiveRegions(document, callback);
    el.textContent = 'Nope';
    await settle();
    expect(announcements).toEqual([]);
  });

  it('coalesces clear-then-set into one announcement', async () => {
    const el = region('aria-live="polite" aria-atomic="true"');
    el.textContent = 'Old';
    teardown = observeLiveRegions(document, callback);
    el.textContent = '';
    await Promise.resolve();
    vi.advanceTimersByTime(20);
    el.textContent = 'New message';
    await settle();
    expect(announcements).toEqual([{ text: 'New message', politeness: 'polite' }]);
  });

  it('ignores removals by default but honours aria-relevant="removals"', async () => {
    const el = region('aria-live="polite"');
    el.innerHTML = '<span>bye</span>';
    teardown = observeLiveRegions(document, callback);
    el.firstElementChild!.remove();
    await settle();
    expect(announcements).toEqual([]);
  });

  it('announces nested additions attributed to the governing region', async () => {
    const el = region('aria-live="assertive"');
    el.innerHTML = '<div class="inner"></div>';
    teardown = observeLiveRegions(document, callback);
    const item = document.createElement('span');
    item.textContent = 'Item added';
    el.querySelector('.inner')!.appendChild(item);
    await settle();
    expect(announcements).toEqual([{ text: 'Item added', politeness: 'assertive' }]);
  });

  it('never announces the simulator panel itself', async () => {
    document.body.innerHTML = '<div data-ship-screenreader><div id="r" aria-live="polite"></div></div>';
    teardown = observeLiveRegions(document, callback);
    document.getElementById('r')!.textContent = 'self talk';
    await settle();
    expect(announcements).toEqual([]);
  });

  it('stops observing after teardown', async () => {
    const el = region('aria-live="polite"');
    const stop = observeLiveRegions(document, callback);
    stop();
    el.textContent = 'after teardown';
    await settle();
    expect(announcements).toEqual([]);
  });
});
