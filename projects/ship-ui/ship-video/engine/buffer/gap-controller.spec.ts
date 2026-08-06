import { describe, expect, it } from 'vitest';
import { GapController, GapControllerCallbacks, MediaLike } from './gap-controller';
import { toTimeRanges } from './mock-media-source';

type Call = ['stall'] | ['recovered'] | ['nudge', number] | ['give-up'];

function makeMedia(overrides?: Partial<MediaLike>): MediaLike {
  return {
    currentTime: 10,
    paused: false,
    seeking: false,
    readyState: 4,
    buffered: toTimeRanges([{ start: 0, end: 60 }]),
    ...overrides,
  };
}

function makeHarness(media: MediaLike, config?: ConstructorParameters<typeof GapController>[2]) {
  const calls: Call[] = [];
  const callbacks: GapControllerCallbacks = {
    onStallStart: () => calls.push(['stall']),
    onStallRecovered: () => calls.push(['recovered']),
    onNudge: (seconds: number) => {
      calls.push(['nudge', seconds]);
      media.currentTime += seconds;
    },
    onGiveUp: () => calls.push(['give-up']),
  };
  return { calls, gap: new GapController(media, callbacks, config) };
}

describe('GapController', () => {
  it('does nothing while currentTime advances', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    media.currentTime += 0.25;
    gap.tick(250);
    media.currentTime += 0.25;
    gap.tick(500);

    expect(calls).toEqual([]);
  });

  it('does not stall before the threshold elapses', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(499);

    expect(calls).toEqual([]);
  });

  it('escalates stall -> 3 nudges -> give-up when data is buffered ahead', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);

    gap.tick(1000);
    gap.tick(1500);
    expect(calls).toEqual([['stall'], ['nudge', 0.1], ['nudge', 0.1], ['nudge', 0.1]]);

    gap.tick(2000);
    expect(calls).toEqual([['stall'], ['nudge', 0.1], ['nudge', 0.1], ['nudge', 0.1], ['give-up']]);

    gap.tick(2500);
    expect(calls).toHaveLength(5);
  });

  it('honors custom threshold, nudge size and nudge count', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media, { stallThresholdMs: 1000, maxNudges: 1, nudgeSeconds: 0.25 });

    gap.tick(0);
    gap.tick(500);
    expect(calls).toEqual([]);

    gap.tick(1000);
    expect(calls).toEqual([['stall'], ['nudge', 0.25]]);

    gap.tick(2000);
    expect(calls).toEqual([['stall'], ['nudge', 0.25], ['give-up']]);
  });

  it('a nudge alone is not recovery, but real movement afterwards is', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);

    media.currentTime += 0.5;
    gap.tick(750);
    expect(calls).toEqual([['stall'], ['nudge', 0.1], ['recovered']]);
  });

  it('resets counters on recovery so a later stall escalates from scratch', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    gap.tick(1000);
    media.currentTime += 1;
    gap.tick(1250);
    expect(calls).toEqual([['stall'], ['nudge', 0.1], ['nudge', 0.1], ['recovered']]);
    calls.length = 0;

    gap.tick(1500);
    gap.tick(2000);
    gap.tick(2500);
    gap.tick(3000);
    gap.tick(3500);
    expect(calls).toEqual([['stall'], ['nudge', 0.1], ['nudge', 0.1], ['nudge', 0.1], ['give-up']]);
  });

  it('reports starvation without nudging or giving up when nothing is buffered ahead', () => {
    const media = makeMedia({ buffered: toTimeRanges([{ start: 0, end: 10 }]) });
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    gap.tick(5000);
    gap.tick(10000);

    expect(calls).toEqual([['stall']]);
  });

  it('starts nudging when data arrives during a starvation stall', () => {
    const media = makeMedia({ buffered: toTimeRanges([{ start: 0, end: 10 }]) });
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    expect(calls).toEqual([['stall']]);

    media.buffered = toTimeRanges([{ start: 0, end: 60 }]);
    gap.tick(1000);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);
  });

  it('ignores frozen time while paused, seeking or without data', () => {
    for (const overrides of [{ paused: true }, { seeking: true }, { readyState: 1 }]) {
      const media = makeMedia(overrides);
      const { calls, gap } = makeHarness(media);

      gap.tick(0);
      gap.tick(1000);
      gap.tick(2000);

      expect(calls).toEqual([]);
    }
  });

  it('does not count time spent paused toward the stall threshold', () => {
    const media = makeMedia({ paused: true });
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(400);
    media.paused = false;
    gap.tick(700);
    expect(calls).toEqual([]);

    gap.tick(1200);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);
  });

  it('reset clears stall state without firing callbacks', () => {
    const media = makeMedia();
    const { calls, gap } = makeHarness(media);

    gap.tick(0);
    gap.tick(500);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);
    calls.length = 0;

    gap.reset();
    gap.tick(600);
    expect(calls).toEqual([]);

    gap.tick(1100);
    expect(calls).toEqual([['stall'], ['nudge', 0.1]]);
  });
});
