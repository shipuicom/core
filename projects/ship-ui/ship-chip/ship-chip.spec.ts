import { describe, beforeEach, it, expect } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipChip } from './ship-chip';

describe('ShipChip', () => {
  let fixture: ComponentFixture<ShipChip>;
  let component: ShipChip;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipChip],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipChip);
    component = fixture.componentInstance;
  });

  it('should create the chip', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(fixture.nativeElement.classList.contains('sh-sheet')).toBe(true);
  });

  it('should apply variant and color classes correctly', () => {
    fixture.componentRef.setInput('variant', 'primary-tonal');
    fixture.componentRef.setInput('color', 'primary');
    fixture.detectChanges();
    
    const classList = fixture.nativeElement.className;
    expect(classList).toContain('primary');
    expect(classList).toContain('primary-tonal');
  });

  it('should apply size classes correctly', () => {
    fixture.componentRef.setInput('size', 'lg');
    fixture.detectChanges();
    
    expect(fixture.nativeElement.classList.contains('lg')).toBe(true);
  });

  it('should apply sharp class if sharp is true', () => {
    fixture.componentRef.setInput('sharp', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('sharp')).toBe(true);

    fixture.componentRef.setInput('sharp', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('sharp')).toBe(false);
  });

  it('should apply dynamic class if dynamic is true', () => {
    fixture.componentRef.setInput('dynamic', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('dynamic')).toBe(true);
  });

  it('should apply readonly class if readonly is true', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('readonly')).toBe(true);
  });

  it('should toggle no-bg class based on noBg input', () => {
    fixture.componentRef.setInput('noBg', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('no-bg')).toBe(true);

    fixture.componentRef.setInput('noBg', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('no-bg')).toBe(false);
  });

  it('applies the selected class from the input', () => {
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('selected')).toBe(true);
    expect(fixture.nativeElement.getAttribute('role')).toBeNull();

    fixture.componentRef.setInput('selected', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('selected')).toBe(false);
  });

  it('is a pressed button when selectable and toggles on click, Enter and Space', () => {
    const host = fixture.nativeElement as HTMLElement;
    const emitted: boolean[] = [];
    component.selectedChange.subscribe((v) => emitted.push(v));

    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    expect(host.getAttribute('role')).toBe('button');
    expect(host.getAttribute('tabindex')).toBe('0');
    expect(host.getAttribute('aria-pressed')).toBe('false');

    host.click();
    fixture.detectChanges();
    expect(host.classList.contains('selected')).toBe(true);
    expect(host.getAttribute('aria-pressed')).toBe('true');

    host.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.classList.contains('selected')).toBe(false);

    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    host.dispatchEvent(space);
    fixture.detectChanges();
    expect(host.classList.contains('selected')).toBe(true);
    expect(space.defaultPrevented).toBe(true);

    expect(emitted).toEqual([true, false, true]);
  });

  it('follows the selected input again after a local toggle', () => {
    const host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    host.click();
    fixture.detectChanges();
    expect(host.classList.contains('selected')).toBe(true);

    fixture.componentRef.setInput('selected', true);
    fixture.componentRef.setInput('selected', false);
    fixture.detectChanges();
    expect(host.classList.contains('selected')).toBe(false);
  });
});
