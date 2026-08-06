import { describe, expect, it } from 'vitest';
import { parseM3u8, HlsMediaPlaylist, HlsMultivariantPlaylist } from './m3u8-parser';

const BASE = 'https://cdn.example.com/video/main.m3u8';

const MULTIVARIANT = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="English",LANGUAGE="en",DEFAULT=YES,AUTOSELECT=YES,CHANNELS="2",URI="audio/en/main.m3u8"
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Dansk",LANGUAGE="da",DEFAULT=NO,AUTOSELECT=YES,CHANNELS="2",URI="audio/da/main.m3u8"
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",LANGUAGE="en",DEFAULT=NO,AUTOSELECT=YES,FORCED=NO,URI="subs/en/main.m3u8"
#EXT-X-MEDIA:TYPE=CLOSED-CAPTIONS,GROUP-ID="cc",NAME="CC1",INSTREAM-ID="CC1"
#EXT-X-STREAM-INF:BANDWIDTH=1500000,AVERAGE-BANDWIDTH=1200000,RESOLUTION=640x360,CODECS="avc1.4d401e,mp4a.40.2",FRAME-RATE=25.000,AUDIO="aud",SUBTITLES="subs",NAME="360p"
360/main.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=4000000,AVERAGE-BANDWIDTH=3500000,RESOLUTION=1280x720,CODECS="avc1.4d401f,mp4a.40.2",FRAME-RATE=50.000,AUDIO="aud",SUBTITLES="subs",NAME="720p"
720/main.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2",AUDIO="aud",SUBTITLES="subs"
https://other-cdn.example.com/1080/main.m3u8
`;

const VOD_MEDIA = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-TARGETDURATION:6
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-MAP:URI="init.mp4",BYTERANGE="720@0"
#EXT-X-KEY:METHOD=AES-128,URI="https://keys.example.com/k1",IV=0x1234
#EXTINF:6.006,
#EXT-X-BYTERANGE:100000@720
seg.mp4
#EXTINF:6.006,segment two
#EXT-X-BYTERANGE:120000
seg.mp4
#EXT-X-DISCONTINUITY
#EXT-X-KEY:METHOD=NONE
#EXTINF:4.5,
#EXT-X-BYTERANGE:80000@500000
seg.mp4
#EXT-X-ENDLIST
`;

const LIVE_MEDIA = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-TARGETDURATION:4
#EXT-X-MEDIA-SEQUENCE:120
#EXT-X-DISCONTINUITY-SEQUENCE:3
#EXT-X-PROGRAM-DATE-TIME:2026-08-06T10:00:00.000Z
#EXTINF:4.0,
seg120.ts
#EXTINF:4.0,
seg121.ts
#EXT-X-DISCONTINUITY
#EXTINF:4.0,
seg122.ts
`;

const LL_HLS_MEDIA = `#EXTM3U
#EXT-X-VERSION:9
#EXT-X-TARGETDURATION:4
#EXT-X-SERVER-CONTROL:CAN-BLOCK-RELOAD=YES,PART-HOLD-BACK=1.002
#EXT-X-PART-INF:PART-TARGET=0.334
#EXT-X-MEDIA-SEQUENCE:266
#EXTINF:4.0,
fileSequence266.mp4
#EXT-X-PART:DURATION=0.334,URI="filePart267.0.mp4"
#EXT-X-PART:DURATION=0.334,URI="filePart267.1.mp4",INDEPENDENT=YES
#EXTINF:4.0,
fileSequence267.mp4
#EXT-X-PRELOAD-HINT:TYPE=PART,URI="filePart268.0.mp4"
`;

describe('parseM3u8', () => {
  it('throws a clear error when #EXTM3U is missing', () => {
    expect(() => parseM3u8('#EXT-X-TARGETDURATION:6\nseg.ts', BASE)).toThrowError(/#EXTM3U/);
  });

  describe('multivariant playlists', () => {
    const playlist = parseM3u8(MULTIVARIANT, BASE) as HlsMultivariantPlaylist;

    it('detects multivariant kind from EXT-X-STREAM-INF', () => {
      expect(playlist.kind).toBe('multivariant');
      expect(playlist.variants).toHaveLength(3);
    });

    it('parses variant attributes including quoted codecs with commas', () => {
      const [v360, v720, v1080] = playlist.variants;

      expect(v360).toEqual({
        uri: 'https://cdn.example.com/video/360/main.m3u8',
        bandwidth: 1500000,
        averageBandwidth: 1200000,
        width: 640,
        height: 360,
        codecs: 'avc1.4d401e,mp4a.40.2',
        frameRate: 25,
        audioGroup: 'aud',
        subtitlesGroup: 'subs',
        name: '360p',
      });
      expect(v720.bandwidth).toBe(4000000);
      expect(v720.height).toBe(720);
      expect(v720.frameRate).toBe(50);
      expect(v1080.averageBandwidth).toBeUndefined();
      expect(v1080.name).toBeUndefined();
    });

    it('resolves relative and keeps absolute variant URIs', () => {
      expect(playlist.variants[1].uri).toBe('https://cdn.example.com/video/720/main.m3u8');
      expect(playlist.variants[2].uri).toBe('https://other-cdn.example.com/1080/main.m3u8');
    });

    it('parses AUDIO and SUBTITLES renditions and ignores CLOSED-CAPTIONS', () => {
      expect(playlist.renditions).toHaveLength(3);

      const [en, da, subs] = playlist.renditions;
      expect(en).toEqual({
        type: 'AUDIO',
        groupId: 'aud',
        name: 'English',
        lang: 'en',
        uri: 'https://cdn.example.com/video/audio/en/main.m3u8',
        isDefault: true,
        autoselect: true,
        forced: false,
        channels: '2',
      });
      expect(da.isDefault).toBe(false);
      expect(subs.type).toBe('SUBTITLES');
      expect(subs.uri).toBe('https://cdn.example.com/video/subs/en/main.m3u8');
    });
  });

  describe('VOD media playlists', () => {
    const playlist = parseM3u8(VOD_MEDIA, BASE) as HlsMediaPlaylist;

    it('parses header tags', () => {
      expect(playlist.kind).toBe('media');
      expect(playlist.targetDuration).toBe(6);
      expect(playlist.playlistType).toBe('VOD');
      expect(playlist.mediaSequence).toBe(0);
      expect(playlist.endList).toBe(true);
      expect(playlist.live).toBe(false);
    });

    it('parses EXT-X-MAP with byterange', () => {
      expect(playlist.map).toEqual({
        uri: 'https://cdn.example.com/video/init.mp4',
        byteRange: { offset: 0, length: 720 },
      });
    });

    it('parses segments with durations, cumulative starts and totalDuration', () => {
      expect(playlist.segments).toHaveLength(3);
      expect(playlist.segments.map((s) => s.duration)).toEqual([6.006, 6.006, 4.5]);
      expect(playlist.segments.map((s) => s.start)).toEqual([0, 6.006, 12.012]);
      expect(playlist.totalDuration).toBeCloseTo(16.512, 6);
      expect(playlist.segments.map((s) => s.sn)).toEqual([0, 1, 2]);
    });

    it('continues an offset-less EXT-X-BYTERANGE from the previous range', () => {
      expect(playlist.segments[0].byteRange).toEqual({ offset: 720, length: 100000 });
      expect(playlist.segments[1].byteRange).toEqual({ offset: 100720, length: 120000 });
      expect(playlist.segments[2].byteRange).toEqual({ offset: 500000, length: 80000 });
    });

    it('increments cc on EXT-X-DISCONTINUITY', () => {
      expect(playlist.segments.map((s) => s.cc)).toEqual([0, 0, 1]);
    });

    it('applies the key METHOD to following segments and clears it on NONE', () => {
      expect(playlist.segments[0].keyMethod).toBe('AES-128');
      expect(playlist.segments[1].keyMethod).toBe('AES-128');
      expect(playlist.segments[2].keyMethod).toBeUndefined();
    });
  });

  describe('live media playlists', () => {
    const playlist = parseM3u8(LIVE_MEDIA, BASE) as HlsMediaPlaylist;

    it('is live when EXT-X-ENDLIST is absent', () => {
      expect(playlist.live).toBe(true);
      expect(playlist.endList).toBe(false);
      expect(playlist.playlistType).toBeUndefined();
    });

    it('numbers segments from EXT-X-MEDIA-SEQUENCE', () => {
      expect(playlist.mediaSequence).toBe(120);
      expect(playlist.segments.map((s) => s.sn)).toEqual([120, 121, 122]);
    });

    it('starts cc at EXT-X-DISCONTINUITY-SEQUENCE', () => {
      expect(playlist.discontinuitySequence).toBe(3);
      expect(playlist.segments.map((s) => s.cc)).toEqual([3, 3, 4]);
    });
  });

  describe('LL-HLS tolerance', () => {
    const playlist = parseM3u8(LL_HLS_MEDIA, BASE) as HlsMediaPlaylist;

    it('records partTargetDuration from EXT-X-PART-INF', () => {
      expect(playlist.partTargetDuration).toBe(0.334);
    });

    it('ignores EXT-X-PART and EXT-X-PRELOAD-HINT lines without erroring', () => {
      expect(playlist.segments).toHaveLength(2);
      expect(playlist.segments.map((s) => s.sn)).toEqual([266, 267]);
      expect(playlist.segments[0].uri).toBe('https://cdn.example.com/video/fileSequence266.mp4');
    });
  });

  it('keeps commas inside quoted attribute values', () => {
    const text = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Commentary, Director",LANGUAGE="en",DEFAULT=NO,AUTOSELECT=NO,URI="commentary.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1000000,CODECS="avc1.4d401e,mp4a.40.2",AUDIO="aud"
low.m3u8
`;
    const playlist = parseM3u8(text, BASE) as HlsMultivariantPlaylist;
    expect(playlist.renditions[0].name).toBe('Commentary, Director');
    expect(playlist.variants[0].codecs).toBe('avc1.4d401e,mp4a.40.2');
  });
});
