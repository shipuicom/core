import { describe, expect, it } from 'vitest';
import { SHIP_VIDEO_DEFAULT_ABR, ShipVideoAbrConfig } from '../types';
import { AbrController, AbrDecisionArgs, selectLevel } from './abr-controller';

const config: ShipVideoAbrConfig = { ...SHIP_VIDEO_DEFAULT_ABR };

/** 5 levels: 300k, 800k, 1.5M, 3M, 6M. */
const LEVELS = [300_000, 800_000, 1_500_000, 3_000_000, 6_000_000];

function args(overrides: Partial<AbrDecisionArgs>): AbrDecisionArgs {
  return {
    levelBitrates: LEVELS,
    currentLevel: 2,
    bandwidthEstimate: 2_000_000,
    forwardBufferSeconds: 20,
    secondsSinceLastSwitch: 30,
    config,
    ...overrides,
  };
}

describe('selectLevel', () => {
  it('returns -1 when there are no levels', () => {
    expect(selectLevel(args({ levelBitrates: [] }))).toBe(-1);
  });

  describe('no estimate', () => {
    it('starts at the lowest level when no level is active', () => {
      expect(selectLevel(args({ bandwidthEstimate: 0, currentLevel: -1 }))).toBe(0);
    });

    it('keeps the current level', () => {
      expect(selectLevel(args({ bandwidthEstimate: 0, currentLevel: 3 }))).toBe(3);
    });

    it('clamps a stale current level into range', () => {
      expect(selectLevel(args({ bandwidthEstimate: 0, currentLevel: 9 }))).toBe(4);
    });
  });

  describe('emergency down-switch', () => {
    it('drops to the highest level the estimate affords when the buffer is critical', () => {
      // buffer 3 < downSwitchMaxBuffer 5, current level 3M > estimate 1M
      expect(
        selectLevel(args({ currentLevel: 3, bandwidthEstimate: 1_000_000, forwardBufferSeconds: 3 })),
      ).toBe(1);
    });

    it('floors at level 0 when no level fits under the estimate', () => {
      expect(
        selectLevel(args({ currentLevel: 3, bandwidthEstimate: 100_000, forwardBufferSeconds: 3 })),
      ).toBe(0);
    });

    it('does not engage when the current level already fits the estimate', () => {
      // buffer critical but 800k <= 2M: normal path; candidate (2M*0.75=1.5M -> level 2)
      // is an up-switch, blocked by the low buffer, so we stay.
      expect(
        selectLevel(args({ currentLevel: 1, bandwidthEstimate: 2_000_000, forwardBufferSeconds: 3 })),
      ).toBe(1);
    });

    it('does not engage when the buffer is at or above downSwitchMaxBuffer', () => {
      // buffer 5 is not < 5; candidate under 1M*0.75 = 750k is level 0: plain down-switch.
      expect(
        selectLevel(args({ currentLevel: 3, bandwidthEstimate: 1_000_000, forwardBufferSeconds: 5 })),
      ).toBe(0);
    });

    it('does not engage before any level is active', () => {
      // currentLevel -1: startup path, not emergency.
      expect(
        selectLevel(args({ currentLevel: -1, bandwidthEstimate: 1_000_000, forwardBufferSeconds: 3 })),
      ).toBe(0); // stays -1 pre-clamp (no up allowed with thin buffer), clamped to 0
    });
  });

  describe('up-switch with hysteresis', () => {
    it('up-switches when buffer and hold time allow', () => {
      // 4.1M * 0.75 = 3.075M -> level 3
      expect(
        selectLevel(
          args({
            currentLevel: 1,
            bandwidthEstimate: 4_100_000,
            forwardBufferSeconds: 12,
            secondsSinceLastSwitch: 6,
          }),
        ),
      ).toBe(3);
    });

    it('applies the safety factor to the candidate', () => {
      // 3.5M raw would afford level 3 (3M), but 3.5M * 0.75 = 2.625M -> level 2.
      expect(
        selectLevel(args({ currentLevel: 1, bandwidthEstimate: 3_500_000 })),
      ).toBe(2);
    });

    it('stays when the buffer is under upSwitchMinBuffer', () => {
      expect(
        selectLevel(
          args({
            currentLevel: 1,
            bandwidthEstimate: 4_100_000,
            forwardBufferSeconds: 9.9,
            secondsSinceLastSwitch: 60,
          }),
        ),
      ).toBe(1);
    });

    it('stays when within the hold time', () => {
      expect(
        selectLevel(
          args({
            currentLevel: 1,
            bandwidthEstimate: 4_100_000,
            forwardBufferSeconds: 30,
            secondsSinceLastSwitch: 4.9,
          }),
        ),
      ).toBe(1);
    });

    it('allows the up-switch exactly at both thresholds', () => {
      expect(
        selectLevel(
          args({
            currentLevel: 1,
            bandwidthEstimate: 4_100_000,
            forwardBufferSeconds: config.upSwitchMinBuffer,
            secondsSinceLastSwitch: config.upSwitchHoldTime,
          }),
        ),
      ).toBe(3);
    });
  });

  describe('down-switch', () => {
    it('downs immediately with no hysteresis', () => {
      // 900k * 0.75 = 675k -> level 0, buffer healthy, switched 0.1s ago.
      expect(
        selectLevel(
          args({
            currentLevel: 3,
            bandwidthEstimate: 900_000,
            forwardBufferSeconds: 30,
            secondsSinceLastSwitch: 0.1,
          }),
        ),
      ).toBe(0);
    });

    it('stays put when the candidate equals the current level', () => {
      // 2M * 0.75 = 1.5M -> level 2 == current.
      expect(selectLevel(args({ currentLevel: 2, bandwidthEstimate: 2_000_000 }))).toBe(2);
    });

    it('floors at level 0 when nothing fits under the safety budget', () => {
      expect(
        selectLevel(args({ currentLevel: 2, bandwidthEstimate: 200_000, forwardBufferSeconds: 30 })),
      ).toBe(0);
    });
  });
});

describe('AbrController', () => {
  function makeController(bitrates: number[] = LEVELS): { controller: AbrController; clock: { t: number } } {
    const clock = { t: 0 };
    const controller = new AbrController(config, () => clock.t);
    controller.setLevels(bitrates);
    return { controller, clock };
  }

  it('defaults to auto', () => {
    const { controller } = makeController();
    expect(controller.autoLevel).toBe(true);
    expect(controller.manualLevel).toBe(-1);
  });

  it('returns -1 before levels are set', () => {
    const controller = new AbrController(config, () => 0);
    expect(controller.nextLevel(5_000_000, 30)).toBe(-1);
  });

  it('starts at level 0 with no estimate', () => {
    const { controller } = makeController();
    expect(controller.nextLevel(0, 0)).toBe(0);
  });

  it('ramps up over time as buffer builds and hold time elapses', () => {
    const { controller, clock } = makeController();
    expect(controller.nextLevel(0, 0)).toBe(0);

    // Estimate appears but buffer is thin: stay at 0.
    clock.t = 1000;
    expect(controller.nextLevel(6_000_000, 4)).toBe(0);

    // Buffer healthy but the switch to 0 was 1s ago... 0 was the first decision,
    // so hold time counts from t=0; at t=4s it is still under 5s.
    clock.t = 4000;
    expect(controller.nextLevel(6_000_000, 15)).toBe(0);

    // Past hold time: up-switch. 6M * 0.75 = 4.5M -> level 3.
    clock.t = 5100;
    expect(controller.nextLevel(6_000_000, 15)).toBe(3);

    // Immediately after: further up-switch blocked by the fresh switch time.
    clock.t = 5200;
    expect(controller.nextLevel(9_000_000, 15)).toBe(3);

    // After the hold time passes again: 9M * 0.75 = 6.75M -> level 4.
    clock.t = 10200;
    expect(controller.nextLevel(9_000_000, 15)).toBe(4);
  });

  it('down-switches immediately regardless of the hold timer', () => {
    const { controller, clock } = makeController();
    controller.nextLevel(0, 0);
    clock.t = 6000;
    expect(controller.nextLevel(6_000_000, 15)).toBe(3);
    clock.t = 6100;
    expect(controller.nextLevel(900_000, 15)).toBe(0);
  });

  describe('manual override', () => {
    it('freezes auto selection at the manual level', () => {
      const { controller } = makeController();
      controller.setManualLevel(4);
      expect(controller.autoLevel).toBe(false);
      expect(controller.manualLevel).toBe(4);
      // Terrible bandwidth and empty buffer: manual wins anyway.
      expect(controller.nextLevel(100_000, 0)).toBe(4);
    });

    it('clamps a manual level above the level count', () => {
      const { controller } = makeController();
      controller.setManualLevel(99);
      expect(controller.nextLevel(1_000_000, 10)).toBe(4);
    });

    it('returning to auto resumes selection and respects the hold timer', () => {
      const { controller, clock } = makeController();
      controller.setManualLevel(4);
      expect(controller.nextLevel(1_000_000, 20)).toBe(4);

      controller.setManualLevel(-1);
      expect(controller.autoLevel).toBe(true);
      // Auto now sees currentLevel 4 with a 1M estimate (budget 750k): down to 0 immediately.
      clock.t = 1000;
      expect(controller.nextLevel(1_000_000, 20)).toBe(0);
      // Up again requires the hold time since that switch.
      clock.t = 2000;
      expect(controller.nextLevel(6_000_000, 20)).toBe(0);
      clock.t = 6100;
      expect(controller.nextLevel(6_000_000, 20)).toBe(3);
    });
  });

  describe('shouldAbortInflight', () => {
    const abortArgs = {
      inflightLevelBitrate: 3_000_000,
      bandwidthEstimate: 1_000_000,
      forwardBufferSeconds: 3,
      remainingBytes: 1_000_000, // 8Mb / 1Mbps = 8s > 3s buffer
    };

    it('aborts when the buffer is critical and the download will not finish in time', () => {
      const { controller } = makeController();
      expect(controller.shouldAbortInflight(abortArgs)).toBe(true);
    });

    it('does not abort with a healthy buffer', () => {
      const { controller } = makeController();
      expect(
        controller.shouldAbortInflight({ ...abortArgs, forwardBufferSeconds: config.downSwitchMaxBuffer }),
      ).toBe(false);
    });

    it('does not abort when the download will finish before the buffer drains', () => {
      const { controller } = makeController();
      expect(
        controller.shouldAbortInflight({ ...abortArgs, remainingBytes: 100_000 }), // 0.8s < 3s
      ).toBe(false);
    });

    it('does not abort with an unknown bandwidth estimate', () => {
      const { controller } = makeController();
      expect(controller.shouldAbortInflight({ ...abortArgs, bandwidthEstimate: 0 })).toBe(false);
    });
  });
});
