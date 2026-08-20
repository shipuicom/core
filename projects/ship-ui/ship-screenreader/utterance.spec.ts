import { afterEach, describe, expect, it } from 'vitest';
import { buildUtterance } from './utterance';

function mount(html: string): Element {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.appendChild(host);
  return host.querySelector('[data-test]') ?? host.firstElementChild!;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('buildUtterance', () => {
  it.each([
    ['<button>Save</button>', 'Save, button'],
    ['<button aria-expanded="false">Settings</button>', 'Settings, button, collapsed'],
    ['<h2>Overview</h2>', 'Overview, heading, level 2'],
    ['<a href="/docs">Documentation</a>', 'Documentation, link'],
    ['<img alt="Logo">', 'Logo, image'],
  ])('%s → "%s"', (html, expected) => {
    expect(buildUtterance(mount(html)).text).toBe(expected);
  });

  it('announces a labeled checkbox with state', () => {
    const el = mount('<label>Accept terms <input data-test type="checkbox" checked></label>');
    expect(buildUtterance(el).text).toBe('Accept terms, checkbox, checked');
  });

  it('announces an invalid required text field with its value', () => {
    const el = mount('<label for="m">Email</label><input data-test id="m" type="email" required aria-invalid="true" value="foo">');
    expect(buildUtterance(el).text).toBe('Email, edit text, required, invalid, foo');
  });

  it('announces option position in set', () => {
    const el = mount(`
      <div role="listbox">
        <div role="option">Pears</div>
        <div data-test role="option" aria-selected="true">Apples</div>
      </div>
    `);
    expect(buildUtterance(el).text).toBe('Apples, option, selected, 2 of 2');
  });

  it('records source and target', () => {
    const el = mount('<button>Go</button>');
    const utterance = buildUtterance(el, 'focus');
    expect(utterance.source).toBe('focus');
    expect(utterance.target).toBe(el);
    expect(utterance.id).toBeTruthy();
  });
});
