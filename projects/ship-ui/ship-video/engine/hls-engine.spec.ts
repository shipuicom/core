import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { MockSourceBuffer, toTimeRanges } from './buffer/mock-media-source';
import { createShipVideoEngine } from './engine';
import { HlsEngine } from './hls-engine';

const MULTIVARIANT = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,CODECS="avc1.42E01E,mp4a.40.2"
low.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2400000,RESOLUTION=1280x720,CODECS="avc1.4D401F,mp4a.40.2"
high.m3u8
`;

const VOD_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="init.mp4"
#EXTINF:4.0,
seg0.m4s
#EXTINF:4.0,
seg1.m4s
#EXTINF:2.0,
seg2.m4s
#EXT-X-ENDLIST
`;

class FakeMediaSource {
  static isTypeSupported = () => true;

  readyState: 'closed' | 'open' = 'closed';
  sourceBuffer: MockSourceBuffer | null = null;
  mimes: string[] = [];
  endOfStreamCalls = 0;
  duration = 0;
  #sourceOpen: (() => void) | null = null;

  addEventListener(type: string, listener: () => void) {
    if (type === 'sourceopen') this.#sourceOpen = listener;
  }

  removeEventListener() {}

  addSourceBuffer(mime: string) {
    this.mimes.push(mime);
    this.sourceBuffer = new MockSourceBuffer();
    return this.sourceBuffer as unknown as SourceBuffer;
  }

  endOfStream() {
    this.endOfStreamCalls++;
  }

  triggerSourceOpen() {
    this.readyState = 'open';
    this.#sourceOpen?.();
  }
}

function fakeVideo() {
  const listeners = new Map<string, Set<(event?: unknown) => void>>();
  const video = {
    currentTime: 0,
    paused: true,
    seeking: false,
    readyState: 4,
    buffered: toTimeRanges([]),
    seekable: toTimeRanges([]),
    src: '',
    addEventListener(type: string, listener: (event?: unknown) => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(listener);
    },
    removeEventListener(type: string, listener: (event?: unknown) => void) {
      listeners.get(type)?.delete(listener);
    },
    removeAttribute() {},
    dispatch(type: string) {
      listeners.get(type)?.forEach((listener) => listener());
    },
  };
  return video as unknown as HTMLVideoElement & { dispatch(type: string): void };
}

function mockFetch(routes: Record<string, string | Uint8Array>): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((candidate) => url.endsWith(candidate));
    if (!key) return new Response(null, { status: 404 });

    // fake network latency: long enough that three segment samples clear the
    // estimator's minimum duration and total-weight guards
    await new Promise((resolve) => setTimeout(resolve, 250));

    const body = routes[key];
    return new Response(typeof body === 'string' ? body : new Uint8Array(body).buffer);
  }) as unknown as typeof fetch;
}

describe('HlsEngine (mocked MSE smoke)', () => {
  let mediaSource: FakeMediaSource;

  beforeEach(() => {
    vi.useFakeTimers();
    mediaSource = new FakeMediaSource();
    vi.stubGlobal('MediaSource', function () {
      return mediaSource;
    });
    (globalThis.MediaSource as unknown as { isTypeSupported: () => boolean }).isTypeSupported = () => true;
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = () => 'blob:mock';
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = () => {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
    delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
  });

  async function playVod() {
    const fetchFn = mockFetch({
      'master.m3u8': MULTIVARIANT,
      'low.m3u8': VOD_PLAYLIST,
      'high.m3u8': VOD_PLAYLIST,
      'init.mp4': new Uint8Array(24000).fill(1),
      'seg0.m4s': new Uint8Array(40000).fill(2),
      'seg1.m4s': new Uint8Array(40000).fill(3),
      'seg2.m4s': new Uint8Array(40000).fill(4),
    });

    const engine = new HlsEngine({ fetchFn });
    const video = fakeVideo();
    engine.load(video, 'https://cdn.test/master.m3u8');
    mediaSource.triggerSourceOpen();

    // manifest + level playlist fetch, then tick-driven segment loop
    await vi.advanceTimersByTimeAsync(600);
    for (let index = 0; index < 14; index++) {
      await vi.advanceTimersByTimeAsync(250);
    }

    return { engine, video };
  }

  it('parses the ladder, starts at the lowest level and appends init + segments in order', async () => {
    const { engine } = await playVod();
    const state = engine.getState();

    expect(state.levels.map((level) => level.label)).toEqual(['360p', '720p']);
    expect(state.currentLevel).toBe(0);

    const appends = mediaSource.sourceBuffer!.opLog.filter((op) => op.op === 'append');
    // init + 3 media segments
    expect(appends.length).toBe(4);
    engine.destroy();
  });

  it('signals end of stream after the last VOD segment', async () => {
    const { engine } = await playVod();

    expect(mediaSource.endOfStreamCalls).toBe(1);
    engine.destroy();
  });

  it('reports bandwidth once segments are measured', async () => {
    const { engine } = await playVod();

    expect(engine.getState().bandwidthEstimate).toBeGreaterThan(0);
    engine.destroy();
  });

  it('fails fatally with drm-unsupported on encrypted playlists', async () => {
    const encrypted = VOD_PLAYLIST.replace('#EXT-X-MAP', '#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n#EXT-X-MAP');
    const fetchFn = mockFetch({ 'master.m3u8': MULTIVARIANT, 'low.m3u8': encrypted, 'high.m3u8': encrypted });

    const engine = new HlsEngine({ fetchFn });
    const errors: string[] = [];
    engine.on((event) => {
      if (event.type === 'error') errors.push(event.error.code);
    });

    engine.load(fakeVideo(), 'https://cdn.test/master.m3u8');
    mediaSource.triggerSourceOpen();
    await vi.advanceTimersByTimeAsync(1000);

    expect(errors).toContain('drm-unsupported');
    engine.destroy();
  });
});

describe('HlsEngine TS transmux mode (real wasm)', () => {
  let mediaSource: FakeMediaSource;

  // vitest's module runner can't load modules while timers are faked —
  // pre-warm the lazy transmux entry so the engine's import hits the cache
  beforeAll(async () => {
    await import('@ship-ui/core/ship-video/engine/transmux');
  });

  beforeEach(() => {
    // leave setImmediate/queueMicrotask real so WebAssembly.instantiate resolves
    vi.useFakeTimers({ toFake: ['setTimeout', 'setInterval'] });
    mediaSource = new FakeMediaSource();
    vi.stubGlobal('MediaSource', function () {
      return mediaSource;
    });
    (globalThis.MediaSource as unknown as { isTypeSupported: () => boolean }).isTypeSupported = () => true;
    (URL as unknown as Record<string, unknown>)['createObjectURL'] = () => 'blob:mock';
    (URL as unknown as Record<string, unknown>)['revokeObjectURL'] = () => {};
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (URL as unknown as Record<string, unknown>)['createObjectURL'];
    delete (URL as unknown as Record<string, unknown>)['revokeObjectURL'];
  });

  it('detects .ts segments, transmuxes and appends muxed fMP4', async () => {
    const { readFileSync } = await import('fs');
    const { tsFixturePath } = await import('./transmux/fixtures/fixture-path');
    const fixture = new Uint8Array(readFileSync(tsFixturePath()));

    const TS_PLAYLIST = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:3
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:VOD
#EXTINF:2.0,
seg0.ts
#EXT-X-ENDLIST
`;

    const fetchFn = mockFetch({ 'media.m3u8': TS_PLAYLIST, 'seg0.ts': fixture });
    const engine = new HlsEngine({ fetchFn });
    const errors: string[] = [];
    engine.on((event) => {
      if (event.type === 'error') errors.push(`${event.error.code}: ${event.error.detail}`);
    });
    const video = fakeVideo();
    engine.load(video, 'https://cdn.test/media.m3u8');
    mediaSource.triggerSourceOpen();

    // interleave fake-timer advances with real macrotasks so wasm
    // instantiation and fetch bodies can settle
    for (let index = 0; index < 20; index++) {
      await vi.advanceTimersByTimeAsync(250);
      await new Promise((resolve) => setImmediate(resolve));
    }

    expect(errors).toEqual([]);
    expect(mediaSource.mimes).toEqual(['video/mp4; codecs="avc1.42c01e,mp4a.40.2"']);

    const appends = mediaSource.sourceBuffer!.opLog.filter((op) => op.op === 'append');
    // init segment + muxed moof/mdat payload
    expect(appends.length).toBe(2);
    expect(mediaSource.endOfStreamCalls).toBe(1);
    engine.destroy();
  });
});

describe('createShipVideoEngine', () => {
  it('returns a progressive engine for non-HLS sources', () => {
    const engine = createShipVideoEngine('movie.mp4');
    expect(engine?.getState().kind).toBe('progressive');
  });

  it('returns the MSE engine for m3u8 when MediaSource exists', () => {
    vi.stubGlobal('MediaSource', class {
      static isTypeSupported = () => true;
    });
    const engine = createShipVideoEngine('stream.m3u8');
    expect(engine?.getState().kind).toBe('mse-hls');
    vi.unstubAllGlobals();
  });

  it('falls back to native HLS without MediaSource', () => {
    const engine = createShipVideoEngine('stream.m3u8');
    expect(engine?.getState().kind).toBe('native-hls');
  });
});
