import { describe, beforeEach, it, expect } from 'vitest';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipToggleCard } from './ship-toggle-card'; 



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
      fixture.detectChanges(); 
      expect(component.isActive()).toBe(false);
      expect(fixture.nativeElement.classList).not.toContain('active');
    });

    it('should toggle isActive when the header is clicked', () => {
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('h3'));

      
      header.triggerEventHandler('click', null);
      fixture.detectChanges();
      expect(component.isActive()).toBe(true);
      expect(fixture.nativeElement.classList).toContain('active');

      
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

  describe('Disable Toggle Behavior', () => {
    it('should NOT toggle when clicked if disableToggle is true', () => {
      fixture.componentRef.setInput('disableToggle', true);
      fixture.detectChanges();

      
      expect(component.isActive()).toBe(true);

      
      const header = fixture.debugElement.query(By.css('h3'));
      header.triggerEventHandler('click', null);

      fixture.detectChanges();

      
      expect(component.isActive()).toBe(true);
    });

    it('should hide the toggle icon if disableToggle is true', () => {
      fixture.componentRef.setInput('disableToggle', true);
      fixture.detectChanges();

      const icon = fixture.debugElement.query(By.css('sh-icon.toggle-icon'));
      expect(icon).toBeNull();
    });

    it('should allow programmatic toggle even if disableToggle is true', () => {
      fixture.componentRef.setInput('disableToggle', true);
      fixture.detectChanges();

      expect(component.isActive()).toBe(true);

      component.toggle();
      fixture.detectChanges();

      expect(component.isActive()).toBe(false);
    });
  });
});
