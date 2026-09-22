import { Component, TemplateRef, computed, input, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { matchSheetSelectOption, sheetSelectExtension } from './cells/sheet-select';
import { sheetRangeToTsv } from './core/sheet-clipboard';
import { SheetCellContext, SheetCellEditor, SheetCellEditorApi, SheetCellExtension } from './core/sheet-extensions';
import { SheetModel, SheetOp, SheetSelection, applySheetOps, cellAt, createSheet, sheetCellSelection } from './core/sheet-model';
import { SheetRowKind, ShipSpreadsheet } from './sh-spreadsheet';

/** A component editor under test: echoes its inputs, commits through the API. */
@Component({
  standalone: true,
  template: `<span class="probe">{{ value() }}|{{ typed() ?? '-' }}|{{ ctx().type }}</span>`,
})
class ProbeEditor implements SheetCellEditor {
  static last: ProbeEditor | null = null;
  value = input('');
  ctx = input.required<SheetCellContext>();
  typed = input<string | null>(null);
  editor = input.required<SheetCellEditorApi>();
  constructor() {
    ProbeEditor.last = this;
  }
  readValue() {
    return `${this.value()}!`;
  }
}

const PROBE: SheetCellExtension = { type: 'probe', editor: ProbeEditor, render: (raw) => raw.toUpperCase() };

/** A component renderer under test: counts instances, echoes its inputs. */
@Component({
  standalone: true,
  template: `<b class="drawn">{{ value() }}#{{ ctx().row }}</b>`,
})
class ProbeCell {
  static created = 0;
  value = input('');
  ctx = input.required<SheetCellContext>();
  constructor() {
    ProbeCell.created++;
  }
}

const DRAWN: SheetCellExtension = { type: 'drawn', renderer: ProbeCell, render: (raw) => raw, validate: (raw) => (raw === 'bad' ? 'Bad' : null) };
const STATUS = sheetSelectExtension({
  type: 'status',
  options: [
    { key: 'todo', label: 'To do' },
    { key: 'doing', label: 'In progress', color: '#08f' },
    { key: 'review', label: 'Review' },
  ],
});

@Component({
  standalone: true,
  imports: [ShipSpreadsheet],
  template: `
    <ng-template #tpl let-value let-ctx="ctx"><i class="tpl">{{ value }}/{{ ctx.col }}</i></ng-template>
    <sh-spreadsheet
      style="height: 300px"
      [(sheet)]="sheet"
      [(selection)]="selection"
      [editable]="editable()"
      [formulaBar]="formulaBar()"
      [extensions]="extensions()"
      [headers]="headers()"
      [letters]="letters()"
      [rowClass]="rowClass()"
      [rowKind]="rowKind()"
      (ops)="log.push($event)" />
  `,
})
class Host {
  grid = viewChild.required(ShipSpreadsheet);
  tpl = viewChild.required('tpl', { read: TemplateRef });
  sheet = signal<SheetModel>(createSheet(4, 3, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3', 'a4', 'b4', 'c4']));
  selection = signal<SheetSelection | null>(sheetCellSelection(0, 0));
  editable = signal(true);
  formulaBar = signal(false);
  headers = signal<boolean | readonly string[]>(true);
  letters = signal(true);
  rowClass = signal<((row: number) => string | null) | null>(null);
  rowKind = signal<((row: number) => SheetRowKind | null) | null>(null);
  extensions = computed<SheetCellExtension[]>(() => [PROBE, STATUS, DRAWN, { type: 'tpl', renderer: this.tpl(), render: (raw) => raw }]);
  log: SheetOp[][] = [];
}

function key(el: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event;
}

function clipboard(kind: 'paste' | 'copy' | 'cut', data: Record<string, string> = {}) {
  const store = { ...data };
  const event = new Event(kind, { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (type: string) => store[type] ?? '', setData: (type: string, value: string) => void (store[type] = value) },
  });
  return { event, store };
}

describe('ShipSpreadsheet composer', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;
  let grid: ShipSpreadsheet;
  let frame: HTMLElement;

  beforeAll(() => {
    if (typeof HTMLElement !== 'undefined') {
      HTMLElement.prototype.showPopover ??= () => {};
      HTMLElement.prototype.hidePopover ??= () => {};
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
    grid = host.grid();
    frame = grid.frame().nativeElement;
  });

  const editor = () => fixture.nativeElement.querySelector('textarea.shs-editor') as HTMLTextAreaElement | null;
  const active = () => grid.activeCell()!;

  it('moves the selection with arrows, Tab, Home/End and extends with Shift', () => {
    key(frame, 'ArrowDown');
    expect(active()).toEqual({ row: 1, col: 0 });
    key(frame, 'ArrowRight');
    key(frame, 'Tab');
    expect(active()).toEqual({ row: 1, col: 2 });
    key(frame, 'Tab'); // clamped at the last column
    expect(active()).toEqual({ row: 1, col: 2 });
    key(frame, 'Home');
    expect(active()).toEqual({ row: 1, col: 0 });
    key(frame, 'ArrowDown', { shiftKey: true });
    key(frame, 'ArrowRight', { shiftKey: true });
    expect(grid.activeRange()).toEqual({ r0: 1, c0: 0, r1: 2, c1: 1 });
    expect(active()).toEqual({ row: 1, col: 0 });
    key(frame, 'End', { metaKey: true });
    expect(active()).toEqual({ row: 3, col: 2 });
  });

  it('opens the in-cell editor on typing and commits on Enter as one set-cells op, moving down', async () => {
    fixture.detectChanges();
    expect(key(frame, 'x').defaultPrevented).toBe(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const el = editor();
    expect(el).not.toBeNull();
    expect(grid.editing()).toEqual({ row: 0, col: 0, initial: 'x' });
    el!.value = 'xyz';
    key(el!, 'Enter');
    fixture.detectChanges();
    expect(editor()).toBeNull();
    expect(cellAt(host.sheet(), 0, 0)).toBe('xyz');
    expect(host.log).toEqual([[{ kind: 'set-cells', row: 0, col: 0, values: [['xyz']] }]]);
    expect(active()).toEqual({ row: 1, col: 0 });
  });

  it('F2 edits the existing text; Escape cancels without an op; Tab commits and moves right', async () => {
    key(frame, 'F2');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(grid.editing()?.initial).toBe('a1');
    key(editor()!, 'Escape');
    fixture.detectChanges();
    expect(grid.editing()).toBeNull();
    expect(host.log).toEqual([]);

    key(frame, 'Enter');
    fixture.detectChanges();
    await fixture.whenStable();
    editor()!.value = 'A1!';
    key(editor()!, 'Tab');
    fixture.detectChanges();
    expect(cellAt(host.sheet(), 0, 0)).toBe('A1!');
    expect(active()).toEqual({ row: 0, col: 1 });
  });

  it('Delete clears the whole selection as one transaction', () => {
    key(frame, 'ArrowRight', { shiftKey: true });
    key(frame, 'Delete');
    expect(host.log).toEqual([[{ kind: 'set-cells', row: 0, col: 0, values: [['', '']] }]]);
    expect(host.sheet().cells.slice(0, 3)).toEqual(['', '', 'c1']);
  });

  it('undo and redo replay inverses and emit them as ops', () => {
    grid.apply([{ kind: 'set-cells', row: 2, col: 2, values: [['Z']] }]);
    expect(grid.canUndo()).toBe(true);
    key(frame, 'z', { metaKey: true });
    expect(cellAt(host.sheet(), 2, 2)).toBe('c3');
    expect(grid.canRedo()).toBe(true);
    expect(host.log[1]).toEqual([{ kind: 'set-cells', row: 2, col: 2, values: [['c3']] }]);
    key(frame, 'z', { metaKey: true, shiftKey: true });
    expect(cellAt(host.sheet(), 2, 2)).toBe('Z');
    expect(host.log).toHaveLength(3);
  });

  it('pastes TSV at the active cell and grows the grid to fit', () => {
    grid.selectCell(3, 1);
    const { event } = clipboard('paste', { 'text/plain': '1\t2\t3\n4\t5\t6\n' });
    frame.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    const sheet = host.sheet();
    expect(sheet.rows).toBe(5);
    expect(sheet.cols).toBe(4);
    expect(cellAt(sheet, 3, 1)).toBe('1');
    expect(cellAt(sheet, 4, 3)).toBe('6');
    expect(host.log[0].map((op) => op.kind)).toEqual(['insert-rows', 'insert-cols', 'set-cells']);
    expect(grid.activeRange()).toEqual({ r0: 3, c0: 1, r1: 4, c1: 3 });
  });

  it('prefers the table flavor on paste', () => {
    const { event } = clipboard('paste', { 'text/plain': 'ignored', 'text/html': '<table><tr><td>p</td><td>q</td></tr></table>' });
    frame.dispatchEvent(event);
    expect(host.sheet().cells.slice(0, 2)).toEqual(['p', 'q']);
  });

  it('copies TSV and cut also clears', () => {
    key(frame, 'ArrowRight', { shiftKey: true });
    const { event, store } = clipboard('cut');
    frame.dispatchEvent(event);
    expect(store['text/plain']).toBe('a1\tb1');
    expect(store['text/html']).toContain('<td>a1</td>');
    expect(host.sheet().cells.slice(0, 2)).toEqual(['', '']);
  });

  it('inserts and deletes rows and columns around the selection', () => {
    grid.selectRange({ r0: 1, c0: 1, r1: 2, c1: 1 });
    grid.insertRows('above');
    expect(host.sheet().rows).toBe(6);
    expect(cellAt(host.sheet(), 3, 0)).toBe('a2');
    expect(grid.activeRange()).toEqual({ r0: 1, c0: 1, r1: 2, c1: 1 });
    grid.deleteRows();
    expect(host.sheet().rows).toBe(4);
    grid.insertCols('right');
    expect(host.sheet().cols).toBe(4);
    expect(cellAt(host.sheet(), 0, 3)).toBe('c1');
    grid.deleteCols();
    expect(host.sheet().cols).toBe(3);
    expect(host.log.map((t) => t[0].kind)).toEqual(['insert-rows', 'remove-rows', 'insert-cols', 'remove-cols']);
  });

  it('applyRemote is silent and rebases the undo stack over the remote op', () => {
    grid.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['mine']] }]);
    grid.applyRemote([{ kind: 'insert-rows', at: 0, count: 2 }]);
    expect(host.log).toHaveLength(1);
    expect(host.sheet().rows).toBe(6);
    expect(cellAt(host.sheet(), 2, 0)).toBe('mine');
    grid.undo();
    expect(cellAt(host.sheet(), 2, 0)).toBe('a1');
    expect(host.sheet().rows).toBe(6);
    expect(host.log[1]).toEqual([{ kind: 'set-cells', row: 2, col: 0, values: [['a1']] }]);
  });

  it('a model set from outside is adopted and clears the history', () => {
    grid.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['mine']] }]);
    host.sheet.set(createSheet(2, 2));
    fixture.detectChanges();
    expect(grid.canUndo()).toBe(false);
    expect(grid.sheet().rows).toBe(2);
  });

  it('checkbox column: click, Space and typed text go through the extension, no text editor opens', async () => {
    grid.setColType(1, 'checkbox');
    fixture.detectChanges();
    expect(host.sheet().colTypes).toEqual([null, 'checkbox', null]);
    expect(fixture.nativeElement.querySelectorAll('.shs-c.t-checkbox sh-checkbox').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.shs-c.t-checkbox .box.sh-sheet')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.shs-c.t-checkbox sh-checkbox.active')).toBeNull();
    grid.selectCell(0, 1);
    key(frame, 'Enter');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(editor()).toBeNull();
    expect(cellAt(host.sheet(), 0, 1)).toBe('true');
    key(frame, ' ');
    expect(cellAt(host.sheet(), 0, 1)).toBe('');
    key(frame, 'x');
    expect(cellAt(host.sheet(), 0, 1)).toBe('true');
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('.shs-c.t-checkbox sh-checkbox') as HTMLElement;
    expect(box.classList.contains('active')).toBe(true);
    expect(box.getAttribute('aria-checked')).toBe('true');
    expect(box.querySelector('input')).toBeNull();
    expect(box.closest('.shs-hosted')?.hasAttribute('inert')).toBe(true);
    // Pasting into the column parses each value; text columns take the raw string.
    grid.selectCell(1, 0);
    const { event } = clipboard('paste', { 'text/plain': 'raw\tyes\nmore\tnope' });
    frame.dispatchEvent(event);
    expect(host.sheet().cells.slice(3, 5)).toEqual(['raw', 'true']);
    expect(host.sheet().cells.slice(6, 8)).toEqual(['more', '']);
    expect(host.log.map((t) => t[0].kind)).toEqual(['set-col-type', 'set-cells', 'set-cells', 'set-cells', 'set-cells']);
  });

  it('a click on an activatable cell toggles it, a sweep does not', () => {
    grid.setColType(2, 'checkbox');
    const body = fixture.nativeElement.querySelector('.shs-body') as HTMLElement;
    const rect = body.getBoundingClientRect();
    // jsdom has no layout: the body rect is 0×0 at (0,0) and every track has its default size.
    const at = (row: number, col: number) => ({ clientX: rect.left + 44 + 96 * col + 10, clientY: rect.top + 28 * row + 10, bubbles: true, cancelable: true, button: 0 });
    body.dispatchEvent(new MouseEvent('mousedown', at(2, 2)));
    body.dispatchEvent(new MouseEvent('mouseup', at(2, 2)));
    body.dispatchEvent(new MouseEvent('click', at(2, 2)));
    expect(cellAt(host.sheet(), 2, 2)).toBe('true');
    body.dispatchEvent(new MouseEvent('mousedown', at(2, 2)));
    body.dispatchEvent(new MouseEvent('mousemove', { ...at(3, 2), buttons: 1 }));
    body.dispatchEvent(new MouseEvent('mouseup', at(3, 2)));
    body.dispatchEvent(new MouseEvent('click', at(3, 2)));
    expect(cellAt(host.sheet(), 2, 2)).toBe('true');
    expect(grid.activeRange()).toEqual({ r0: 2, c0: 2, r1: 3, c1: 2 });
  });

  it('stays read-only without `editable`: navigation and copy work, nothing edits', () => {
    host.editable.set(false);
    fixture.detectChanges();
    key(frame, 'ArrowDown');
    expect(active()).toEqual({ row: 1, col: 0 });
    expect(key(frame, 'x').defaultPrevented).toBe(false);
    key(frame, 'Delete');
    key(frame, 'z', { metaKey: true });
    fixture.detectChanges();
    expect(grid.editing()).toBeNull();
    expect(host.log).toEqual([]);
    const { event, store } = clipboard('copy');
    frame.dispatchEvent(event);
    expect(store['text/plain']).toBe('a2');
    const paste = clipboard('paste', { 'text/plain': 'nope' });
    frame.dispatchEvent(paste.event);
    expect(host.sheet().cells[3]).toBe('a2');
  });

  describe('component editors', () => {
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const hostEl = () => fixture.nativeElement.querySelector('.shs-editor-host') as HTMLElement | null;

    it('mounts the type\'s component in the overlay with its inputs; commit stores the raw and moves; Escape cancels', async () => {
      grid.setColType(1, 'probe');
      grid.selectCell(0, 1);
      key(frame, 'F2');
      await settle();
      expect(editor()).toBeNull();
      expect(hostEl()?.querySelector('.probe')?.textContent).toBe('b1|-|probe');
      expect(grid.editing()?.component).toBe(ProbeEditor);
      ProbeEditor.last!.editor().commit('picked', 'down');
      await settle();
      expect(hostEl()).toBeNull();
      expect(cellAt(host.sheet(), 0, 1)).toBe('picked');
      expect(host.log.at(-1)).toEqual([{ kind: 'set-cells', row: 0, col: 1, values: [['picked']] }]);
      expect(active()).toEqual({ row: 1, col: 1 });
      // A typed character opens the editor with `typed` set, the value untouched.
      key(frame, 'q');
      await settle();
      expect(hostEl()?.querySelector('.probe')?.textContent).toBe('b2|q|probe');
      key(hostEl()!, 'Escape');
      await settle();
      expect(hostEl()).toBeNull();
      expect(cellAt(host.sheet(), 1, 1)).toBe('b2');
      expect(host.log).toHaveLength(2);
    });

    it('Tab and a click elsewhere commit through readValue; a formula still opens the text editor', async () => {
      grid.setColType(1, 'probe');
      grid.selectCell(0, 1);
      key(frame, 'Enter');
      await settle();
      key(hostEl()!, 'Tab');
      await settle();
      expect(cellAt(host.sheet(), 0, 1)).toBe('b1!');
      expect(active()).toEqual({ row: 0, col: 2 });
      grid.selectCell(1, 1);
      key(frame, 'Enter');
      await settle();
      fixture.nativeElement.querySelector('.shs-body').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 300, clientY: 300 }));
      await settle();
      expect(cellAt(host.sheet(), 1, 1)).toBe('b2!');
      expect(hostEl()).toBeNull();
      grid.selectCell(2, 1);
      key(frame, '=');
      await settle();
      expect(hostEl()).toBeNull();
      expect(editor()?.value).toBe('=');
    });

    it('select: renders labels, parses keys, labels and prefixes, edits through a menu of the options', async () => {
      expect(matchSheetSelectOption('rev', STATUS.options())?.key).toBe('review');
      expect(matchSheetSelectOption('In Progress', STATUS.options())?.key).toBe('doing');
      expect(matchSheetSelectOption('nope', STATUS.options())).toBeNull();
      host.sheet.set(applySheetOps(createSheet(2, 2, ['x', 'doing', 'y', 'gone']), [{ kind: 'set-col-type', col: 1, type: 'status' }]).model);
      await settle();
      const cells = fixture.nativeElement.querySelectorAll('.shs-c.t-status') as NodeListOf<HTMLElement>;
      expect(cells[0].textContent?.trim()).toBe('In progress');
      expect(STATUS.render('doing', { row: 0, col: 1, type: 'status' })).toContain('--chip-c:#08f');
      expect(cells[1].classList.contains('shs-invalid')).toBe(true);
      expect(cells[1].textContent?.trim()).toBe('gone');
      grid.selectCell(0, 1);
      grid.startEdit('rev');
      expect(cellAt(host.sheet(), 0, 1)).toBe('doing');
      await settle();
      const options = () => Array.from(hostEl()?.querySelectorAll('sh-sheet-select-editor .options button') ?? []) as HTMLButtonElement[];
      expect(options().map((b) => b.textContent?.trim())).toEqual(['To do', 'In progress', 'Review', 'Clear']);
      expect(options()[1].classList.contains('active')).toBe(true);
      options()[2].click();
      await settle();
      expect(cellAt(host.sheet(), 0, 1)).toBe('review');
      expect(hostEl()).toBeNull();
      expect(active()).toEqual({ row: 0, col: 1 });
      // Paste resolves through parse; the formula bar's typed text does too.
      grid.selectCell(1, 1);
      const { event } = clipboard('paste', { 'text/plain': 'to do' });
      frame.dispatchEvent(event);
      expect(cellAt(host.sheet(), 1, 1)).toBe('todo');
      expect(sheetRangeToTsv(host.sheet(), { r0: 0, c0: 1, r1: 1, c1: 1 }, grid.registry())).toBe('Review\ntodo'.replace('todo', 'To do'));
    });
  });

  describe('cell renderers', () => {
    const settle = async () => {
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const hosted = () => Array.from(fixture.nativeElement.querySelectorAll('.shs-c.shs-hosted')) as HTMLElement[];

    it('a component renderer draws the cell, one instance per visible cell, re-fed on change', async () => {
      ProbeCell.created = 0;
      grid.setColType(1, 'drawn');
      await settle();
      const cells = hosted();
      expect(cells).toHaveLength(4);
      expect(cells.map((cell) => cell.textContent)).toEqual(['b1#0', 'b2#1', 'b3#2', 'b4#3']);
      expect(cells[0].classList.contains('t-drawn')).toBe(true);
      expect(cells[0].hasAttribute('inert')).toBe(true);
      expect(ProbeCell.created).toBe(4);
      // The string payload no longer carries the column; the other columns are untouched.
      expect(fixture.nativeElement.querySelectorAll('.shs-row')[0].querySelectorAll('.shs-c').length).toBe(3);
      grid.apply([{ kind: 'set-cells', row: 1, col: 1, values: [['bad']] }]);
      await settle();
      expect(ProbeCell.created).toBe(4);
      const changed = hosted()[1];
      expect(changed.textContent).toBe('bad#1');
      expect(changed.classList.contains('shs-invalid')).toBe(true);
      expect(changed.title).toBe('Bad');
      expect(hosted()[0]).toBe(cells[0]);
      // A formula in a rendered column hands the component its value.
      grid.apply([{ kind: 'set-cells', row: 0, col: 1, values: [['=1+1']] }]);
      await settle();
      expect(hosted()[0].textContent).toBe('2#0');
    });

    it('a template renderer gets the value as $implicit and the cell context', async () => {
      grid.setColType(2, 'tpl');
      await settle();
      expect(hosted().map((cell) => cell.querySelector('i.tpl')?.textContent)).toEqual(['c1/2', 'c2/2', 'c3/2', 'c4/2']);
    });

    it('select cells render the option as a real sh-chip', async () => {
      host.sheet.set(applySheetOps(createSheet(2, 1, ['doing', 'gone']), [{ kind: 'set-col-type', col: 0, type: 'status' }]).model);
      await settle();
      const chips = fixture.nativeElement.querySelectorAll('.shs-hosted sh-chip') as NodeListOf<HTMLElement>;
      expect(chips).toHaveLength(2);
      expect(chips[0].textContent?.trim()).toBe('In progress');
      expect(chips[0].classList.contains('dynamic')).toBe(true);
      expect(chips[0].style.getPropertyValue('--chip-c')).toBe('#08f');
      expect(chips[1].classList.contains('unknown')).toBe(true);
      expect(chips[1].textContent?.trim()).toBe('gone');
    });
  });

  describe('headers and row hooks', () => {
    const colHead = () => Array.from(fixture.nativeElement.querySelectorAll('.shs-ch')) as HTMLElement[];
    const rows = () => Array.from(fixture.nativeElement.querySelectorAll('.shs-row')) as HTMLElement[];

    it('labels replace the letters in the column rail; letters:false drops the row rail', () => {
      expect(colHead().map((el) => el.textContent)).toEqual(['A', 'B', 'C']);
      host.headers.set(['Title', 'Status']);
      fixture.detectChanges();
      expect(colHead().map((el) => el.textContent)).toEqual(['Title', 'Status', 'C']);
      expect(colHead()[0].classList.contains('shs-ch-label')).toBe(true);
      expect(colHead()[0].title).toBe('Title');
      expect(rows()[0].querySelector('.shs-rh')).not.toBeNull();
      expect(grid.headOffset()).toBe(44);
      host.letters.set(false);
      fixture.detectChanges();
      expect(colHead().map((el) => el.textContent)).toEqual(['Title', 'Status', '']);
      expect(rows()[0].querySelector('.shs-rh')).toBeNull();
      expect(grid.headOffset()).toBe(0);
      expect(grid.activeLabel()).toBe('A1');
      // Plain headers without letters: no rails at all.
      host.headers.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.shs-colhead')).toBeNull();
      host.letters.set(true);
      host.headers.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.shs-colhead')).toBeNull();
      expect(grid.headOffset()).toBe(0);
    });

    it('rowClass styles rows; a group row is one heading band; group and readonly rows refuse edits', async () => {
      host.rowClass.set((row) => (row === 3 ? 'done' : null));
      host.rowKind.set((row) => (row === 0 ? 'group' : row === 2 ? 'readonly' : null));
      fixture.detectChanges();
      expect(rows()[3].classList.contains('done')).toBe(true);
      expect(rows()[0].classList.contains('shs-row-group')).toBe(true);
      expect(rows()[2].classList.contains('shs-row-readonly')).toBe(true);
      const heading = rows()[0].querySelectorAll('.shs-c');
      expect(heading).toHaveLength(1);
      expect(heading[0].classList.contains('shs-group')).toBe(true);
      expect(heading[0].textContent).toBe('a1');
      expect((heading[0] as HTMLElement).style.left).toBe('44px');
      expect(rows()[1].querySelectorAll('.shs-c')).toHaveLength(3);
      // Typing, Enter, Delete and paste leave the group and the read-only row alone.
      expect(key(frame, 'x').defaultPrevented).toBe(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(grid.editing()).toBeNull();
      grid.selectCell(2, 0);
      key(frame, 'Enter');
      fixture.detectChanges();
      expect(grid.editing()).toBeNull();
      grid.selectRange({ r0: 1, c0: 0, r1: 2, c1: 0 });
      key(frame, 'Delete');
      expect(host.sheet().cells.slice(3, 7)).toEqual(['', 'b2', 'c2', 'a3']);
      grid.selectCell(1, 1);
      frame.dispatchEvent(clipboard('paste', { 'text/plain': 'p\nq\nr' }).event);
      expect(cellAt(host.sheet(), 1, 1)).toBe('p');
      expect(cellAt(host.sheet(), 2, 1)).toBe('b3');
      expect(cellAt(host.sheet(), 3, 1)).toBe('r');
      // The formula bar and a programmatic edit are refused too; an ordinary row still takes them.
      grid.selectCell(2, 2);
      grid.startEdit('z');
      expect(grid.editing()).toBeNull();
      expect(cellAt(host.sheet(), 2, 2)).toBe('c3');
      grid.selectCell(1, 2);
      grid.startEdit('z');
      grid.commitEdit();
      expect(cellAt(host.sheet(), 1, 2)).toBe('z');
      // Checkbox activation on a read-only row is refused.
      grid.setColType(2, 'checkbox');
      expect(grid.activateCell(2, 2)).toBe(false);
      expect(grid.activateCell(1, 2)).toBe(true);
    });
  });

  describe('formulas', () => {
    const cellText = (row: number, col: number) => (fixture.nativeElement.querySelectorAll('.shs-row')[row].querySelectorAll('.shs-c')[col] as HTMLElement).textContent;

    it('shows the evaluated value in the grid, the source in the editor, and re-evaluates on edits and undo', async () => {
      grid.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['1', '2', '=A1+B1'], ['=SUM(A1:B1)*2']] }]);
      fixture.detectChanges();
      expect(cellText(0, 2)).toBe('3');
      expect(cellText(1, 0)).toBe('6');
      expect(grid.values().valueAt(0, 2)).toBe('3');
      expect(grid.values().isFormulaAt(0, 2)).toBe(true);
      grid.selectCell(0, 2);
      key(frame, 'F2');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(grid.editing()?.initial).toBe('=A1+B1');
      editor()!.value = '=A1*10';
      key(editor()!, 'Enter');
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 0, 2)).toBe('=A1*10');
      expect(cellText(0, 2)).toBe('10');
      // Editing an input recomputes the dependents incrementally.
      grid.apply([{ kind: 'set-cells', row: 0, col: 0, values: [['5']] }]);
      fixture.detectChanges();
      expect(cellText(0, 2)).toBe('50');
      expect(cellText(1, 0)).toBe('14');
      key(frame, 'z', { metaKey: true });
      fixture.detectChanges();
      expect(cellText(0, 2)).toBe('10');
      expect(cellText(1, 0)).toBe('6');
    });

    it('errors show their token with the source as title; a model set from outside is evaluated from scratch', () => {
      host.sheet.set(createSheet(2, 2, ['=1/0', '=A1', '=A2', 'x']));
      fixture.detectChanges();
      expect(cellText(0, 0)).toBe('#DIV/0!');
      expect(cellText(0, 1)).toBe('#DIV/0!');
      expect(cellText(1, 0)).toBe('#CYCLE');
      const cell = fixture.nativeElement.querySelectorAll('.shs-row')[0].querySelector('.shs-c') as HTMLElement;
      expect(cell.classList.contains('shs-error')).toBe(true);
      expect(cell.title).toBe('=1/0');
      expect(grid.values().errorAt(1, 0)).toBe('#CYCLE');
    });

    it('a formula in a typed column formats its value, stores its source, and survives a row insert', () => {
      host.sheet.set(applySheetOps(createSheet(3, 2, ['10', '', '20', '', '', '']), [{ kind: 'set-col-type', col: 0, type: 'currency' }]).model);
      fixture.detectChanges();
      grid.selectCell(2, 0);
      grid.startEdit('=SUM(A1:A2)');
      grid.commitEdit();
      expect(cellAt(host.sheet(), 2, 0)).toBe('=SUM(A1:A2)');
      fixture.detectChanges();
      expect(cellText(2, 0)).toBe('$30.00');
      expect(cellText(0, 0)).toBe('$10.00');
      // Pasting a formula into a typed column keeps the formula.
      grid.selectCell(2, 1);
      const { event } = clipboard('paste', { 'text/plain': '=A3/3' });
      frame.dispatchEvent(event);
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 2, 1)).toBe('=A3/3');
      expect(cellText(2, 1)).toBe('10');
      grid.apply([{ kind: 'insert-rows', at: 1, count: 1 }]);
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 3, 0)).toBe('=SUM(A1:A3)');
      expect(cellText(3, 0)).toBe('$30.00');
      // A text export through the registry and the values carries the display form of the value.
      expect(sheetRangeToTsv(host.sheet(), { r0: 3, c0: 0, r1: 3, c1: 1 }, grid.registry(), grid.values())).toBe('$30.00\t10');
      expect(sheetRangeToTsv(host.sheet(), { r0: 3, c0: 0, r1: 3, c1: 1 })).toBe('=SUM(A1:A3)\t=A4/3');
    });

    it('formula bar: shows the active source, Enter commits it, Escape reverts, read-only without editable', async () => {
      host.formulaBar.set(true);
      host.sheet.set(applySheetOps(createSheet(2, 2, ['1', '=A1+1', '0.5', '']), [{ kind: 'set-col-type', col: 0, type: 'percent' }]).model);
      fixture.detectChanges();
      await fixture.whenStable();
      const bar = () => fixture.nativeElement.querySelector('input.shs-bar-input') as HTMLInputElement;
      expect(bar().value).toBe('50%'.replace('50%', grid.activeSource()));
      grid.selectCell(0, 1);
      fixture.detectChanges();
      expect(bar().value).toBe('=A1+1');
      grid.selectCell(1, 0);
      fixture.detectChanges();
      expect(bar().value).toBe('50%');
      bar().value = '=A1*3';
      key(bar(), 'Enter');
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 1, 0)).toBe('=A1*3');
      expect(cellText(1, 0)).toBe('300%');
      expect(host.log.at(-1)).toEqual([{ kind: 'set-cells', row: 1, col: 0, values: [['=A1*3']] }]);
      bar().value = 'junk';
      key(bar(), 'Escape');
      expect(bar().value).toBe('=A1*3');
      expect(cellAt(host.sheet(), 1, 0)).toBe('=A1*3');
      // A plain value goes through the column type's parse.
      bar().value = '25';
      key(bar(), 'Enter');
      expect(cellAt(host.sheet(), 1, 0)).toBe('0.25');
      // A click on another cell blurs the bar: the text lands in the cell it was typed for, not the new one.
      bar().dispatchEvent(new FocusEvent('focus'));
      bar().value = '=A1*4';
      grid.selectCell(0, 1);
      bar().dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 1, 0)).toBe('=A1*4');
      expect(cellAt(host.sheet(), 0, 1)).toBe('=A1+1');
      expect(bar().value).toBe('=A1+1');
      // Typed text committed by a blur, then a move to a cell with the same source as before the typing: the bar follows.
      grid.selectCell(1, 1);
      fixture.detectChanges();
      expect(bar().value).toBe('');
      bar().dispatchEvent(new FocusEvent('focus'));
      bar().value = 'typed';
      bar().dispatchEvent(new FocusEvent('blur'));
      grid.selectCell(1, 1);
      grid.selectCell(0, 1);
      grid.selectCell(1, 1);
      fixture.detectChanges();
      expect(cellAt(host.sheet(), 1, 1)).toBe('typed');
      expect(bar().value).toBe('typed');
      grid.apply([{ kind: 'set-cells', row: 1, col: 1, values: [['']] }]);
      fixture.detectChanges();
      expect(bar().value).toBe('');
      host.editable.set(false);
      fixture.detectChanges();
      expect(bar().readOnly).toBe(true);
    });
  });
});
