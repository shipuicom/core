import { describe, expect, it } from 'vitest';
import { shipStylesUse, shipStylesWith } from './ship-styles';

describe('shipStylesWith', () => {
  it('is empty when nothing is trimmed', () => {
    expect(shipStylesWith({})).toEqual([]);
    expect(shipStylesWith({ colors: ['success', 'primary', 'accent', 'warn', 'error'] })).toEqual([]);
  });

  it('emits trimmed lists, dropped skins and per skin overrides', () => {
    expect(
      shipStylesWith({
        colors: ['primary', 'error'],
        variants: ['flat'],
        skins: { toggle: false, chip: { colors: ['primary'] } },
      })
    ).toEqual([
      '$shipColors: (primary, error)',
      '$shipVariants: (flat)',
      '$shipToggle: false',
      '$shipSkins: (\n    chip: (colors: (primary)),\n  )',
    ]);
  });
});

describe('shipStylesUse', () => {
  it('falls back to a bare @use', () => {
    expect(shipStylesUse({})).toBe(`@use '@ship-ui/core/styles';`);
  });

  it('appends extra with entries', () => {
    expect(shipStylesUse({ skins: { video: false } }, ['$shipPalettes: ()'])).toBe(
      `@use '@ship-ui/core/styles' with (\n  $shipVideo: false,\n  $shipPalettes: (),\n);`
    );
  });
});
