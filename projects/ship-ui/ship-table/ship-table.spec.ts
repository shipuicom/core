import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipSort, ShipTable, ShipTableColumn, ShipTableContent } from './ship-table';

@Component({
  selector: 'sh-test-table',
  template: `
    <sh-table [data]="dataSource()" [loading]="isLoading()" [(sortByColumn)]="sortByColumn">
      <tr thead>
        <th id="col-name" shSort="name">Name</th>
        <th id="col-age" shSort="age">Age</th>
      </tr>
      @for (row of dataSource(); track $index) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </sh-table>
  `,
  standalone: true,
  imports: [ShipTable, ShipSort],
})
class TestTableComponent {
  shipTable = viewChild(ShipTable);

  dataSource = signal([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
    { name: 'Charlie', age: 35 },
  ]);

  isLoading = signal(false);
  sortByColumn = signal<string | null>(null);
}

@Component({
  selector: 'sh-test-config-table',
  template: `
    <sh-table
      [data]="dataSource()"
      [(sortByColumn)]="sortByColumn"
      (dataChange)="dataSource.set($event)"
      [aria-label]="ariaLabel()"
      [aria-labelledby]="ariaLabelledby()">
      <sh-table-content [data]="dataSource()" [columns]="columns()"></sh-table-content>
    </sh-table>

    <ng-template #customTemplate let-row>Custom {{ row.name }}</ng-template>
  `,
  standalone: true,
  imports: [ShipTable, ShipTableContent],
})
class TestConfigTableComponent {
  shipTable = viewChild(ShipTable);
  customTemplate = viewChild.required<TemplateRef<any>>('customTemplate');

  dataSource = signal<any[]>([
    { name: 'Alice', age: 30 },
    { name: 'Bob', age: 25 },
  ]);

  columns = signal<ShipTableColumn[]>([]);
  sortByColumn = signal<string | null>(null);
  ariaLabel = signal<string | null>(null);
  ariaLabelledby = signal<string | null>(null);
}

describe('ShipTable ARIA & Accessibility', () => {
  let fixture: ComponentFixture<TestTableComponent>;
  let hostComponent: TestTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestTableComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should apply role="table" to the host sh-table element', () => {
    const tableEl = fixture.nativeElement.querySelector('sh-table');
    expect(tableEl.getAttribute('role')).toBe('table');
  });

  it('should toggle aria-busy attribute based on loading input', () => {
    const tableEl = fixture.nativeElement.querySelector('sh-table');

    hostComponent.isLoading.set(false);
    fixture.detectChanges();
    expect(tableEl.getAttribute('aria-busy')).toBe('false');

    hostComponent.isLoading.set(true);
    fixture.detectChanges();
    expect(tableEl.getAttribute('aria-busy')).toBe('true');
  });

  it('should apply role="rowgroup" to thead and tbody elements in the template', () => {
    const theadEl = fixture.nativeElement.querySelector('thead');
    const tbodyEl = fixture.nativeElement.querySelector('tbody');

    expect(theadEl.getAttribute('role')).toBe('rowgroup');
    expect(tbodyEl.getAttribute('role')).toBe('rowgroup');
  });

  it('should apply role="columnheader", tabindex="0", and aria-sort to shSort directive host elements', () => {
    const nameHeader = fixture.nativeElement.querySelector('#col-name');

    expect(nameHeader.getAttribute('role')).toBe('columnheader');
    expect(nameHeader.getAttribute('tabindex')).toBe('0');
    expect(nameHeader.getAttribute('aria-sort')).toBe('none');
  });

  it('should update aria-sort attribute and sort the data when clicking the header', () => {
    const nameHeader = fixture.nativeElement.querySelector('#col-name');

    // Sort Ascending
    nameHeader.click();
    fixture.detectChanges();
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(hostComponent.sortByColumn()).toBe('name');

    // Sort Descending
    nameHeader.click();
    fixture.detectChanges();
    expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
    expect(hostComponent.sortByColumn()).toBe('-name');

    // Clear Sort
    nameHeader.click();
    fixture.detectChanges();
    expect(nameHeader.getAttribute('aria-sort')).toBe('none');
    expect(hostComponent.sortByColumn()).toBeNull();
  });

  it('should trigger sort on Enter keypress', () => {
    const ageHeader = fixture.nativeElement.querySelector('#col-age');

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    ageHeader.dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(ageHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(hostComponent.sortByColumn()).toBe('age');
  });

  it('should trigger sort and preventDefault on Space keypress', () => {
    const ageHeader = fixture.nativeElement.querySelector('#col-age');

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
    const preventSpy = vi.spyOn(spaceEvent, 'preventDefault');

    ageHeader.dispatchEvent(spaceEvent);
    fixture.detectChanges();

    expect(preventSpy).toHaveBeenCalled();
    expect(ageHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(hostComponent.sortByColumn()).toBe('age');
  });
});

describe('ShipTable Configuration-Based Columns', () => {
  let fixture: ComponentFixture<TestConfigTableComponent>;
  let hostComponent: TestConfigTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestConfigTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestConfigTableComponent);
    hostComponent = fixture.componentInstance;
  });

  it('should render columns and rows dynamically based on config', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'Name' },
      { id: 'age', header: 'Age' },
    ]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    expect(headers.length).toBe(2);
    expect(headers[0].textContent?.trim()).toBe('Name');
    expect(headers[1].textContent?.trim()).toBe('Age');

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells.length).toBe(4);
    expect(cells[0].textContent?.trim()).toBe('Alice');
    expect(cells[1].textContent?.trim()).toBe('30');
    expect(cells[2].textContent?.trim()).toBe('Bob');
    expect(cells[3].textContent?.trim()).toBe('25');
  });

  it('should apply role="columnheader", tabindex="0", and aria-sort="none" only if sortable is true', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'Name', sortable: true },
      { id: 'age', header: 'Age', sortable: false },
    ]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');

    // Sortable column
    expect(headers[0].getAttribute('role')).toBe('columnheader');
    expect(headers[0].getAttribute('tabindex')).toBe('0');
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
    expect(headers[0].classList.contains('sortable')).toBe(true);

    // Non-sortable column
    expect(headers[1].getAttribute('role')).toBe('columnheader');
    expect(headers[1].getAttribute('tabindex')).toBeNull();
    expect(headers[1].getAttribute('aria-sort')).toBeNull();
    expect(headers[1].classList.contains('sortable')).toBe(false);
  });

  it('should support custom cell rendering functions', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'Name' },
      { id: 'age', header: 'Age', cell: (row) => `${row.age} years old` },
    ]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[1].textContent?.trim()).toBe('30 years old');
    expect(cells[3].textContent?.trim()).toBe('25 years old');
  });

  it('should support custom cellTemplate (TemplateRef)', () => {
    hostComponent.columns.set([{ id: 'name', header: 'Name', cellTemplate: hostComponent.customTemplate() }]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].textContent?.trim()).toBe('Custom Alice');
    expect(cells[1].textContent?.trim()).toBe('Custom Bob');
  });

  it('should apply role="cell" to generated cells', () => {
    hostComponent.columns.set([{ id: 'name', header: 'User Name' }]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].getAttribute('role')).toBe('cell');
  });

  it('should apply role="rowheader" to cells if rowHeader is true in config', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'User Name', rowHeader: true },
      { id: 'age', header: 'Age' },
    ]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].getAttribute('role')).toBe('rowheader');
    expect(cells[1].getAttribute('role')).toBe('cell');
  });

  it('should apply id, aria-label to header and link cells via aria-labelledby', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'User Name' },
      { id: 'age', header: 'Age' },
    ]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    const cells = fixture.nativeElement.querySelectorAll('tbody td');

    // Headers should have id and aria-label
    expect(headers[0].getAttribute('id')).toBe('name');
    expect(headers[0].getAttribute('aria-label')).toBe('User Name');
    expect(headers[1].getAttribute('id')).toBe('age');
    expect(headers[1].getAttribute('aria-label')).toBe('Age');

    // Cells should have generated id and aria-labelledby pointing to header + self
    expect(cells[0].getAttribute('id')).toBe('name-0');
    expect(cells[0].getAttribute('aria-labelledby')).toBe('name name-0');
    expect(cells[1].getAttribute('id')).toBe('age-0');
    expect(cells[1].getAttribute('aria-labelledby')).toBe('age age-0');

    // Row 2 cells should have correct indices
    expect(cells[2].getAttribute('id')).toBe('name-1');
    expect(cells[2].getAttribute('aria-labelledby')).toBe('name name-1');
    expect(cells[3].getAttribute('id')).toBe('age-1');
    expect(cells[3].getAttribute('aria-labelledby')).toBe('age age-1');
  });

  it('should apply aria-label and aria-labelledby dynamically', () => {
    fixture.detectChanges();
    const tableEl = fixture.nativeElement.querySelector('sh-table');

    expect(tableEl.getAttribute('aria-label')).toBeNull();
    expect(tableEl.getAttribute('aria-labelledby')).toBeNull();

    hostComponent.ariaLabel.set('Users List');
    hostComponent.ariaLabelledby.set('table-title');
    fixture.detectChanges();

    expect(tableEl.getAttribute('aria-label')).toBe('Users List');
    expect(tableEl.getAttribute('aria-labelledby')).toBe('table-title');
  });

  it('should conditionally apply shResize based on config', () => {
    hostComponent.columns.set([
      { id: 'name', header: 'Name', resizable: true, minWidth: 100, maxWidth: 300 },
      { id: 'age', header: 'Age', resizable: false },
    ]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');

    // Resizable column should have the .sh-resizer element (which shResize creates)
    const nameResizer = headers[0].querySelector('.sh-resizer');
    expect(nameResizer).toBeTruthy();

    // Non-resizable column should not have the .sh-resizer element
    const ageResizer = headers[1].querySelector('.sh-resizer');
    expect(ageResizer).toBeFalsy();
  });

  it('should not trigger sorting when releasing the resizer after resizing', () => {
    vi.useFakeTimers();
    hostComponent.columns.set([
      { id: 'name', header: 'Name', resizable: true, sortable: true },
    ]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('thead th');
    const resizer = header.querySelector('.sh-resizer');
    expect(resizer).toBeTruthy();

    // 1. Mouse down on the resizer
    resizer.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    fixture.detectChanges();
    expect(header.classList.contains('resizing')).toBe(true);

    // 2. Mouse move on document to simulate resizing/dragging
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    fixture.detectChanges();
    expect(header.classList.contains('resizing')).toBe(true);

    // 3. Mouse up on document to release resizer
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    fixture.detectChanges();
    expect(header.classList.contains('resizing')).toBe(false);

    // The click event is dispatched on the header (or bubbles up) when mouse is released
    header.click();
    fixture.detectChanges();

    // The sort should NOT be triggered
    expect(hostComponent.sortByColumn()).toBeNull();

    // 4. Advance time past 50ms
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    // Now click should trigger sorting
    header.click();
    fixture.detectChanges();
    expect(hostComponent.sortByColumn()).toBe('name');

    vi.useRealTimers();
  });

  it('should support default formatting for date, boolean, and badge types', () => {
    hostComponent.dataSource.set([
      { name: 'Alice', joined: new Date('2026-01-10T00:00:00'), active: true, status: 'active' },
      { name: 'Bob', joined: new Date('2026-05-15T00:00:00'), active: false, status: 'pending' },
    ]);
    hostComponent.columns.set([
      { id: 'joined', header: 'Joined', type: 'date' },
      { id: 'active', header: 'Active', type: 'boolean' },
      { id: 'status', header: 'Status', type: 'badge' },
    ]);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');

    // Check Date formatting
    const formattedDate = new Date('2026-01-10T00:00:00').toLocaleDateString();
    expect(rows[0].querySelectorAll('td')[0].textContent?.trim()).toBe(formattedDate);

    // Check Boolean formatting (icon check/x)
    expect(rows[0].querySelectorAll('td')[1].querySelector('sh-icon')).toBeTruthy();
    expect(rows[1].querySelectorAll('td')[1].querySelector('sh-icon')).toBeTruthy();

    // Check Badge formatting (renders sh-chip)
    expect(rows[0].querySelectorAll('td')[2].querySelector('sh-chip')).toBeTruthy();
    expect(rows[0].querySelectorAll('td')[2].querySelector('sh-chip')?.textContent?.trim()).toBe('active');
  });

  it('should support custom format override', () => {
    hostComponent.columns.set([{ id: 'age', header: 'Age', format: (val) => `${val} yrs` }]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    // First row's age cell (Alice, age 30)
    expect(cells[0].textContent?.trim()).toBe('30 yrs');
  });

  it('should support custom sortPredicate override', () => {
    hostComponent.dataSource.set([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ]);
    hostComponent.columns.set([
      { id: 'name', header: 'Name' },
      { id: 'age', header: 'Age', sortable: true, sortPredicate: (a, b) => b.age - a.age },
    ]);
    fixture.detectChanges();

    // Trigger sorting on Age header
    const ageHeader = fixture.nativeElement.querySelector('thead th:nth-child(2)');

    // Triggering sorting (this updates sortByColumn via ShipTable double-binding logic)
    ageHeader.click();
    fixture.detectChanges();

    // Access sorting outcome
    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    // Descending order from sortPredicate: Charlie (35), Alice (30), Bob (25)
    // Row 0: Charlie (cells[4] -> now cells[0]), 35 (cells[5] -> now cells[1])
    // Row 1: Alice (cells[0] -> now cells[2]), 30 (cells[1] -> now cells[3])
    // Row 2: Bob (cells[2] -> now cells[4]), 25 (cells[3] -> now cells[5])
    expect(cells[1].textContent?.trim()).toBe('35');
    expect(cells[3].textContent?.trim()).toBe('30');
    expect(cells[5].textContent?.trim()).toBe('25');
  });

  it('should support default alphabetical sorting for string and badge types', () => {
    hostComponent.dataSource.set([
      { name: 'Charlie', status: 'pending' },
      { name: 'alice', status: 'active' },
      { name: 'Bob', status: 'archived' },
    ]);
    hostComponent.columns.set([
      { id: 'name', header: 'Name', sortable: true, type: 'string' },
      { id: 'status', header: 'Status', sortable: true, type: 'badge' },
    ]);
    fixture.detectChanges();

    // Trigger sorting on Name header (ascending)
    const nameHeader = fixture.nativeElement.querySelector('thead th:nth-child(1)');
    nameHeader.click();
    fixture.detectChanges();

    let cells = fixture.nativeElement.querySelectorAll('tbody td');
    // Ascending order: alice, Bob, Charlie (case-insensitive)
    expect(cells[0].textContent?.trim()).toBe('alice');
    expect(cells[2].textContent?.trim()).toBe('Bob');
    expect(cells[4].textContent?.trim()).toBe('Charlie');

    // Trigger sorting on Status header (ascending)
    const statusHeader = fixture.nativeElement.querySelector('thead th:nth-child(2)');
    statusHeader.click();
    fixture.detectChanges();

    cells = fixture.nativeElement.querySelectorAll('tbody td');
    // Ascending order: active, archived, pending
    expect(cells[1].textContent?.trim()).toBe('active');
    expect(cells[3].textContent?.trim()).toBe('archived');
    expect(cells[5].textContent?.trim()).toBe('pending');
  });

  it('should not mutate the original data source array when sorting', () => {
    const originalData = [
      { name: 'Charlie', age: 35 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    // Set data
    hostComponent.dataSource.set(originalData);
    hostComponent.columns.set([
      { id: 'name', header: 'Name', sortable: true },
    ]);
    fixture.detectChanges();

    // Trigger sorting
    const nameHeader = fixture.nativeElement.querySelector('thead th:nth-child(1)');
    nameHeader.click();
    fixture.detectChanges();

    // Verify emitted/sorted data is sorted
    expect(hostComponent.dataSource()).toEqual([
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ]);

    // Verify originalData array was NOT mutated/sorted in-place
    expect(originalData).toEqual([
      { name: 'Charlie', age: 35 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ]);
  });

  it('should support nested dot-notation paths for accessorKey', () => {
    hostComponent.dataSource.set([
      { name: 'Alice', details: { address: { city: 'New York' } } },
      { name: 'Bob', details: { address: undefined } },
      { name: 'Charlie', details: null },
      { name: 'Dave' },
    ]);
    hostComponent.columns.set([
      { id: 'city', header: 'City', accessorKey: 'details.address.city' },
    ]);
    fixture.detectChanges();

    const cells = fixture.nativeElement.querySelectorAll('tbody td');
    expect(cells[0].textContent?.trim()).toBe('New York');
    expect(cells[1].textContent?.trim()).toBe('');
    expect(cells[2].textContent?.trim()).toBe('');
    expect(cells[3].textContent?.trim()).toBe('');
  });

  it('should support sorting by a nested dot-notation accessorKey', () => {
    hostComponent.dataSource.set([
      { name: 'Alice', details: { address: { city: 'Paris' } } },
      { name: 'Charlie', details: { address: { city: 'London' } } },
      { name: 'Bob', details: { address: { city: 'Berlin' } } },
    ]);
    hostComponent.columns.set([
      { id: 'city', header: 'City', accessorKey: 'details.address.city', sortable: true },
    ]);
    fixture.detectChanges();

    const cityHeader = fixture.nativeElement.querySelector('thead th:nth-child(1)');

    // Sort Ascending: Berlin, London, Paris
    cityHeader.click();
    fixture.detectChanges();

    expect(hostComponent.dataSource()).toEqual([
      { name: 'Bob', details: { address: { city: 'Berlin' } } },
      { name: 'Charlie', details: { address: { city: 'London' } } },
      { name: 'Alice', details: { address: { city: 'Paris' } } },
    ]);

    // Sort Descending: Paris, London, Berlin
    cityHeader.click();
    fixture.detectChanges();

    expect(hostComponent.dataSource()).toEqual([
      { name: 'Alice', details: { address: { city: 'Paris' } } },
      { name: 'Charlie', details: { address: { city: 'London' } } },
      { name: 'Bob', details: { address: { city: 'Berlin' } } },
    ]);
  });

  it('should always sort null or undefined values to the bottom', () => {
    hostComponent.dataSource.set([
      { name: 'Charlie', age: 35 },
      { name: 'Alice', age: null },
      { name: 'Bob', age: 25 },
    ]);
    hostComponent.columns.set([
      { id: 'age', header: 'Age', sortable: true, type: 'number' },
    ]);
    fixture.detectChanges();

    const ageHeader = fixture.nativeElement.querySelector('thead th:nth-child(1)');

    // Sort Ascending: Bob (25), Charlie (35), Alice (null)
    ageHeader.click();
    fixture.detectChanges();

    expect(hostComponent.dataSource()).toEqual([
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
      { name: 'Alice', age: null },
    ]);

    // Sort Descending: Charlie (35), Bob (25), Alice (null)
    ageHeader.click();
    fixture.detectChanges();

    expect(hostComponent.dataSource()).toEqual([
      { name: 'Charlie', age: 35 },
      { name: 'Bob', age: 25 },
      { name: 'Alice', age: null },
    ]);
  });
});
