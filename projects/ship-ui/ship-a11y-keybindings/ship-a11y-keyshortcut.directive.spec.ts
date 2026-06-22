import { Component, ElementRef, model, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShipA11yKeyshortcutDirective } from './ship-a11y-keyshortcut.directive';
import { ShipA11yKeybindingsService } from './ship-a11y-keybindings.service';

@Component({
  template: `
    <button #testBtn [shA11yKeyshortcut]="actionName()">
      Sort Column
    </button>
  `,
  imports: [ShipA11yKeyshortcutDirective],
  standalone: true,
})
class TestComponent {
  testBtn = viewChild<ElementRef<HTMLButtonElement>>('testBtn');
  actionName = model<string>('table.sort');
}

describe('ShipA11yKeyshortcutDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;
  let service: ShipA11yKeybindingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestComponent],
      providers: [ShipA11yKeybindingsService],
    });

    service = TestBed.inject(ShipA11yKeybindingsService);
    service.registerDefaults({
      'table.sort': 'Enter, space',
    });

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set the aria-keyshortcuts attribute on the host element dynamically', () => {
    const btnEl = component.testBtn()?.nativeElement;
    expect(btnEl?.getAttribute('aria-keyshortcuts')).toBe('Enter, Space');
  });

  it('should remove the aria-keyshortcuts attribute if action shortcut is not found', () => {
    const btnEl = component.testBtn()?.nativeElement;
    
    // Change the action name to something that doesn't exist
    component.actionName.set('non-existent');
    fixture.detectChanges();

    expect(btnEl?.hasAttribute('aria-keyshortcuts')).toBe(false);
  });
});
