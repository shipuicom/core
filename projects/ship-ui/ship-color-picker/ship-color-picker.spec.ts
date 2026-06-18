import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipColorPicker } from './ship-color-picker';
import { ShipColorPickerInput } from './ship-color-picker-input';

// Mock HTMLCanvasElement 2D context
const mockCtx = {
  clearRect: vi.fn(),
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  fillRect: vi.fn(),
  getImageData: vi.fn((x: number, y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray((w || 200) * (h || 200) * 4),
  })),
  set fillStyle(val: any) {},
  get fillStyle() { return ''; }
};

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    if (type === '2d') {
      return mockCtx as any;
    }
    return null;
  } as any;
}

if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function () {};
  }
  if (!HTMLElement.prototype.hidePopover) {
    HTMLElement.prototype.hidePopover = function () {};
  }
}

@Component({
  template: `
    <sh-color-picker-input
      [(isOpen)]="isOpen"
      [format]="format()"
      [renderingType]="renderingType()"
      (closed)="onClosed($event)">
      <input type="text" />
    </sh-color-picker-input>
  `,
  standalone: true,
  imports: [ShipColorPickerInput],
})
class TestHostComponent {
  isOpen = signal(false);
  format = signal<'rgb' | 'rgba' | 'hex' | 'hex8' | 'hsl' | 'hsla'>('rgb');
  renderingType = signal<'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'>('hsl');
  closedValue = '';

  onClosed(val: string) {
    this.closedValue = val;
  }
}

describe('ShipColorPicker & ShipColorPickerInput', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, ShipColorPicker],
    }).compileComponents();
  });

  describe('ShipColorPicker Component', () => {
    it('should create the color picker', () => {
      const fixture = TestBed.createComponent(ShipColorPicker);
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should calculate selectedColorRgb and selectedColorHex correctly', () => {
      const fixture = TestBed.createComponent(ShipColorPicker);
      const comp = fixture.componentInstance;
      
      comp.selectedColor.set([255, 0, 0, 1]);
      fixture.detectChanges();

      expect(comp.selectedColorRgb()).toBe('rgba(255,0,0,1)');
      expect(comp.selectedColorHex()).toBe('#ff0000');
    });

    it('should emit currentColor output when selectedColor changes', () => {
      const fixture = TestBed.createComponent(ShipColorPicker);
      const comp = fixture.componentInstance;
      let emitted: any = null;
      comp.currentColor.subscribe((val) => (emitted = val));

      // Set both alpha and selectedColor to keep them in sync
      comp.alpha.set(0.5);
      comp.selectedColor.set([0, 255, 0, 0.5]);
      fixture.detectChanges();

      expect(emitted).toBeTruthy();
      expect(emitted.hex).toBe('#00ff00');
      expect(emitted.alpha).toBe(0.5);
    });
  });

  describe('ShipColorPickerInput Component', () => {
    it('should create the color picker input', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const inputEl = fixture.nativeElement.querySelector('sh-color-picker-input');
      expect(inputEl).toBeTruthy();
    });

    it('should open the popover when the text input is focused', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      
      const host = fixture.componentInstance;
      const textInput = fixture.nativeElement.querySelector('input');
      
      expect(host.isOpen()).toBe(false);
      
      textInput.dispatchEvent(new Event('focus'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      
      expect(host.isOpen()).toBe(true);
    });

    it('should update model value when typing a valid color', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const textInput = fixture.nativeElement.querySelector('input');

      // Type '#0000ff' (blue)
      textInput.value = '#0000ff';
      textInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const inputComp = fixture.debugElement.children[0].componentInstance as ShipColorPickerInput;
      expect(inputComp.internalColorTuple()).toEqual([0, 0, 255, 1]);
      expect(inputComp.formattedColorString()).toBe('rgb(0, 0, 255)');
    });

    it('should update input text string on format changes', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const host = fixture.componentInstance;
      const textInput = fixture.nativeElement.querySelector('input');

      // Initialize with red
      textInput.value = '#ff0000';
      textInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Change format to hex
      host.format.set('hex');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(textInput.value).toBe('#ff0000');

      // Change format to hsl
      host.format.set('hsl');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(textInput.value).toBe('hsl(0, 100%, 50%)');
    });

    it('should emit closed output with current color value when close is called', async () => {
      const fixture = TestBed.createComponent(TestHostComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const host = fixture.componentInstance;
      const textInput = fixture.nativeElement.querySelector('input');
      textInput.value = '#00ff00';
      textInput.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const inputComp = fixture.debugElement.children[0].componentInstance as ShipColorPickerInput;
      inputComp.close();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(host.closedValue).toBe('rgb(0, 255, 0)');
    });
  });
});
