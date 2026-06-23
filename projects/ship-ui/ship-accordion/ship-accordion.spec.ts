import { describe, beforeEach, afterEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipAccordion } from './ship-accordion';
import { SHIP_CONFIG, ShipVariant } from '@ship-ui/core';

@Component({
  template: `
    <sh-accordion
      [value]="value()"
      (valueChange)="value.set($event)"
      [allowMultiple]="allowMultiple()"
      [variant]="variant()"
      [size]="size()">
      <details value="item1" id="det1">
        <summary>Item 1 Title</summary>
        Item 1 Body Content
      </details>
      <details value="item2" id="det2">
        <summary>Item 2 Title</summary>
        Item 2 Body Content
      </details>
    </sh-accordion>
  `,
  imports: [ShipAccordion],
  standalone: true,
})
class TestHostComponent {
  value = signal<string | null>(null);
  allowMultiple = signal(false);
  variant = signal<ShipVariant | null>(null);
  size = signal<string | null>(null);
}

describe('ShipAccordion', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let accordionComponent: ShipAccordion;
  let accordionDebugEl: any;

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

    
    document.body.appendChild(fixture.nativeElement);

    fixture.detectChanges();

    accordionDebugEl = fixture.debugElement.query(By.directive(ShipAccordion));
    accordionComponent = accordionDebugEl.componentInstance;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('should create accordion and inject summary icons / content wrapper', async () => {
    expect(accordionComponent).toBeTruthy();
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det1 = hostEl.querySelector('#det1');
    const summary = det1.querySelector('summary');

    
    expect(summary.querySelector('sh-icon')).toBeTruthy();
    expect(summary.querySelector('sh-icon').textContent).toBe('caret-down');

    
    const content = det1.querySelector('.content');
    expect(content).toBeTruthy();
    expect(content.textContent).toContain('Item 1 Body Content');
  });

  it('should apply group name to details when allowMultiple is false', async () => {
    hostComponent.allowMultiple.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det1 = hostEl.querySelector('#det1');
    const det2 = hostEl.querySelector('#det2');

    expect(det1.getAttribute('name')).toBeTruthy();
    expect(det1.getAttribute('name')).toBe(det2.getAttribute('name'));
  });

  it('should remove group name from details when allowMultiple is true', async () => {
    hostComponent.allowMultiple.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det1 = hostEl.querySelector('#det1');

    expect(det1.hasAttribute('name')).toBe(false);
  });

  it('should update value model on details toggle event', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det2 = hostEl.querySelector('#det2') as HTMLDetailsElement;

    
    det2.open = true;
    det2.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('item2');

    
    det2.open = false;
    det2.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBeNull();
  });

  it('should handle value updates in multiple mode', async () => {
    hostComponent.allowMultiple.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det1 = hostEl.querySelector('#det1') as HTMLDetailsElement;
    const det2 = hostEl.querySelector('#det2') as HTMLDetailsElement;

    
    det1.open = true;
    det1.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('item1');

    
    det2.open = true;
    det2.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('item1,item2');

    
    det1.open = false;
    det1.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('item2');
  });

  it('should sync open state when model value changes programmatically', async () => {
    hostComponent.value.set('item2');
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    const det1 = hostEl.querySelector('#det1') as HTMLDetailsElement;
    const det2 = hostEl.querySelector('#det2') as HTMLDetailsElement;

    expect(det1.open).toBe(false);
    expect(det2.open).toBe(true);
  });

  it('should apply variant and size classes', async () => {
    hostComponent.variant.set('outlined');
    hostComponent.size.set('small');
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = accordionDebugEl.nativeElement;
    expect(hostEl.classList.contains('outlined')).toBe(true);
    expect(hostEl.classList.contains('small')).toBe(true);
  });
});
