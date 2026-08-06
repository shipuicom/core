import { describe, expect, it } from 'vitest';
import { SourceBufferQueue } from './source-buffer-queue';
import { MockSourceBuffer } from './mock-media-source';

function bytes(n: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(new ArrayBuffer(n));
}

async function flushMicrotasks(): Promise<void> {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('SourceBufferQueue', () => {
  it('serializes appends: the second only starts after the first updateend', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const p1 = q.append(bytes(3));
    const p2 = q.append(bytes(5));

    expect(sb.opLog).toEqual([{ op: 'append', byteLength: 3 }]);
    expect(q.pending).toBe(2);

    await p1;
    expect(sb.opLog).toEqual([
      { op: 'append', byteLength: 3 },
      { op: 'append', byteLength: 5 },
    ]);

    await p2;
    expect(q.pending).toBe(0);
  });

  it('preserves FIFO order across mixed appends and removes', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const ops = [q.append(bytes(1)), q.remove(0, 10), q.append(bytes(2))];
    await Promise.all(ops);

    expect(sb.opLog).toEqual([
      { op: 'append', byteLength: 1 },
      { op: 'remove', start: 0, end: 10 },
      { op: 'append', byteLength: 2 },
    ]);
  });

  it('waits while the buffer is updating instead of throwing InvalidStateError', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const p1 = q.append(bytes(1));
    expect(sb.updating).toBe(true);
    const p2 = q.append(bytes(2));
    expect(sb.opLog).toHaveLength(1);

    await expect(Promise.all([p1, p2])).resolves.toBeDefined();
    expect(sb.opLog).toHaveLength(2);
  });

  it('rejects a sync-throwing op with the original error and continues the queue', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);
    sb.armQuotaError(1);

    const p1 = q.append(bytes(1));
    const p2 = q.append(bytes(2));

    await expect(p1).rejects.toMatchObject({ name: 'QuotaExceededError' });
    await p2;
    expect(sb.opLog).toEqual([{ op: 'append', byteLength: 2 }]);
  });

  it('rejects on the error event and continues with the next op', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);
    sb.armErrorEvent(1);

    const p1 = q.append(bytes(1));
    const p2 = q.append(bytes(2));

    await expect(p1).rejects.toThrow('SourceBuffer error event');
    await p2;
    expect(sb.opLog).toHaveLength(2);
  });

  it('queues setTimestampOffset behind an in-flight append', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const p1 = q.append(bytes(1));
    const pOffset = q.setTimestampOffset(42);
    expect(sb.timestampOffset).toBe(0);

    await p1;
    await pOffset;
    expect(sb.timestampOffset).toBe(42);
  });

  it('resolves setTimestampOffset immediately when idle', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    await q.setTimestampOffset(7);
    expect(sb.timestampOffset).toBe(7);
    expect(q.pending).toBe(0);
  });

  it('abortAndFlush aborts the in-flight op and rejects everything queued', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const p1 = q.append(bytes(1));
    const p2 = q.append(bytes(2));
    const p3 = q.remove(0, 5);
    q.abortAndFlush();

    await expect(p1).rejects.toMatchObject({ name: 'AbortError' });
    await expect(p2).rejects.toMatchObject({ name: 'AbortError' });
    await expect(p3).rejects.toMatchObject({ name: 'AbortError' });
    expect(sb.opLog).toEqual([{ op: 'append', byteLength: 1 }, { op: 'abort' }]);
    expect(q.pending).toBe(0);
  });

  it('abortAndFlush does not call abort when nothing is updating', () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    q.abortAndFlush();
    expect(sb.opLog).toEqual([]);
  });

  it('keeps working after abortAndFlush and ignores stray updateend events', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    q.append(bytes(1)).catch(() => {});
    q.abortAndFlush();
    await flushMicrotasks();

    await q.append(bytes(9));
    expect(sb.opLog).toEqual([
      { op: 'append', byteLength: 1 },
      { op: 'abort' },
      { op: 'append', byteLength: 9 },
    ]);
  });

  it('counts pending as queued plus inflight', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);
    expect(q.pending).toBe(0);

    const p1 = q.append(bytes(1));
    const p2 = q.append(bytes(2));
    const p3 = q.append(bytes(3));
    expect(q.pending).toBe(3);

    await p1;
    expect(q.pending).toBe(2);
    await Promise.all([p2, p3]);
    expect(q.pending).toBe(0);
  });

  it('destroy flushes, removes listeners and rejects later ops', async () => {
    const sb = new MockSourceBuffer();
    const q = new SourceBufferQueue(sb);

    const p1 = q.append(bytes(1));
    q.destroy();

    await expect(p1).rejects.toMatchObject({ name: 'AbortError' });
    await expect(q.append(bytes(2))).rejects.toMatchObject({ name: 'AbortError' });
    expect(q.pending).toBe(0);
  });
});
