import { describe, expect, it } from 'vitest';
import { parseWebVtt } from './webvtt-parser';

const SIMPLE = `WEBVTT

00:01.000 --> 00:04.000
Hello there.

00:05.500 --> 00:08.250
Second cue.
`;

const FULL_FEATURED = `WEBVTT - subtitle track

NOTE
This note block, including this line,
must be skipped entirely.

intro
00:00:01.000 --> 00:00:04.000 align:start line:0
<v Narrator>Welcome
to the show.

NOTE single-line note

00:01:02.500 --> 00:01:05.000
Plain cue without id or settings.
`;

const TIMESTAMP_MAPPED = `WEBVTT
X-TIMESTAMP-MAP=MPEGTS:900000,LOCAL:00:00:00.000

00:00.000 --> 00:02.000
Mapped cue.
`;

describe('parseWebVtt', () => {
  it('throws when the WEBVTT header is missing', () => {
    expect(() => parseWebVtt('00:01.000 --> 00:02.000\nHi')).toThrowError(/WEBVTT/);
  });

  it('parses mm:ss.mmm timestamps', () => {
    const cues = parseWebVtt(SIMPLE);
    expect(cues).toHaveLength(2);
    expect(cues[0].start).toBe(1);
    expect(cues[0].end).toBe(4);
    expect(cues[1].start).toBe(5.5);
    expect(cues[1].end).toBe(8.25);
  });

  it('parses hh:mm:ss.mmm timestamps', () => {
    const cues = parseWebVtt(FULL_FEATURED);
    expect(cues[1].start).toBe(62.5);
    expect(cues[1].end).toBe(65);
  });

  it('captures cue ids and leaves them undefined when absent', () => {
    const cues = parseWebVtt(FULL_FEATURED);
    expect(cues[0].id).toBe('intro');
    expect(cues[1].id).toBeUndefined();
  });

  it('captures cue settings after the timing line', () => {
    const cues = parseWebVtt(FULL_FEATURED);
    expect(cues[0].settings).toBe('align:start line:0');
    expect(cues[1].settings).toBeUndefined();
  });

  it('joins multi-line cue text with newlines', () => {
    const cues = parseWebVtt(FULL_FEATURED);
    expect(cues[0].text).toBe('<v Narrator>Welcome\nto the show.');
  });

  it('skips NOTE blocks', () => {
    const cues = parseWebVtt(FULL_FEATURED);
    expect(cues).toHaveLength(2);
    expect(cues.some((cue) => cue.text.includes('skipped'))).toBe(false);
  });

  it('applies the X-TIMESTAMP-MAP offset (MPEGTS/90000 - LOCAL)', () => {
    const cues = parseWebVtt(TIMESTAMP_MAPPED);
    expect(cues[0].start).toBe(10);
    expect(cues[0].end).toBe(12);
  });

  it('subtracts a non-zero LOCAL from the MPEGTS offset', () => {
    const text = `WEBVTT
X-TIMESTAMP-MAP=LOCAL:00:00:02.000,MPEGTS:900000

00:03.000 --> 00:05.000
Cue.
`;
    const cues = parseWebVtt(text);
    expect(cues[0].start).toBe(11); // 3 + (10 - 2)
  });

  it('combines the timestampOffset argument with X-TIMESTAMP-MAP', () => {
    const cues = parseWebVtt(TIMESTAMP_MAPPED, 100);
    expect(cues[0].start).toBe(110);
  });

  it('applies timestampOffset alone', () => {
    const cues = parseWebVtt(SIMPLE, 60);
    expect(cues[0].start).toBe(61);
    expect(cues[0].end).toBe(64);
  });
});
