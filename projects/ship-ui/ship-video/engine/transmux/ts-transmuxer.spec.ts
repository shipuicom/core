import { readFileSync } from 'fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { tsFixturePath } from './fixtures/fixture-path';
import { isTsSegmentUri, TsTransmuxer } from './ts-transmuxer';

const FIXTURE = new Uint8Array(readFileSync(tsFixturePath()));

type Box = { type: string; size: number; offset: number };

function walkBoxes(data: Uint8Array): Box[] {
  const boxes: Box[] = [];
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let offset = 0;
  while (offset + 8 <= data.byteLength) {
    const size = view.getUint32(offset);
    const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7]);
    boxes.push({ type, size, offset });
    if (size < 8) break;
    offset += size;
  }
  return boxes;
}

function findNested(data: Uint8Array, path: string[]): Uint8Array | null {
  let scope = data;
  for (const name of path) {
    const box = walkBoxes(scope).find((candidate) => candidate.type === name);
    if (!box) return null;
    scope = scope.subarray(box.offset + 8, box.offset + box.size);
  }
  return scope;
}

describe('TsTransmuxer (real wasm)', () => {
  let transmuxer: TsTransmuxer;

  beforeAll(async () => {
    transmuxer = await TsTransmuxer.create();
  });

  it('transmuxes the ffmpeg fixture into valid fMP4 structure', () => {
    transmuxer.reset();
    const result = transmuxer.transmux(FIXTURE);

    expect(result.videoCodec).toBe('avc1.42c01e');
    expect(result.audioCodec).toBe('mp4a.40.2');

    expect(result.init).not.toBeNull();
    const initBoxes = walkBoxes(result.init!).map((box) => box.type);
    expect(initBoxes).toEqual(['ftyp', 'moov']);

    // both traks + mvex present
    const moov = findNested(result.init!, ['moov'])!;
    const moovChildren = walkBoxes(moov).map((box) => box.type);
    expect(moovChildren).toEqual(['mvhd', 'trak', 'trak', 'mvex']);

    // video sample description carries avcC with SPS/PPS
    expect(findNested(result.init!, ['moov', 'trak', 'mdia', 'minf', 'stbl', 'stsd'])).not.toBeNull();

    // media payload: video moof/mdat followed by audio moof/mdat
    const mediaBoxes = walkBoxes(result.media).map((box) => box.type);
    expect(mediaBoxes).toEqual(['moof', 'mdat', 'moof', 'mdat']);
  });

  it('emits the init segment only once until reset', () => {
    transmuxer.reset();
    const first = transmuxer.transmux(FIXTURE);
    const second = transmuxer.transmux(FIXTURE);
    expect(first.init).not.toBeNull();
    expect(second.init).toBeNull();

    transmuxer.reset();
    const third = transmuxer.transmux(FIXTURE);
    expect(third.init).not.toBeNull();
  });

  it('extracts a plausible number of samples (2s @ 25fps ≈ 50 video frames)', () => {
    transmuxer.reset();
    const result = transmuxer.transmux(FIXTURE);

    // trun sample_count lives 8 bytes into the trun payload (version+flags, count)
    const videoTraf = findNested(result.media, ['moof', 'traf'])!;
    const trun = walkBoxes(videoTraf).find((box) => box.type === 'trun')!;
    const view = new DataView(videoTraf.buffer, videoTraf.byteOffset + trun.offset + 8);
    const sampleCount = view.getUint32(4);
    expect(sampleCount).toBeGreaterThanOrEqual(48);
    expect(sampleCount).toBeLessThanOrEqual(52);
  });

  it('throws a coded error on garbage input', () => {
    transmuxer.reset();
    expect(() => transmuxer.transmux(new Uint8Array(1024).fill(0xab))).toThrowError(/sync/i);
  });

  it('detects TS segment uris', () => {
    expect(isTsSegmentUri('https://cdn/seg-001.ts')).toBe(true);
    expect(isTsSegmentUri('https://cdn/seg-001.ts?token=x')).toBe(true);
    expect(isTsSegmentUri('https://cdn/seg-001.m4s')).toBe(false);
    expect(isTsSegmentUri('https://cdn/video.mp4')).toBe(false);
  });
});
