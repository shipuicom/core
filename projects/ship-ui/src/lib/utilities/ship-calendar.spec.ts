import { describe, it, expect, beforeEach } from 'vitest';
import { ShipCalendar } from './ship-calendar';

/** Calendar day after `d`, constructed in local time (DST-safe). */
function nextCalendarDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function gridForMonth(cal: ShipCalendar, year: number, month: number): Date[] {
  cal.currentDate.set(new Date(year, month, 1, 0, 0, 0, 0));
  return cal.getMonthDates(0);
}

describe('ShipCalendar', () => {
  let cal: ShipCalendar;

  beforeEach(() => {
    cal = new ShipCalendar();
  });

  describe('grid generation', () => {
    it('generates a padded grid whose length is a multiple of 7', () => {
      const grid = gridForMonth(cal, 2026, 0); // Jan 2026
      expect(grid.length % 7).toBe(0);
      expect(grid.length).toBeGreaterThanOrEqual(28);
    });

    it('starts the grid on the configured startOfWeek', () => {
      cal.startOfWeek.set(1); // Monday
      let grid = gridForMonth(cal, 2026, 0);
      expect(grid[0].getDay()).toBe(1);

      cal.startOfWeek.set(0); // Sunday
      grid = gridForMonth(cal, 2026, 0);
      expect(grid[0].getDay()).toBe(0);
    });

    it('contains every day of the target month exactly once', () => {
      const year = 2026;
      const month = 1; // Feb 2026 (28 days)
      const grid = gridForMonth(cal, year, month);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const matches = grid.filter((x) => x.getFullYear() === year && x.getMonth() === month && x.getDate() === d);
        expect(matches.length, `day ${d}`).toBe(1);
      }
    });

    it('emits strictly consecutive calendar days with no gaps or duplicates', () => {
      const grid = gridForMonth(cal, 2026, 0);
      for (let i = 1; i < grid.length; i++) {
        expect(isSameDay(grid[i], nextCalendarDay(grid[i - 1])), `cell ${i}`).toBe(true);
      }
    });

    it('exposes a months() model with one entry per visible month', () => {
      cal.monthsToShow.set(2);
      cal.currentDate.set(new Date(2026, 0, 1));
      const months = cal.months();
      expect(months.length).toBe(2);
      expect(months[0].date.getMonth()).toBe(0);
      expect(months[1].date.getMonth()).toBe(1);
      expect(months[0].dates.length % 7).toBe(0);
    });
  });

  // The calendar builds every cell with new Date(y, m, d, 0,0,0,0) (local midnight),
  // so these structural properties hold in ANY timezone — no global TZ mutation needed.
  describe('DST / timezone invariants', () => {
    const dstMonths: Array<[string, number, number]> = [
      ['US spring-forward (Mar 2026)', 2026, 2],
      ['US fall-back (Nov 2026)', 2026, 10],
      ['EU autumn transition (Oct 2026)', 2026, 9],
    ];

    for (const [label, year, month] of dstMonths) {
      it(`grid stays contiguous across ${label}`, () => {
        for (const sow of [0, 1]) {
          cal.startOfWeek.set(sow);
          const grid = gridForMonth(cal, year, month);
          expect(grid.length % 7, `${label} sow=${sow} length`).toBe(0);
          expect(grid[0].getDay(), `${label} sow=${sow} first`).toBe(sow);
          for (let i = 1; i < grid.length; i++) {
            expect(isSameDay(grid[i], nextCalendarDay(grid[i - 1])), `${label} cell ${i}`).toBe(true);
          }
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const owned = grid.filter((x) => x.getMonth() === month && x.getFullYear() === year);
          expect(owned.length, `${label} owned days`).toBe(daysInMonth);
        }
      });
    }

    it('addDays steps by calendar day across the spring-forward seam', () => {
      // US DST begins 02:00 on 8 Mar 2026 — the 02:00 hour does not exist locally.
      expect(isSameDay(cal.addDays(new Date(2026, 2, 7), 1), new Date(2026, 2, 8))).toBe(true);
      expect(isSameDay(cal.addDays(new Date(2026, 2, 8), 1), new Date(2026, 2, 9))).toBe(true);
      // A whole-week jump lands on the right calendar day, not off-by-one from the lost hour.
      expect(isSameDay(cal.addDays(new Date(2026, 2, 1), 7), new Date(2026, 2, 8))).toBe(true);
    });

    it('never produces a cell sitting on the missing wall-clock hour', () => {
      const grid = gridForMonth(cal, 2026, 2);
      for (const cell of grid) {
        expect(cell.getHours()).toBe(0);
        expect(cell.getMinutes()).toBe(0);
      }
    });

    it('preserves time-of-day when selecting across a DST change', () => {
      cal.selectedDate.set(new Date(2026, 2, 7, 14, 30, 0, 0)); // before the seam
      cal.selectDate(new Date(2026, 2, 9)); // after the seam
      const sel = cal.selectedDate()!;
      expect(sel.getHours()).toBe(14);
      expect(sel.getMinutes()).toBe(30);
      expect(isSameDay(sel, new Date(2026, 2, 9))).toBe(true);
    });
  });

  describe('single selection', () => {
    it('sets selectedDate and clears endDate', () => {
      cal.endDate.set(new Date(2026, 0, 20));
      cal.selectDate(new Date(2026, 0, 15));
      expect(isSameDay(cal.selectedDate()!, new Date(2026, 0, 15))).toBe(true);
      expect(cal.endDate()).toBeNull();
    });

    it('marks only the selected day with the sel class', () => {
      cal.selectDate(new Date(2026, 0, 15));
      expect(cal.isDateSelected(new Date(2026, 0, 15))).toContain('sel');
      expect(cal.isDateSelected(new Date(2026, 0, 16))).toBeNull();
      expect(cal.isDateSelectedBool(new Date(2026, 0, 15))).toBe(true);
    });
  });

  describe('range selection', () => {
    beforeEach(() => cal.asRange.set(true));

    it('selects start then end and orders them', () => {
      cal.activeRangeSelection.set('start');
      cal.selectDate(new Date(2026, 0, 10));
      cal.activeRangeSelection.set('end');
      cal.selectDate(new Date(2026, 0, 20));
      expect(isSameDay(cal.selectedDate()!, new Date(2026, 0, 10))).toBe(true);
      expect(isSameDay(cal.endDate()!, new Date(2026, 0, 20))).toBe(true);
    });

    it('swaps to a new start when the picked end precedes the start', () => {
      cal.selectedDate.set(new Date(2026, 0, 20));
      cal.activeRangeSelection.set('end');
      cal.selectDate(new Date(2026, 0, 10));
      expect(isSameDay(cal.selectedDate()!, new Date(2026, 0, 10))).toBe(true);
      expect(cal.endDate()).toBeNull();
    });

    it('flags first, last and interior days of a range', () => {
      cal.selectedDate.set(new Date(2026, 0, 10));
      cal.endDate.set(new Date(2026, 0, 12));
      expect(cal.isDateSelected(new Date(2026, 0, 10))).toContain('first');
      expect(cal.isDateSelected(new Date(2026, 0, 12))).toContain('last');
      expect(cal.isDateSelected(new Date(2026, 0, 11))).toContain('sel');
      expect(cal.isDateSelected(new Date(2026, 0, 13))).toBeNull();
    });

    it('handles a range spanning a DST boundary', () => {
      cal.selectedDate.set(new Date(2026, 2, 6));
      cal.endDate.set(new Date(2026, 2, 10));
      expect(cal.isDateSelected(new Date(2026, 2, 6))).toContain('first');
      expect(cal.isDateSelected(new Date(2026, 2, 10))).toContain('last');
      expect(cal.isDateSelectedBool(new Date(2026, 2, 8))).toBe(true); // the DST day
    });
  });

  describe('navigation', () => {
    it('moves to the next and previous month', () => {
      cal.currentDate.set(new Date(2026, 0, 15));
      cal.nextMonth();
      expect(cal.currentDate().getMonth()).toBe(1);
      cal.previousMonth();
      cal.previousMonth();
      expect(cal.currentDate().getMonth()).toBe(11);
      expect(cal.currentDate().getFullYear()).toBe(2025);
    });

    it('ensureDateVisible scrolls a past date into view', () => {
      cal.currentDate.set(new Date(2026, 5, 1));
      cal.ensureDateVisible(new Date(2026, 2, 15));
      expect(cal.currentDate().getFullYear()).toBe(2026);
      expect(cal.currentDate().getMonth()).toBe(2);
    });

    it('ensureDateVisible scrolls a future date into view across multiple months', () => {
      cal.monthsToShow.set(2);
      cal.currentDate.set(new Date(2026, 0, 1));
      cal.ensureDateVisible(new Date(2026, 5, 20));
      // Target must fall within the visible window [currentDate .. +monthsToShow).
      const start = cal.currentDate();
      const last = cal.getLastVisibleMonth();
      const target = new Date(2026, 5, 20);
      expect(target >= new Date(start.getFullYear(), start.getMonth(), 1)).toBe(true);
      expect(target <= new Date(last.getFullYear(), last.getMonth() + 1, 0)).toBe(true);
    });
  });

  describe('date-math helpers', () => {
    it('addMonths / addYears / monthStart / monthEnd', () => {
      // Jan 31 + 1mo overflows Feb (no 31st) → rolls into March, matching JS Date semantics.
      expect(cal.addMonths(new Date(2026, 0, 31), 1).getMonth()).toBe(2);
      expect(isSameDay(cal.addYears(new Date(2026, 1, 10), 1), new Date(2027, 1, 10))).toBe(true);
      expect(isSameDay(cal.monthStart(new Date(2026, 4, 17)), new Date(2026, 4, 1))).toBe(true);
      expect(isSameDay(cal.monthEnd(new Date(2026, 4, 17)), new Date(2026, 4, 31))).toBe(true);
    });
  });

  describe('i18n via Intl', () => {
    it('localizes month names', () => {
      cal.locale.set('en-US');
      expect(cal.getMonthName(new Date(2026, 0, 1))).toBe('January');
      expect(cal.getMonthName(new Date(2026, 2, 1))).toBe('March');
      cal.locale.set('da-DK');
      expect(cal.getMonthName(new Date(2026, 0, 1)).toLowerCase()).toBe('januar');
    });

    it('builds a localized accessible label containing month, day and year', () => {
      cal.locale.set('en-US');
      const label = cal.getAriaLabel(new Date(2026, 2, 8));
      expect(label).toContain('March');
      expect(label).toContain('8');
      expect(label).toContain('2026');
    });

    it('derives a 7-entry Sunday-first weekday base from the locale', () => {
      cal.locale.set('en-US');
      const base = cal.intlWeekdays();
      expect(base.length).toBe(7);
      // Sunday-first base, independent of startOfWeek.
      expect(base[0]).toBe(cal.intlWeekdays()[0]);
    });

    it('reorders effective weekdays by startOfWeek', () => {
      cal.locale.set('en-US');
      const base = cal.intlWeekdays();
      cal.startOfWeek.set(1); // Monday-first
      const wk = cal.weekdays();
      expect(wk[0]).toBe(base[1]);
      expect(wk[6]).toBe(base[0]);
    });

    it('honors an explicit weekdayLabels override (Sunday-first) and still reorders it', () => {
      cal.weekdayLabels.set(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
      cal.startOfWeek.set(1);
      const wk = cal.weekdays();
      expect(wk[0]).toBe('M');
      expect(wk[6]).toBe('S');
    });

    it('changing locale is reactive', () => {
      cal.locale.set('en-US');
      expect(cal.getMonthName(new Date(2026, 5, 1))).toBe('June');
      cal.locale.set('de-DE');
      expect(cal.getMonthName(new Date(2026, 5, 1))).toBe('Juni');
    });
  });
});
