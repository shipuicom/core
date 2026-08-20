import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipSidenav } from './ship-sidenav';

@Component({
  template: `
    <div class="host-parent">
      <sh-sidenav #nav [class]="type()" [(isOpen)]="isOpen" [disableDrag]="disableDrag()" [openWidth]="openWidth()">
        <ng-container sidenav>nav content</ng-container>
        <ng-container sidenav-closed-topbar>topbar</ng-container>
        main content
      </sh-sidenav>
    </div>
  `,
  standalone: true,
  imports: [ShipSidenav],
})
class TestHostComponent {
  nav = viewChild.required('nav', { read: ShipSidenav });
  type = signal<string>('');
  isOpen = signal(false);
  disableDrag = signal(false);
  openWidth = signal(280);
}

function pointerEvent(type: string, clientX: number, pointerId = 1): PointerEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as any;
  event.pointerId = pointerId;
  event.clientX = clientX;
  event.clientY = 100;
  return event as PointerEvent;
}

describe('ShipSidenav', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let nav: ShipSidenav;
  let navEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    nav = host.nav();
    navEl = fixture.nativeElement.querySelector('sh-sidenav');
  });

  async function setType(type: string) {
    host.type.set(type);
    fixture.detectChanges();
    // classMutationSignal reacts via MutationObserver, which fires as a microtask.
    await Promise.resolve();
    fixture.detectChanges();
  }

  function dragHandle(): HTMLElement {
    return navEl.querySelector('.dragable') as HTMLElement;
  }

  describe('default variant', () => {
    it('reflects open state as host classes', () => {
      expect(navEl.classList.contains('closed')).toBe(true);

      host.isOpen.set(true);
      fixture.detectChanges();

      expect(navEl.classList.contains('open')).toBe(true);
      expect(navEl.classList.contains('closed')).toBe(false);
    });

    it('renders no drag handle', () => {
      expect(dragHandle()).toBeNull();
    });

    it('does not lock document scroll when open', () => {
      host.isOpen.set(true);
      fixture.detectChanges();

      expect(document.body.classList.contains('sh-sidenav-open')).toBe(false);
    });

    it('applies no transform on main-wrap', () => {
      const mainWrap = navEl.querySelector('.main-wrap') as HTMLElement;
      expect(mainWrap.style.transform).toBe('');
    });
  });

  describe('simple variant', () => {
    it('renders no drag handle and no scroll lock', async () => {
      await setType('simple');
      host.isOpen.set(true);
      fixture.detectChanges();

      expect(dragHandle()).toBeNull();
      expect(document.body.classList.contains('sh-sidenav-open')).toBe(false);
    });
  });

  describe('overlay variant', () => {
    beforeEach(async () => {
      await setType('overlay');
    });

    it('detects the overlay class via MutationObserver', async () => {
      await fixture.whenStable();
      expect(nav.isOverlay()).toBe(true);
    });

    it('renders a drag handle unless drag is disabled', () => {
      expect(dragHandle()).not.toBeNull();

      host.disableDrag.set(true);
      fixture.detectChanges();

      expect(dragHandle()).toBeNull();
    });

    it('translates main-wrap by openWidth when open', () => {
      host.isOpen.set(true);
      fixture.detectChanges();

      const mainWrap = navEl.querySelector('.main-wrap') as HTMLElement;
      expect(mainWrap.style.transform).toBe('translateX(280px)');
    });

    it('respects a custom openWidth', () => {
      host.openWidth.set(320);
      host.isOpen.set(true);
      fixture.detectChanges();

      const mainWrap = navEl.querySelector('.main-wrap') as HTMLElement;
      expect(mainWrap.style.transform).toBe('translateX(320px)');
      expect(navEl.style.getPropertyValue('--sidenav-open-width')).toBe('320px');
    });

    it('locks document scroll while open and releases it on close', () => {
      host.isOpen.set(true);
      fixture.detectChanges();
      expect(document.body.classList.contains('sh-sidenav-open')).toBe(true);
      expect(document.documentElement.classList.contains('sh-sidenav-open')).toBe(true);

      host.isOpen.set(false);
      fixture.detectChanges();
      expect(document.body.classList.contains('sh-sidenav-open')).toBe(false);
      expect(document.documentElement.classList.contains('sh-sidenav-open')).toBe(false);
    });

    it('releases the scroll lock on destroy', () => {
      host.isOpen.set(true);
      fixture.detectChanges();
      expect(document.body.classList.contains('sh-sidenav-open')).toBe(true);

      fixture.destroy();
      expect(document.body.classList.contains('sh-sidenav-open')).toBe(false);
    });

    it('hides the nav panel from the a11y tree while closed', () => {
      const panel = navEl.querySelector('.sidenav') as HTMLElement;
      expect(panel.getAttribute('aria-hidden')).toBe('true');

      host.isOpen.set(true);
      fixture.detectChanges();
      expect(panel.getAttribute('aria-hidden')).toBeNull();
    });

    it('closes on Escape', () => {
      host.isOpen.set(true);
      fixture.detectChanges();

      const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      document.dispatchEvent(escape);
      fixture.detectChanges();

      expect(host.isOpen()).toBe(false);
    });

    it('toggles via keyboard on the drag handle', () => {
      const handle = dragHandle();
      handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      fixture.detectChanges();
      expect(host.isOpen()).toBe(true);

      handle.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      fixture.detectChanges();
      expect(host.isOpen()).toBe(false);
    });

    describe('pointer dragging', () => {
      it('opens when released past the threshold', () => {
        const handle = dragHandle();
        handle.dispatchEvent(pointerEvent('pointerdown', 10));
        fixture.detectChanges();
        expect(nav.isDragging()).toBe(true);
        expect(document.body.classList.contains('dragging')).toBe(true);

        handle.dispatchEvent(pointerEvent('pointermove', 200));
        fixture.detectChanges();

        handle.dispatchEvent(pointerEvent('pointerup', 200));
        fixture.detectChanges();

        expect(nav.isDragging()).toBe(false);
        expect(host.isOpen()).toBe(true);
        expect(document.body.classList.contains('dragging')).toBe(false);
      });

      it('closes when released before the threshold', () => {
        host.isOpen.set(true);
        fixture.detectChanges();

        const handle = dragHandle();
        handle.dispatchEvent(pointerEvent('pointerdown', 280));
        handle.dispatchEvent(pointerEvent('pointermove', 50));
        handle.dispatchEvent(pointerEvent('pointerup', 50));
        fixture.detectChanges();

        expect(host.isOpen()).toBe(false);
      });

      it('ignores moves from a different pointer than the active one', () => {
        const handle = dragHandle();
        handle.dispatchEvent(pointerEvent('pointerdown', 10, 1));
        handle.dispatchEvent(pointerEvent('pointermove', 250, 2));
        fixture.detectChanges();

        expect(nav.dragPositionX()).toBe(10);

        handle.dispatchEvent(pointerEvent('pointerup', 250, 2));
        fixture.detectChanges();
        expect(nav.isDragging()).toBe(true);

        handle.dispatchEvent(pointerEvent('pointerup', 10, 1));
        fixture.detectChanges();
        expect(nav.isDragging()).toBe(false);
      });

      it('snaps back and cleans up on pointercancel', () => {
        const handle = dragHandle();
        handle.dispatchEvent(pointerEvent('pointerdown', 10));
        handle.dispatchEvent(pointerEvent('pointermove', 200));
        fixture.detectChanges();
        expect(document.body.classList.contains('dragging')).toBe(true);

        handle.dispatchEvent(pointerEvent('pointercancel', 200));
        fixture.detectChanges();

        expect(nav.isDragging()).toBe(false);
        expect(host.isOpen()).toBe(false);
        expect(document.body.classList.contains('dragging')).toBe(false);
      });

      it('applies dampened translate while dragging past the dead zone', () => {
        const handle = dragHandle();
        handle.dispatchEvent(pointerEvent('pointerdown', 0));
        handle.dispatchEvent(pointerEvent('pointermove', 270));
        fixture.detectChanges();

        const mainWrap = navEl.querySelector('.main-wrap') as HTMLElement;
        const translate = parseFloat(mainWrap.style.transform.replace('translateX(', ''));
        expect(translate).toBeGreaterThan(190);
        expect(translate).toBeLessThan(270);
      });
    });

    describe('multiple instances', () => {
      it('keeps the scroll lock while another open instance remains', async () => {
        const second = TestBed.createComponent(TestHostComponent);
        second.componentInstance.type.set('overlay');
        second.detectChanges();
        await Promise.resolve();
        second.detectChanges();

        host.isOpen.set(true);
        fixture.detectChanges();
        second.componentInstance.isOpen.set(true);
        second.detectChanges();
        expect(document.body.classList.contains('sh-sidenav-open')).toBe(true);

        host.isOpen.set(false);
        fixture.detectChanges();
        expect(document.body.classList.contains('sh-sidenav-open')).toBe(true);

        second.componentInstance.isOpen.set(false);
        second.detectChanges();
        expect(document.body.classList.contains('sh-sidenav-open')).toBe(false);

        second.destroy();
      });
    });
  });
});
