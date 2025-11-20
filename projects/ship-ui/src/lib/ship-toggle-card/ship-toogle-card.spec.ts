import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipIcon } from '../ship-icon/ship-icon';
import { ShipToggleCard } from './ship-toggle-card'; // Update path as needed

// 1. Create a Mock for the child component (ShipIcon)
// This prevents the test from depending on the actual Icon implementation
@Component({
  selector: 'sh-icon',
  template: '',
  standalone: true,
})
class MockShipIcon {}

describe('ShipToggleCard', () => {
  let component: ShipToggleCard;
  let fixture: ComponentFixture<ShipToggleCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipToggleCard],
    })
      // 2. Override the component to use the Mock Icon instead of the real one
      .overrideComponent(ShipToggleCard, {
        remove: { imports: [ShipIcon] },
        add: { imports: [MockShipIcon] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ShipToggleCard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Default Behavior', () => {
    it('should default to inactive (false)', () => {
      fixture.detectChanges(); // Trigger ngOnInit
      expect(component.isActive()).toBe(false);
      expect(fixture.nativeElement.classList).not.toContain('active');
    });

    it('should toggle isActive when the header is clicked', () => {
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('h3'));

      // Click to open
      header.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(component.isActive()).toBe(true);
      expect(fixture.nativeElement.classList).toContain('active');

      // Click to close
      header.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(component.isActive()).toBe(false);
      expect(fixture.nativeElement.classList).not.toContain('active');
    });

    it('should show the toggle icon by default', () => {
      fixture.detectChanges();
      const icon = fixture.debugElement.query(By.css('sh-icon.toggle-icon'));
      expect(icon).toBeTruthy();
    });
  });

  describe('Disallow Toggle Behavior', () => {
    it('should force isActive to true on init if disallowToggle is true', () => {
      // 3. Set Signal Input before change detection runs
      fixture.componentRef.setInput('disallowToggle', true);

      fixture.detectChanges(); // triggers ngOnInit

      expect(component.isActive()).toBe(true);
      expect(fixture.nativeElement.classList).toContain('active');
    });

    it('should NOT toggle when clicked if disallowToggle is true', () => {
      fixture.componentRef.setInput('disallowToggle', true);
      fixture.detectChanges();

      // Ensure it started as true
      expect(component.isActive()).toBe(true);

      // Try to click header
      const header = fixture.debugElement.query(By.css('h3'));
      header.triggerEventHandler('click', null);

      fixture.detectChanges();

      // Should remain true (no toggle)
      expect(component.isActive()).toBe(true);
    });

    it('should hide the toggle icon if disallowToggle is true', () => {
      fixture.componentRef.setInput('disallowToggle', true);
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('sh-icon.toggle-icon'));
      expect(icon).toBeNull();
    });
  });
});
