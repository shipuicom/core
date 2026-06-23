import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipListItemSwipe, ShipListItemSwipeService } from './ship-list-item-swipe';

@Component({
  template: `
    <div style="width: 300px;">
      <sh-list-item-swipe #swipeItem1 id="item1">
        <button actionLeft class="archive-btn">Archive</button>
        <button actionRight class="delete-btn">Delete</button>
        <div class="content">Item 1 Content</div>
      </sh-list-item-swipe>

      <sh-list-item-swipe #swipeItem2 id="item2">
        <button actionRight class="delete-btn">Delete Only</button>
        <div class="content">Item 2 Content</div>
      </sh-list-item-swipe>
    </div>
  `,
  standalone: true,
  imports: [ShipListItemSwipe],
})
class TestHostComponent {
  swipeItem1 = viewChild.required('swipeItem1', { read: ShipListItemSwipe });
  swipeItem2 = viewChild.required('swipeItem2', { read: ShipListItemSwipe });
}

describe('ShipListItemSwipe', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let item1: ShipListItemSwipe;
  let item2: ShipListItemSwipe;
  let swipeService: ShipListItemSwipeService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    item1 = host.swipeItem1();
    item2 = host.swipeItem2();
    swipeService = TestBed.inject(ShipListItemSwipeService);

    
    Object.defineProperty(item1.actionsLeftEl().nativeElement, 'offsetWidth', { value: 80, configurable: true });
    Object.defineProperty(item1.actionsRightEl().nativeElement, 'offsetWidth', { value: 100, configurable: true });
    Object.defineProperty(item2.actionsRightEl().nativeElement, 'offsetWidth', { value: 100, configurable: true });
  });

  afterEach(() => {
    item1.close();
    item2.close();
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

  it('should initialize and project content slots correctly', () => {
    expect(item1).toBeTruthy();
    const actionsLeft = fixture.nativeElement.querySelector('#item1 .actions-left');
    const actionsRight = fixture.nativeElement.querySelector('#item1 .actions-right');
    const content = fixture.nativeElement.querySelector('#item1 .sh-swipe-content');

    expect(actionsLeft.querySelector('.archive-btn')).toBeTruthy();
    expect(actionsRight.querySelector('.delete-btn')).toBeTruthy();
    expect(content.textContent.trim()).toBe('Item 1 Content');
  });

  it('should translate content element on horizontal touchmove (swiping left)', () => {
    const hostEl = fixture.nativeElement.querySelector('#item1');
    const contentEl = item1.contentEl().nativeElement;

    
    hostEl.dispatchEvent(createMockTouchEvent('touchstart', hostEl, 200, 100));

    
    document.dispatchEvent(createMockTouchEvent('touchmove', hostEl, 150, 100)); 
    fixture.detectChanges();

    
    expect(contentEl.style.transform).toBe('translateX(-50px)');
  });

  it('should translate content element on horizontal touchmove (swiping right)', () => {
    const hostEl = fixture.nativeElement.querySelector('#item1');
    const contentEl = item1.contentEl().nativeElement;

    
    hostEl.dispatchEvent(createMockTouchEvent('touchstart', hostEl, 100, 100));

    
    document.dispatchEvent(createMockTouchEvent('touchmove', hostEl, 150, 100)); 
    fixture.detectChanges();

    expect(contentEl.style.transform).toBe('translateX(50px)');
  });

  it('should ignore swiping in direction where no actions are projected', () => {
    const hostEl = fixture.nativeElement.querySelector('#item2'); 
    const contentEl = item2.contentEl().nativeElement;

    
    hostEl.dispatchEvent(createMockTouchEvent('touchstart', hostEl, 100, 100));
    document.dispatchEvent(createMockTouchEvent('touchmove', hostEl, 150, 100)); 
    fixture.detectChanges();

    expect(contentEl.style.transform).toBe('translateX(0px)');
  });

  it('should snap open when swiped past threshold', () => {
    const hostEl = fixture.nativeElement.querySelector('#item1');
    const contentEl = item1.contentEl().nativeElement;

    
    hostEl.dispatchEvent(createMockTouchEvent('touchstart', hostEl, 200, 100));

    
    document.dispatchEvent(createMockTouchEvent('touchmove', hostEl, 150, 100)); 
    document.dispatchEvent(createMockTouchEvent('touchend', hostEl, 150, 100));
    fixture.detectChanges();

    
    expect(contentEl.style.transform).toBe('translateX(-100px)');
    expect(swipeService.activeSwipeItem).toBe(item1);
  });

  it('should snap closed when released below threshold', () => {
    const hostEl = fixture.nativeElement.querySelector('#item1');
    const contentEl = item1.contentEl().nativeElement;

    
    hostEl.dispatchEvent(createMockTouchEvent('touchstart', hostEl, 200, 100));

    
    document.dispatchEvent(createMockTouchEvent('touchmove', hostEl, 190, 100)); 
    document.dispatchEvent(createMockTouchEvent('touchend', hostEl, 190, 100));
    fixture.detectChanges();

    
    expect(contentEl.style.transform).toBe('translateX(0px)');
    expect(swipeService.activeSwipeItem).toBeNull();
  });

  it('should auto-close other active swiped item when a new touch gesture begins', () => {
    
    item1.open('right');
    fixture.detectChanges();
    expect(swipeService.activeSwipeItem).toBe(item1);
    expect(item1.contentEl().nativeElement.style.transform).toBe('translateX(-100px)');

    
    const host2El = fixture.nativeElement.querySelector('#item2');
    host2El.dispatchEvent(createMockTouchEvent('touchstart', host2El, 200, 100));
    document.dispatchEvent(createMockTouchEvent('touchmove', host2El, 190, 100)); 
    fixture.detectChanges();

    
    expect(item1.contentEl().nativeElement.style.transform).toBe('translateX(0px)');
    expect(swipeService.activeSwipeItem).not.toBe(item1);
  });

  it('should open and close programmatically', () => {
    const contentEl = item1.contentEl().nativeElement;

    item1.open('left');
    fixture.detectChanges();
    expect(contentEl.style.transform).toBe('translateX(80px)');
    expect(swipeService.activeSwipeItem).toBe(item1);

    item1.close();
    fixture.detectChanges();
    expect(contentEl.style.transform).toBe('translateX(0px)');
    expect(swipeService.activeSwipeItem).toBeNull();
  });
});
