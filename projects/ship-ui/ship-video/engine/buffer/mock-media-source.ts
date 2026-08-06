import { SourceBufferLike, TimeRangesLike } from './source-buffer-like';

export type MockSourceBufferOp =
  | { op: 'append'; byteLength: number }
  | { op: 'remove'; start: number; end: number }
  | { op: 'abort' };

function namedError(name: string, message: string): Error {
  const err = new Error(message);
  err.name = name;
  return err;
}

/** Builds a `TimeRangesLike` from plain ranges (also handy for `MediaLike` doubles). */
export function toTimeRanges(ranges: Array<{ start: number; end: number }>): TimeRangesLike {
  return {
    length: ranges.length,
    start: (i: number): number => {
      if (i < 0 || i >= ranges.length) {
        throw namedError('IndexSizeError', `index ${i} out of range`);
      }
      return ranges[i].start;
    },
    end: (i: number): number => {
      if (i < 0 || i >= ranges.length) {
        throw namedError('IndexSizeError', `index ${i} out of range`);
      }
      return ranges[i].end;
    },
  };
}

/**
 * Test double for `SourceBufferLike`. Records an op log, fires `updateend`
 * asynchronously (queueMicrotask), and can be armed to throw
 * `QuotaExceededError` synchronously or fire the `error` event instead of
 * `updateend`. Runs anywhere — no MSE required.
 */
export class MockSourceBuffer implements SourceBufferLike {
  updating = false;
  buffered: TimeRangesLike = toTimeRanges([]);
  timestampOffset = 0;

  /** Every append/remove/abort in call order. */
  opLog: MockSourceBufferOp[] = [];

  #listeners: Record<'updateend' | 'error', Set<() => void>> = {
    updateend: new Set(),
    error: new Set(),
  };
  #quotaThrowsRemaining = 0;
  #errorEventsRemaining = 0;
  /** Bumped by `abort()` to cancel a scheduled `updateend`. */
  #generation = 0;

  /** Arm the next `n` appends to throw a `QuotaExceededError`-named error synchronously. */
  armQuotaError(n = 1): void {
    this.#quotaThrowsRemaining = n;
  }

  /** Arm the next `n` ops to fire `error` instead of `updateend`. */
  armErrorEvent(n = 1): void {
    this.#errorEventsRemaining = n;
  }

  setBuffered(ranges: Array<{ start: number; end: number }>): void {
    this.buffered = toTimeRanges(ranges);
  }

  appendBuffer(data: BufferSource): void {
    if (this.updating) {
      throw namedError('InvalidStateError', 'appendBuffer while updating');
    }
    if (this.#quotaThrowsRemaining > 0) {
      this.#quotaThrowsRemaining--;
      throw namedError('QuotaExceededError', 'mock quota exceeded');
    }
    this.opLog.push({ op: 'append', byteLength: data.byteLength });
    this.#beginOp();
  }

  remove(start: number, end: number): void {
    if (this.updating) {
      throw namedError('InvalidStateError', 'remove while updating');
    }
    this.opLog.push({ op: 'remove', start, end });
    this.#beginOp();
  }

  abort(): void {
    this.opLog.push({ op: 'abort' });
    this.#generation++;
    this.updating = false;
  }

  addEventListener(type: 'updateend' | 'error', fn: () => void): void {
    this.#listeners[type].add(fn);
  }

  removeEventListener(type: 'updateend' | 'error', fn: () => void): void {
    this.#listeners[type].delete(fn);
  }

  #beginOp(): void {
    this.updating = true;
    const generation = ++this.#generation;
    queueMicrotask(() => {
      if (generation !== this.#generation || !this.updating) {
        return;
      }
      this.updating = false;
      const type = this.#errorEventsRemaining > 0 ? 'error' : 'updateend';
      if (type === 'error') {
        this.#errorEventsRemaining--;
      }
      for (const fn of [...this.#listeners[type]]) {
        fn();
      }
    });
  }
}
