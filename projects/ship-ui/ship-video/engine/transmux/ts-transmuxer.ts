import { TRANSMUX_WASM_BASE64 } from './transmux-wasm';

export type TsTransmuxResult = {
  /** New init segment when the codec configuration (first segment / SPS change) appeared; `null` otherwise. */
  init: Uint8Array | null;
  /** moof/mdat payload for the segment. */
  media: Uint8Array;
  /** RFC 6381 codec strings, e.g. `avc1.42c01e` / `mp4a.40.2`; empty when the track is absent. */
  videoCodec: string;
  audioCodec: string;
};

export class TsTransmuxError extends Error {
  constructor(
    readonly code: number,
    message: string
  ) {
    super(message);
    this.name = 'TsTransmuxError';
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  [-1]: 'No MPEG-TS sync byte found',
  [-2]: 'Unsupported video codec in transport stream (only H.264 is supported)',
  [-3]: 'No supported streams found in transport stream',
  [-6]: 'Segment exceeds transmuxer limits',
  [-7]: 'Missing H.264 parameter sets (SPS/PPS)',
};

type TransmuxExports = {
  memory: WebAssembly.Memory;
  ts_alloc(len: number): number;
  ts_heap_reset(): void;
  ts_reset(): void;
  ts_transmux(ptr: number, len: number): number;
  ts_result_init_ptr(): number;
  ts_result_init_len(): number;
  ts_result_media_ptr(): number;
  ts_result_media_len(): number;
  ts_video_codec_ptr(): number;
  ts_video_codec_len(): number;
  ts_audio_codec_ptr(): number;
  ts_audio_codec_len(): number;
};

function decodeWasm(): Uint8Array<ArrayBuffer> {
  const binary = atob(TRANSMUX_WASM_BASE64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * MPEG-TS → fMP4 transmuxer (Zig compiled to wasm, ~10KB). One instance per
 * stream; feed segments in playback order, `reset()` on discontinuities.
 */
export class TsTransmuxer {
  #exports: TransmuxExports;
  #decoder = new TextDecoder();

  private constructor(exports: TransmuxExports) {
    this.#exports = exports;
  }

  static async create(): Promise<TsTransmuxer> {
    const { instance } = await WebAssembly.instantiate(decodeWasm(), {});
    return new TsTransmuxer(instance.exports as unknown as TransmuxExports);
  }

  /** Transmuxes one TS segment; throws `TsTransmuxError` on unsupported input. */
  transmux(segment: ArrayBuffer | Uint8Array): TsTransmuxResult {
    const wasm = this.#exports;
    const input = segment instanceof Uint8Array ? segment : new Uint8Array(segment);

    wasm.ts_heap_reset();
    const ptr = wasm.ts_alloc(input.byteLength);
    new Uint8Array(wasm.memory.buffer, ptr, input.byteLength).set(input);

    const code = wasm.ts_transmux(ptr, input.byteLength);
    if (code !== 0) {
      throw new TsTransmuxError(code, ERROR_MESSAGES[code] ?? `Transmux failed (${code})`);
    }

    // copy out — the bump heap is reset on the next call
    const initLen = wasm.ts_result_init_len();
    const init = initLen > 0 ? new Uint8Array(wasm.memory.buffer, wasm.ts_result_init_ptr(), initLen).slice() : null;
    const media = new Uint8Array(wasm.memory.buffer, wasm.ts_result_media_ptr(), wasm.ts_result_media_len()).slice();

    return {
      init,
      media,
      videoCodec: this.#readString(wasm.ts_video_codec_ptr(), wasm.ts_video_codec_len()),
      audioCodec: this.#readString(wasm.ts_audio_codec_ptr(), wasm.ts_audio_codec_len()),
    };
  }

  /** Clears codec context and timestamp continuity (EXT-X-DISCONTINUITY). */
  reset() {
    this.#exports.ts_reset();
  }

  #readString(ptr: number, len: number): string {
    if (len === 0) return '';
    return this.#decoder.decode(new Uint8Array(this.#exports.memory.buffer, ptr, len));
  }
}

/** `true` when the segment URI looks like an MPEG-TS segment. */
export function isTsSegmentUri(uri: string): boolean {
  return /\.(ts|m2ts|mts)(\?|#|$)/i.test(uri);
}
