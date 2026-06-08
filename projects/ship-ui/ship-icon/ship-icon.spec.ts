import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipIcon } from './ship-icon';
import { SHIP_CONFIG } from '@ship-ui/core';

describe('ShipIcon', () => {
  let fixture: ComponentFixture<ShipIcon>;
  let component: ShipIcon;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipIcon);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not have the unfocused class by default', () => {
    component.isUnfocused.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('unfocused')).toBe(false);
  });

  it('should react to window blur/focus events', () => {
    fixture.detectChanges();
    
    window.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('unfocused')).toBe(true);

    window.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('unfocused')).toBe(false);
  });
});

describe('ShipIcon with SHIP_CONFIG disabled unfocus', () => {
  let fixture: ComponentFixture<ShipIcon>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipIcon],
      providers: [
        {
          provide: SHIP_CONFIG,
          useValue: {
            icon: {
              disableUnfocus: true,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipIcon);
  });

  it('should not have the unfocused class even if window blurs if disableUnfocus is true', () => {
    fixture.detectChanges();
    window.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.nativeElement.classList.contains('unfocused')).toBe(false);
  });
});
