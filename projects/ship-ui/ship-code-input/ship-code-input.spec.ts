import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ShipCodeInput } from './ship-code-input';
import { ShipCodeInputDivider } from './ship-code-input-divider';
import { ShipCodeInputGroup } from './ship-code-input-group';

@Component({
  imports: [ShipCodeInput],
  template: `<sh-code-input [length]="4" [(value)]="code" (completed)="done.set($event)"><label>Code</label></sh-code-input>`,
})
class Host {
  code = signal('');
  done = signal('');
}

@Component({
  imports: [ShipCodeInputGroup],
  template: `
    <div shCodeInputGroup="alphanumeric" (valueChange)="value.set($event)">
      <input /><input /><input />
    </div>
  `,
})
class DirectiveHost {
  value = signal('');
}

function type(input: HTMLInputElement, text: string) {
  input.focus();
  input.value = text;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function key(input: HTMLInputElement, key: string) {
  input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
}

describe('ShipCodeInput', () => {
  function setup() {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const cells = Array.from(fixture.nativeElement.querySelectorAll('input.cell')) as HTMLInputElement[];
    return { fixture, cells, host: fixture.componentInstance };
  }

  it('renders one box per character with a11y attributes', () => {
    const { cells } = setup();
    expect(cells.length).toBe(4);
    expect(cells[0].getAttribute('autocomplete')).toBe('one-time-code');
    expect(cells[0].getAttribute('inputmode')).toBe('numeric');
    expect(cells[3].getAttribute('aria-label')).toBe('Character 4 of 4');
  });

  it('advances focus on typing and emits the joined value', () => {
    const { fixture, cells, host } = setup();
    type(cells[0], '1');
    fixture.detectChanges();
    expect(document.activeElement).toBe(cells[1]);
    expect(host.code()).toBe('1');
  });

  it('spreads a multi-character write across the boxes and emits completed', () => {
    const { fixture, cells, host } = setup();
    type(cells[0], '12 34');
    fixture.detectChanges();
    expect(cells.map((c) => c.value)).toEqual(['1', '2', '3', '4']);
    expect(host.code()).toBe('1234');
    expect(host.done()).toBe('1234');
    expect(document.activeElement).toBe(cells[3]);
  });

  it('spreads a paste from the focused box onward', () => {
    const { fixture, cells, host } = setup();
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => '987' } });
    cells[1].dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
    expect(cells.map((c) => c.value)).toEqual(['', '9', '8', '7']);
    expect(host.code()).toBe('987');
  });

  it('drops characters the type does not accept', () => {
    const { fixture, cells, host } = setup();
    type(cells[0], 'a1');
    fixture.detectChanges();
    expect(cells[0].value).toBe('1');
    expect(host.code()).toBe('1');
  });

  it('backspace on an empty box clears and focuses the previous one', () => {
    const { fixture, cells, host } = setup();
    type(cells[0], '1');
    key(cells[1], 'Backspace');
    fixture.detectChanges();
    expect(cells[0].value).toBe('');
    expect(document.activeElement).toBe(cells[0]);
    expect(host.code()).toBe('');
  });

  it('arrow keys move between boxes', () => {
    const { cells } = setup();
    cells[0].focus();
    key(cells[0], 'ArrowRight');
    expect(document.activeElement).toBe(cells[1]);
    key(cells[1], 'ArrowLeft');
    expect(document.activeElement).toBe(cells[0]);
  });

  it('writes an external model value into the boxes', () => {
    const { fixture, cells, host } = setup();
    host.code.set('42');
    fixture.detectChanges();
    expect(cells.map((c) => c.value)).toEqual(['4', '2', '', '']);
  });
});

describe('ShipCodeInputGroup', () => {
  it('works on plain inputs with the alphanumeric filter', () => {
    const fixture = TestBed.createComponent(DirectiveHost);
    fixture.detectChanges();
    const inputs = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
    type(inputs[0], 'a-B7');
    expect(inputs.map((i) => i.value)).toEqual(['a', 'B', '7']);
    expect(fixture.componentInstance.value()).toBe('aB7');
  });
});

@Component({
  imports: [ShipCodeInput, ShipCodeInputDivider],
  template: `
    <sh-code-input [length]="6" [groupSize]="3" divider="-" />
    <sh-code-input [length]="4" [groupSize]="2"><ng-template shCodeInputDivider><b>•</b></ng-template></sh-code-input>
    <sh-code-input [length]="3" divider="/" />
  `,
})
class DividerHost {}

describe('ShipCodeInput dividers', () => {
  it('renders text dividers at group boundaries, templates when projected, and between every box without groupSize', () => {
    const fixture = TestBed.createComponent(DividerHost);
    fixture.detectChanges();
    const [grouped, templated, plain] = Array.from(fixture.nativeElement.querySelectorAll('sh-code-input')) as HTMLElement[];

    const order = (host: HTMLElement) =>
      Array.from(host.querySelectorAll('.cells > *')).map((el) => (el.classList.contains('cell') ? 'c' : el.textContent?.trim()));

    expect(order(grouped)).toEqual(['c', 'c', 'c', '-', 'c', 'c', 'c']);
    expect(order(templated)).toEqual(['c', 'c', '•', 'c', 'c']);
    expect(templated.querySelector('.divider b')).not.toBeNull();
    expect(order(plain)).toEqual(['c', '/', 'c', '/', 'c']);
    // Dividers are not part of the code group.
    expect(grouped.querySelectorAll('.cells input').length).toBe(6);
  });
});
