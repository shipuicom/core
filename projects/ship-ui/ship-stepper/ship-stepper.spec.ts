import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipStepper } from './ship-stepper';
import { SHIP_CONFIG, ShipColor } from '@ship-ui/core';

@Component({
  template: `
    <sh-stepper [value]="value()" (valueChange)="value.set($event)" [color]="color()">
      <button value="step1" id="step1">Step 1</button>
      <button value="step2" id="step2">Step 2</button>
      <button value="step3" id="step3">Step 3</button>
      <button id="extra-btn">Extra</button>
    </sh-stepper>
  `,
  imports: [ShipStepper],
  standalone: true,
})
class TestHostComponent {
  value = signal<string | null>('step1');
  color = signal<ShipColor | null>(null);
}

describe('ShipStepper', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let stepperComponent: ShipStepper;
  let stepperDebugEl: any;

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

    stepperDebugEl = fixture.debugElement.query(By.directive(ShipStepper));
    stepperComponent = stepperDebugEl.componentInstance;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('should create stepper and prepend radio elements', async () => {
    expect(stepperComponent).toBeTruthy();
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = stepperDebugEl.nativeElement;
    const step1 = hostEl.querySelector('#step1');
    const step2 = hostEl.querySelector('#step2');

    
    const radio1 = step1.querySelector('.sh-radio');
    const radio2 = step2.querySelector('.sh-radio');
    expect(radio1).toBeTruthy();
    expect(radio1.querySelector('.radio.sh-sheet')).toBeTruthy();
    expect(radio2).toBeTruthy();
    expect(radio2.querySelector('.radio.sh-sheet')).toBeTruthy();
  });

  it('should calculate and update --stepper-progress variable', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = stepperDebugEl.nativeElement;
    
    expect(hostEl.style.getPropertyValue('--stepper-progress')).toBe('0%');

    
    hostComponent.value.set('step2');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(hostEl.style.getPropertyValue('--stepper-progress')).toBe('33.33333333333333%');

    
    hostComponent.value.set('step3');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(hostEl.style.getPropertyValue('--stepper-progress')).toBe('66.66666666666666%');
  });

  it('should react to mutation events on children classes', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = stepperDebugEl.nativeElement;
    const extraBtn = hostEl.querySelector('#extra-btn');

    
    const spy = vi.spyOn(stepperComponent, 'updateProgress');

    
    extraBtn.setAttribute('class', 'active');

    
    await new Promise(resolve => setTimeout(resolve, 50));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalled();
  });

  it('should apply color to host', async () => {
    hostComponent.color.set('primary');
    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = stepperDebugEl.nativeElement;
    expect(hostEl.classList.contains('primary')).toBe(true);
  });
});
