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

    <!-- No touch inputs bound: exercises the directive's own defaults. -->
    <div #list4 id="list4" [shSortable]="list4Items">
      @for (item of list4Items(); track item) {
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
  list3Items = signal(['G', 'H', 'I']);
  list4Items = signal(['J', 'K', 'L']);

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
  sortable4 = viewChild.required('list4', { read: ShipSortable });

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
  let sortable4: ShipSortable;
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
    sortable4 = host.sortable4();
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
      sortable4.dragEnd();
    });

    function createMockTouchEvent(
      type: string,
      target: HTMLElement,
      clientX = 0,
      clientY = 0,
      fingers = 1
    ): TouchEvent {
      const touches = Array.from({ length: fingers }, (_, i) => ({
        identifier: i,
        target: target,
        clientX: clientX + i * 40,
        clientY: clientY,
        screenX: clientX + i * 40,
        screenY: clientY,
        pageX: clientX + i * 40,
        pageY: clientY,
      })) as unknown as Touch[];

      const event = new CustomEvent(type, { bubbles: true, cancelable: true }) as any;
      event.touches = touches;
      event.targetTouches = touches;
      event.changedTouches = touches;
      return event;
    }

    describe('defaults (no touch inputs bound)', () => {
      it('picks an item up only after a 300ms long press', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
        vi.advanceTimersByTime(299);
        fixture.detectChanges();

        expect(sortable4.isTouchDragging).toBe(false);
        expect(sortableService.activeSource).toBeNull();

        vi.advanceTimersByTime(1);
        fixture.detectChanges();

        expect(sortable4.isTouchDragging).toBe(true);
        expect(sortableService.activeSource).toBe(sortable4);
        expect(sortableService.activeDraggedElement).toBe(firstItem);
        expect(firstItem.classList.contains('sortable-ghost')).toBe(true);
        expect(document.querySelector('.sortable-ghost-touch')).toBeTruthy();

        const touchEnd = createMockTouchEvent('touchend', firstItem, 100, 100);
        document.dispatchEvent(touchEnd);
        fixture.detectChanges();

        // The drop swallows the compatibility click, and the drag is torn down.
        expect(touchEnd.defaultPrevented).toBe(true);
        expect(sortable4.isTouchDragging).toBe(false);
        expect(sortableService.activeSource).toBeNull();
        expect(document.querySelector('.sortable-ghost-touch')).toBeNull();
      });

      it('reorders after a long press and a drag', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
        vi.advanceTimersByTime(300);
        fixture.detectChanges();

        const touchMove = createMockTouchEvent('touchmove', firstItem, 100, 160);
        document.dispatchEvent(touchMove);
        expect(touchMove.defaultPrevented).toBe(true);

        let dropped: ShipDropEvent | null = null;
        sortable4.sortDrop.subscribe((event) => (dropped = event));

        sortable4.dragToIndex.set(2);
        document.dispatchEvent(createMockTouchEvent('touchend', firstItem, 100, 160));
        fixture.detectChanges();

        expect(dropped).toMatchObject({ container: sortable4, previousIndex: 0, currentIndex: 2 });
      });

      it('leaves the touch to the browser before the long press fires, so the list scrolls', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        const touchStart = createMockTouchEvent('touchstart', firstItem, 100, 100);
        firstItem.dispatchEvent(touchStart);
        expect(touchStart.defaultPrevented).toBe(false);

        const smallMove = createMockTouchEvent('touchmove', firstItem, 100, 104);
        document.dispatchEvent(smallMove);
        expect(smallMove.defaultPrevented).toBe(false);

        const scroll = createMockTouchEvent('touchmove', firstItem, 100, 140);
        document.dispatchEvent(scroll);
        expect(scroll.defaultPrevented).toBe(false);

        vi.advanceTimersByTime(300);
        fixture.detectChanges();

        expect(sortable4.isTouchDragging).toBe(false);
        expect(sortableService.activeSource).toBeNull();
      });

      it('does nothing on a quick tap', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
        vi.advanceTimersByTime(120);

        const touchEnd = createMockTouchEvent('touchend', firstItem, 100, 100);
        document.dispatchEvent(touchEnd);
        vi.advanceTimersByTime(300);
        fixture.detectChanges();

        expect(touchEnd.defaultPrevented).toBe(false);
        expect(sortable4.isTouchDragging).toBe(false);
        expect(sortableService.activeSource).toBeNull();
      });

      it('never picks up on a two-finger touch', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100, 2));
        vi.advanceTimersByTime(300);
        fixture.detectChanges();
        expect(sortable4.isTouchDragging).toBe(false);

        // A second finger landing during the press cancels it too.
        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
        document.dispatchEvent(createMockTouchEvent('touchmove', firstItem, 100, 100, 2));
        vi.advanceTimersByTime(300);
        fixture.detectChanges();

        expect(sortable4.isTouchDragging).toBe(false);
        expect(sortableService.activeSource).toBeNull();
      });

      it('holds off the context menu only while a touch is pressed', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
        const during = new Event('contextmenu', { bubbles: true, cancelable: true });
        firstItem.dispatchEvent(during);
        expect(during.defaultPrevented).toBe(true);

        document.dispatchEvent(createMockTouchEvent('touchend', firstItem, 100, 100));
        const after = new Event('contextmenu', { bubbles: true, cancelable: true });
        firstItem.dispatchEvent(after);
        expect(after.defaultPrevented).toBe(false);
      });

      it('starts a mouse drag immediately, with no long press', () => {
        const firstItem = fixture.nativeElement.querySelector('#list4 .item');

        const dragStart = new Event('dragstart', { bubbles: true }) as any;
        dragStart.dataTransfer = { effectAllowed: '', setDragImage: vi.fn() };
        dragStart.clientX = 100;
        dragStart.clientY = 100;
        firstItem.dispatchEvent(dragStart);

        expect(sortableService.activeSource).toBe(sortable4);
        expect(sortableService.activeDraggedElement).toBe(firstItem);
        expect(sortable4.dragStartIndex()).toBe(0);
        expect(sortable4.isTouchDragging).toBe(false);
      });
    });

    it('registers a passive touchstart for longpress and an active one for handles', () => {
      const firstItem = fixture.nativeElement.querySelector('#list1 .item') as HTMLElement;
      const spy = vi.spyOn(firstItem, 'addEventListener');
      const touchStartOptions = () =>
        spy.mock.calls.filter(([type]) => type === 'touchstart').map(([, , options]) => (options as any)?.passive);

      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      fixture.detectChanges();
      expect(touchStartOptions()).toEqual([true]);

      spy.mockClear();
      host.list1TouchActivation.set('handle');
      fixture.detectChanges();
      expect(touchStartOptions()).toEqual([false]);

      spy.mockClear();
      host.list1TouchActivation.set('none');
      fixture.detectChanges();
      expect(touchStartOptions()).toEqual([]);
    });

    it('does not initiate touch drag when touchActivation is none', () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('none');
      fixture.detectChanges();

      const firstItem = fixture.nativeElement.querySelector('#list1 .item');
      firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(false);
      expect(sortableService.activeSource).toBeNull();
    });

    it('should not initiate touch drag when touchEnabled is explicitly false', async () => {
      host.list1TouchEnabled.set(true);
      fixture.detectChanges();
      host.list1TouchEnabled.set(false);
      fixture.detectChanges();

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

    it('should abort without reordering when the touch is cancelled mid-drag', async () => {
      host.list1TouchEnabled.set(true);
      host.list1TouchActivation.set('longpress');
      fixture.detectChanges();

      const list1El = fixture.nativeElement.querySelector('#list1');
      const firstItem = list1El.querySelector('.item');
      const dropSpy = vi.spyOn(sortable1, 'drop');

      firstItem.dispatchEvent(createMockTouchEvent('touchstart', firstItem, 100, 100));
      fixture.detectChanges();
      vi.advanceTimersByTime(300);
      fixture.detectChanges();

      expect(sortable1.isTouchDragging).toBe(true);

      document.dispatchEvent(createMockTouchEvent('touchcancel', firstItem, 100, 160));
      fixture.detectChanges();

      expect(dropSpy).not.toHaveBeenCalled();
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

@Component({
  template: `
    <div #row id="row" [shSortable]="manager" shSortableAxis="x">
      @for (column of columns(); track column) {
        <div class="header" draggable="true">
          <span class="handle" sort-handle>::</span>
          {{ column }}
        </div>
      }
    </div>

    <div #plain id="plain" [shSortable]="items" shSortableAxis="x">
      @for (item of items(); track item) {
        <div class="item" draggable="true">{{ item }}</div>
      }
    </div>

    <div #list id="list" [shSortable]="listManager" shSortableAxis="y">
      @for (item of items(); track item) {
        <div class="item" draggable="true" tabindex="0">{{ item }}</div>
      }
    </div>
  `,
  standalone: true,
  imports: [ShipSortable],
})
class AxisHostComponent {
  columns = signal(['To do', 'Doing', 'Review', 'Done']);
  manager = createSortableManager(this.columns);
  items = signal(['A', 'B', 'C']);
  listManager = createSortableManager(this.items);
  row = viewChild.required('row', { read: ShipSortable });
  list = viewChild.required('list', { read: ShipSortable });
  plain = viewChild.required('plain', { read: ShipSortable });
}

describe('ShipSortable axis and keyboard', () => {
  let fixture: ComponentFixture<AxisHostComponent>;
  let host: AxisHostComponent;

  const settle = async () => {
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
  };

  const key = (el: Element, key: string) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(event);
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AxisHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(AxisHostComponent);
    host = fixture.componentInstance;
    await settle();
  });

  it('makes the handles focusable and announces the axis keys', () => {
    const handle = fixture.nativeElement.querySelector('#row [sort-handle]') as HTMLElement;
    expect(handle.getAttribute('tabindex')).toBe('0');
    const shortcuts = handle.getAttribute('aria-keyshortcuts') ?? '';
    expect(shortcuts).toContain('ArrowRight');
    expect(shortcuts).not.toContain('ArrowDown');
  });

  it('moves a header with the left/right keys on its handle and keeps focus on it', async () => {
    const handles = fixture.nativeElement.querySelectorAll('#row [sort-handle]') as NodeListOf<HTMLElement>;
    handles[0].focus();

    expect(key(handles[0], 'ArrowRight').defaultPrevented).toBe(true);
    await settle();
    expect(host.columns()).toEqual(['Doing', 'To do', 'Review', 'Done']);
    const focused = document.activeElement as HTMLElement;
    expect(focused.closest('[draggable]')?.textContent).toContain('To do');

    key(focused, 'ArrowLeft');
    await settle();
    expect(host.columns()).toEqual(['To do', 'Doing', 'Review', 'Done']);

    key(document.activeElement as HTMLElement, 'End');
    await settle();
    expect(host.columns()).toEqual(['Doing', 'Review', 'Done', 'To do']);

    key(document.activeElement as HTMLElement, 'Home');
    await settle();
    expect(host.columns()).toEqual(['To do', 'Doing', 'Review', 'Done']);
  });

  it('ignores the other axis and the ends', async () => {
    const handle = fixture.nativeElement.querySelector('#row [sort-handle]') as HTMLElement;
    expect(key(handle, 'ArrowDown').defaultPrevented).toBe(false);
    expect(key(handle, 'ArrowLeft').defaultPrevented).toBe(true);
    await settle();
    expect(host.columns()).toEqual(['To do', 'Doing', 'Review', 'Done']);

    const items = fixture.nativeElement.querySelectorAll('#list .item') as NodeListOf<HTMLElement>;
    expect(key(items[2], 'ArrowRight').defaultPrevented).toBe(false);
    key(items[2], 'ArrowUp');
    await settle();
    expect(host.items()).toEqual(['A', 'C', 'B']);
  });

  it('emits the outputs instead when there is no manager', async () => {
    const plain = host.plain();
    const drops: ShipDropEvent[] = [];
    const after: { fromIndex: number; toIndex: number }[] = [];
    plain.sortDrop.subscribe((e) => drops.push(e));
    plain.afterDrop.subscribe((e) => after.push(e));

    key(fixture.nativeElement.querySelector('#plain .item') as HTMLElement, 'ArrowRight');
    await settle();
    expect(drops).toEqual([{ previousContainer: plain, container: plain, previousIndex: 0, currentIndex: 1 }]);
    expect(after).toEqual([{ fromIndex: 0, toIndex: 1 }]);
    expect(host.items()).toEqual(['A', 'B', 'C']);
  });

  it('targets the nearest slot along the x axis only while dragging', async () => {
    const row = host.row();
    const rowEl = fixture.nativeElement.querySelector('#row') as HTMLElement;
    rowEl.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 40, width: 400, height: 40 } as DOMRect);
    row.initialPositions.set([
      { x: 0, y: 0, width: 100, height: 40 },
      { x: 100, y: 0, width: 100, height: 40 },
      { x: 200, y: 0, width: 100, height: 40 },
      { x: 300, y: 0, width: 100, height: 40 },
    ]);
    const service = TestBed.inject(ShipSortableService);
    service.activeSource = row;
    service.activeTarget = row;
    row.dragStartIndex.set(0);

    // Far below the row on the y axis, but over the third slot on x: x alone decides.
    row.processDragOver(260, 600);
    expect(row.dragToIndex()).toBe(2);

    row.processDragOver(20, -300);
    expect(row.dragToIndex()).toBe(0);

    row.dragEnd();
  });
});
