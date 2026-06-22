import { Component, ElementRef, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShipA11yKeybindingsDirective } from './ship-a11y-keybindings.directive';
import { ShipA11yKeybindingsService } from './ship-a11y-keybindings.service';

@Component({
  template: `
    <button
      #localBtn
      [shA11yKeybinding]="'item.select'"
      [mode]="'local'"
      (triggered)="onLocalTriggered($event)"
      (click)="onClicked()">
      Local Button
    </button>

    <button #globalBtn [shA11yKeybinding]="'app.search'" [mode]="'global'" (triggered)="onGlobalTriggered($event)">
      Global Button
    </button>

    <input #textInput type="text" />
  `,
  imports: [ShipA11yKeybindingsDirective],
  standalone: true,
})
class TestComponent {
  localBtn = viewChild<ElementRef<HTMLButtonElement>>('localBtn');
  globalBtn = viewChild<ElementRef<HTMLButtonElement>>('globalBtn');
  textInput = viewChild<ElementRef<HTMLInputElement>>('textInput');

  localTriggerCount = 0;
  globalTriggerCount = 0;
  clickCount = 0;

  onLocalTriggered(event: KeyboardEvent) {
    this.localTriggerCount++;
  }

  onGlobalTriggered(event: KeyboardEvent) {
    this.globalTriggerCount++;
  }

  onClicked() {
    this.clickCount++;
  }
}

describe('ShipA11yKeybindingsDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let service: ShipA11yKeybindingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [ShipA11yKeybindingsService],
    });

    service = TestBed.inject(ShipA11yKeybindingsService);

    // Register actions
    service.registerDefaults({
      'item.select': 'enter',
      'app.search': 'ctrlOrCmd+s',
      'item.delete': 'delete',
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set the aria-keyshortcuts attribute on the host element', () => {
    const localBtnEl = component.localBtn()?.nativeElement;
    const globalBtnEl = component.globalBtn()?.nativeElement;

    expect(localBtnEl?.getAttribute('aria-keyshortcuts')).toBeTruthy();
    expect(globalBtnEl?.getAttribute('aria-keyshortcuts')).toBeTruthy();
  });

  it('should trigger click and emit triggered on local keydown match', () => {
    const localBtnEl = component.localBtn()?.nativeElement;

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
    });

    localBtnEl?.dispatchEvent(enterEvent);
    fixture.detectChanges();

    expect(component.localTriggerCount).toBe(1);
    expect(component.clickCount).toBe(1);
  });

  it('should not trigger on local keydown mismatch', () => {
    const localBtnEl = component.localBtn()?.nativeElement;

    const mismatchEvent = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
    });

    localBtnEl?.dispatchEvent(mismatchEvent);
    fixture.detectChanges();

    expect(component.localTriggerCount).toBe(0);
    expect(component.clickCount).toBe(0);
  });

  it('should listen to global keydown events', () => {
    const searchEvent = new KeyboardEvent('keydown', {
      key: 's',
      ctrlKey: !service.isMac,
      metaKey: service.isMac,
      bubbles: true,
    });

    window.dispatchEvent(searchEvent);
    fixture.detectChanges();

    expect(component.globalTriggerCount).toBe(1);
  });

  it('should ignore global events if focus is inside an input unless modifiers are present', () => {
    // Add another action without modifiers
    service.registerDefaults({
      'item.delete': 'd',
    });

    // Dynamically update bindings in DOM
    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('shA11yKeybinding', 'item.delete');
    deleteBtn.setAttribute('mode', 'global');

    // Focus the text input
    const inputEl = component.textInput()?.nativeElement;
    inputEl?.focus();

    // Trigger keydown of 'd' (no modifiers)
    const dEvent = new KeyboardEvent('keydown', {
      key: 'd',
      bubbles: true,
    });

    inputEl?.dispatchEvent(dEvent);
    fixture.detectChanges();

    // The handler should not execute because focus is in the input element
    expect(component.globalTriggerCount).toBe(0);
  });
});
