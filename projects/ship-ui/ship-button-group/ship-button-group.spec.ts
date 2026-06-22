import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipButtonGroup } from './ship-button-group';
import { SHIP_CONFIG, ShipColor, ShipButtonGroupVariant, ShipSize } from '@ship-ui/core';

@Component({
  template: `
    <sh-button-group
      [value]="value()"
      (valueChange)="value.set($event)"
      [color]="color()"
      [variant]="variant()"
      [size]="size()">
      <button value="btn1" id="btn1">Button 1</button>
      <button value="btn2" id="btn2">Button 2</button>
      <button value="btn3" id="btn3">Button 3</button>
    </sh-button-group>
  `,
  imports: [ShipButtonGroup],
  standalone: true,
})
class TestHostComponent {
  value = signal<string | null>('btn1');
  color = signal<ShipColor | null>(null);
  variant = signal<ShipButtonGroupVariant | null>(null);
  size = signal<ShipSize | null>(null);
}

describe('ShipButtonGroup', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let groupComponent: ShipButtonGroup;
  let groupDebugEl: any;

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

    groupDebugEl = fixture.debugElement.query(By.directive(ShipButtonGroup));
    groupComponent = groupDebugEl.componentInstance;
  });

  it('should create and apply role="group"', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(groupComponent).toBeTruthy();
    expect(groupDebugEl.nativeElement.getAttribute('role')).toBe('group');
  });

  it('should set active class, aria-pressed and tabindex on active button', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = groupDebugEl.nativeElement;
    const btn1 = hostEl.querySelector('#btn1');
    const btn2 = hostEl.querySelector('#btn2');

    expect(btn1.classList.contains('active')).toBe(true);
    expect(btn1.getAttribute('aria-pressed')).toBe('true');
    expect(btn1.getAttribute('tabindex')).toBe('0');

    expect(btn2.classList.contains('active')).toBe(false);
    expect(btn2.getAttribute('aria-pressed')).toBe('false');
    expect(btn2.getAttribute('tabindex')).toBe('-1');
  });

  it('should update active selection on button click', async () => {
    const hostEl = groupDebugEl.nativeElement;
    const btn2 = hostEl.querySelector('#btn2') as HTMLButtonElement;

    btn2.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe('btn2');
    expect(btn2.classList.contains('active')).toBe(true);
    expect(btn2.getAttribute('aria-pressed')).toBe('true');
  });
});
