import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipTabs } from './ship-tabs';
import { SHIP_CONFIG, ShipColor, ShipSheetVariant } from '@ship-ui/core';

@Component({
  template: `
    <sh-tabs
      [value]="value()"
      (valueChange)="value.set($event)"
      [closable]="closable()"
      [manualActivation]="manualActivation()"
      [color]="color()"
      [variant]="variant()">
      <button value="tab1" id="btn1">Tab 1</button>
      <button value="tab2" id="btn2">Tab 2</button>
      <button value="tab3" id="btn3">Tab 3</button>
      <div id="no-value">No Value Attribute Item</div>
    </sh-tabs>
  `,
  imports: [ShipTabs],
  standalone: true,
})
class TestHostComponent {
  value = signal<string | null>('tab1');
  closable = signal(false);
  manualActivation = signal(false);
  color = signal<ShipColor | null>(null);
  variant = signal<ShipSheetVariant | null>(null);
}

describe('ShipTabs & ShipSelectionGroup', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let tabsComponent: ShipTabs;
  let tabsDebugEl: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: SHIP_CONFIG,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    tabsDebugEl = fixture.debugElement.query(By.directive(ShipTabs));
    tabsComponent = tabsDebugEl.componentInstance;
  });

  it('should create tabs and apply roles', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(tabsComponent).toBeTruthy();
    
    const hostEl = tabsDebugEl.nativeElement;
    expect(hostEl.getAttribute('role')).toBe('tablist');

    const btn1 = hostEl.querySelector('#btn1');
    expect(btn1.getAttribute('role')).toBe('tab');
  });

  it('should set active class, aria-selected and tabindex on active tab', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1');
    const btn2 = hostEl.querySelector('#btn2');

    expect(btn1.classList.contains('active')).toBe(true);
    expect(btn1.getAttribute('aria-selected')).toBe('true');
    expect(btn1.getAttribute('tabindex')).toBe('0');

    expect(btn2.classList.contains('active')).toBe(false);
    expect(btn2.getAttribute('aria-selected')).toBe('false');
    expect(btn2.getAttribute('tabindex')).toBe('-1');
  });

  it('should update value on tab click', async () => {
    const hostEl = tabsDebugEl.nativeElement;
    const btn2 = hostEl.querySelector('#btn2') as HTMLButtonElement;

    btn2.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('tab2');
    expect(btn2.classList.contains('active')).toBe(true);
  });

  it('should allow closing active tab if closable is true', async () => {
    hostComponent.closable.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1') as HTMLButtonElement;

    btn1.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBeNull();
    expect(btn1.classList.contains('active')).toBe(false);
  });

  it('should navigate and activate next tab on ArrowRight / ArrowDown', async () => {
    const hostEl = tabsDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1') as HTMLButtonElement;

    btn1.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    btn1.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('tab2');
    expect(document.activeElement?.id).toBe('btn2');
  });

  it('should navigate and activate previous tab on ArrowLeft / ArrowUp', async () => {
    hostComponent.value.set('tab1');
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1') as HTMLButtonElement;

    btn1.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    btn1.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('tab3'); 
    expect(document.activeElement?.id).toBe('btn3');
  });

  it('should select tab on Enter or Space key press', async () => {
    hostComponent.value.set(null);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    const btn2 = hostEl.querySelector('#btn2') as HTMLButtonElement;

    btn2.focus();
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    btn2.dispatchEvent(enterEvent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('tab2');
  });

  it('should only move focus and NOT select tab with manualActivation=true', async () => {
    hostComponent.manualActivation.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1') as HTMLButtonElement;

    btn1.focus();
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    btn1.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();

    
    expect(hostComponent.value()).toBe('tab1');
    expect(document.activeElement?.id).toBe('btn2');

    
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    document.activeElement?.dispatchEvent(enterEvent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('tab2');
  });

  it('should apply color and variant classes to host', async () => {
    hostComponent.color.set('primary');
    hostComponent.variant.set('outlined');
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = tabsDebugEl.nativeElement;
    expect(hostEl.classList.contains('primary')).toBe(true);
    expect(hostEl.classList.contains('outlined')).toBe(true);
  });
});
