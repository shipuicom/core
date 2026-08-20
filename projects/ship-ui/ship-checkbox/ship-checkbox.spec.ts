import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { computeAccessibleName } from '@ship-ui/core/ship-screenreader';
import { ShipCheckbox } from './ship-checkbox';

@Component({
  imports: [ShipCheckbox],
  template: `<sh-checkbox>Accept terms</sh-checkbox>`,
})
class Host {}

describe('ShipCheckbox accessibility', () => {
  it('labels the internal input with the projected content', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('sh-checkbox') as HTMLElement;
    const input = host.querySelector('input.internal-input') as HTMLInputElement;

    expect(input.getAttribute('aria-labelledby')).toBe(host.id);
    expect(computeAccessibleName(input)).toBe('Accept terms');
  });

  it('labels a projected input with the projected content', async () => {
    TestBed.resetTestingModule();
    @Component({
      imports: [ShipCheckbox],
      template: `<sh-checkbox><input type="checkbox" /> Enable notifications</sh-checkbox>`,
    })
    class Projected {}

    const fixture = TestBed.createComponent(Projected);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('sh-checkbox') as HTMLElement;
    const input = host.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-labelledby')).toBe(host.id);
    expect(computeAccessibleName(input)).toBe('Enable notifications');
  });

  it('keeps a consumer-provided host id', () => {
    TestBed.resetTestingModule();
    @Component({
      imports: [ShipCheckbox],
      template: `<sh-checkbox id="my-check">Keep me</sh-checkbox>`,
    })
    class WithId {}

    const fixture = TestBed.createComponent(WithId);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input.internal-input') as HTMLInputElement;
    expect(input.getAttribute('aria-labelledby')).toBe('my-check');
  });
});
