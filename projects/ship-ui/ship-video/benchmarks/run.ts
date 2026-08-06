/**
 * ship-video performance benchmark runner.
 *
 * Benchmarks the streaming engine's hot paths (playlist parsing, ABR
 * decisions, buffer bookkeeping, subtitle/storyboard parsing) plus the
 * component-level utilities, and reports the built entry-point size
 * (raw + gzip) from dist.
 *
 * Outputs results as JSON and CSV. Compares against a saved baseline
 * and flags regressions (>20% slower).
 *
 * Usage:
 *   bun projects/ship-ui/ship-video/benchmarks/run.ts            # run + compare
 *   bun projects/ship-ui/ship-video/benchmarks/run.ts --save     # run + save as new baseline
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { gzipSync } from 'zlib';

import { AbrController, selectLevel } from '../engine/abr/abr-controller';
import { BandwidthEstimator } from '../engine/abr/bandwidth-estimator';
import { Ewma } from '../engine/abr/ewma';
import { computeEviction } from '../engine/buffer/buffer-controller';
import { GapController } from '../engine/buffer/gap-controller';
import { MockSourceBuffer, toTimeRanges } from '../engine/buffer/mock-media-source';
import { forwardBufferLength } from '../engine/buffer/source-buffer-like';
import { SourceBufferQueue } from '../engine/buffer/source-buffer-queue';
import { computeLiveInfo } from '../engine/hls/live-tracker';
import { HlsMediaPlaylist, parseM3u8 } from '../engine/hls/m3u8-parser';
import { parseStoryboard } from '../engine/extras/storyboard';
import { parseWebVtt } from '../engine/tracks/webvtt-parser';
import { SHIP_VIDEO_DEFAULT_ABR } from '../engine/types';
import { TsTransmuxer } from '../engine/transmux/ts-transmuxer';
import { shipVideoFormatTime, shipVideoLevelsFromSources, shipVideoToSourceArray } from '../ship-video-types';

const _dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = resolve(_dirname, '../../../../dist/ship-ui/fesm2022');

interface BenchmarkResult {
  name: string;
  category: string;
  size: number;
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

interface BenchmarkReport {
  timestamp: string;
  runtime: string;
  results: BenchmarkResult[];
  bundle: Array<{ file: string; rawBytes: number; gzipBytes: number }>;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function generateMultivariant(variants: number): string {
  const lines = ['#EXTM3U'];
  for (let i = 0; i < variants; i++) {
    lines.push(
      `#EXT-X-MEDIA:TYPE=AUDIO,URI="a${i}.m3u8",GROUP-ID="aud",LANGUAGE="en",NAME="audio ${i}",DEFAULT=${i === 0 ? 'YES' : 'NO'},CHANNELS="2"`,
      `#EXT-X-STREAM-INF:BANDWIDTH=${500000 * (i + 1)},AVERAGE-BANDWIDTH=${400000 * (i + 1)},RESOLUTION=${640 + i * 128}x${360 + i * 72},CODECS="avc1.4d401f,mp4a.40.2",FRAME-RATE=29.970,AUDIO="aud"`,
      `v${i}.m3u8`
    );
  }
  return lines.join('\n');
}

function generateMediaPlaylist(segments: number, live: boolean): string {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    '#EXT-X-TARGETDURATION:4',
    `#EXT-X-MEDIA-SEQUENCE:${live ? 12345 : 0}`,
    '#EXT-X-MAP:URI="init.mp4"',
  ];
  for (let i = 0; i < segments; i++) {
    lines.push('#EXTINF:4.000,', `seg${i}.m4s`);
  }
  if (!live) lines.push('#EXT-X-ENDLIST');
  return lines.join('\n');
}

function generateVtt(cues: number): string {
  const lines = ['WEBVTT', ''];
  for (let i = 0; i < cues; i++) {
    const start = i * 4;
    lines.push(`${format(start)} --> ${format(start + 3.5)}`, `Cue line one for ${i}`, `and a second line ${i}`, '');
  }
  return lines.join('\n');

  function format(seconds: number): string {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = (seconds % 60).toFixed(3).padStart(6, '0');
    return `00:${m}:${s.length === 6 ? s : '0' + s}`;
  }
}

function generateStoryboardVtt(cues: number): string {
  const lines = ['WEBVTT', ''];
  for (let i = 0; i < cues; i++) {
    const start = i * 10;
    lines.push(
      `00:${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}.000 --> 00:${String(Math.floor((start + 10) / 60)).padStart(2, '0')}:${String((start + 10) % 60).padStart(2, '0')}.000`,
      `sprite${Math.floor(i / 25)}.jpg#xywh=${(i % 5) * 160},${Math.floor((i % 25) / 5) * 90},160,90`,
      ''
    );
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function bench(name: string, category: string, size: number, iterations: number, fn: () => void): BenchmarkResult {
  for (let i = 0; i < Math.min(iterations, 5); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const totalMs = performance.now() - start;

  return {
    name,
    category,
    size,
    iterations,
    totalMs: Math.round(totalMs * 1000) / 1000,
    avgMs: Math.round((totalMs / iterations) * 10000) / 10000,
    opsPerSec: Math.round(iterations / (totalMs / 1000)),
  };
}

async function benchAsync(
  name: string,
  category: string,
  size: number,
  iterations: number,
  fn: () => Promise<void>
): Promise<BenchmarkResult> {
  await fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) await fn();
  const totalMs = performance.now() - start;

  return {
    name,
    category,
    size,
    iterations,
    totalMs: Math.round(totalMs * 1000) / 1000,
    avgMs: Math.round((totalMs / iterations) * 10000) / 10000,
    opsPerSec: Math.round(iterations / (totalMs / 1000)),
  };
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

async function runAll(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const baseUrl = 'https://cdn.example/stream/master.m3u8';

  // --- HLS parsing ---------------------------------------------------------
  const multivariant = generateMultivariant(8);
  results.push(bench('parseM3u8 multivariant (8 variants)', 'hls-parse', 8, 5_000, () => parseM3u8(multivariant, baseUrl)));

  for (const segments of [100, 1_000, 5_000, 9_000]) {
    // 9000 × 4s = a 10-hour VOD
    const playlist = generateMediaPlaylist(segments, false);
    const label = segments === 9_000 ? 'parseM3u8 VOD 10h (9000 segments)' : `parseM3u8 VOD (${segments} segments)`;
    results.push(bench(label, 'hls-parse', segments, segments >= 5_000 ? 100 : 1_000, () => parseM3u8(playlist, baseUrl)));
  }

  const livePlaylistText = generateMediaPlaylist(1_800, true); // 2h DVR window
  const livePlaylist = parseM3u8(livePlaylistText, baseUrl) as HlsMediaPlaylist;
  results.push(bench('parseM3u8 live (1800 segments)', 'hls-parse', 1_800, 500, () => parseM3u8(livePlaylistText, baseUrl)));

  // --- live tracking -------------------------------------------------------
  results.push(
    bench('computeLiveInfo (1800-segment DVR)', 'live', 1_800, 100_000, () =>
      computeLiveInfo({ playlist: livePlaylist, currentTime: 3_000, startOffset: 120 })
    )
  );

  const tenHourLive = parseM3u8(generateMediaPlaylist(9_000, true), baseUrl) as HlsMediaPlaylist;
  results.push(
    bench('computeLiveInfo (10h DVR, 9000 segments)', 'live', 9_000, 100_000, () =>
      computeLiveInfo({ playlist: tenHourLive, currentTime: 30_000, startOffset: 0 })
    )
  );

  // --- ABR -----------------------------------------------------------------
  const bitrates = [400_000, 800_000, 1_600_000, 3_200_000, 6_400_000];
  results.push(
    bench('selectLevel decision', 'abr', bitrates.length, 1_000_000, () =>
      selectLevel({
        levelBitrates: bitrates,
        currentLevel: 2,
        bandwidthEstimate: 2_500_000,
        forwardBufferSeconds: 18,
        secondsSinceLastSwitch: 12,
        config: SHIP_VIDEO_DEFAULT_ABR,
      })
    )
  );

  results.push(
    bench('AbrController.nextLevel', 'abr', bitrates.length, 1_000_000, () => {
      const abr = benchAbr;
      abr.nextLevel(2_500_000, 18);
    })
  );

  results.push(
    bench('BandwidthEstimator sample+estimate', 'abr', 1, 1_000_000, () => {
      benchEstimator.sample(400, 1_000_000);
      benchEstimator.getEstimate();
    })
  );

  results.push(
    bench('Ewma sample', 'abr', 1, 1_000_000, () => {
      benchEwma.sample(0.4, 8_000_000);
    })
  );

  // --- buffer bookkeeping ----------------------------------------------------
  const ranges = [
    { start: 0, end: 120 },
    { start: 130, end: 400 },
  ];
  results.push(
    bench('computeEviction', 'buffer', 2, 1_000_000, () =>
      computeEviction({ buffered: ranges, currentTime: 300, backBufferLength: 30 })
    )
  );

  const timeRanges = toTimeRanges(ranges);
  results.push(bench('forwardBufferLength', 'buffer', 2, 1_000_000, () => forwardBufferLength(timeRanges, 200)));

  results.push(
    await benchAsync('SourceBufferQueue append cycle', 'buffer', 1, 20_000, async () => {
      await benchQueue.append(benchChunk);
    })
  );

  const gapVideo = { currentTime: 10, paused: false, seeking: false, readyState: 4, buffered: timeRanges };
  const gap = new GapController(gapVideo, {
    onStallStart() {},
    onStallRecovered() {},
    onNudge() {},
    onGiveUp() {},
  });
  let gapNow = 0;
  results.push(
    bench('GapController.tick', 'buffer', 1, 1_000_000, () => {
      gapVideo.currentTime += 0.02;
      gap.tick((gapNow += 20));
    })
  );

  // --- text tracks -----------------------------------------------------------
  const vtt1000 = generateVtt(1_000);
  results.push(bench('parseWebVtt (1000 cues)', 'tracks', 1_000, 500, () => parseWebVtt(vtt1000)));

  const storyboard500 = generateStoryboardVtt(500);
  results.push(bench('parseStoryboard (500 sprite cues)', 'tracks', 500, 500, () => parseStoryboard(storyboard500, baseUrl)));

  // --- TS transmuxer (Zig → wasm) --------------------------------------------
  const tsFixture = new Uint8Array(readFileSync(resolve(_dirname, '../engine/transmux/fixtures/sample-ts.bin')));
  const transmuxer = await TsTransmuxer.create();
  const fixtureSeconds = 2;
  const transmuxResult = bench(`ts_transmux (${(tsFixture.byteLength / 1024).toFixed(0)}KB, 2s segment)`, 'transmux', tsFixture.byteLength, 2_000, () => {
    transmuxer.transmux(tsFixture);
  });
  results.push(transmuxResult);
  console.log(`ts_transmux realtime factor: ~${Math.round(fixtureSeconds / (transmuxResult.avgMs / 1000))}x faster than playback`);

  // throughput on a big concatenated payload (~4K-bitrate segment sizes);
  // timeline is degenerate but the byte-processing cost is representative
  const bigChunks = 30;
  const big = new Uint8Array(tsFixture.byteLength * bigChunks);
  for (let i = 0; i < bigChunks; i++) big.set(tsFixture, i * tsFixture.byteLength);
  transmuxer.reset();
  const bigResult = bench(`ts_transmux throughput (${(big.byteLength / 1024 / 1024).toFixed(1)}MB payload)`, 'transmux', big.byteLength, 200, () => {
    transmuxer.transmux(big);
  });
  results.push(bigResult);
  console.log(`ts_transmux throughput: ~${(big.byteLength / 1024 / 1024 / (bigResult.avgMs / 1000)).toFixed(0)} MB/s`);

  // --- component utilities ----------------------------------------------------
  results.push(bench('shipVideoFormatTime', 'component', 1, 1_000_000, () => shipVideoFormatTime(4523.7)));

  const qualitySources = [
    { src: 'v-2160.mp4', height: 2160 },
    { src: 'v-1080.mp4', height: 1080 },
    { src: 'v-720.mp4', height: 720 },
    { src: 'v-360.mp4', height: 360 },
  ];
  results.push(bench('shipVideoLevelsFromSources', 'component', 4, 1_000_000, () => shipVideoLevelsFromSources(qualitySources)));
  results.push(bench('shipVideoToSourceArray', 'component', 1, 1_000_000, () => shipVideoToSourceArray('movie.mp4')));

  return results;
}

// long-lived instances for steady-state benches
const benchAbr = new AbrController(SHIP_VIDEO_DEFAULT_ABR, () => 0);
benchAbr.setLevels([400_000, 800_000, 1_600_000, 3_200_000, 6_400_000]);
const benchEstimator = new BandwidthEstimator();
const benchEwma = new Ewma(9);
const benchSourceBuffer = new MockSourceBuffer();
const benchQueue = new SourceBufferQueue(benchSourceBuffer);
const benchChunk = new Uint8Array(new ArrayBuffer(4096));

// ---------------------------------------------------------------------------
// Bundle size
// ---------------------------------------------------------------------------

function measureBundles(): BenchmarkReport['bundle'] {
  const files = [
    'ship-ui-core-ship-video.mjs', // player + controls + playlist (engine excluded)
    'ship-ui-core-ship-video-engine.mjs', // MSE/HLS engine, lazily loaded on .m3u8 sources
    'ship-ui-core-ship-video-engine-transmux.mjs', // Zig→wasm TS transmuxer, lazily loaded on .ts segments
    'ship-ui-core-ship-icon.mjs', // reference: a small entry point
    'ship-ui-core-ship-menu.mjs', // reference: a mid-size entry point
  ];

  const bundle: BenchmarkReport['bundle'] = [];
  for (const file of files) {
    const path = resolve(DIST_DIR, file);
    if (!existsSync(path)) continue;

    const raw = readFileSync(path);
    bundle.push({ file, rawBytes: raw.byteLength, gzipBytes: gzipSync(raw).byteLength });
  }
  return bundle;
}

// ---------------------------------------------------------------------------
// Reporting (mirrors ship-code/benchmarks/run.ts)
// ---------------------------------------------------------------------------

const BASELINE_PATH = resolve(_dirname, 'baseline.json');
const LATEST_JSON = resolve(_dirname, 'latest.json');
const LATEST_CSV = resolve(_dirname, 'latest.csv');
const REGRESSION_THRESHOLD = 1.2;

function toCsv(results: BenchmarkResult[]): string {
  const header = 'name,category,size,iterations,totalMs,avgMs,opsPerSec';
  const rows = results.map(
    (result) =>
      `"${result.name}",${result.category},${result.size},${result.iterations},${result.totalMs},${result.avgMs},${result.opsPerSec}`
  );
  return [header, ...rows].join('\n');
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const save = process.argv.includes('--save');

  console.log('Running ship-video benchmarks...\n');
  const results = await runAll();
  const bundle = measureBundles();

  const report: BenchmarkReport = {
    timestamp: new Date().toISOString(),
    runtime: typeof Bun !== 'undefined' ? `bun ${Bun.version}` : `node ${process.version}`,
    results,
    bundle,
  };

  writeFileSync(LATEST_JSON, JSON.stringify(report, null, 2));
  writeFileSync(LATEST_CSV, toCsv(results));

  const nameWidth = Math.max(...results.map((result) => result.name.length)) + 2;
  for (const result of results) {
    console.log(`${result.name.padEnd(nameWidth)} ${String(result.opsPerSec).padStart(12)} ops/s  avg ${result.avgMs} ms`);
  }

  console.log('\nBundle sizes (dist/ship-ui/fesm2022):');
  if (!bundle.length) {
    console.log('  dist not found — run `ng build ship-ui` first for size numbers.');
  }
  for (const entry of bundle) {
    console.log(`  ${entry.file.padEnd(36)} raw ${formatBytes(entry.rawBytes).padStart(9)}   gzip ${formatBytes(entry.gzipBytes).padStart(9)}`);
  }

  if (save) {
    writeFileSync(BASELINE_PATH, JSON.stringify(report, null, 2));
    console.log('\nBaseline saved.');
    return;
  }

  if (!existsSync(BASELINE_PATH)) {
    console.log('\nNo baseline found — run with --save to create one.');
    return;
  }

  const baseline: BenchmarkReport = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  const regressions: string[] = [];
  for (const result of results) {
    const base = baseline.results.find((candidate) => candidate.name === result.name);
    if (!base || base.avgMs <= 0) continue;
    // sub-microsecond benches flap on rounding — only meaningful timings gate
    if (base.avgMs < 0.001 && result.avgMs < 0.001) continue;
    if (result.avgMs > base.avgMs * REGRESSION_THRESHOLD) {
      regressions.push(`${result.name}: ${base.avgMs} ms → ${result.avgMs} ms (${((result.avgMs / base.avgMs - 1) * 100).toFixed(0)}% slower)`);
    }
  }

  if (regressions.length) {
    console.log('\nREGRESSIONS (>20% slower than baseline):');
    for (const line of regressions) console.log(`  ${line}`);
    process.exitCode = 1;
  } else {
    console.log('\nNo regressions vs baseline.');
  }
}

declare const Bun: { version: string } | undefined;

void main();
