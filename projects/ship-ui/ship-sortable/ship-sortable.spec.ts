import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSortableManager, moveIndex, ShipDropEvent, ShipSortable, ShipSortableService } from './ship-sortable';

if (typeof document !== 'undefined') {
  document.elementFromPoint = () => null;
}

@Component({
  template: `
    <div
      #list1
      id="list1"
      [shSortable]="list1Items"
      sortableGroup="shared-group"
      (sortDrop)="onSortDrop1($event)"
      [touchEnabled]="list1TouchEnabled()"
      [touchActivation]="list1TouchActivation()">
      @for (item of list1Items(); track item) {
        <div class="item" draggable="true">{{ item }}</div>
      }
    </div>

    <div
      #list2
      id="list2"
      [shSortable]="list2Items"
      sortableGroup="shared-group"
      (sortDrop)="onSortDrop2($event)"
      [touchEnabled]="list2TouchEnabled()"
      [touchActivation]="list2TouchActivation()">
      @for (item of list2Items(); track item) {
        <div class="item" draggable="true">{{ item }}</div>
      }
    </div>

    <div
      #list3
      id="list3"
      [shSortable]="list3Items"
      (sortDrop)="onSortDrop3($event)"
      [touchEnabled]="list3TouchEnabled()"
      [touchActivation]="list3TouchActivation()">
      @for (item of list3Items(); track item) {
        <div class="item" draggable="true">
          <span class="handle" sort-handle>::</span>
          {{ item }}
        </div>
      }
    </div>
  `,
  standalone: true,
  imports: [ShipSortable],
})
class TestHostComponent {
  list1Items = signal(['A', 'B', 'C']);
  list2Items = signal(['D', 'E', 'F']);
  list3Items = signal(['G', 'H', 'I']);

  list1TouchEnabled = signal(false);
  list1TouchActivation = signal<'longpress' | 'handle' | 'none'>('longpress');
  list2TouchEnabled = signal(false);
  list2TouchActivation = signal<'longpress' | 'handle' | 'none'>('longpress');
  list3TouchEnabled = signal(false);
  list3TouchActivation = signal<'longpress' | 'handle' | 'none'>('longpress');

  dropEvent1: ShipDropEvent | null = null;
  dropEvent2: ShipDropEvent | null = null;
  dropEvent3: ShipDropEvent | null = null;

  sortable1 = viewChild.required('list1', { read: ShipSortable });
  sortable2 = viewChild.required('list2', { read: ShipSortable });
  sortable3 = viewChild.required('list3', { read: ShipSortable });

  onSortDrop1(event: ShipDropEvent) {
    this.dropEvent1 = event;
  }

  onSortDrop2(event: ShipDropEvent) {
    this.dropEvent2 = event;
  }

  onSortDrop3(event: ShipDropEvent) {
    this.dropEvent3 = event;
  }
}

describe('ShipSortable', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let sortable1: ShipSortable;
  let sortable2: ShipSortable;
  let sortable3: ShipSortable;
  let sortableService: ShipSortableService;

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
    sortable3 = host.sortable3();
    sortableService = TestBed.inject(ShipSortableService);
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(sortableService.activeSource).toBe(sortable1);
    expect(sortableService.activeDraggedElement).toBe(firstItem);
    expect(firstItem.classList.contains('sortable-ghost')).toBe(true);

    sortable1.dragEnd();
    fixture.detectChanges();
    expect(sortableService.activeSource).toBeNull();
    expect(firstItem.classList.contains('sortable-ghost')).toBe(false);
  });

  it('should calculate moving elements using moveIndex utility', () => {
    const original = ['A', 'B', 'C', 'D'];

    const moved = moveIndex(original, { previousIndex: 0, currentIndex: 2 });
    expect(moved).toEqual(['B', 'C', 'A', 'D']);

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

    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    firstItem.dispatchEvent(dragStartEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    sortable1.dragToIndex.set(2);
    fixture.detectChanges();

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

    const dragStartEvent = new Event('dragstart', { bubbles: true }) as any;
    dragStartEvent.dataTransfer = mockDataTransfer;
    firstItem.dispatchEvent(dragStartEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    const dragEnterEvent = new Event('dragenter', { bubbles: true }) as any;
    list2El.dispatchEvent(dragEnterEvent);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(sortable2.isCrossTarget).toBe(true);
    expect(list2El.querySelector('.sortable-spacer')).toBeTruthy();

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
      previousIndex: 2,
      currentIndex: 0,
    };

    await manager.drop(event);
    expect(itemsSignal()).toEqual(['Item 3', 'Item 1', 'Item 2']);
  });

  describe('Touch Gestures', () => {
    let originalElementFromPoint: any;

    beforeEach(() => {
      originalElementFromPoint = document.elementFromPoint;
      vi.useFakeTimers();
    });

    afterEach(() => {
      document.elementFromPoint = originalElementFromPoint;
      vi.useRealTimers();
      sortable1.dragEnd();
      sortable2.dragEnd();
      sortable3.dragEnd();
    });

    function createMockTouchEvent(type: string, target: HTMLElement, clientX = 0, clientY = 0): TouchEvent {
      const touch = {
        identifier: Date.now(),
        target: target,
        clientX: clientX,
        clientY: clientY,
        screenX: clientX,
        screenY: clientY,
        pageX: clientX,
        pageY: clientY,
      } as unknown as Touch;

      const event = new CustomEvent(type, { bubbles: true, cancelable: true }) as any;
      event.touches = [touch];
      event.targetTouches = [touch];
      event.changedTouches = [touch];
      return event;
    }

    it('should not initiate touch drag when touchEnabled is false (default)', async () => {
      const list1El = fixture.nativeElement.querySelector('#list1');
      const firstItem = list1El.querySelector('.item');

      const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
      firstItem.dispatchEvent(touchStart);
      fixture.detectChanges();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(false);
      expect(sortableService.activeSource).toBeNull();
    });

    it('should initiate touch drag after 300ms delay under longpress activation strategy', async () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      fixture.detectChanges();

      const list1El = fixture.nativeElement.querySelector('#list1');
      const firstItem = list1El.querySelector('.item');

      const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
      firstItem.dispatchEvent(touchStart);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(false);

      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(true);
      expect(sortableService.activeSource).toBe(sortable1);
      expect(sortableService.activeDraggedElement).toBe(firstItem);
      expect(firstItem.classList.contains('sortable-ghost')).toBe(true);

      const touchEnd = createMockTouchEvent('touchend', firstItem, 100, 100);
      document.dispatchEvent(touchEnd);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(false);
      expect(sortableService.activeSource).toBeNull();
    });

    it('should cancel touch drag if finger moves more than 8px before 300ms', async () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      fixture.detectChanges();

      const list1El = fixture.nativeElement.querySelector('#list1');
      const firstItem = list1El.querySelector('.item');

      const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
      firstItem.dispatchEvent(touchStart);
      fixture.detectChanges();

      const touchMove = createMockTouchEvent('touchmove', firstItem, 115, 100);
      document.dispatchEvent(touchMove);
      fixture.detectChanges();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(false);
      expect(sortableService.activeSource).toBeNull();
    });

    it('should drag-over and reorder items upon touchend', async () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      fixture.detectChanges();

      const list1El = fixture.nativeElement.querySelector('#list1');
      const firstItem = list1El.querySelector('.item');

      const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
      firstItem.dispatchEvent(touchStart);
      fixture.detectChanges();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(true);

      sortable1.dragToIndex.set(2);
      fixture.detectChanges();

      const touchEnd = createMockTouchEvent('touchend', firstItem, 100, 100);
      document.dispatchEvent(touchEnd);
      fixture.detectChanges();

      expect(host.dropEvent1).toBeTruthy();
      expect(host.dropEvent1?.previousIndex).toBe(0);
      expect(host.dropEvent1?.currentIndex).toBe(2);
    });

    it('should initiate dragging immediately when using handle activation strategy', async () => {
      host.list3TouchEnabled.set(true);
      host.list3TouchActivation.set('handle');
      fixture.detectChanges();

      const list3El = fixture.nativeElement.querySelector('#list3');
      const firstItem = list3El.querySelector('.item');
      const handle = firstItem.querySelector('[sort-handle]') as HTMLElement;

      document.elementFromPoint = (x, y) => handle;

      const touchStart = createMockTouchEvent('touchstart', handle, 100, 100);
      handle.dispatchEvent(touchStart);
      fixture.detectChanges();

      expect(sortable3.isTouchDragging).toBe(true);
      expect(sortableService.activeSource).toBe(sortable3);

      const touchEnd = createMockTouchEvent('touchend', handle, 100, 100);
      document.dispatchEvent(touchEnd);
      fixture.detectChanges();
    });

    it('should transfer item to another container on touchmove and drop', async () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      host.list2TouchEnabled.set(true);
      host.list2TouchActivation.set('longpress');
      fixture.detectChanges();

      const list1El = fixture.nativeElement.querySelector('#list1');
      const list2El = fixture.nativeElement.querySelector('#list2');
      const firstItem = list1El.querySelector('.item');

      const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
      firstItem.dispatchEvent(touchStart);
      fixture.detectChanges();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(true);

      document.elementFromPoint = (x, y) => list2El;

      const touchMove = createMockTouchEvent('touchmove', firstItem, 300, 100);
      document.dispatchEvent(touchMove);
      fixture.detectChanges();

      expect(sortableService.activeTarget).toBe(sortable2);
      expect(sortable2.isCrossTarget).toBe(true);

      sortable2.dragToIndex.set(1);
      fixture.detectChanges();

      const touchEnd = createMockTouchEvent('touchend', firstItem, 300, 100);
      document.dispatchEvent(touchEnd);
      fixture.detectChanges();

      expect(host.dropEvent2).toBeTruthy();
      expect(host.dropEvent2?.previousContainer).toBe(sortable1);
      expect(host.dropEvent2?.container).toBe(sortable2);
      expect(host.dropEvent2?.previousIndex).toBe(0);
      expect(host.dropEvent2?.currentIndex).toBe(1);
    });
  });
});
