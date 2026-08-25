import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { computeAccessibleName } from '@ship-ui/core/ship-screenreader';
import { ShipToggle } from './ship-toggle';

@Component({
  imports: [ShipToggle],
  template: `<sh-toggle>Dark mode</sh-toggle>`,
})
class Host {}

describe('ShipToggle accessibility', () => {
  it('labels the internal input with the projected content', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('sh-toggle') as HTMLElement;
    const input = host.querySelector('input.internal-input') as HTMLInputElement;

    expect(input.getAttribute('aria-labelledby')).toBe(host.id);
    expect(computeAccessibleName(input)).toBe('Dark mode');
  });
});
