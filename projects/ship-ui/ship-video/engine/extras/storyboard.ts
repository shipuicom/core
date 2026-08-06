import type { ShipVideoStoryboardCue } from '../types';
import { parseWebVtt } from '../tracks/webvtt-parser';

const XYWH_RE = /#xywh=(\d+),(\d+),(\d+),(\d+)$/;

/**
 * Parses a storyboard (thumbnail) WebVTT document. Each cue's text is an
 * image URL, optionally carrying a `#xywh=x,y,w,h` fragment describing the
 * sprite region. URLs are resolved absolute against `baseUrl`; the fragment
 * is stripped from `url` and mapped to `x`/`y`/`w`/`h`.
 */
export function parseStoryboard(vttText: string, baseUrl: string): ShipVideoStoryboardCue[] {
  const cues = parseWebVtt(vttText);
  const storyboard: ShipVideoStoryboardCue[] = [];

  for (const cue of cues) {
    const rawUrl = cue.text.trim();
    if (!rawUrl) continue;

    const match = XYWH_RE.exec(rawUrl);
    const urlWithoutFragment = match ? rawUrl.slice(0, match.index) : rawUrl;
    const url = new URL(urlWithoutFragment, baseUrl).href;

    if (match) {
      storyboard.push({
        start: cue.start,
        end: cue.end,
        url,
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10),
        w: parseInt(match[3], 10),
        h: parseInt(match[4], 10),
      });
    } else {
      storyboard.push({ start: cue.start, end: cue.end, url });
    }
  }

  return storyboard;
}
