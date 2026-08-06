import { describe, expect, it } from 'vitest';
import { computeEviction, shouldLoadMore, QuotaBackoff } from './buffer-controller';

describe('computeEviction', () => {
  const cases: Array<{
    name: string;
    buffered: Array<{ start: number; end: number }>;
    currentTime: number;
    backBufferLength: number;
    expected: { start: number; end: number } | null;
  }> = [
    {
      name: 'nothing buffered',
      buffered: [],
      currentTime: 100,
      backBufferLength: 30,
      expected: null,
    },
    {
      name: 'back buffer within limit',
      buffered: [{ start: 80, end: 120 }],
      currentTime: 100,
      backBufferLength: 30,
      expected: null,
    },
    {
      name: 'back buffer over limit',
      buffered: [{ start: 0, end: 120 }],
      currentTime: 100,
      backBufferLength: 30,
      expected: { start: 0, end: 70 },
    },
    {
      name: 'playhead too early for any eviction',
      buffered: [{ start: 0, end: 20 }],
      currentTime: 8,
      backBufferLength: 30,
      expected: null,
    },
    {
      name: 'small backBufferLength still keeps 10s behind the playhead',
      buffered: [{ start: 0, end: 120 }],
      currentTime: 100,
      backBufferLength: 2,
      expected: { start: 0, end: 90 },
    },
    {
      name: 'eviction starts at the earliest buffered range',
      buffered: [
        { start: 5, end: 20 },
        { start: 30, end: 120 },
      ],
      currentTime: 100,
      backBufferLength: 30,
      expected: { start: 5, end: 70 },
    },
    {
      name: 'range starting exactly at the eviction end is kept',
      buffered: [{ start: 70, end: 120 }],
      currentTime: 100,
      backBufferLength: 30,
      expected: null,
    },
  ];

  for (const c of cases) {
    it(c.name, () => {
      expect(
        computeEviction({ buffered: c.buffered, currentTime: c.currentTime, backBufferLength: c.backBufferLength }),
      ).toEqual(c.expected);
    });
  }
});

describe('shouldLoadMore', () => {
  it('loads while under the target', () => {
    expect(shouldLoadMore({ forwardBufferSeconds: 10, maxForwardBuffer: 60 })).toBe(true);
  });

  it('stops at the target', () => {
    expect(shouldLoadMore({ forwardBufferSeconds: 60, maxForwardBuffer: 60 })).toBe(false);
    expect(shouldLoadMore({ forwardBufferSeconds: 61, maxForwardBuffer: 60 })).toBe(false);
  });
});

describe('QuotaBackoff', () => {
  it('halves the window down to the default floor of 15', () => {
    const backoff = new QuotaBackoff(60);
    expect(backoff.maxForwardBuffer).toBe(60);

    expect(backoff.onQuotaExceeded()).toEqual({ evictBehind: 10, retry: true });
    expect(backoff.maxForwardBuffer).toBe(30);

    expect(backoff.onQuotaExceeded()).toEqual({ evictBehind: 10, retry: true });
    expect(backoff.maxForwardBuffer).toBe(15);

    expect(backoff.onQuotaExceeded()).toEqual({ evictBehind: 10, retry: false });
    expect(backoff.maxForwardBuffer).toBe(15);
  });

  it('respects a custom floor', () => {
    const backoff = new QuotaBackoff(40, 5);
    backoff.onQuotaExceeded();
    expect(backoff.maxForwardBuffer).toBe(20);
    backoff.onQuotaExceeded();
    expect(backoff.maxForwardBuffer).toBe(10);
    backoff.onQuotaExceeded();
    expect(backoff.maxForwardBuffer).toBe(5);
    backoff.onQuotaExceeded();
    expect(backoff.maxForwardBuffer).toBe(5);
  });

  it('allows two retries per append, then gives up', () => {
    const backoff = new QuotaBackoff(60);
    expect(backoff.onQuotaExceeded().retry).toBe(true);
    expect(backoff.onQuotaExceeded().retry).toBe(true);
    expect(backoff.onQuotaExceeded().retry).toBe(false);
    expect(backoff.onQuotaExceeded().retry).toBe(false);
  });

  it('reset restores the retry budget but keeps the shrunken window', () => {
    const backoff = new QuotaBackoff(60);
    backoff.onQuotaExceeded();
    backoff.onQuotaExceeded();
    backoff.onQuotaExceeded();
    expect(backoff.maxForwardBuffer).toBe(15);

    backoff.reset();
    expect(backoff.maxForwardBuffer).toBe(15);
    expect(backoff.onQuotaExceeded()).toEqual({ evictBehind: 10, retry: true });
  });
});
