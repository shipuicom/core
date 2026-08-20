import { afterEach, describe, expect, it } from 'vitest';
import { computeAccessibleName, isAccHidden } from './accname';

function mount(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.querySelector('[data-test]') ?? host.firstElementChild!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('computeAccessibleName', () => {
  it('uses button text content', () => {
    expect(computeAccessibleName(mount('<button>Save changes</button>'))).toBe('Save changes');
  });

  it('prefers aria-label over content', () => {
    expect(computeAccessibleName(mount('<button aria-label="Close dialog">×</button>'))).toBe('Close dialog');
  });

  it('prefers aria-labelledby over aria-label, joining multiple ids', () => {
    const el = mount(`
      <span id="a">Delete</span><span id="b">file</span>
      <button data-test aria-labelledby="a b" aria-label="nope">x</button>
    `);
    expect(computeAccessibleName(el)).toBe('Delete file');
  });

  it('ignores missing labelledby ids', () => {
    const el = mount('<span id="a">Hi</span><button data-test aria-labelledby="a ghost">x</button>');
    expect(computeAccessibleName(el)).toBe('Hi');
  });

  it('survives a labelledby self-reference loop', () => {
    const el = mount('<button data-test id="self" aria-labelledby="self">Fallback</button>');
    expect(computeAccessibleName(el)).toBe('Fallback');
  });

  it('uses an associated <label for>', () => {
    const el = mount('<label for="mail">Email address</label><input data-test id="mail">');
    expect(computeAccessibleName(el)).toBe('Email address');
  });

  it('uses a wrapping <label>', () => {
    const el = mount('<label>Subscribe <input data-test type="checkbox"></label>');
    expect(computeAccessibleName(el)).toBe('Subscribe');
  });

  it('uses img alt', () => {
    expect(computeAccessibleName(mount('<img alt="Company logo">'))).toBe('Company logo');
  });

  it('falls back to title', () => {
    expect(computeAccessibleName(mount('<button title="Settings"></button>'))).toBe('Settings');
  });

  it('excludes aria-hidden children from subtree text', () => {
    const el = mount('<button>Save <span aria-hidden="true">(⌘S)</span></button>');
    expect(computeAccessibleName(el)).toBe('Save');
  });

  it('uses submit input value', () => {
    expect(computeAccessibleName(mount('<input type="submit" value="Send it">'))).toBe('Send it');
  });

  it('falls back to placeholder for unlabeled inputs', () => {
    expect(computeAccessibleName(mount('<input placeholder="Search…">'))).toBe('Search…');
  });

  it('gives a plain div no name', () => {
    expect(computeAccessibleName(mount('<div>Just text</div>'))).toBe('');
  });
});

describe('isAccHidden', () => {
  it.each([
    ['<button aria-hidden="true">x</button>', true],
    ['<button hidden>x</button>', true],
    ['<button inert>x</button>', true],
    ['<button style="display:none">x</button>', true],
    ['<button style="visibility:hidden">x</button>', true],
    ['<button>x</button>', false],
  ])('%s → %s', (html, expected) => {
    expect(isAccHidden(mount(html))).toBe(expected);
  });

  it('detects hidden ancestors', () => {
    const el = mount('<div aria-hidden="true"><button data-test>x</button></div>');
    expect(isAccHidden(el)).toBe(true);
  });
});
