import { describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ShipDatepickerInput } from './ship-datepicker-input';

@Component({
  template: `
    <sh-datepicker-input>
      <label>Start date</label>
      <input [ngModel]="date()" />
    </sh-datepicker-input>
  `,
  standalone: true,
  imports: [ShipDatepickerInput, FormsModule],
})
class Host {
  date = signal<Date | null>(null);
}

async function setup(date: Date) {
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.date.set(date);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

describe('ShipDatepickerInput value formatting', () => {
  it('reflects the masking format into the input value for date-only dates', async () => {
    const input = await setup(new Date(2026, 7, 20));
    // mediumDate ("Aug 20, 2026") round-trips a midnight date losslessly.
    expect(input.value).toBe('Aug 20, 2026');
  });

  it('falls back to a lossless format when the mask would drop the time', async () => {
    const input = await setup(new Date(2026, 7, 20, 17, 10, 0));
    // "Aug 20, 2026" would parse back to midnight — the reflected value must
    // keep the instant, so the medium format (with time) is used instead.
    expect(input.value).not.toContain('GMT');
    expect(new Date(input.value).getTime()).toBe(new Date(2026, 7, 20, 17, 10, 0).getTime());
  });
});
