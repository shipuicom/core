import { describe, expect, it } from 'vitest';
import { parseM3u8, HlsMediaPlaylist } from './m3u8-parser';
import { computeLiveInfo } from './live-tracker';

const BASE = 'https://live.example.com/ch1/media.m3u8';

function livePlaylist(mediaSequence: number, segmentCount: number): HlsMediaPlaylist {
  const lines = ['#EXTM3U', '#EXT-X-TARGETDURATION:4', `#EXT-X-MEDIA-SEQUENCE:${mediaSequence}`];
  for (let i = 0; i < segmentCount; i++) {
    lines.push('#EXTINF:4.0,', `seg${mediaSequence + i}.ts`);
  }
  return parseM3u8(lines.join('\n'), BASE) as HlsMediaPlaylist;
}

describe('computeLiveInfo', () => {
  // 10 segments x 4s => playlist-relative window [0, 40].
  const playlist = livePlaylist(100, 10);

  it('computes the DVR window from first segment start to last segment end', () => {
    const info = computeLiveInfo({ playlist, currentTime: 0 });
    expect(info.dvrWindow).toEqual({ start: 0, end: 40 });
  });

  it('places the live edge 3 target durations behind the window end by default', () => {
    const info = computeLiveInfo({ playlist, currentTime: 0 });
    expect(info.liveEdge).toBe(40 - 3 * 4);
  });

  it('honors a custom liveEdgeOffsetTargets', () => {
    const info = computeLiveInfo({ playlist, currentTime: 0, liveEdgeOffsetTargets: 1 });
    expect(info.liveEdge).toBe(36);
  });

  it('clamps the live edge to the window start on short playlists', () => {
    const short = livePlaylist(0, 2); // window [0, 8], edge would be -4
    const info = computeLiveInfo({ playlist: short, currentTime: 0 });
    expect(info.liveEdge).toBe(0);
  });

  it('reports latency as distance behind the live edge, floored at 0', () => {
    expect(computeLiveInfo({ playlist, currentTime: 10 }).latency).toBe(18);
    expect(computeLiveInfo({ playlist, currentTime: 35 }).latency).toBe(0);
  });

  it('is at the live edge within 1.5 target durations by default', () => {
    expect(computeLiveInfo({ playlist, currentTime: 22 }).atLiveEdge).toBe(true); // latency 6 = 1.5 * 4
    expect(computeLiveInfo({ playlist, currentTime: 21.9 }).atLiveEdge).toBe(false);
  });

  it('honors a custom atEdgeToleranceSeconds', () => {
    const info = computeLiveInfo({ playlist, currentTime: 27, atEdgeToleranceSeconds: 0.5 });
    expect(info.atLiveEdge).toBe(false);
    expect(computeLiveInfo({ playlist, currentTime: 27.6, atEdgeToleranceSeconds: 0.5 }).atLiveEdge).toBe(true);
  });

  it('shifts liveEdge and dvrWindow by startOffset for sliding-window playlists', () => {
    // Reload after the window slid by 2 segments: mediaSequence 102, segment
    // starts are again playlist-relative from 0, so the caller passes the
    // media time of the first remaining segment (8s) as startOffset.
    const slid = livePlaylist(102, 10);
    const info = computeLiveInfo({ playlist: slid, currentTime: 30, startOffset: 8 });

    expect(info.dvrWindow).toEqual({ start: 8, end: 48 });
    expect(info.liveEdge).toBe(36);
    expect(info.latency).toBe(6);
    expect(info.atLiveEdge).toBe(true);
  });
});
