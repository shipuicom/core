import { describe, expect, it } from 'vitest';
import { sheetFillValues } from './sheet-fill';
import { createSheet } from './sheet-model';

describe('sheetFillValues', () => {
  it('copies a single cell down and right, shifting formulas', () => {
    const model = createSheet(3, 3, ['1', 'x', '=A1*2', '', '', '', '', '', '']);
    expect(sheetFillValues(model, { r0: 0, c0: 0, r1: 0, c1: 0 }, { r0: 1, c0: 0, r1: 2, c1: 0 })).toEqual([['1'], ['1']]);
    expect(sheetFillValues(model, { r0: 0, c0: 1, r1: 0, c1: 1 }, { r0: 1, c0: 1, r1: 1, c1: 1 })).toEqual([['x']]);
    expect(sheetFillValues(model, { r0: 0, c0: 2, r1: 0, c1: 2 }, { r0: 1, c0: 2, r1: 2, c1: 2 })).toEqual([['=A2*2'], ['=A3*2']]);
    expect(sheetFillValues(model, { r0: 0, c0: 0, r1: 0, c1: 0 }, { r0: 0, c0: 1, r1: 0, c1: 2 })).toEqual([['1', '1']]);
  });

  it('continues an arithmetic series, repeats other patterns, fills upward', () => {
    const model = createSheet(4, 2, ['1', 'a', '3', 'b', '', '', '', '']);
    expect(sheetFillValues(model, { r0: 0, c0: 0, r1: 1, c1: 1 }, { r0: 2, c0: 0, r1: 3, c1: 1 })).toEqual([
      ['5', 'a'],
      ['7', 'b'],
    ]);
    const above = createSheet(3, 1, ['', '10', '20']);
    expect(sheetFillValues(above, { r0: 1, c0: 0, r1: 2, c1: 0 }, { r0: 0, c0: 0, r1: 0, c1: 0 })).toEqual([['0']]);
  });
});
