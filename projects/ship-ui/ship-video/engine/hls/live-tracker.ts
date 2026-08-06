import type { HlsMediaPlaylist } from './m3u8-parser';

export type LiveInfo = {
  liveEdge: number;
  dvrWindow: { start: number; end: number };
  latency: number;
  atLiveEdge: boolean;
};

/**
 * Computes live-edge, DVR window and latency for a live media playlist.
 *
 * Segment `start` values from `parseM3u8` are playlist-relative (cumulative
 * from 0 within one parse). When the sliding window advances, pass
 * `startOffset` — the media time of the playlist's first segment — so
 * `liveEdge` and `dvrWindow` land on the media timeline `currentTime` uses.
 *
 * - `dvrWindow` spans first segment start to last segment end (+ offset).
 * - `liveEdge` sits `liveEdgeOffsetTargets` (default 3) target durations
 *   behind the window end, clamped to the window start.
 * - `atLiveEdge` when latency <= `atEdgeToleranceSeconds` (default 1.5 target
 *   durations).
 */
export function computeLiveInfo(args: {
  playlist: HlsMediaPlaylist;
  currentTime: number;
  liveEdgeOffsetTargets?: number;
  atEdgeToleranceSeconds?: number;
  startOffset?: number;
}): LiveInfo {
  const { playlist, currentTime } = args;
  const startOffset = args.startOffset ?? 0;
  const offsetTargets = args.liveEdgeOffsetTargets ?? 3;
  const tolerance = args.atEdgeToleranceSeconds ?? 1.5 * playlist.targetDuration;

  const segments = playlist.segments;
  const first = segments[0];
  const last = segments[segments.length - 1];

  const windowStart = startOffset + (first ? first.start : 0);
  const windowEnd = startOffset + (last ? last.start + last.duration : 0);

  const liveEdge = Math.max(windowStart, windowEnd - offsetTargets * playlist.targetDuration);
  const latency = Math.max(0, liveEdge - currentTime);

  return {
    liveEdge,
    dvrWindow: { start: windowStart, end: windowEnd },
    latency,
    atLiveEdge: latency <= tolerance,
  };
}
