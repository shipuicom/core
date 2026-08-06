import { SourceBufferLike } from './source-buffer-like';

type QueueOp = {
  run: () => void;
  /** `true` for append/remove, which settle on `updateend`/`error`; offset ops settle synchronously. */
  awaitsUpdateEnd: boolean;
  resolve: () => void;
  reject: (err: unknown) => void;
  /** Kept so `abortAndFlush` can attach a no-op catch before rejecting. */
  promise: Promise<void>;
};

function abortError(): Error {
  const err = new Error('SourceBufferQueue operation aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * Serializes all mutations of a `SourceBufferLike`. This is the only code in
 * the engine allowed to call `appendBuffer`/`remove`/`abort` — one operation
 * in flight at a time, the next starting only after `updateend`/`error`.
 */
export class SourceBufferQueue {
  #sb: SourceBufferLike;
  #queue: QueueOp[] = [];
  #inflight: QueueOp | null = null;
  #pumping = false;
  #destroyed = false;

  #onUpdateEnd = (): void => this.#settle(null);
  #onError = (): void => this.#settle(new Error('SourceBuffer error event'));

  constructor(sb: SourceBufferLike) {
    this.#sb = sb;
    sb.addEventListener('updateend', this.#onUpdateEnd);
    sb.addEventListener('error', this.#onError);
  }

  /** Queued + inflight op count. */
  get pending(): number {
    return this.#queue.length + (this.#inflight ? 1 : 0);
  }

  /**
   * Appends `data`; resolves on `updateend`. Rejects on the `error` event or a
   * synchronous throw (incl. `QuotaExceededError`, rejected with the original error).
   */
  append(data: BufferSource): Promise<void> {
    return this.#enqueue(() => this.#sb.appendBuffer(data), true);
  }

  /** Removes `[start, end)`; serialized like `append`. */
  remove(start: number, end: number): Promise<void> {
    return this.#enqueue(() => this.#sb.remove(start, end), true);
  }

  /** Queued op that sets `timestampOffset` once the buffer is not updating. */
  setTimestampOffset(value: number): Promise<void> {
    return this.#enqueue(() => {
      this.#sb.timestampOffset = value;
    }, false);
  }

  /**
   * Aborts the in-flight op (if any) and rejects every queued op with an
   * `AbortError`-named error. Rejections are pre-caught so nothing escapes as
   * an unhandled rejection when callers have already moved on.
   */
  abortAndFlush(): void {
    if (this.#sb.updating) {
      try {
        this.#sb.abort();
      } catch {
        // The buffer may already be detached; flushing still proceeds.
      }
    }
    const flushed = this.#inflight ? [this.#inflight, ...this.#queue] : [...this.#queue];
    this.#inflight = null;
    this.#queue.length = 0;
    const err = abortError();
    for (const op of flushed) {
      op.promise.catch(() => {});
      op.reject(err);
    }
  }

  /** `abortAndFlush` + listener removal; the queue rejects all ops afterwards. */
  destroy(): void {
    this.abortAndFlush();
    this.#sb.removeEventListener('updateend', this.#onUpdateEnd);
    this.#sb.removeEventListener('error', this.#onError);
    this.#destroyed = true;
  }

  #enqueue(run: () => void, awaitsUpdateEnd: boolean): Promise<void> {
    if (this.#destroyed) {
      return Promise.reject(abortError());
    }
    let resolve!: () => void;
    let reject!: (err: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    this.#queue.push({ run, awaitsUpdateEnd, resolve, reject, promise });
    this.#pump();
    return promise;
  }

  #pump(): void {
    if (this.#pumping) {
      return;
    }
    this.#pumping = true;
    try {
      while (!this.#inflight && this.#queue.length > 0) {
        const op = this.#queue.shift()!;
        this.#inflight = op;
        try {
          op.run();
        } catch (err) {
          this.#inflight = null;
          op.reject(err);
          continue;
        }
        if (this.#inflight !== op) {
          // `run()` settled synchronously (re-entrant event); keep pumping.
          continue;
        }
        if (!op.awaitsUpdateEnd) {
          this.#inflight = null;
          op.resolve();
        }
      }
    } finally {
      this.#pumping = false;
    }
  }

  #settle(err: Error | null): void {
    const op = this.#inflight;
    if (!op) {
      // Stray event after abortAndFlush — the op was already rejected.
      return;
    }
    this.#inflight = null;
    if (err) {
      op.reject(err);
    } else {
      op.resolve();
    }
    this.#pump();
  }
}
