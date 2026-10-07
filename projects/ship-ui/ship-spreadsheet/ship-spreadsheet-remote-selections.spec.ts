import { Component, inject, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CollabPresence } from '@ship-ui/core/ship-editor-collab';
import { SheetModel, SheetSelection, createSheet } from './core/sheet-model';
import { ShipSheetCollab } from './sheet-collab';
import { ShipSpreadsheet } from './ship-spreadsheet';
import { ShipSpreadsheetRemoteSelections } from './ship-spreadsheet-remote-selections';

@Component({
  standalone: true,
  imports: [ShipSpreadsheet, ShipSpreadsheetRemoteSelections],
  providers: [ShipSheetCollab],
  template: `
    <sh-spreadsheet style="height: 300px" [(sheet)]="sheet" [editable]="true">
      <sh-spreadsheet-remote-selections [collab]="collab" />
    </sh-spreadsheet>
  `,
})
class Host {
  collab = inject(ShipSheetCollab);
  grid = viewChild.required(ShipSpreadsheet);
  overlay = viewChild.required(ShipSpreadsheetRemoteSelections);
  sheet = signal<SheetModel>(createSheet(4, 3));
}

const peer = (clientId: string, selection: SheetSelection | null, name = 'Ada'): CollabPresence<SheetSelection> => ({ clientId, name, color: 'rgb(10, 20, 30)', selection, version: 0 });

describe('ShipSpreadsheetRemoteSelections', () => {
  let fixture: ComponentFixture<Host>;
  let host: Host;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  const boxes = () => Array.from(fixture.nativeElement.querySelectorAll('.remote-range') as NodeListOf<HTMLElement>);

  it('mounts inside the grid body and paints nothing without peers', () => {
    const overlayEl = fixture.nativeElement.querySelector('sh-spreadsheet-remote-selections') as HTMLElement;
    expect(overlayEl.parentElement?.classList.contains('shs-body')).toBe(true);
    expect(boxes()).toEqual([]);
  });

  it('paints one box per range on the grid geometry, the name on the last range', () => {
    host.collab.peers.set(new Map([['p1', peer('p1', { ranges: [{ r0: 0, c0: 0, r1: 0, c1: 0 }, { r0: 2, c0: 1, r1: 1, c1: 2 }] })]]));
    fixture.detectChanges();
    const [first, second] = boxes();
    expect(boxes().length).toBe(2);
    expect([first.style.top, first.style.left, first.style.width, first.style.height]).toEqual(['0px', '44px', '96px', '28px']);
    expect([second.style.top, second.style.left, second.style.width, second.style.height]).toEqual(['28px', '140px', '192px', '56px']);
    expect(first.querySelector('.remote-label')).toBeNull();
    expect(second.querySelector('.remote-label')?.textContent).toBe('Ada');
    expect(second.style.getPropertyValue('--peer-c')).toBe('rgb(10, 20, 30)');
  });

  it('keeps the name tag inside a range that starts on the first row', () => {
    host.collab.peers.set(new Map([['p1', peer('p1', { ranges: [{ r0: 0, c0: 1, r1: 1, c1: 1 }] })]]));
    fixture.detectChanges();
    expect(boxes()[0].querySelector('.remote-label')?.classList.contains('inside')).toBe(true);
    host.collab.peers.set(new Map([['p1', peer('p1', { ranges: [{ r0: 1, c0: 1, r1: 1, c1: 1 }] })]]));
    fixture.detectChanges();
    expect(boxes()[0].querySelector('.remote-label')?.classList.contains('inside')).toBe(false);
  });

  it('follows the model: a range past the sheet clamps, a resized column moves the box', () => {
    host.collab.peers.set(new Map([['p1', peer('p1', { ranges: [{ r0: 9, c0: 9, r1: 9, c1: 9 }] })]]));
    fixture.detectChanges();
    expect([boxes()[0].style.top, boxes()[0].style.left]).toEqual(['84px', '236px']);
    host.grid().apply([{ kind: 'set-col-width', col: 0, width: 150 }]);
    fixture.detectChanges();
    expect(boxes()[0].style.left).toBe('290px');
  });

  it('drops a peer that left or has no selection', () => {
    host.collab.peers.set(new Map([['p1', peer('p1', { ranges: [{ r0: 0, c0: 0, r1: 0, c1: 0 }] })], ['p2', peer('p2', null, 'Bob')]]));
    fixture.detectChanges();
    expect(boxes().length).toBe(1);
    host.collab.peers.set(new Map());
    fixture.detectChanges();
    expect(boxes()).toEqual([]);
  });
});
