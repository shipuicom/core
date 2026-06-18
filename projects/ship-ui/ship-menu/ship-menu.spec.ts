import { describe, beforeAll, beforeEach, it, expect } from 'vitest';
import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipMenu } from './ship-menu';

@Component({
  selector: 'sh-test-component',
  template: `
    <sh-menu [isOpen]="isOpen" [searchable]="searchable">
      <button trigger>Menu Trigger</button>
      <div menu>
        <button id="opt1">Option 1</button>
        <button id="opt2">Option 2</button>
        <button id="opt3">Option 3</button>
      </div>
    </sh-menu>
  `,
  standalone: true,
  imports: [ShipMenu],
})
class TestComponent {
  shipMenu = viewChild.required(ShipMenu);
  isOpen = false;
  searchable = false;
}

describe('ShipMenu Keyboard Navigation', () => {
  let fixture: ComponentFixture<TestComponent>;
  let hostComponent: TestComponent;

  beforeAll(() => {
    if (typeof HTMLDivElement !== 'undefined') {
      HTMLDivElement.prototype.showPopover = () => {};
      HTMLDivElement.prototype.hidePopover = () => {};
    }
    if (typeof HTMLElement !== 'undefined') {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, ShipMenu],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create menu component', () => {
    expect(hostComponent.shipMenu()).toBeTruthy();
  });

  it('should navigate down by exactly one option at a time on ArrowDown when non-searchable', async () => {
    const menu = hostComponent.shipMenu();

    // Open the menu
    menu.open();
    fixture.detectChanges();

    // Wait a macrotask / microtask for effects to run and elements to populate
    await fixture.whenStable();
    fixture.detectChanges();

    // Verify it is open and added to openMenus
    expect(menu.isOpen()).toBe(true);
    expect(ShipMenu['openMenus'].length).toBe(1);

    // Initially activeOptionIndex should be -1
    expect(menu.activeOptionIndex()).toBe(-1);

    // Simulate ArrowDown on document
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    document.documentElement.dispatchEvent(event);
    fixture.detectChanges();

    // Verify it moved to index 0 (Option 1)
    expect(menu.activeOptionIndex()).toBe(0);

    // Simulate ArrowDown again
    document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    // Verify it moved to index 1 (Option 2)
    expect(menu.activeOptionIndex()).toBe(1);

    // Simulate ArrowDown again
    document.documentElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    // Verify it moved to index 2 (Option 3)
    expect(menu.activeOptionIndex()).toBe(2);
  });

  it('should navigate down by exactly one option at a time on ArrowDown when searchable', async () => {
    hostComponent.searchable = true;
    fixture.detectChanges();

    const menu = hostComponent.shipMenu();

    // Open the menu
    menu.open();
    fixture.detectChanges();

    // Wait a macrotask / microtask for effects to run and elements to populate
    await fixture.whenStable();
    fixture.detectChanges();

    // Verify it is open
    expect(menu.isOpen()).toBe(true);

    const inputEl = menu.inputRef()?.nativeElement;
    expect(inputEl).toBeTruthy();

    // Initially activeOptionIndex should be -1
    expect(menu.activeOptionIndex()).toBe(-1);

    // Simulate ArrowDown on input
    inputEl?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    // Verify it moved to index 0 (Option 1)
    expect(menu.activeOptionIndex()).toBe(0);

    // Simulate ArrowDown again
    inputEl?.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    // Verify it moved to index 1 (Option 2)
    expect(menu.activeOptionIndex()).toBe(1);
  });
});
