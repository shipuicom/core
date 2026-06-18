import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipDatepicker } from './ship-datepicker';

@Component({
  template: `
    <sh-datepicker
      [(date)]="date"
      [(endDate)]="endDate"
      [asRange]="asRange()"
      [activeRangeSelection]="activeRangeSelection()"
      [monthsToShow]="monthsToShow()"
      [disabled]="disabled()"
      (tabbedOut)="onTabbedOut()">
    </sh-datepicker>
    <button id="outside-btn">Outside</button>
  `,
  standalone: true,
  imports: [ShipDatepicker],
})
class TestHostComponent {
  date = signal<Date | null>(null);
  endDate = signal<Date | null>(null);
  asRange = signal(false);
  activeRangeSelection = signal<'start' | 'end' | null>(null);
  monthsToShow = signal(1);
  disabled = signal(false);
  tabbedOutCalled = false;

  onTabbedOut() {
    this.tabbedOutCalled = true;
  }
}

function findDayButton(fixture: ComponentFixture<any>, date: Date): HTMLButtonElement | null {
  const label = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return fixture.nativeElement.querySelector(`button[aria-label="${label}"]`);
}

describe('ShipDatepicker', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  it('should create the datepicker component', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const datepicker = fixture.nativeElement.querySelector('sh-datepicker');
    expect(datepicker).toBeTruthy();
  });

  it('should navigate months correctly', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    
    // Set initial date to June 18, 2026
    const initialDate = new Date(2026, 5, 18); // June (month index 5)
    host.date.set(initialDate);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    // Verify month title renders June 2026
    const titleEl = fixture.nativeElement.querySelector('.title');
    expect(titleEl.textContent).toContain('June');
    expect(titleEl.textContent).toContain('2026');

    // Click next month
    const nextBtn = fixture.nativeElement.querySelectorAll('header button')[1];
    nextBtn.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(titleEl.textContent).toContain('July');

    // Click previous month twice (July -> June -> May)
    const prevBtn = fixture.nativeElement.querySelectorAll('header button')[0];
    prevBtn.click();
    fixture.detectChanges();
    prevBtn.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(titleEl.textContent).toContain('May');
    vi.useRealTimers();
  });

  it('should select a date in single mode', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    
    const initialDate = new Date(2026, 5, 18);
    host.date.set(initialDate);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    // Find June 20 button
    const targetDate = new Date(2026, 5, 20);
    const targetBtn = findDayButton(fixture, targetDate);
    expect(targetBtn).toBeTruthy();

    targetBtn!.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    // Check host date is updated
    expect(host.date()?.getDate()).toBe(20);
    expect(host.date()?.getMonth()).toBe(5);
    expect(host.date()?.getFullYear()).toBe(2026);

    // Verify the selected element has the 'sel' class
    expect(targetBtn!.classList.contains('sel')).toBe(true);
    vi.useRealTimers();
  });

  it('should select date ranges correctly', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    host.asRange.set(true);
    
    // Set initial date to June 18, 2026
    const initialDate = new Date(2026, 5, 18);
    host.date.set(initialDate);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    // Click June 25 to set as end date
    const endDate = new Date(2026, 5, 25);
    const endBtn = findDayButton(fixture, endDate);
    expect(endBtn).toBeTruthy();
    endBtn!.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(host.endDate()?.getDate()).toBe(25);

    // Click June 15 (before start date June 18) - should clear end date and make June 15 the new start date
    const earlyDate = new Date(2026, 5, 15);
    const earlyBtn = findDayButton(fixture, earlyDate);
    expect(earlyBtn).toBeTruthy();
    earlyBtn!.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(host.date()?.getDate()).toBe(15);
    expect(host.endDate()).toBeNull();
    vi.useRealTimers();
  });

  it('should navigate days using arrow keys', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    
    const initialDate = new Date(2026, 5, 18);
    host.date.set(initialDate);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    const startBtn = findDayButton(fixture, initialDate);
    expect(startBtn).toBeTruthy();
    
    // Focus start button
    startBtn!.focus();
    expect(document.activeElement).toBe(startBtn);

    // ArrowRight to June 19
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    startBtn!.dispatchEvent(rightEvent);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    const nextDayBtn = findDayButton(fixture, new Date(2026, 5, 19));
    expect(document.activeElement).toBe(nextDayBtn);

    // ArrowLeft back to June 18
    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    nextDayBtn!.dispatchEvent(leftEvent);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(document.activeElement).toBe(startBtn);

    // ArrowDown to June 25 (+7 days)
    const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    startBtn!.dispatchEvent(downEvent);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    const nextWeekBtn = findDayButton(fixture, new Date(2026, 5, 25));
    expect(document.activeElement).toBe(nextWeekBtn);

    // ArrowUp back to June 18
    const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    nextWeekBtn!.dispatchEvent(upEvent);
    fixture.detectChanges();
    vi.advanceTimersByTime(50);
    fixture.detectChanges();

    expect(document.activeElement).toBe(startBtn);
    vi.useRealTimers();
  });

  it('should emit tabbedOut when focus leaves the component', () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(TestHostComponent);
    const host = fixture.componentInstance;
    fixture.detectChanges();

    const datepickerEl = fixture.nativeElement.querySelector('sh-datepicker');
    const outsideBtn = fixture.nativeElement.querySelector('#outside-btn');
    expect(host.tabbedOutCalled).toBe(false);

    // Focus the outside button to set document.activeElement
    outsideBtn.focus();

    // Simulate focusout moving to the outside button
    const focusOutEvent = new FocusEvent('focusout', { bubbles: true, relatedTarget: outsideBtn });
    datepickerEl.dispatchEvent(focusOutEvent);
    
    // Wait for the setTimeout(..., 50) inside onFocusOut
    vi.advanceTimersByTime(100);
    fixture.detectChanges();

    expect(host.tabbedOutCalled).toBe(true);
    vi.useRealTimers();
  });
});
