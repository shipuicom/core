import { describe, expect, it } from 'vitest';
import { computeRole } from './role';

function el(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  return host.firstElementChild!;
}

describe('computeRole', () => {
  it.each([
    ['<button>Go</button>', 'button'],
    ['<a href="/x">Go</a>', 'link'],
    ['<a>Go</a>', ''],
    ['<h3>Title</h3>', 'heading'],
    ['<ul></ul>', 'list'],
    ['<li>Item</li>', 'listitem'],
    ['<nav></nav>', 'navigation'],
    ['<img alt="x">', 'img'],
    ['<textarea></textarea>', 'textbox'],
    ['<input>', 'textbox'],
    ['<input type="text">', 'textbox'],
    ['<input type="checkbox">', 'checkbox'],
    ['<input type="radio">', 'radio'],
    ['<input type="range">', 'slider'],
    ['<input type="number">', 'spinbutton'],
    ['<input type="search">', 'searchbox'],
    ['<input type="submit">', 'button'],
    ['<input type="password">', 'textbox'],
    ['<select></select>', 'combobox'],
    ['<select multiple></select>', 'listbox'],
    ['<select size="4"></select>', 'listbox'],
    ['<div>plain</div>', ''],
    ['<span>plain</span>', ''],
  ])('%s → %s', (html, expected) => {
    expect(computeRole(el(html))).toBe(expected);
  });

  it('prefers an explicit role attribute', () => {
    expect(computeRole(el('<div role="tab">x</div>'))).toBe('tab');
    expect(computeRole(el('<button role="switch">x</button>'))).toBe('switch');
  });

  it('uses the first token of a multi-token role', () => {
    expect(computeRole(el('<div role="switch checkbox">x</div>'))).toBe('switch');
  });
});
