import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ShipSelect } from './ship-select';

if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.showPopover) {
    HTMLElement.prototype.showPopover = function () {};
  }
  if (!HTMLElement.prototype.hidePopover) {
    HTMLElement.prototype.hidePopover = function () {};
  }
}

@Component({
  template: `
    <sh-select
      [value]="'value'"
      [label]="'label'"
      [options]="options()"
      [inlineSearch]="inlineSearch()"
      [selectMultiple]="selectMultiple()"
      [asFreeText]="asFreeText()">
      <input type="text" />
    </sh-select>
  `,
  imports: [ShipSelect],
  standalone: true,
})
class ValueSyncHost {
  options = signal([
    { value: 'pizza', label: 'Pizza' },
    { value: 'burger', label: 'Burger' },
    { value: 'salad', label: 'Salad' },
  ]);
  inlineSearch = signal(false);
  selectMultiple = signal(false);
  asFreeText = signal(false);
}

function typeInto(input: HTMLInputElement, text: string) {
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  descriptor!.set!.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('ShipSelect value sync', () => {
  let fixture: ComponentFixture<ValueSyncHost>;
  let host: ValueSyncHost;
  let select: ShipSelect;
  let inputEl: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ValueSyncHost] }).compileComponents();
    fixture = TestBed.createComponent(ValueSyncHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.directive(ShipSelect));
    select = debugEl.componentInstance;
    inputEl = debugEl.query(By.css('input')).nativeElement;
  });

  it('reflects a picked option in the native input', async () => {
    select.open();
    fixture.detectChanges();
    select.toggleOptionByIndex(0);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([{ value: 'pizza', label: 'Pizza' }]);
    expect(inputEl.value).toBe('pizza');
    expect(select.isOpen()).toBe(false);
  });

  it('resolves selection from an external programmatic write', async () => {
    inputEl.value = 'burger';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([{ value: 'burger', label: 'Burger' }]);
    expect(inputEl.value).toBe('burger');
  });

  it('clears the input on an external write that matches no option', async () => {
    inputEl.value = 'burger';
    fixture.detectChanges();
    await fixture.whenStable();

    inputEl.value = 'nonexistent';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([]);
    expect(inputEl.value).toBe('');
  });

  it('resolves multiple selections from a comma-separated external write', async () => {
    host.selectMultiple.set(true);
    fixture.detectChanges();

    inputEl.value = 'pizza,salad';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([
      { value: 'pizza', label: 'Pizza' },
      { value: 'salad', label: 'Salad' },
    ]);
    expect(inputEl.value).toBe('pizza,salad');
  });

  it('typing filters options without resolving a selection', async () => {
    host.inlineSearch.set(true);
    fixture.detectChanges();

    select.open();
    fixture.detectChanges();

    typeInto(inputEl, 'bur');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.filteredOptions()).toEqual([{ value: 'burger', label: 'Burger' }]);
    expect(select.selectedOptions()).toEqual([]);
    expect(inputEl.value).toBe('bur');
  });

  it('keeps a committed free-text value in the input', async () => {
    host.inlineSearch.set(true);
    host.asFreeText.set(true);
    fixture.detectChanges();

    select.open();
    fixture.detectChanges();

    typeInto(inputEl, 'zzz');
    fixture.detectChanges();

    select.toggleOptionByIndex(-1);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([{ value: 'zzz' }]);
    expect(select.inputValue()).toBe('zzz');
    expect(select.options()[0]).toEqual({ value: 'zzz' });
    expect(inputEl.value).toBe('zzz');
  });

  it('clear() empties both the selection and the native input', async () => {
    inputEl.value = 'burger';
    fixture.detectChanges();
    await fixture.whenStable();

    select.clear();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(select.selectedOptions()).toEqual([]);
    expect(inputEl.value).toBe('');
  });
});
