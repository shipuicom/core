import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipSelect } from './ship-select';

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
    <sh-select [options]="options()" [inlineSearch]="inlineSearch()" [selectMultiple]="true">
      <input type="text" />
    </sh-select>
  `,
  imports: [ShipSelect],
  standalone: true,
})
class TestHostComponent {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
  ]);
  inlineSearch = signal(false);
}

describe('ShipSelect Keyboard Interaction', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let hostComponent: TestHostComponent;
  let selectComponent: ShipSelect;
  let selectDebugEl: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    hostComponent = fixture.componentInstance;
    fixture.detectChanges();

    selectDebugEl = fixture.debugElement.query(By.directive(ShipSelect));
    selectComponent = selectDebugEl.componentInstance;
  });

  it('should prevent default and toggle selection on Space when search is disabled', () => {
    // Open select dropdown
    selectComponent.open();
    fixture.detectChanges();

    expect(selectComponent.isOpen()).toBe(true);

    // Set focused option to the first one (Pizza)
    selectComponent.focusedOptionIndex.set(0);
    fixture.detectChanges();

    // Create space key event
    const inputEl = selectDebugEl.query(By.css('input')).nativeElement;
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault');

    inputEl.dispatchEvent(spaceEvent);
    fixture.detectChanges();

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(selectComponent.selectedOptions()).toContainEqual({ value: 'pizza', label: 'Pizza' });
  });

  it('should NOT prevent default on Space when search is enabled', () => {
    hostComponent.inlineSearch.set(true);
    fixture.detectChanges();

    selectComponent.open();
    fixture.detectChanges();

    const inputEl = selectDebugEl.query(By.css('input')).nativeElement;
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
    const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault');

    inputEl.dispatchEvent(spaceEvent);
    fixture.detectChanges();

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should set input to readonly when search is disabled', () => {
    fixture.detectChanges();
    const inputEl = selectDebugEl.query(By.css('input')).nativeElement;
    expect(inputEl.getAttribute('readonly')).toBe('true');
  });

  it('should NOT set input to readonly when search is enabled', () => {
    hostComponent.inlineSearch.set(true);
    fixture.detectChanges();
    const inputEl = selectDebugEl.query(By.css('input')).nativeElement;
    expect(inputEl.hasAttribute('readonly')).toBe(false);
  });
});
