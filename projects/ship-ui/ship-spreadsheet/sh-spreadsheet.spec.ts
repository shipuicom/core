import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SheetModel, SheetOp, SheetSelection, cellAt, createSheet, sheetCellSelection } from './core/sheet-model';
import { ShipSpreadsheet } from './sh-spreadsheet';

@Component({
  standalone: true,
  imports: [ShipSpreadsheet],
  template: `<sh-spreadsheet style="height: 300px" [(sheet)]="sheet" [(selection)]="selection" [editable]="editable()" (ops)="log.push($event)" />`,
})
class Host {
  grid = viewChild.required(ShipSpreadsheet);
  sheet = signal<SheetModel>(createSheet(4, 3, ['a1', 'b1', 'c1', 'a2', 'b2', 'c2', 'a3', 'b3', 'c3', 'a4', 'b4', 'c4']));
  selection = signal<SheetSelection | null>(sheetCellSelection(0, 0));
  editable = signal(true);
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
    expect(fixture.nativeElement.querySelectorAll('.shs-c.t-checkbox .shs-check').length).toBe(4);
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
    expect(fixture.nativeElement.querySelector('.shs-check.on')).not.toBeNull();
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
});
