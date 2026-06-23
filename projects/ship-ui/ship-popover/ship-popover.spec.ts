import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipPopover } from './ship-popover';


if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function (this: HTMLElement) {
      this.setAttribute('open', '');
    };
  }
  if (!HTMLElement.prototype.hidePopover) {
    HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
      this.removeAttribute('open');
    };
  }
}

@Component({
  template: `
    <sh-popover
      [isOpen]="isOpen()"
      (isOpenChange)="isOpen.set($event)"
      [disableOpenByClick]="disableOpenByClick()"
      [asSheetOnMobile]="asSheetOnMobile()"
      [asMultiLayer]="asMultiLayer()"
      [options]="options()">
      <button trigger>Trigger Button</button>
      <div class="my-content">Popover Content</div>
    </sh-popover>
  `,
  imports: [ShipPopover],
  standalone: true,
})
class TestHostComponent {
  isOpen = signal(false);
  disableOpenByClick = signal(false);
  asSheetOnMobile = signal(false);
  asMultiLayer = signal(false);
  options = signal({});
}

describe('ShipPopover', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let popoverComponent: ShipPopover;
  let popoverDebugEl: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    popoverDebugEl = fixture.debugElement.query(By.directive(ShipPopover));
    popoverComponent = popoverDebugEl.componentInstance;
  });

  it('should create popover', () => {
    expect(popoverComponent).toBeTruthy();
  });

  it('should apply host classes correctly', () => {
    hostComponent.asMultiLayer.set(true);
    hostComponent.asSheetOnMobile.set(true);
    fixture.detectChanges();

    const hostEl = popoverDebugEl.nativeElement;
    expect(hostEl.classList.contains('multi-layer')).toBe(true);
    expect(hostEl.classList.contains('as-sheet')).toBe(true);
  });

  it('should toggle popover on click when click is enabled', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const triggerEl = popoverDebugEl.query(By.css('.trigger')).nativeElement;
    triggerEl.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(true);

    triggerEl.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });

  it('should NOT toggle popover on click when disableOpenByClick is true', async () => {
    hostComponent.disableOpenByClick.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const triggerEl = popoverDebugEl.query(By.css('.trigger')).nativeElement;
    triggerEl.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });

  it('should trigger close on overlay click', async () => {
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const overlay = popoverDebugEl.query(By.css('.overlay'));
    expect(overlay).toBeTruthy();

    overlay.nativeElement.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });

  it('should support closing via Escape key if closeOnEsc is true', async () => {
    hostComponent.options.set({ closeOnEsc: true });
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.isOpen()).toBe(false);
  });

  it('should NOT support closing via Escape key if closeOnEsc is false', async () => {
    hostComponent.options.set({ closeOnEsc: false });
    hostComponent.isOpen.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    document.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(hostComponent.isOpen()).toBe(true);
  });
});
