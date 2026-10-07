import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShipCode } from './ship-code';
import { textSerializations } from './core/text-cache';

@Component({
  imports: [ShipCode],
  template: `<sh-code [(value)]="source" [valueSync]="sync()" (valueChange)="changes.push($event)" />`,
})
class BindingHost {
  source = signal<string | null>('ab');
  sync = signal<'idle' | 'immediate' | 'blur'>('idle');
  changes: (string | null)[] = [];
}

@Component({
  imports: [ShipCode],
  template: `@if (show()) { <sh-code [(value)]="source" valueSync="blur" /> }`,
})
class RemovableHost {
  show = signal(true);
  source = signal<string | null>('ab');
}

@Component({
  imports: [ShipCode, ReactiveFormsModule],
  template: `<sh-code [formControl]="control" valueSync="blur" />`,
})
class FormHost {
  control = new FormControl<string | null>('ab');
}

function setup<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  TestBed.tick();
  const code = fixture.debugElement.children[0]!.componentInstance as ShipCode;
  return { fixture, host: fixture.componentInstance, code };
}

/** Type at the caret (it starts at 0 and advances with each insert). */
function typeAtCaret(code: ShipCode, text: string) {
  code.insertText(text);
  TestBed.tick();
}

afterEach(() => vi.useRealTimers());

describe('ShipCode value sync', () => {
  it('does not serialize the document on every keystroke by default', () => {
    vi.useFakeTimers();
    const { host, code } = setup(BindingHost);
    for (const ch of 'xyz') typeAtCaret(code, ch);
    expect(host.changes).toEqual([]);
    expect(host.source()).toBe('ab');

    vi.runAllTimers();
    TestBed.tick();
    expect(host.changes).toEqual(['xyzab']);
    expect(host.source()).toBe('xyzab');
  });

  it('never serializes the document while editing or rendering', () => {
    vi.useFakeTimers();
    const { code, fixture } = setup(BindingHost);
    const before = textSerializations();
    for (const ch of 'hello world') typeAtCaret(code, ch);
    code.onKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }));
    code.onKeyDown(new KeyboardEvent('keydown', { key: 'Enter' }));
    TestBed.tick();
    fixture.detectChanges();
    expect(textSerializations()).toBe(before);

    // The idle flush serializes exactly once for all of it.
    vi.runAllTimers();
    TestBed.tick();
    expect(textSerializations()).toBe(before + 1);
  });

  it('flushes an unsent edit on blur and on flushValue()', () => {
    vi.useFakeTimers();
    const { host, code } = setup(BindingHost);
    typeAtCaret(code, 'x');
    code.onBlur();
    TestBed.tick();
    expect(host.source()).toBe('xab');

    typeAtCaret(code, 'y');
    code.flushValue();
    TestBed.tick();
    expect(host.changes).toEqual(['xab', 'xyab']);
    // Nothing unsent: a second flush emits nothing.
    code.flushValue();
    expect(host.changes).toHaveLength(2);
  });

  it("emits on every edit with valueSync='immediate'", () => {
    const { host, code } = setup(BindingHost);
    host.sync.set('immediate');
    TestBed.tick();
    typeAtCaret(code, 'x');
    typeAtCaret(code, 'y');
    expect(host.changes).toEqual(['xab', 'xyab']);
  });

  it('lets an external write win over an unsent edit', () => {
    vi.useFakeTimers();
    const { host, code, fixture } = setup(BindingHost);
    typeAtCaret(code, 'x');
    host.source.set('fresh');
    fixture.detectChanges();
    TestBed.tick();
    vi.runAllTimers();
    TestBed.tick();
    expect(host.source()).toBe('fresh');
    expect(host.changes).toEqual([]);
  });

  it('reports user edits to a form control, but not its own writes', () => {
    const { host, code, fixture } = setup(FormHost);
    const seen: (string | null)[] = [];
    host.control.valueChanges.subscribe((v) => seen.push(v));

    host.control.setValue('a\r\nb');
    fixture.detectChanges();
    TestBed.tick();
    expect(host.control.dirty).toBe(false);
    expect(seen).toEqual(['a\r\nb']);

    typeAtCaret(code, 'x');
    expect(host.control.value).toBe('a\r\nb');
    code.onBlur();
    expect(host.control.value).toBe('xa\nb');
    expect(host.control.dirty).toBe(true);
  });

  it('applies a form write equal to the last value when an edit is unsent', () => {
    const { host, code, fixture } = setup(FormHost);
    typeAtCaret(code, 'x');
    host.control.setValue('ab');
    fixture.detectChanges();
    TestBed.tick();
    code.flushValue();
    expect(host.control.value).toBe('ab');
  });

  it('hands an unsent edit to the two-way binding when the editor is removed', () => {
    const warn = vi.spyOn(console, 'warn');
    const { host, code, fixture } = setup(RemovableHost);
    typeAtCaret(code, 'x');
    host.show.set(false);
    fixture.detectChanges();
    TestBed.tick();
    expect(host.source()).toBe('xab');
    expect(warn).not.toHaveBeenCalled();
  });
});
