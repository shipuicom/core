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

  it('should map letter variants to type-x', () => {
    fixture.componentRef.setInput('variant', 'b');
    fixture.detectChanges();
    
    expect(fixture.nativeElement.classList.contains('type-b')).toBe(true);
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
});
