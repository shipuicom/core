import { describe, expect, it } from 'vitest';
import { parseStoryboard } from './storyboard';

const BASE = 'https://cdn.example.com/video/thumbs/storyboard.vtt';

const SPRITE_VTT = `WEBVTT

00:00.000 --> 00:05.000
sprite-01.jpg#xywh=0,0,160,90

00:05.000 --> 00:10.000
sprite-01.jpg#xywh=160,0,160,90

00:10.000 --> 00:15.000
sprite-01.jpg#xywh=0,90,160,90
`;

const SINGLE_IMAGE_VTT = `WEBVTT

00:00.000 --> 00:10.000
thumb-0001.jpg

00:10.000 --> 00:20.000
https://other-cdn.example.com/thumbs/thumb-0002.jpg
`;

describe('parseStoryboard', () => {
  it('parses sprite cues, stripping the xywh fragment into coordinates', () => {
    const cues = parseStoryboard(SPRITE_VTT, BASE);

    expect(cues).toHaveLength(3);
    expect(cues[0]).toEqual({
      start: 0,
      end: 5,
      url: 'https://cdn.example.com/video/thumbs/sprite-01.jpg',
      x: 0,
      y: 0,
      w: 160,
      h: 90,
    });
    expect(cues[1].x).toBe(160);
    expect(cues[2]).toMatchObject({ start: 10, end: 15, x: 0, y: 90, w: 160, h: 90 });
    expect(cues.every((cue) => !cue.url.includes('#'))).toBe(true);
  });

  it('parses non-sprite cues without region fields', () => {
    const cues = parseStoryboard(SINGLE_IMAGE_VTT, BASE);

    expect(cues).toHaveLength(2);
    expect(cues[0]).toEqual({
      start: 0,
      end: 10,
      url: 'https://cdn.example.com/video/thumbs/thumb-0001.jpg',
    });
    expect(cues[0].x).toBeUndefined();
    expect(cues[0].w).toBeUndefined();
  });

  it('keeps absolute image URLs as-is', () => {
    const cues = parseStoryboard(SINGLE_IMAGE_VTT, BASE);
    expect(cues[1].url).toBe('https://other-cdn.example.com/thumbs/thumb-0002.jpg');
  });

  it('throws on a non-VTT document', () => {
    expect(() => parseStoryboard('not a vtt file', BASE)).toThrowError(/WEBVTT/);
  });
});
