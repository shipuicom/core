import { Component, signal, TemplateRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    
    nameHeader.click();
    fixture.detectChanges();
    expect(nameHeader.getAttribute('aria-sort')).toBe('ascending');
    expect(hostComponent.sortByColumn()).toBe('name');

    
    nameHeader.click();
    fixture.detectChanges();
    expect(nameHeader.getAttribute('aria-sort')).toBe('descending');
    expect(hostComponent.sortByColumn()).toBe('-name');

    
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

    
    expect(headers[0].getAttribute('role')).toBe('columnheader');
    expect(headers[0].getAttribute('tabindex')).toBe('0');
    expect(headers[0].getAttribute('aria-sort')).toBe('none');
    expect(headers[0].classList.contains('sortable')).toBe(true);

    
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
    hostComponent.columns.set([{ id: 'name', header: 'Name', resizable: true, sortable: true }]);
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
    hostComponent.columns.set([{ id: 'name', header: 'Name', sortable: true }]);
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
    hostComponent.columns.set([{ id: 'city', header: 'City', accessorKey: 'details.address.city' }]);
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
    hostComponent.columns.set([{ id: 'city', header: 'City', accessorKey: 'details.address.city', sortable: true }]);
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
    hostComponent.columns.set([{ id: 'age', header: 'Age', sortable: true, type: 'number' }]);
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

describe('ShipTable Keyboard Resizing & Accessibility Shortcuts', () => {
  let fixture: ComponentFixture<TestConfigTableComponent>;
  let hostComponent: TestConfigTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestConfigTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestConfigTableComponent);
    hostComponent = fixture.componentInstance;
  });

  it('should apply tabindex="0" and role="columnheader" to resizable columns even if they are not sortable', () => {
    hostComponent.columns.set([{ id: 'name', header: 'Name', resizable: true, sortable: false }]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('thead th');
    expect(header.getAttribute('role')).toBe('columnheader');
    expect(header.getAttribute('tabindex')).toBe('0');
  });

  it('should merge aria-keyshortcuts when a column is both sortable and resizable', () => {
    hostComponent.columns.set([{ id: 'name', header: 'Name', resizable: true, sortable: true }]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('thead th');
    const keyshortcuts = header.getAttribute('aria-keyshortcuts');
    expect(keyshortcuts).toContain('Enter');
    expect(keyshortcuts).toContain('ArrowLeft');
    expect(keyshortcuts).toContain('ArrowRight');
  });

  it('should decrease and increase column size when pressing Shift+ArrowLeft and Shift+ArrowRight', () => {
    hostComponent.columns.set([{ id: 'name', header: 'Name', resizable: true, minWidth: 50, size: '100px' }]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('thead th') as HTMLTableCellElement;

    // Stub offsetWidth to simulate actual layout width dynamically
    Object.defineProperty(header, 'offsetWidth', {
      get: () => {
        const sizeAttr = header.getAttribute('size');
        return sizeAttr ? parseInt(sizeAttr, 10) : 100;
      },
      configurable: true,
    });

    // Decrease column width
    const leftEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      shiftKey: true,
      bubbles: true,
    });
    header.dispatchEvent(leftEvent);
    fixture.detectChanges();

    expect(header.getAttribute('size')).toBe('90px');

    // Increase column width
    const rightEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      shiftKey: true,
      bubbles: true,
    });
    header.dispatchEvent(rightEvent);
    fixture.detectChanges();

    expect(header.getAttribute('size')).toBe('100px');
  });

  it('should ignore click and keydown events originating from nested interactive controls', () => {
    hostComponent.columns.set([{ id: 'name', header: 'Name', resizable: true, sortable: true, size: '100px' }]);
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('thead th') as HTMLTableCellElement;

    // Add a button inside the header
    const btn = document.createElement('button');
    btn.setAttribute('role', 'button');
    header.appendChild(btn);

    // Clicking the button should NOT toggle sort
    btn.click();
    fixture.detectChanges();
    expect(hostComponent.sortByColumn()).toBeNull();

    // Pressing Enter on the button should NOT toggle sort
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
    });
    btn.dispatchEvent(enterEvent);
    fixture.detectChanges();
    expect(hostComponent.sortByColumn()).toBeNull();

    // Stub offsetWidth to simulate actual layout width
    Object.defineProperty(header, 'offsetWidth', { value: 100, configurable: true });

    // Pressing Shift+ArrowLeft on the button should NOT trigger resize
    const resizeEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      shiftKey: true,
      bubbles: true,
    });
    btn.dispatchEvent(resizeEvent);
    fixture.detectChanges();
    expect(header.getAttribute('size')).toBe('100px'); // should remain 100px (not change to 90px)
  });

  it('should navigate between headers using ArrowLeft and ArrowRight keys', () => {
    hostComponent.columns.set([
      { id: 'col1', header: 'Col1', sortable: true },
      { id: 'col2', header: 'Col2', sortable: true },
      { id: 'col3', header: 'Col3', sortable: true },
    ]);
    fixture.detectChanges();

    const headers = fixture.nativeElement.querySelectorAll('thead th');
    expect(headers.length).toBe(3);

    // Focus the first header
    headers[0].focus();
    expect(document.activeElement).toBe(headers[0]);

    // Press ArrowRight on first header to focus the second
    const rightEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });
    const preventRightSpy = vi.spyOn(rightEvent, 'preventDefault');
    headers[0].dispatchEvent(rightEvent);
    fixture.detectChanges();

    expect(document.activeElement).toBe(headers[1]);
    expect(preventRightSpy).toHaveBeenCalled();

    // Press ArrowLeft on second header to focus back the first
    const leftEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
    });
    const preventLeftSpy = vi.spyOn(leftEvent, 'preventDefault');
    headers[1].dispatchEvent(leftEvent);
    fixture.detectChanges();

    expect(document.activeElement).toBe(headers[0]);
    expect(preventLeftSpy).toHaveBeenCalled();
  });

  it('should support grid mode with roving tabindex and 2D arrow key cell navigation', () => {
    // Setup Table with grid = true
    @Component({
      template: `
        <sh-table [data]="data" [grid]="true">
          <thead>
            <tr>
              <th id="h1">H1</th>
              <th id="h2">H2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td id="c00">C00</td>
              <td id="c01">C01</td>
            </tr>
            <tr>
              <td id="c10">C10</td>
              <td id="c11">C11</td>
            </tr>
          </tbody>
        </sh-table>
      `,
      standalone: true,
      imports: [ShipTable],
    })
    class GridTableComponent {
      data = [{ id: 1 }, { id: 2 }];
    }

    const gridFixture = TestBed.createComponent(GridTableComponent);
    gridFixture.detectChanges();

    const tableEl = gridFixture.nativeElement.querySelector('sh-table');
    expect(tableEl.getAttribute('role')).toBe('grid');

    const h1 = gridFixture.nativeElement.querySelector('#h1') as HTMLElement;
    const h2 = gridFixture.nativeElement.querySelector('#h2') as HTMLElement;
    const c00 = gridFixture.nativeElement.querySelector('#c00') as HTMLElement;
    const c01 = gridFixture.nativeElement.querySelector('#c01') as HTMLElement;
    const c10 = gridFixture.nativeElement.querySelector('#c10') as HTMLElement;
    const c11 = gridFixture.nativeElement.querySelector('#c11') as HTMLElement;

    // Initially, the first cell should have tabindex="0"
    expect(h1.getAttribute('tabindex')).toBe('0');

    // Focus the first cell
    h1.focus();
    expect(document.activeElement).toBe(h1);

    // Press ArrowDown to navigate to C00
    const downEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });
    h1.dispatchEvent(downEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c00);
    expect(c00.getAttribute('role')).toBe('gridcell');
    expect(c00.getAttribute('tabindex')).toBe('0');
    expect(h1.getAttribute('tabindex')).toBe('-1');

    // Press ArrowRight to navigate to C01
    const rightEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
    });
    c00.dispatchEvent(rightEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c01);

    // Press ArrowDown to navigate to C11
    c01.dispatchEvent(downEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c11);

    // Press ArrowLeft to navigate to C10
    const leftEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
    });
    c11.dispatchEvent(leftEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c10);

    // Press ArrowUp to navigate to C00
    const upEvent = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      bubbles: true,
    });
    c10.dispatchEvent(upEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c00);

    // Press End to navigate to C01 (first row, last cell)
    const endEvent = new KeyboardEvent('keydown', {
      key: 'End',
      bubbles: true,
    });
    c00.dispatchEvent(endEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c01);

    // Press Home to navigate to C00 (first row, first cell)
    const homeEvent = new KeyboardEvent('keydown', {
      key: 'Home',
      bubbles: true,
    });
    c01.dispatchEvent(homeEvent);
    gridFixture.detectChanges();

    expect(document.activeElement).toBe(c00);

    // Press 's' to navigate down to C10
    const sEvent = new KeyboardEvent('keydown', {
      key: 's',
      bubbles: true,
    });
    c00.dispatchEvent(sEvent);
    gridFixture.detectChanges();
    expect(document.activeElement).toBe(c10);

    // Press 'd' to navigate right to C11
    const dEvent = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    });
    c10.dispatchEvent(dEvent);
    gridFixture.detectChanges();
    expect(document.activeElement).toBe(c11);

    // Press 'w' to navigate up to C01
    const wEvent = new KeyboardEvent('keydown', {
      key: 'w',
      bubbles: true,
    });
    c11.dispatchEvent(wEvent);
    gridFixture.detectChanges();
    expect(document.activeElement).toBe(c01);

    // Press 'a' to navigate left to C00
    const aEvent = new KeyboardEvent('keydown', {
      key: 'a',
      bubbles: true,
    });
    c01.dispatchEvent(aEvent);
    gridFixture.detectChanges();
    expect(document.activeElement).toBe(c00);
  });

  it('should support dynamically toggling the grid input', async () => {
    @Component({
      template: `
        <sh-table [data]="data" [grid]="gridActive()">
          <thead>
            <tr>
              <th id="h1" class="sortable">H1</th>
              <th id="h2">H2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td id="c00">C00</td>
              <td id="c01">C01</td>
            </tr>
          </tbody>
        </sh-table>
      `,
      standalone: true,
      imports: [ShipTable],
    })
    class ToggleGridTableComponent {
      data = [{ id: 1 }];
      gridActive = signal(false);
    }

    const fixture = TestBed.createComponent(ToggleGridTableComponent);
    fixture.detectChanges();

    const tableEl = fixture.nativeElement.querySelector('sh-table');
    expect(tableEl.getAttribute('role')).toBe('table');

    const h1 = fixture.nativeElement.querySelector('#h1') as HTMLElement;
    const h2 = fixture.nativeElement.querySelector('#h2') as HTMLElement;
    const c00 = fixture.nativeElement.querySelector('#c00') as HTMLElement;

    // Initially (grid = false): h1 (sortable) has tabindex="0", h2/c00 have no tabindex
    expect(h1.getAttribute('tabindex')).toBe('0');
    expect(h2.getAttribute('tabindex')).toBeNull();
    expect(c00.getAttribute('tabindex')).toBeNull();

    // Toggle grid = true
    fixture.componentInstance.gridActive.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(tableEl.getAttribute('role')).toBe('grid');
    // First cell (h1) should have tabindex="0" and others tabindex="-1"
    expect(h1.getAttribute('tabindex')).toBe('0');
    expect(h2.getAttribute('tabindex')).toBe('-1');
    expect(c00.getAttribute('tabindex')).toBe('-1');

    // Toggle grid = false
    fixture.componentInstance.gridActive.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(tableEl.getAttribute('role')).toBe('table');
    // Interactive header (h1) should go back to tabindex="0", other cells have tabindex removed
    expect(h1.getAttribute('tabindex')).toBe('0');
    expect(h2.getAttribute('tabindex')).toBeNull();
    expect(c00.getAttribute('tabindex')).toBeNull();
  });

  it('should support Tab and Shift+Tab navigation in grid mode', async () => {
    @Component({
      template: `
        <sh-table [data]="data" [grid]="true">
          <thead>
            <tr>
              <th id="h1">
                H1
                <button id="btn1">Filter</button>
              </th>
              <th id="h2">H2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td id="c00">C00</td>
              <td id="c01">C01</td>
            </tr>
          </tbody>
        </sh-table>
      `,
      standalone: true,
      imports: [ShipTable],
    })
    class TabGridTableComponent {
      data = [{ id: 1 }];
    }

    const fixture = TestBed.createComponent(TabGridTableComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const h1 = fixture.nativeElement.querySelector('#h1') as HTMLElement;
    const btn1 = fixture.nativeElement.querySelector('#btn1') as HTMLElement;
    const h2 = fixture.nativeElement.querySelector('#h2') as HTMLElement;

    h1.focus();
    expect(document.activeElement).toBe(h1);

    // Focus interactive child btn1
    btn1.focus();
    // Simulate focusin event
    btn1.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(btn1);
    expect(h1.getAttribute('tabindex')).toBe('0');
    expect(h2.getAttribute('tabindex')).toBe('-1');

    // Tab key on the last focusable child (btn1) should move to next cell (h2)
    const tabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
    });
    btn1.dispatchEvent(tabEvent);
    fixture.detectChanges();
    expect(document.activeElement).toBe(h2);
    expect(h2.getAttribute('tabindex')).toBe('0');
    expect(h1.getAttribute('tabindex')).toBe('-1');

    // Shift+Tab key on h2 (no children) should move to previous cell (h1)
    // and since h1 has children, it should focus the last child (btn1)
    const shiftTabEvent = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
    });
    h2.dispatchEvent(shiftTabEvent);
    fixture.detectChanges();
    expect(document.activeElement).toBe(btn1);

    // Shift+Tab key on first child (btn1) should move focus to parent cell container (h1)
    btn1.dispatchEvent(shiftTabEvent);
    fixture.detectChanges();
    expect(document.activeElement).toBe(h1);
  });
});
