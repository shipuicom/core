// ---------------------------------------------------------------------------
// ShipSpreadsheet — fill: what dragging the fill handle writes
// ---------------------------------------------------------------------------

import { cellValueOf, isFormula, shiftFormulaRefs } from './sheet-formulas';
import { cellAt, SheetModel, SheetRange } from './sheet-model';

const numberText = (n: number): string => String(Number(n.toPrecision(15)));

/** The common difference of a numeric line, or `null` when it is not an arithmetic series (or shorter than two). */
function seriesStep(values: readonly (number | null)[]): number | null {
  if (values.length < 2 || values.some((v) => v === null)) return null;
  const ns = values as number[];
  const step = ns[1] - ns[0];
  for (let i = 2; i < ns.length; i++) if (Math.abs(ns[i] - ns[i - 1] - step) > 1e-9) return null;
  return step;
}

/**
 * The cell strings a fill writes into `target` from the pattern in
 * `source` — the two ranges normalized, `target` adjoining `source` above,
 * below, left or right with the same extent on the other axis. Along the
 * fill axis each line repeats its pattern; a pattern that is a single
 * arithmetic series of numbers is continued (`1, 2` → `3, 4`); a formula
 * moves with the distance from its pattern cell (`shiftFormulaRefs`).
 */
export function sheetFillValues(model: SheetModel, source: SheetRange, target: SheetRange): string[][] {
  const vertical = target.c0 === source.c0 && target.c1 === source.c1;
  const rows = target.r1 - target.r0 + 1;
  const cols = target.c1 - target.c0 + 1;
  const out: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      const tr = target.r0 + r;
      const tc = target.c0 + c;
      // The pattern line this cell continues, and its distance from the line's first cell.
      const line = vertical ? source.r0 : source.c0;
      const length = vertical ? source.r1 - source.r0 + 1 : source.c1 - source.c0 + 1;
      const d = (vertical ? tr : tc) - line;
      const k = ((d % length) + length) % length;
      const pr = vertical ? source.r0 + k : tr;
      const pc = vertical ? tc : source.c0 + k;
      const raw = cellAt(model, pr, pc);
      if (isFormula(raw)) {
        row.push(shiftFormulaRefs(raw, tr - pr, tc - pc));
        continue;
      }
      const numbers = Array.from({ length }, (_, i) => {
        const v = cellValueOf(cellAt(model, vertical ? source.r0 + i : tr, vertical ? tc : source.c0 + i));
        return typeof v === 'number' ? v : null;
      });
      const step = seriesStep(numbers);
      row.push(step === null ? raw : numberText((numbers[0] as number) + step * d));
    }
    out.push(row);
  }
  return out;
}
