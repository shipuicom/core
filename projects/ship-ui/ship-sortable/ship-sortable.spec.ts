import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipSortable, moveIndex, createSortableManager, ShipDropEvent } from './ship-sortable';

if (typeof document !== 'undefined') {
  document.elementFromPoint = () => null;
}

@Component({
  template: `
    <div #list1 id="list1" [shSortable]="list1Items" sortableGroup="shared-group" (sortDrop)="onSortDrop1($event)">
      @for (item of list1Items(); track item) {
        <div class="item" draggable="true">{{ item }}</div>
      }
    </div>

    <div #list2 id="list2" [shSortable]="list2Items" sortableGroup="shared-group" (sortDrop)="onSortDrop2($event)">
      @for (item of list2Items(); track item) {
        <div class="item" draggable="true">{{ item }}</div>
      }
    </div>
  `,
  standalone: true,
  imports: [ShipSortable],
})
class TestHostComponent {
  list1Items = signal(['A', 'B', 'C']);
  list2Items = signal(['D', 'E', 'F']);

  dropEvent1: ShipDropEvent | null = null;
  dropEvent2: ShipDropEvent | null = null;

  sortable1 = viewChild.required('list1', { read: ShipSortable });
  sortable2 = viewChild.required('list2', { read: ShipSortable });

  onSortDrop1(event: ShipDropEvent) {
    this.dropEvent1 = event;
  }

  onSortDrop2(event: ShipDropEvent) {
    this.dropEvent2 = event;
  }
}

describe('ShipSortable', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let sortable1: ShipSortable;
  let sortable2: ShipSortable;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    sortable1 = host.sortable1();
    sortable2 = host.sortable2();
  });

  it('should initialize and populate draggable children', () => {
    expect(sortable1).toBeTruthy();
    expect(sortable2).toBeTruthy();
    expect(sortable1.dragables().length).toBe(3);
    expect(sortable2.dragables().length).toBe(3);
  });

  it('should handle dragstart and set static active state', async () => {
    const list1El = fixture.nativeElement.querySelector('#list1');
    const firstItem = list1El.querySelector('.item');

    const mockDataTransfer = {
      effectAllowed: '',
      setDragImage: vi.fn(),
    };

    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    dragStartEvent.clientX = 100;
    dragStartEvent.clientY = 100;

    firstItem.dispatchEvent(dragStartEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0)); // allow ghost timeouts to execute
    fixture.detectChanges();

    expect(ShipSortable.activeSource).toBe(sortable1);
    expect(ShipSortable.activeDraggedElement).toBe(firstItem);
    expect(firstItem.classList.contains('sortable-ghost')).toBe(true);

    // End drag
    sortable1.dragEnd();
    fixture.detectChanges();
    expect(ShipSortable.activeSource).toBeNull();
    expect(firstItem.classList.contains('sortable-ghost')).toBe(false);
  });

  it('should calculate moving elements using moveIndex utility', () => {
    const original = ['A', 'B', 'C', 'D'];
    
    // Move 'A' (index 0) to index 2
    const moved = moveIndex(original, { previousIndex: 0, currentIndex: 2 });
    expect(moved).toEqual(['B', 'C', 'A', 'D']);

    // Move 'D' (index 3) to index 1
    const movedBack = moveIndex(original, { previousIndex: 3, currentIndex: 1 });
    expect(movedBack).toEqual(['A', 'D', 'B', 'C']);
  });

  it('should trigger internal reordering drop event', async () => {
    const list1El = fixture.nativeElement.querySelector('#list1');
    const items = list1El.querySelectorAll('.item');
    const firstItem = items[0];

    const mockDataTransfer = {
      effectAllowed: '',
      setDragImage: vi.fn(),
      dropEffect: '',
    };

    // 1. Drag start
    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    firstItem.dispatchEvent(dragStartEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    // 2. Drag over index 2
    sortable1.dragToIndex.set(2);
    fixture.detectChanges();

    // 3. Drop
    const dropEvent = new Event('drop', { bubbles: true }) as any;
    list1El.dispatchEvent(dropEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(host.dropEvent1).toBeTruthy();
    expect(host.dropEvent1?.previousIndex).toBe(0);
    expect(host.dropEvent1?.currentIndex).toBe(2);
    expect(host.dropEvent1?.container).toBe(sortable1);

    sortable1.dragEnd();
  });

  it('should trigger cross-container transfer', async () => {
    const list1El = fixture.nativeElement.querySelector('#list1');
    const list2El = fixture.nativeElement.querySelector('#list2');
    const firstItem = list1El.querySelector('.item');

    const mockDataTransfer = {
      effectAllowed: '',
      setDragImage: vi.fn(),
      dropEffect: '',
    };

    // 1. Drag start in list 1
    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    firstItem.dispatchEvent(dragStartEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    // 2. Enter list 2
    const dragEnterEvent = new Event('dragenter', { bubbles: true }) as any;
    list2El.dispatchEvent(dragEnterEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(sortable2.isCrossTarget).toBe(true);
    expect(list2El.querySelector('.sortable-spacer')).toBeTruthy();

    // 3. Drop in list 2
    sortable2.dragToIndex.set(1);
    const dropEvent = new Event('drop', { bubbles: true }) as any;
    list2El.dispatchEvent(dropEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(host.dropEvent2).toBeTruthy();
    expect(host.dropEvent2?.previousContainer).toBe(sortable1);
    expect(host.dropEvent2?.container).toBe(sortable2);
    expect(host.dropEvent2?.previousIndex).toBe(0);
    expect(host.dropEvent2?.currentIndex).toBe(1);

    sortable1.dragEnd();
  });

  it('should update signal array automatically via createSortableManager', async () => {
    const itemsSignal = signal(['Item 1', 'Item 2', 'Item 3']);
    const manager = createSortableManager(itemsSignal);

    const event: ShipDropEvent = {
      previousContainer: sortable1,
      container: sortable1,
      previousIndex: 2, // Move 'Item 3'
      currentIndex: 0,  // To the beginning
    };

    await manager.drop(event);
    expect(itemsSignal()).toEqual(['Item 3', 'Item 1', 'Item 2']);
  });
});
