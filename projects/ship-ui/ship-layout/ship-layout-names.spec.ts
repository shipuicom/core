import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { computeAccessibleName } from '@ship-ui/core/ship-screenreader';
import { ShipLayoutRankingItem } from './ship-ranking';
import { ShipLayoutStatGoal } from './ship-stat-goal';
import { ShipLayoutSetting } from './ship-setting';

@Component({
  imports: [ShipLayoutStatGoal, ShipLayoutRankingItem],
  template: `
    <sh-lo-stat-goal id="slotted" [value]="68" [max]="100">
      <p>Sales goal</p>
      <h3>$204k</h3>
    </sh-lo-stat-goal>
    <sh-lo-stat-goal id="explicit" [value]="1" [max]="2" label="Quarter">
      <p>ignored</p>
    </sh-lo-stat-goal>
    <sh-lo-ranking-item id="orphan" [value]="50">alone</sh-lo-ranking-item>
  `,
})
class Host {}

// Slotted content is observed by a MutationObserver, which reports in a microtask after the first render.
const render = async () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve));
  TestBed.inject(ApplicationRef).tick();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('ship-layout accessible names', () => {
  it('names the stat-goal progressbar after the slotted label', async () => {
    const el = await render();
    const bar = el.querySelector('#slotted .bar') as HTMLElement;
    const p = el.querySelector('#slotted p') as HTMLElement;
    expect(p.id).toBeTruthy();
    expect(bar.getAttribute('aria-labelledby')).toBe(p.id);
    expect(computeAccessibleName(bar)).toBe('Sales goal');
  });

  it('prefers an explicit label over the slotted one', async () => {
    const el = await render();
    const bar = el.querySelector('#explicit .bar') as HTMLElement;
    expect(bar.getAttribute('aria-labelledby')).toBeNull();
    expect(computeAccessibleName(bar)).toBe('Quarter');
  });

  it('draws no bar for a ranking item outside sh-lo-ranking and says why in dev mode', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const el = await render();
    expect((el.querySelector('#orphan') as HTMLElement).getAttribute('style')).toContain('--ranking-pct: 0');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('sh-lo-ranking'));
    warn.mockRestore();
  });

  it('names a setting control that renders after the first pass', async () => {
    @Component({
      imports: [ShipLayoutSetting],
      template: `<sh-lo-setting><label>Alerts</label><div control>@if (ready()) {<input type="checkbox" />}</div></sh-lo-setting>`,
    })
    class LateControlHost {
      ready = signal(false);
    }
    const fixture = TestBed.createComponent(LateControlHost);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    fixture.componentInstance.ready.set(true);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-labelledby')).toBe((el.querySelector('label') as HTMLElement).id);
    expect(computeAccessibleName(input)).toBe('Alerts');
  });

  it('leaves a control inside a nested setting to that setting', async () => {
    @Component({
      imports: [ShipLayoutSetting],
      template: `<sh-lo-setting id="outer"><label>Outer</label>
        <sh-lo-setting id="inner"><label>Inner</label><input type="checkbox" /></sh-lo-setting>
      </sh-lo-setting>`,
    })
    class NestedHost {}
    const fixture = TestBed.createComponent(NestedHost);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    expect(computeAccessibleName(input)).toBe('Inner');
  });

  it('hands its name back when the consumer names the control later', async () => {
    @Component({
      imports: [ShipLayoutSetting],
      template: `<sh-lo-setting><label>Alerts</label><input type="checkbox" /></sh-lo-setting>`,
    })
    class LaterNameHost {}
    const fixture = TestBed.createComponent(LaterNameHost);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    const input = (fixture.nativeElement as HTMLElement).querySelector('input') as HTMLInputElement;
    expect(input.getAttribute('aria-labelledby')).toBeTruthy();
    input.setAttribute('aria-label', 'Email alerts');
    await new Promise((resolve) => setTimeout(resolve));
    expect(input.getAttribute('aria-labelledby')).toBeNull();
    expect(computeAccessibleName(input)).toBe('Email alerts');
  });
});
