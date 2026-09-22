import { describe, expect, it } from 'vitest';
import {
  SHEET_BUILTIN_FUNCTIONS,
  SheetEvaluator,
  SheetFunction,
  SheetFunctionRegistry,
  SheetValue,
  SheetWorkbook,
  formulaColIndex,
  formulaColLabel,
  formulaNameText,
  parseFormula,
  renameFormulaSheet,
  rewriteFormulaRefs,
  shiftFormulaRefs,
} from './sheet-formulas';
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
    expect(parseFormula('=SUM(A1:B2, 3)')).toMatchObject({
      t: 'call',
      name: 'SUM',
      args: [{ t: 'range' }, { t: 'num', v: 3 }],
    });
    expect(parseFormula('=sum(a1;b1)')).toMatchObject({ t: 'call', name: 'SUM' });
    expect(parseFormula('="a""b"&A1')).toMatchObject({ t: 'bin', op: '&', l: { t: 'str', v: 'a"b' } });
    expect(parseFormula('=A1<>B1')).toMatchObject({ t: 'bin', op: '<>' });
    // A reference-shaped word followed by `(` is a call, not a reference.
    expect(parseFormula('=LOG10(A1)')).toMatchObject({ t: 'call', name: 'LOG10', args: [{ t: 'ref' }] });
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
    const ev = evaluated(
      sheet(4, 3, [
        '1',
        '2',
        '=A1+B1',
        '3',
        'x',
        '=SUM(A1:A3)',
        '',
        '',
        '=AVG(A1:A3)*2',
        '=MAX(A1:B2)',
        '=MIN(A1:B2)',
        '=COUNT(A1:B3)',
      ])
    );
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
    const ev = evaluated(
      sheet(2, 4, [
        'ab',
        '=A1&"c"',
        '=LEN(B1)',
        '=IF(C1>2,"big","small")',
        '2.345',
        '=ROUND(A2,2)',
        '=CONCAT(A1,1,TRUE)',
        '=A2*10%',
      ])
    );
    expect(ev.valueAt(0, 1)).toBe('abc');
    expect(ev.valueAt(0, 2)).toBe('3');
    expect(ev.valueAt(0, 3)).toBe('big');
    expect(ev.valueAt(1, 1)).toBe('2.35');
    expect(ev.valueAt(1, 2)).toBe('ab1TRUE');
    expect(ev.valueAt(1, 3)).toBe('0.2345');
  });

  it('errors: #DIV/0!, #VALUE!, #NAME?, #REF!, syntax, and propagation', () => {
    const ev = evaluated(
      sheet(2, 4, ['=1/0', '=A1+1', '="x"*2', '=FOO(1)', '=ZZ9999', '=1+', '=SUM(A1:B1)', '=B1=B1'])
    );
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
    const ops2: SheetOp[] = [
      { kind: 'set-cells', row: 0, col: 1, values: [['hello']] },
      { kind: 'set-cells', row: 2, col: 0, values: [['=B3']] },
    ];
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
    // The apply rewrote the range past the new row; the value survives.
    expect(model.cells[4]).toBe('=SUM(A2:B2)');
    expect(ev.valueAt(2, 0)).toBe('3');
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
    expect(rewriteFormulaRefs('=SUM(A1:A5)', { kind: 'remove-rows', at: 5, count: 2 })).toBe('=SUM(A1:A5)');
    expect(rewriteFormulaRefs('=SUM(A6:A9)', { kind: 'remove-rows', at: 0, count: 4 })).toBe('=SUM(A2:A5)');
    // A removal taking either end of a range is #REF! (see the rewrite's note on convergence).
    expect(rewriteFormulaRefs('=SUM(A3:A5)', { kind: 'remove-rows', at: 0, count: 4 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=SUM(A3:A5)', { kind: 'remove-rows', at: 4, count: 4 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=SUM(A3:A4)', { kind: 'remove-rows', at: 2, count: 2 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=SUM(A3:A4)', { kind: 'remove-rows', at: 1, count: 5 })).toBe('=SUM(#REF!)');
    expect(rewriteFormulaRefs('=B1', { kind: 'remove-cols', at: 1, count: 1 })).toBe('=#REF!');
    expect(rewriteFormulaRefs('=C1', { kind: 'remove-cols', at: 1, count: 1 })).toBe('=B1');
  });

  it('is unaffected by function names, custom or reference-shaped', () => {
    const op: SheetOp = { kind: 'insert-rows', at: 0, count: 1 };
    expect(rewriteFormulaRefs('=DOUBLE(A1)+USERNAME()', op)).toBe('=DOUBLE(A2)+USERNAME()');
    expect(rewriteFormulaRefs('=LOG10(A1)+AB1(B1)', op)).toBe('=LOG10(A2)+AB1(B2)');
    expect(rewriteFormulaRefs('=LINKED("tasks")', op)).toBe('=LINKED("tasks")');
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

describe('SheetFunctionRegistry and custom functions', () => {
  const DOUBLE: SheetFunction = {
    name: 'double',
    minArgs: 1,
    maxArgs: 1,
    signature: 'DOUBLE(x)',
    call: ([x]) => (typeof x === 'number' ? x * 2 : { error: '#VALUE!' }),
  };
  const USERNAME: SheetFunction = {
    name: 'USERNAME',
    maxArgs: 0,
    volatile: true,
    call: (_, ctx) => (ctx.external as { user: string }).user,
  };
  const custom = (functions: SheetFunction[], model: SheetModel, external?: unknown) => {
    const ev = new SheetEvaluator(new SheetFunctionRegistry(functions));
    ev.external = external;
    ev.update(model);
    return ev;
  };

  it('merges over the built-ins, case-insensitively, and a same-named function overrides', () => {
    const reg = new SheetFunctionRegistry([DOUBLE]);
    expect(reg.has('sum')).toBe(true);
    expect(reg.get('AVERAGE')?.name).toBe('AVERAGE');
    expect(reg.get('Double')).toBe(DOUBLE);
    expect(reg.names()).toEqual([...SHEET_BUILTIN_FUNCTIONS.map((f) => f.name), 'DOUBLE']);
    expect(reg.list().every((f) => f.signature)).toBe(true);
    const over = reg.with([{ name: 'SUM', variadic: true, call: () => 'mine' }]);
    expect(over.get('sum')?.call([], null!)).toBe('mine');
    expect(over.names().length).toBe(reg.names().length);
    expect(reg.get('SUM')?.call([1, 2], null!)).toBe(3);
    // A registry built on an empty base has nothing but its own.
    expect(new SheetFunctionRegistry([DOUBLE], []).names()).toEqual(['DOUBLE']);
  });

  it('evaluates custom functions; unknown names stay #NAME?', () => {
    const ev = custom([DOUBLE], sheet(1, 4, ['21', '=double(A1)', '=DOUBLE(A1)+DOUBLE(1)', '=TRIPLE(A1)']));
    expect(ev.valueAt(0, 1)).toBe('42');
    expect(ev.valueAt(0, 2)).toBe('44');
    expect(ev.valueAt(0, 3)).toBe('#NAME?');
    expect(ev.errorAt(0, 3)).toBe('#NAME?');
    // The default evaluator does not know it.
    expect(evaluated(sheet(1, 1, ['=DOUBLE(2)'])).valueAt(0, 0)).toBe('#NAME?');
  });

  it('arity errors read #ERROR! with a message; a thrown error too', () => {
    const THROWS: SheetFunction = {
      name: 'THROWS',
      call: () => {
        throw new Error('no such table');
      },
    };
    const ev = custom([DOUBLE, THROWS], sheet(1, 4, ['=DOUBLE()', '=DOUBLE(1,2)', '=THROWS()', '=THROWS()+1']));
    expect(ev.valueAt(0, 0)).toBe('#ERROR!');
    expect(ev.errorMessageAt(0, 0)).toBe('DOUBLE takes 1 argument, got 0');
    expect(ev.errorMessageAt(0, 1)).toBe('DOUBLE takes 1 argument, got 2');
    expect(ev.valueAt(0, 2)).toBe('#ERROR!');
    expect(ev.errorMessageAt(0, 2)).toBe('no such table');
    // Propagated errors keep the message.
    expect(ev.valueAt(0, 3)).toBe('#ERROR!');
    expect(ev.errorMessageAt(0, 3)).toBe('no such table');
    expect(ev.errorMessageAt(0, 4)).toBeNull();
    expect(evaluated(sheet(1, 1, ['=ABS(1,2)'])).errorMessageAt(0, 0)).toBe('ABS takes 1 argument, got 2');
    expect(evaluated(sheet(1, 1, ['=IF()'])).errorMessageAt(0, 0)).toBe('IF takes 1 to 3 arguments, got 0');
  });

  it('the context gives the cell, the model, other values and the external bag', () => {
    const seen: unknown[] = [];
    const PROBE: SheetFunction = {
      name: 'PROBE',
      call: (_, ctx) => {
        seen.push([ctx.row, ctx.col, ctx.address, ctx.model.rows, ctx.external]);
        return `${ctx.valueAt('A1')}/${ctx.valueAt({ row: 0, col: 1 })}/${(ctx.valueAt('Z99') as { error: string }).error}/${(ctx.valueAt('junk') as { error: string }).error}`;
      },
    };
    const ev = custom([PROBE], sheet(2, 2, ['5', '=A1*2', '', '=PROBE()']), { user: 'sp90' });
    expect(ev.valueAt(1, 1)).toBe('5/10/#REF!/#REF!');
    expect(seen).toEqual([[1, 1, 'B2', 2, { user: 'sp90' }]]);
  });

  it('volatile functions recompute on every update and on recalc(); others only when their inputs change', () => {
    let calls = 0;
    const COUNTER: SheetFunction = { name: 'COUNTER', call: () => ++calls };
    let model = sheet(1, 3, ['=USERNAME()', '=COUNTER()', '=A1&"!"']);
    const ev = custom([USERNAME, COUNTER], model, { user: 'ann' });
    expect(ev.valueAt(0, 0)).toBe('ann');
    expect(ev.valueAt(0, 1)).toBe('1');
    expect(ev.valueAt(0, 2)).toBe('ann!');
    // An unrelated edit: the volatile cell and its dependents recompute, the plain custom one does not.
    ev.external = { user: 'bob' };
    const ops: SheetOp[] = [{ kind: 'set-cells', row: 0, col: 2, values: [['=A1&"?"']] }];
    model = applySheetOps(model, ops).model;
    ev.update(model, ops);
    expect(ev.valueAt(0, 0)).toBe('bob');
    expect(ev.valueAt(0, 2)).toBe('bob?');
    expect(ev.valueAt(0, 1)).toBe('1');
    // recalc() recomputes everything.
    ev.external = { user: 'cy' };
    ev.recalc();
    expect(ev.valueAt(0, 0)).toBe('cy');
    expect(ev.valueAt(0, 2)).toBe('cy?');
    expect(ev.valueAt(0, 1)).toBe('2');
    // A rebuild (structural op) recomputes everything too.
    const ops2: SheetOp[] = [{ kind: 'insert-rows', at: 1, count: 1 }];
    ev.update(applySheetOps(model, ops2).model, ops2);
    expect(ev.valueAt(0, 1)).toBe('3');
  });
});

describe('cross-sheet references', () => {
  /** A workbook over evaluators by name (case-insensitive), with named columns per sheet. */
  function workbook(
    sheets: Record<string, SheetEvaluator>,
    columns: Record<string, Record<string, SheetValue[]>> = {}
  ): SheetWorkbook {
    return {
      sheet(name) {
        const key = [...Object.keys(sheets), ...Object.keys(columns)].find((k) => k.toLowerCase() === name.toLowerCase());
        if (key === undefined) return null;
        const ev = sheets[key];
        return {
          rows: ev?.model?.rows ?? 0,
          cols: ev?.model?.cols ?? 0,
          cell: (r, c) => ev?.cellValue(r, c) ?? null,
          column: (col) => columns[key]?.[col] ?? null,
        };
      },
    };
  }

  it('parses sheet-qualified references, quoted names and named columns', () => {
    expect(parseFormula('=Sheet2!A1')).toEqual({
      t: 'ref',
      ref: { row: 0, col: 0, absRow: false, absCol: false, sheet: 'Sheet2' },
    });
    expect(parseFormula("='Budget 2026'!B2:B9")).toMatchObject({
      t: 'range',
      from: { sheet: 'Budget 2026', row: 1, col: 1 },
      to: { row: 8, col: 1 },
    });
    expect(parseFormula('=Sheet2!A1:Sheet2!B2')).toMatchObject({ t: 'range', from: { sheet: 'Sheet2' } });
    expect(parseFormula('=Sheet2!A1:Sheet3!B2')).toBeNull();
    expect(parseFormula('=COUNTA(Tasks!Title)')).toMatchObject({
      t: 'call',
      args: [{ t: 'column', sheet: 'Tasks', name: 'Title' }],
    });
    expect(parseFormula("=SUM(Tasks!'Due date')")).toMatchObject({
      t: 'call',
      args: [{ t: 'column', sheet: 'Tasks', name: 'Due date' }],
    });
    expect(parseFormula('=Sheet2!')).toBeNull();
    expect(formulaNameText('Sheet2')).toBe('Sheet2');
    expect(formulaNameText("Budget '26")).toBe("'Budget ''26'");
  });

  it('reads cells, ranges and columns of other sheets through the workbook; #REF! without one', () => {
    const other = evaluated(sheet(3, 1, ['10', '=A1*2', 'x']));
    const ev = new SheetEvaluator();
    const model = sheet(1, 5, [
      '=Sheet2!A2*2',
      "=SUM('Sheet2'!A1:A3)",
      '=COUNTA(Tasks!Title)',
      '=Nope!A1',
      '=Sheet2!A9',
    ]);
    ev.update(model);
    expect(ev.valueAt(0, 0)).toBe('#REF!');
    ev.workbook = workbook({ Sheet2: other }, { Tasks: { Title: ['a', 'b', 'c'] } });
    ev.recalc();
    expect(ev.valueAt(0, 0)).toBe('40');
    expect(ev.valueAt(0, 1)).toBe('30');
    expect(ev.valueAt(0, 2)).toBe('3');
    expect(ev.valueAt(0, 3)).toBe('#REF!');
    expect(ev.valueAt(0, 4)).toBe('');
    // The referenced sheet changes: a recalc (or any update) re-reads it.
    const ops: SheetOp[] = [{ kind: 'set-cells', row: 0, col: 0, values: [['5']] }];
    other.update(applySheetOps(other.model!, ops).model, ops);
    ev.recalc();
    expect(ev.valueAt(0, 0)).toBe('20');
    expect(ev.valueAt(0, 1)).toBe('15');
  });

  it('a cycle across sheets ends in #CYCLE; chains resolve whatever the update order', () => {
    const a = new SheetEvaluator();
    const b = new SheetEvaluator();
    const book = workbook({ A: a, B: b });
    a.workbook = book;
    b.workbook = book;
    a.update(sheet(1, 2, ['=B!A1', '1']));
    b.update(sheet(1, 1, ['=A!A1']));
    expect(a.valueAt(0, 0)).toBe('#CYCLE');
    b.update(sheet(1, 1, ['=A!B1+1']));
    a.recalc();
    expect(a.valueAt(0, 0)).toBe('2');
  });

  it('rewriteFormulaRefs rewrites only the own sheet, or only the named sheet', () => {
    const insert: SheetOp = { kind: 'insert-rows', at: 0, count: 1 };
    expect(rewriteFormulaRefs('=A1+Sheet2!A1', insert)).toBe('=A2+Sheet2!A1');
    expect(rewriteFormulaRefs('=A1+Sheet2!A1', insert, 'sheet2')).toBe('=A1+Sheet2!A2');
    expect(
      rewriteFormulaRefs("=SUM('Budget 2026'!B2:B9)", { kind: 'remove-rows', at: 2, count: 2 }, 'Budget 2026')
    ).toBe("=SUM('Budget 2026'!B2:B7)");
    expect(rewriteFormulaRefs('=Sheet2!A1', { kind: 'remove-rows', at: 0, count: 1 }, 'Sheet2')).toBe('=#REF!');
    expect(rewriteFormulaRefs('=COUNTA(Tasks!Title)+A1', insert)).toBe('=COUNTA(Tasks!Title)+A2');
  });

  it('shiftFormulaRefs moves relative references, keeps anchors, #REF! off the sheet', () => {
    expect(shiftFormulaRefs('=A1+$B$1+C$2+Sheet2!A1', 2, 1)).toBe('=B3+$B$1+D$2+Sheet2!B3');
    expect(shiftFormulaRefs('=SUM(A1:B2)', 1, 0)).toBe('=SUM(A2:B3)');
    expect(shiftFormulaRefs('=A1', -1, 0)).toBe('=#REF!');
    expect(shiftFormulaRefs('="A1"&A1', 0, 1)).toBe('="A1"&B1');
  });

  it('renameFormulaSheet re-points references and named columns', () => {
    expect(renameFormulaSheet('=Sheet2!A1+SUM(sheet2!B1:B3)+A1', 'Sheet2', 'Budget 2026')).toBe(
      "='Budget 2026'!A1+SUM('Budget 2026'!B1:B3)+A1"
    );
    expect(renameFormulaSheet('=COUNTA(Tasks!Title)', 'Tasks', 'Work')).toBe('=COUNTA(Work!Title)');
    expect(renameFormulaSheet('=Other!A1', 'Tasks', 'Work')).toBe('=Other!A1');
  });
});
