/**
 * Framework-free M3U8 playlist parser for the ship-video streaming engine.
 * Handles both multivariant (master) and media playlists per RFC 8216,
 * tolerating LL-HLS tags (EXT-X-PART, EXT-X-PRELOAD-HINT, ...) without erroring.
 */

export type HlsRendition = {
  type: 'AUDIO' | 'SUBTITLES';
  groupId: string;
  name: string;
  lang?: string;
  uri?: string;
  isDefault: boolean;
  autoselect: boolean;
  forced: boolean;
  channels?: string;
};

export type HlsVariant = {
  uri: string;
  bandwidth: number;
  averageBandwidth?: number;
  width?: number;
  height?: number;
  codecs?: string;
  frameRate?: number;
  audioGroup?: string;
  subtitlesGroup?: string;
  name?: string;
};

export type HlsMultivariantPlaylist = {
  kind: 'multivariant';
  variants: HlsVariant[];
  renditions: HlsRendition[];
};

export type HlsByteRange = { offset: number; length: number };

export type HlsSegment = {
  uri: string;
  duration: number;
  sn: number;
  cc: number;
  start: number;
  byteRange?: HlsByteRange;
  keyMethod?: string;
};

export type HlsInitSegment = { uri: string; byteRange?: HlsByteRange };

export type HlsMediaPlaylist = {
  kind: 'media';
  targetDuration: number;
  mediaSequence: number;
  discontinuitySequence: number;
  live: boolean;
  playlistType?: 'VOD' | 'EVENT';
  segments: HlsSegment[];
  map: HlsInitSegment | null;
  totalDuration: number;
  partTargetDuration?: number;
  endList: boolean;
};

/**
 * Parses an HLS attribute list (`KEY=value,KEY2="quoted, value"`), preserving
 * commas inside quoted strings. Quoted values are returned without quotes.
 */
function parseAttributeList(input: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let i = 0;

  while (i < input.length) {
    const eq = input.indexOf('=', i);
    if (eq === -1) break;

    const key = input.slice(i, eq).trim();
    let value: string;
    const valueStart = eq + 1;

    if (input[valueStart] === '"') {
      const close = input.indexOf('"', valueStart + 1);
      if (close === -1) {
        value = input.slice(valueStart + 1);
        i = input.length;
      } else {
        value = input.slice(valueStart + 1, close);
        i = close + 1;
        if (input[i] === ',') i++;
      }
    } else {
      let comma = input.indexOf(',', valueStart);
      if (comma === -1) comma = input.length;
      value = input.slice(valueStart, comma).trim();
      i = comma + 1;
    }

    if (key) attrs[key] = value;
  }

  return attrs;
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? undefined : parsed;
}

function parseByteRangeValue(value: string, previousEnd: number | null): HlsByteRange | null {
  const [lengthPart, offsetPart] = value.split('@');
  const length = parseInt(lengthPart, 10);
  if (isNaN(length)) return null;

  if (offsetPart !== undefined) {
    const offset = parseInt(offsetPart, 10);
    return isNaN(offset) ? null : { offset, length };
  }

  if (previousEnd === null) return null;
  return { offset: previousEnd, length };
}

function resolveUri(uri: string, baseUrl: string): string {
  return new URL(uri, baseUrl).href;
}

function parseMultivariant(lines: string[], baseUrl: string): HlsMultivariantPlaylist {
  const variants: HlsVariant[] = [];
  const renditions: HlsRendition[] = [];
  let pendingStreamInf: Record<string, string> | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXT-X-STREAM-INF:')) {
      pendingStreamInf = parseAttributeList(line.slice('#EXT-X-STREAM-INF:'.length));
      continue;
    }

    if (line.startsWith('#EXT-X-MEDIA:')) {
      const attrs = parseAttributeList(line.slice('#EXT-X-MEDIA:'.length));
      const type = attrs['TYPE'];
      if (type !== 'AUDIO' && type !== 'SUBTITLES') continue;

      renditions.push({
        type,
        groupId: attrs['GROUP-ID'] ?? '',
        name: attrs['NAME'] ?? '',
        lang: attrs['LANGUAGE'],
        uri: attrs['URI'] !== undefined ? resolveUri(attrs['URI'], baseUrl) : undefined,
        isDefault: attrs['DEFAULT'] === 'YES',
        autoselect: attrs['AUTOSELECT'] === 'YES',
        forced: attrs['FORCED'] === 'YES',
        channels: attrs['CHANNELS'],
      });
      continue;
    }

    if (line.startsWith('#')) continue;

    if (pendingStreamInf) {
      const attrs = pendingStreamInf;
      pendingStreamInf = null;

      let width: number | undefined;
      let height: number | undefined;
      const resolution = attrs['RESOLUTION'];
      if (resolution) {
        const [w, h] = resolution.split('x');
        width = parseOptionalNumber(w);
        height = parseOptionalNumber(h);
      }

      variants.push({
        uri: resolveUri(line, baseUrl),
        bandwidth: parseOptionalNumber(attrs['BANDWIDTH']) ?? 0,
        averageBandwidth: parseOptionalNumber(attrs['AVERAGE-BANDWIDTH']),
        width,
        height,
        codecs: attrs['CODECS'],
        frameRate: parseOptionalNumber(attrs['FRAME-RATE']),
        audioGroup: attrs['AUDIO'],
        subtitlesGroup: attrs['SUBTITLES'],
        name: attrs['NAME'],
      });
    }
  }

  return { kind: 'multivariant', variants, renditions };
}

function parseMedia(lines: string[], baseUrl: string): HlsMediaPlaylist {
  const segments: HlsSegment[] = [];
  let targetDuration = 0;
  let mediaSequence = 0;
  let discontinuitySequence = 0;
  let playlistType: 'VOD' | 'EVENT' | undefined;
  let map: HlsInitSegment | null = null;
  let partTargetDuration: number | undefined;
  let endList = false;

  let cc = 0;
  let start = 0;
  let pendingDuration: number | null = null;
  let pendingByteRange: HlsByteRange | null = null;
  let lastByteRangeEnd: number | null = null;
  let keyMethod: string | undefined;

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const value = line.slice('#EXTINF:'.length);
      const comma = value.indexOf(',');
      pendingDuration = parseFloat(comma === -1 ? value : value.slice(0, comma));
      continue;
    }

    if (line.startsWith('#EXT-X-TARGETDURATION:')) {
      targetDuration = parseFloat(line.slice('#EXT-X-TARGETDURATION:'.length)) || 0;
      continue;
    }

    if (line.startsWith('#EXT-X-MEDIA-SEQUENCE:')) {
      mediaSequence = parseInt(line.slice('#EXT-X-MEDIA-SEQUENCE:'.length), 10) || 0;
      continue;
    }

    if (line.startsWith('#EXT-X-DISCONTINUITY-SEQUENCE:')) {
      discontinuitySequence = parseInt(line.slice('#EXT-X-DISCONTINUITY-SEQUENCE:'.length), 10) || 0;
      cc = discontinuitySequence;
      continue;
    }

    if (line === '#EXT-X-DISCONTINUITY') {
      cc++;
      continue;
    }

    if (line === '#EXT-X-ENDLIST') {
      endList = true;
      continue;
    }

    if (line.startsWith('#EXT-X-PLAYLIST-TYPE:')) {
      const value = line.slice('#EXT-X-PLAYLIST-TYPE:'.length).trim();
      if (value === 'VOD' || value === 'EVENT') playlistType = value;
      continue;
    }

    if (line.startsWith('#EXT-X-MAP:')) {
      const attrs = parseAttributeList(line.slice('#EXT-X-MAP:'.length));
      const uri = attrs['URI'];
      if (uri !== undefined) {
        const byteRange = attrs['BYTERANGE'] !== undefined
          ? parseByteRangeValue(attrs['BYTERANGE'], 0) ?? undefined
          : undefined;
        map = { uri: resolveUri(uri, baseUrl), byteRange };
      }
      continue;
    }

    if (line.startsWith('#EXT-X-BYTERANGE:')) {
      pendingByteRange = parseByteRangeValue(line.slice('#EXT-X-BYTERANGE:'.length), lastByteRangeEnd);
      continue;
    }

    if (line.startsWith('#EXT-X-KEY:')) {
      const attrs = parseAttributeList(line.slice('#EXT-X-KEY:'.length));
      const method = attrs['METHOD'];
      keyMethod = method === undefined || method === 'NONE' ? undefined : method;
      continue;
    }

    if (line.startsWith('#EXT-X-PART-INF:')) {
      const attrs = parseAttributeList(line.slice('#EXT-X-PART-INF:'.length));
      partTargetDuration = parseOptionalNumber(attrs['PART-TARGET']);
      continue;
    }

    // LL-HLS and informational tags tolerated without effect.
    if (line.startsWith('#')) continue;

    if (pendingDuration === null) continue;

    const byteRange = pendingByteRange ?? undefined;
    if (byteRange) lastByteRangeEnd = byteRange.offset + byteRange.length;

    segments.push({
      uri: resolveUri(line, baseUrl),
      duration: pendingDuration,
      sn: mediaSequence + segments.length,
      cc,
      start,
      byteRange,
      keyMethod,
    });

    start += pendingDuration;
    pendingDuration = null;
    pendingByteRange = null;
  }

  return {
    kind: 'media',
    targetDuration,
    mediaSequence,
    discontinuitySequence,
    live: !endList,
    playlistType,
    segments,
    map,
    totalDuration: start,
    partTargetDuration,
    endList,
  };
}

/**
 * Parses an M3U8 playlist. Returns a multivariant playlist when
 * EXT-X-STREAM-INF is present, a media playlist otherwise. All URIs are
 * resolved absolute against `baseUrl`. Throws on a missing #EXTM3U header.
 */
export function parseM3u8(text: string, baseUrl: string): HlsMultivariantPlaylist | HlsMediaPlaylist {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines[0] !== '#EXTM3U') {
    throw new Error('parseM3u8: not an M3U8 playlist (missing #EXTM3U header)');
  }

  const isMultivariant = lines.some((line) => line.startsWith('#EXT-X-STREAM-INF:'));
  return isMultivariant ? parseMultivariant(lines, baseUrl) : parseMedia(lines, baseUrl);
}
