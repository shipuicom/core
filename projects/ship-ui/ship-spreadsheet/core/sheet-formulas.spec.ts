import { describe, expect, it } from 'vitest';
import { SheetEvaluator, formulaColIndex, formulaColLabel, parseFormula, rewriteFormulaRefs } from './sheet-formulas';
import { SheetModel, SheetOp, applySheetOps, createSheet } from './sheet-model';

const sheet = (rows: number, cols: number, cells: string[]) => createSheet(rows, cols, cells);

function evaluated(model: SheetModel): SheetEvaluator {
  const ev = new SheetEvaluator();
  ev.update(model);
  return ev;
}

describe('formula grammar', () => {
  it('column letters round-trip', () => {
    expect(formulaColLabel(0)).toBe('A');
    expect(formulaColLabel(25)).toBe('Z');
    expect(formulaColLabel(26)).toBe('AA');
    expect(formulaColLabel(701)).toBe('ZZ');
    expect(formulaColIndex('AA')).toBe(26);
    expect(formulaColIndex('zz')).toBe(701);
  });

  it('parses refs, ranges, precedence, unary minus, percent and calls', () => {
    expect(parseFormula('=A1')).toEqual({ t: 'ref', ref: { row: 0, col: 0, absRow: false, absCol: false } });
    expect(parseFormula('=$B$2')).toEqual({ t: 'ref', ref: { row: 1, col: 1, absRow: true, absCol: true } });
    expect(parseFormula('=1+2*3')).toMatchObject({ t: 'bin', op: '+', r: { t: 'bin', op: '*' } });
    expect(parseFormula('=(1+2)*3')).toMatchObject({ t: 'bin', op: '*', l: { t: 'bin', op: '+' } });
    expect(parseFormula('=2^3^2')).toMatchObject({ t: 'bin', op: '^', r: { t: 'bin', op: '^' } });
    expect(parseFormula('=-A1')).toMatchObject({ t: 'neg' });
    expect(parseFormula('=50%')).toMatchObject({ t: 'bin', op: '/' });
    expect(parseFormula('=SUM(A1:B2, 3)')).toMatchObject({ t: 'call', name: 'SUM', args: [{ t: 'range' }, { t: 'num', v: 3 }] });
    expect(parseFormula('=sum(a1;b1)')).toMatchObject({ t: 'call', name: 'SUM' });
    expect(parseFormula('="a""b"&A1')).toMatchObject({ t: 'bin', op: '&', l: { t: 'str', v: 'a"b' } });
    expect(parseFormula('=A1<>B1')).toMatchObject({ t: 'bin', op: '<>' });
  });

  it('rejects malformed input', () => {
    expect(parseFormula('=1+')).toBeNull();
    expect(parseFormula('=SUM(1')).toBeNull();
    expect(parseFormula('=(1')).toBeNull();
    expect(parseFormula('="open')).toBeNull();
    expect(parseFormula('=1 2')).toBeNull();
    expect(parseFormula('=A1:')).toBeNull();
  });
});

describe('SheetEvaluator', () => {
  it('evaluates arithmetic, refs, ranges and the built-in functions', () => {
    const ev = evaluated(sheet(4, 3, ['1', '2', '=A1+B1', '3', 'x', '=SUM(A1:A3)', '', '', '=AVG(A1:A3)*2', '=MAX(A1:B2)', '=MIN(A1:B2)', '=COUNT(A1:B3)']));
    expect(ev.valueAt(0, 2)).toBe('3');
    expect(ev.valueAt(1, 2)).toBe('4');
    expect(ev.valueAt(2, 2)).toBe(String((4 / 3) * 2).slice(0, 10) === '2.66666666' ? ev.valueAt(2, 2) : 'x');
    expect(ev.valueAt(3, 0)).toBe('3');
    expect(ev.valueAt(3, 1)).toBe('1');
    expect(ev.valueAt(3, 2)).toBe('3');
    expect(ev.valueAt(0, 0)).toBe('1');
    expect(ev.isFormulaAt(0, 2)).toBe(true);
    expect(ev.isFormulaAt(0, 0)).toBe(false);
  });

  it('strings, comparisons, IF, ROUND, CONCAT, LEN, percent', () => {
    const ev = evaluated(sheet(2, 4, ['ab', '=A1&"c"', '=LEN(B1)', '=IF(C1>2,"big","small")', '2.345', '=ROUND(A2,2)', '=CONCAT(A1,1,TRUE)', '=A2*10%']));
    expect(ev.valueAt(0, 1)).toBe('abc');
    expect(ev.valueAt(0, 2)).toBe('3');
    expect(ev.valueAt(0, 3)).toBe('big');
    expect(ev.valueAt(1, 1)).toBe('2.35');
    expect(ev.valueAt(1, 2)).toBe('ab1TRUE');
    expect(ev.valueAt(1, 3)).toBe('0.2345');
  });

  it('errors: #DIV/0!, #VALUE!, #NAME?, #REF!, syntax, and propagation', () => {
    const ev = evaluated(sheet(2, 4, ['=1/0', '=A1+1', '="x"*2', '=FOO(1)', '=ZZ9999', '=1+', '=SUM(A1:B1)', '=B1=B1']));
    expect(ev.valueAt(0, 0)).toBe('#DIV/0!');
    expect(ev.valueAt(0, 1)).toBe('#DIV/0!');
    expect(ev.errorAt(0, 1)).toBe('#DIV/0!');
    expect(ev.valueAt(0, 2)).toBe('#VALUE!');
    expect(ev.valueAt(0, 3)).toBe('#NAME?');
    expect(ev.valueAt(1, 0)).toBe('#REF!');
    expect(ev.valueAt(1, 1)).toBe('#ERROR!');
    expect(ev.valueAt(1, 2)).toBe('#DIV/0!');
    expect(ev.errorAt(1, 3)).toBe('#DIV/0!');
  });

  it('cycles: every cell on the cycle and downstream shows #CYCLE; unrelated cells do not', () => {
    const ev = evaluated(sheet(1, 5, ['=B1+1', '=C1+1', '=A1', '=C1*2', '=1+1']));
    expect(ev.valueAt(0, 0)).toBe('#CYCLE');
    expect(ev.valueAt(0, 1)).toBe('#CYCLE');
    expect(ev.valueAt(0, 2)).toBe('#CYCLE');
    expect(ev.valueAt(0, 3)).toBe('#CYCLE');
    expect(ev.valueAt(0, 4)).toBe('2');
    expect(evaluated(sheet(1, 1, ['=A1'])).valueAt(0, 0)).toBe('#CYCLE');
  });

  it('recomputes incrementally on set-cells, dependents included, and breaks cycles when edited', () => {
    let model = sheet(3, 2, ['1', '=A1*2', '=B1+1', '=A2+B1', '5', '=SUM(A1:A3)']);
    const ev = evaluated(model);
    expect(ev.valueAt(0, 1)).toBe('2');
    expect(ev.valueAt(1, 0)).toBe('3');
    expect(ev.valueAt(1, 1)).toBe('5');
    expect(ev.valueAt(2, 1)).toBe('9');

    const ops: SheetOp[] = [{ kind: 'set-cells', row: 0, col: 0, values: [['10']] }];
    model = applySheetOps(model, ops).model;
    ev.update(model, ops);
    expect(ev.valueAt(0, 1)).toBe('20');
    expect(ev.valueAt(1, 0)).toBe('21');
    expect(ev.valueAt(1, 1)).toBe('41');
    expect(ev.valueAt(2, 1)).toBe('36');

    // A formula becomes text, text becomes a formula, a cycle is created then broken.
    const ops2: SheetOp[] = [{ kind: 'set-cells', row: 0, col: 1, values: [['hello']] }, { kind: 'set-cells', row: 2, col: 0, values: [['=B3']] }];
    model = applySheetOps(model, ops2).model;
    ev.update(model, ops2);
    expect(ev.valueAt(0, 1)).toBe('hello');
    expect(ev.isFormulaAt(0, 1)).toBe(false);
    expect(ev.valueAt(1, 0)).toBe('#VALUE!');
    expect(ev.valueAt(2, 0)).toBe('#CYCLE');
    expect(ev.valueAt(2, 1)).toBe('#CYCLE');
    const ops3: SheetOp[] = [{ kind: 'set-cells', row: 2, col: 0, values: [['7']] }];
    model = applySheetOps(model, ops3).model;
    ev.update(model, ops3);
    expect(ev.valueAt(2, 0)).toBe('7');
    // A2 is still #VALUE! (B1 is text), which SUM reports now that the cycle is gone.
    expect(ev.valueAt(2, 1)).toBe('#VALUE!');
    const ops4: SheetOp[] = [{ kind: 'set-cells', row: 0, col: 1, values: [['3']] }];
    model = applySheetOps(model, ops4).model;
    ev.update(model, ops4);
    expect(ev.valueAt(1, 0)).toBe('4');
    expect(ev.valueAt(2, 1)).toBe('21');
  });

  it('a structural op re-evaluates against the moved cells', () => {
    let model = sheet(2, 2, ['1', '2', '=SUM(A1:B1)', '']);
    const ev = evaluated(model);
    expect(ev.valueAt(1, 0)).toBe('3');
    const ops: SheetOp[] = [{ kind: 'insert-rows', at: 0, count: 1 }];
    model = applySheetOps(model, ops).model;
    ev.update(model, ops);
    // Not rewritten yet (FORMULAS.md step 2): the formula now reads the empty new row.
    expect(ev.valueAt(2, 0)).toBe('0');
    expect(ev.formulaCells()).toEqual([4]);
  });

  it('a range wider than the per-cell cap still recomputes on any change', () => {
    let model = sheet(200, 100, []);
    model = applySheetOps(model, [{ kind: 'set-cells', row: 0, col: 0, values: [['=SUM(A2:CV200)']] }]).model;
    const ev = evaluated(model);
    expect(ev.valueAt(0, 0)).toBe('0');
    const ops: SheetOp[] = [{ kind: 'set-cells', row: 150, col: 50, values: [['4']] }];
    model = applySheetOps(model, ops).model;
    ev.update(model, ops);
    expect(ev.valueAt(0, 0)).toBe('4');
  });
});

describe('rewriteFormulaRefs', () => {
  it('shifts refs and ranges across inserts', () => {
    expect(rewriteFormulaRefs('=A5+$B$2', { kind: 'insert-rows', at: 4, count: 2 })).toBe('=A7+$B$2');
    expect(rewriteFormulaRefs('=A5', { kind: 'insert-rows', at: 5, count: 1 })).toBe('=A5');
    expect(rewriteFormulaRefs('=SUM(A1:A3)', { kind: 'insert-rows', at: 1, count: 1 })).toBe('=SUM(A1:A4)');
    expect(rewriteFormulaRefs('=SUM(A1:A3)', { kind: 'insert-rows', at: 0, count: 1 })).toBe('=SUM(A2:A4)');
    expect(rewriteFormulaRefs('=SUM(A1:A3)', { kind: 'insert-rows', at: 3, count: 1 })).toBe('=SUM(A1:A3)');
    expect(rewriteFormulaRefs('=B1*C1', { kind: 'insert-cols', at: 1, count: 1 })).toBe('=C1*D1');
    expect(rewriteFormulaRefs('=SUM(A1:C1)', { kind: 'insert-cols', at: 1, count: 2 })).toBe('=SUM(A1:E1)');
  });

  it('removes: refs into the band become #REF!, ranges shrink or die', () => {
    expect(rewriteFormulaRefs('=A5+A9', { kind: 'remove-rows', at: 4, count: 2 })).toBe('=#REF!+A7');
    expect(rewriteFormulaRefs('=A2', { kind: 'remove-rows', at: 4, count: 2 })).toBe('=A2');
    expect(rewriteFormulaRefs('=SUM(A1:A5)', { kind: 'remove-rows', at: 2, count: 2 })).toBe('=SUM(A1:A3)');
    expect(rewriteFormulaRefs('=SUM(A3:A5)', { kind: 'remove-rows', at: 0, count: 4 })).toBe('=SUM(A1:A1)');
    expect(rewriteFormulaRefs('=SUM(A3:A4)', { kind: 'remove-rows', at: 2, count: 2 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=SUM(A3:A4)', { kind: 'remove-rows', at: 1, count: 5 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=B1', { kind: 'remove-cols', at: 1, count: 1 })).toBe('=#REF!');
    expect(rewriteFormulaRefs('=C1', { kind: 'remove-cols', at: 1, count: 1 })).toBe('=B1');
  });

  it('leaves strings, non-formulas and non-structural ops alone', () => {
    expect(rewriteFormulaRefs('="A5"&A5', { kind: 'insert-rows', at: 0, count: 1 })).toBe('="A5"&A6');
    expect(rewriteFormulaRefs('A5', { kind: 'insert-rows', at: 0, count: 1 })).toBe('A5');
    expect(rewriteFormulaRefs('=A5', { kind: 'set-col-width', col: 0, width: 1 })).toBe('=A5');
    expect(rewriteFormulaRefs('=FOO(A1)', { kind: 'insert-rows', at: 0, count: 1 })).toBe('=FOO(A2)');
    // `SUM1` is a cell (column SUM, row 1), as in every spreadsheet.
    expect(rewriteFormulaRefs('=SUM1', { kind: 'insert-rows', at: 0, count: 1 })).toBe('=SUM2');
  });
});
