import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ShipA11yAnnouncerService } from './ship-a11y-announcer.service';

describe('ShipA11yAnnouncerService', () => {
  let service: ShipA11yAnnouncerService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ShipA11yAnnouncerService);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('[data-ship-announcer]').forEach((el) => el.remove());
  });

  function region(politeness: string): HTMLElement | null {
    return document.querySelector(`[data-ship-announcer="${politeness}"]`);
  }

  it('creates a hidden polite live region and writes the message after the settle timer', () => {
    service.announce('Row 5 selected');
    const el = region('polite')!;
    expect(el).toBeTruthy();
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('aria-atomic')).toBe('true');
    expect(el.textContent).toBe(''); // cleared until the timer lands
    vi.advanceTimersByTime(100);
    expect(el.textContent).toBe('Row 5 selected');
  });

  it('uses a separate assertive region', () => {
    service.announce('Save failed', 'assertive');
    vi.advanceTimersByTime(100);
    expect(region('assertive')!.textContent).toBe('Save failed');
    expect(region('polite')).toBeNull();
  });

  it('re-announces the same message by clearing first', () => {
    service.announce('Copied');
    vi.advanceTimersByTime(100);
    service.announce('Copied');
    expect(region('polite')!.textContent).toBe(''); // change screen readers can voice
    vi.advanceTimersByTime(100);
    expect(region('polite')!.textContent).toBe('Copied');
  });

  it('rapid announcements settle on the last message', () => {
    service.announce('one');
    service.announce('two');
    service.announce('three');
    vi.advanceTimersByTime(100);
    expect(region('polite')!.textContent).toBe('three');
  });

  it('clear() empties regions and cancels pending announcements', () => {
    service.announce('stale');
    service.clear();
    vi.advanceTimersByTime(200);
    expect(region('polite')!.textContent).toBe('');
  });

  it('ignores empty messages', () => {
    service.announce('');
    expect(region('polite')).toBeNull();
  });
});
