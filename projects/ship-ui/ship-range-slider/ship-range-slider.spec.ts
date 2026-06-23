import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SHIP_CONFIG, ShipColor, ShipRangeSliderVariant, ShipSize } from '@ship-ui/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipRangeSlider } from './ship-range-slider';

@Component({
  template: `
    <sh-range-slider
      [value]="value()"
      (valueChange)="value.set($event)"
      [color]="color()"
      [variant]="variant()"
      [size]="size()"
      [sharp]="sharp()"
      [alwaysShow]="alwaysShow()"
      unit="%">
      <label>Volume</label>
      <input type="range" min="0" max="100" step="5" value="20" />
    </sh-range-slider>
  `,
  imports: [ShipRangeSlider],
  standalone: true,
})
class TestHostComponent {
  value = signal<number>(20);
  color = signal<ShipColor | null>(null);
  variant = signal<ShipRangeSliderVariant | null>(null);
  size = signal<ShipSize | null>(null);
  sharp = signal<boolean | undefined>(undefined);
  alwaysShow = signal<boolean | undefined>(undefined);
}

describe('ShipRangeSlider', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let sliderComponent: ShipRangeSlider;
  let sliderDebugEl: any;

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

    sliderDebugEl = fixture.debugElement.query(By.directive(ShipRangeSlider));
    sliderComponent = sliderDebugEl.componentInstance;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('should create range slider and extract min, max, step from input', async () => {
    expect(sliderComponent).toBeTruthy();
    fixture.detectChanges();
    await fixture.whenStable();

    const state = sliderComponent.inputState();
    expect(state.min).toBe(0);
    expect(state.max).toBe(100);
    expect(state.step).toBe(5);
  });

  it('should synchronize model changes to input value', async () => {
    hostComponent.value.set(45);
    fixture.detectChanges();
    await fixture.whenStable();

    const inputEl = sliderDebugEl.nativeElement.querySelector('input[type="range"]');
    expect(inputEl.value).toBe('45');
    expect(sliderComponent.trackFilledPercentage()).toBe(45);
  });

  it('should synchronize programmatic input value overrides via redefined setter', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const inputEl = sliderDebugEl.nativeElement.querySelector('input[type="range"]');

    inputEl.value = '70';
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe(70);
  });

  it('should react to MutationObserver attribute changes on min/max/step', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const inputEl = sliderDebugEl.nativeElement.querySelector('input[type="range"]');
    inputEl.setAttribute('max', '200');
    inputEl.setAttribute('step', '10');

    await new Promise((resolve) => setTimeout(resolve, 50));
    fixture.detectChanges();
    await fixture.whenStable();

    const state = sliderComponent.inputState();
    expect(state.max).toBe(200);
    expect(state.step).toBe(10);
  });

  it('should compute value on click along the track wrap', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const trackWrap = sliderDebugEl.query(By.css('.track-wrap')).nativeElement;

    vi.spyOn(trackWrap, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      right: 300,
      bottom: 110,
      width: 200,
      height: 10,
      x: 100,
      y: 100,
      toJSON: () => {},
    } as any);

    const clickEvent = new MouseEvent('click', {
      clientX: 200,
      bubbles: true,
      cancelable: true,
    });

    trackWrap.dispatchEvent(clickEvent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(hostComponent.value()).toBe(50);
  });

  it('should apply color, variant, size, sharp, and alwaysShow host classes', async () => {
    hostComponent.color.set('warn');
    hostComponent.variant.set('thick');
    hostComponent.size.set('small');
    hostComponent.sharp.set(true);
    hostComponent.alwaysShow.set(true);

    fixture.detectChanges();
    await fixture.whenStable();

    const hostEl = sliderDebugEl.nativeElement;
    expect(hostEl.classList.contains('warn')).toBe(true);
    expect(hostEl.classList.contains('thick')).toBe(true);
    expect(hostEl.classList.contains('small')).toBe(true);
    expect(hostEl.classList.contains('sharp')).toBe(true);
    expect(hostEl.classList.contains('always-show')).toBe(true);
  });
});
