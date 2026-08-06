/**
 * Framework-free WebVTT parser for the ship-video streaming engine.
 * Supports cue ids, cue settings, NOTE blocks and the X-TIMESTAMP-MAP header
 * used by HLS-carried subtitles.
 */

export type VttCue = {
  start: number;
  end: number;
  text: string;
  settings?: string;
  id?: string;
};

const TIMESTAMP_RE = /^(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})$/;

function parseTimestamp(value: string): number | null {
  const match = TIMESTAMP_RE.exec(value.trim());
  if (!match) return null;

  const hours = match[1] !== undefined ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const millis = parseInt(match[4], 10);

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Extracts the cue offset from an X-TIMESTAMP-MAP header value
 * (`MPEGTS:<90kHz ticks>,LOCAL:<timestamp>`): MPEGTS/90000 − LOCAL seconds.
 */
function parseTimestampMap(value: string): number {
  let mpegts = 0;
  let local = 0;

  for (const part of value.split(',')) {
    const [key, ...rest] = part.split(':');
    const raw = rest.join(':').trim();
    if (key.trim() === 'MPEGTS') {
      mpegts = parseFloat(raw) || 0;
    } else if (key.trim() === 'LOCAL') {
      local = parseTimestamp(raw) ?? 0;
    }
  }

  return mpegts / 90000 - local;
}

/**
 * Parses a WebVTT document into cues, in document order. Throws when the
 * WEBVTT header is missing. `timestampOffset` is added to every cue's start
 * and end, on top of any X-TIMESTAMP-MAP offset in the document.
 */
export function parseWebVtt(text: string, timestampOffset = 0): VttCue[] {
  const lines = text.split(/\r?\n/);
  const header = lines[0]?.trim() ?? '';

  if (header !== 'WEBVTT' && !header.startsWith('WEBVTT ') && !header.startsWith('WEBVTT\t')) {
    throw new Error('parseWebVtt: not a WebVTT document (missing WEBVTT header)');
  }

  let offset = timestampOffset;
  const cues: VttCue[] = [];
  let i = 1;

  // Header block: metadata lines (incl. X-TIMESTAMP-MAP) until the first blank line.
  while (i < lines.length && lines[i].trim() !== '') {
    const line = lines[i].trim();
    if (line.startsWith('X-TIMESTAMP-MAP=')) {
      offset += parseTimestampMap(line.slice('X-TIMESTAMP-MAP='.length));
    }
    i++;
  }

  while (i < lines.length) {
    // Skip blank lines between blocks.
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i >= lines.length) break;

    // NOTE blocks are skipped in full.
    if (lines[i].trim() === 'NOTE' || lines[i].trim().startsWith('NOTE ')) {
      while (i < lines.length && lines[i].trim() !== '') i++;
      continue;
    }

    let id: string | undefined;
    if (!lines[i].includes('-->')) {
      id = lines[i].trim();
      i++;
      if (i >= lines.length || !lines[i].includes('-->')) {
        // Not a cue block; skip to the next blank line.
        while (i < lines.length && lines[i].trim() !== '') i++;
        continue;
      }
    }

    const [startPart, rest] = lines[i].split('-->');
    const restTrimmed = (rest ?? '').trim();
    const spaceIndex = restTrimmed.search(/\s/);
    const endPart = spaceIndex === -1 ? restTrimmed : restTrimmed.slice(0, spaceIndex);
    const settings = spaceIndex === -1 ? undefined : restTrimmed.slice(spaceIndex).trim();

    const start = parseTimestamp(startPart);
    const end = parseTimestamp(endPart);
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i]);
      i++;
    }

    if (start === null || end === null) continue;

    cues.push({
      start: start + offset,
      end: end + offset,
      text: textLines.join('\n'),
      settings,
      id,
    });
  }

  return cues;
}
