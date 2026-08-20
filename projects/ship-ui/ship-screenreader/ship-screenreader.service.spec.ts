import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ShipScreenreaderService } from './ship-screenreader.service';

describe('ShipScreenreaderService', () => {
  let service: ShipScreenreaderService;

  beforeEach(() => {
    service = TestBed.inject(ShipScreenreaderService);
  });

  afterEach(() => {
    service.disable();
    service.clearLog();
    document.body.innerHTML = '';
  });

  function focusButton(label: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    document.body.appendChild(button);
    button.focus();
    return button;
  }

  it('starts disabled with an empty log', () => {
    expect(service.enabled()).toBe(false);
    expect(service.log()).toEqual([]);
  });

  it('logs focus announcements while enabled', () => {
    service.enable();
    focusButton('Save');
    expect(service.log().at(-1)?.text).toBe('Save, button');
    expect(service.log().at(-1)?.source).toBe('focus');
  });

  it('ignores focus inside the simulator panel', () => {
    service.enable();
    const panel = document.createElement('div');
    panel.setAttribute('data-ship-screenreader', '');
    const button = document.createElement('button');
    button.textContent = 'Clear';
    panel.appendChild(button);
    document.body.appendChild(panel);
    button.focus();
    expect(service.log()).toEqual([]);
  });

  it('stops logging after disable', () => {
    service.enable();
    service.disable();
    expect(service.enabled()).toBe(false);
    focusButton('After');
    expect(service.log()).toEqual([]);
  });

  it('dedupes identical back-to-back announcements', () => {
    service.enable();
    service.announce('Same thing');
    service.announce('Same thing');
    expect(service.log()).toHaveLength(1);
  });

  it('caps the log at 200 entries', () => {
    for (let i = 0; i < 210; i++) service.announce(`Message ${i}`);
    expect(service.log()).toHaveLength(200);
    expect(service.log()[0].text).toBe('Message 10');
  });

  it('clears the log', () => {
    service.announce('One');
    service.clearLog();
    expect(service.log()).toEqual([]);
  });

  it('keeps speech off when SpeechSynthesis is unsupported', () => {
    service.toggleSpeech(true);
    expect(service.speechEnabled()).toBe(service.speechSupported);
  });
});
