import { ApplicationRef, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { computeAccessibleName } from '@ship-ui/core/ship-screenreader';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ShipLayoutSetting } from './ship-setting';

@Component({
  imports: [ShipLayoutSetting, ShipToggle],
  template: `
    <sh-lo-setting id="toggle">
      <label>Weekly digest</label>
      <p>A summary of activity every Monday.</p>
      <sh-toggle color="primary" />
    </sh-lo-setting>
    <sh-lo-setting id="native">
      <label>Workspace name</label>
      <input value="Acme" />
    </sh-lo-setting>
    <sh-lo-setting id="wired">
      <label for="url">URL</label>
      <input id="url" value="acme" />
    </sh-lo-setting>
    <sh-lo-setting id="named">
      <label>Theme</label>
      <sh-toggle label="Dark mode" />
    </sh-lo-setting>
  `,
})
class Host {}

const render = () => {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  TestBed.inject(ApplicationRef).tick();
  return fixture.nativeElement as HTMLElement;
};

describe('ShipLayoutSetting accessibility', () => {
  it('names an unlabelled toggle after the slotted label', () => {
    const el = render();
    const input = el.querySelector('#toggle input') as HTMLInputElement;
    const label = el.querySelector('#toggle label') as HTMLElement;

    expect(label.id).toBeTruthy();
    expect(input.getAttribute('aria-labelledby')).toBe(label.id);
    expect(computeAccessibleName(input)).toBe('Weekly digest');
  });

  it('names a native input after the slotted label', () => {
    const el = render();
    const input = el.querySelector('#native input') as HTMLInputElement;
    expect(computeAccessibleName(input)).toBe('Workspace name');
  });

  it('leaves a control alone when the consumer already named it', () => {
    const el = render();
    const wired = el.querySelector('#wired input') as HTMLInputElement;
    expect(wired.hasAttribute('aria-labelledby')).toBe(false);
    expect(computeAccessibleName(wired)).toBe('URL');

    const named = el.querySelector('#named input') as HTMLInputElement;
    expect(computeAccessibleName(named)).toBe('Dark mode');
  });
});
