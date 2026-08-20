import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipList } from './ship-list';

@Component({
  template: `
    <sh-list #staticList>
      <h3 title>Static</h3>
      <div item>Plain item</div>
      <div>Attribute-free item</div>
    </sh-list>

    <sh-list #selectList listRole="listbox" [(value)]="active" [closable]="closable()">
      <h3 title>Nav</h3>
      <a value="dashboard">Dashboard</a>
      <a value="projects">Projects</a>
      <button value="settings">Settings</button>
      <div>Static row</div>
    </sh-list>
  `,
  standalone: true,
  imports: [ShipList],
})
class TestHostComponent {
  staticList = viewChild.required('staticList', { read: ShipList });
  selectList = viewChild.required('selectList', { read: ShipList });
  active = signal<string | null>(null);
  closable = signal(false);
}

describe('ShipList', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let staticEl: HTMLElement;
  let selectEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const lists = fixture.nativeElement.querySelectorAll('sh-list');
    staticEl = lists[0];
    selectEl = lists[1];
  });

  describe('static list (default listRole)', () => {
    it('keeps role="list" on the host', () => {
      expect(staticEl.getAttribute('role')).toBe('list');
    });

    it('leaves projected content untouched', () => {
      const children = staticEl.querySelectorAll('div');
      children.forEach((child) => {
        expect(child.hasAttribute('role')).toBe(false);
        expect(child.hasAttribute('aria-selected')).toBe(false);
        expect(child.hasAttribute('tabindex')).toBe(false);
      });
    });

    it('ignores clicks on value-less items', () => {
      (staticEl.querySelector('[item]') as HTMLElement).click();
      fixture.detectChanges();
      expect(host.staticList().value()).toBeNull();
    });
  });

  describe('listbox list', () => {
    it('sets role="listbox" on the host and option roles on value items', () => {
      expect(selectEl.getAttribute('role')).toBe('listbox');

      const options = selectEl.querySelectorAll('[value]');
      expect(options.length).toBe(3);
      options.forEach((option) => expect(option.getAttribute('role')).toBe('option'));
    });

    it('selects on click and reflects the active class', () => {
      const dashboard = selectEl.querySelector('[value="dashboard"]') as HTMLElement;
      dashboard.click();
      fixture.detectChanges();

      expect(host.active()).toBe('dashboard');
      expect(dashboard.classList.contains('active')).toBe(true);
      expect(dashboard.getAttribute('aria-selected')).toBe('true');
      expect(dashboard.getAttribute('tabindex')).toBe('0');

      const projects = selectEl.querySelector('[value="projects"]') as HTMLElement;
      expect(projects.classList.contains('active')).toBe(false);
      expect(projects.getAttribute('aria-selected')).toBe('false');
      expect(projects.getAttribute('tabindex')).toBe('-1');
    });

    it('supports programmatic selection through the model', () => {
      host.active.set('settings');
      fixture.detectChanges();

      const settings = selectEl.querySelector('[value="settings"]') as HTMLElement;
      expect(settings.classList.contains('active')).toBe(true);
    });

    it('deselects on second click when closable', () => {
      host.closable.set(true);
      fixture.detectChanges();

      const projects = selectEl.querySelector('[value="projects"]') as HTMLElement;
      projects.click();
      fixture.detectChanges();
      expect(host.active()).toBe('projects');

      projects.click();
      fixture.detectChanges();
      expect(host.active()).toBeNull();
    });

    it('does not select value-less rows on click', () => {
      host.active.set('dashboard');
      fixture.detectChanges();

      const staticRow = [...selectEl.querySelectorAll('div')].find((d) => d.textContent?.includes('Static row')) as HTMLElement;
      staticRow.click();
      fixture.detectChanges();

      expect(host.active()).toBe('dashboard');
    });

    it('moves selection with arrow keys', () => {
      host.active.set('dashboard');
      fixture.detectChanges();

      const dashboard = selectEl.querySelector('[value="dashboard"]') as HTMLElement;
      dashboard.focus();
      selectEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      fixture.detectChanges();

      expect(host.active()).toBe('projects');
    });

    it('is a single tab stop: inner focusables are removed from the tab order', () => {
      host.active.set('dashboard');
      fixture.detectChanges();

      const settings = selectEl.querySelector('[value="settings"]') as HTMLElement;
      expect(settings.getAttribute('tabindex')).toBe('-1');

      selectEl.querySelectorAll('[value] a[href], [value] button, [value] input').forEach((focusable) => {
        expect(focusable.getAttribute('tabindex')).toBe('-1');
      });
    });

    it('makes the first selectable item the tab stop when nothing is selected', () => {
      expect(host.active()).toBeNull();

      const options = [...selectEl.querySelectorAll('[value]')];
      expect(options[0].getAttribute('tabindex')).toBe('0');
      options.slice(1).forEach((option) => expect(option.getAttribute('tabindex')).toBe('-1'));
    });

    it('jumps to first and last option with Home and End', () => {
      host.active.set('projects');
      fixture.detectChanges();

      const projects = selectEl.querySelector('[value="projects"]') as HTMLElement;
      projects.focus();

      selectEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
      fixture.detectChanges();
      expect(host.active()).toBe('settings');

      (selectEl.querySelector('[value="settings"]') as HTMLElement).focus();
      selectEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      fixture.detectChanges();
      expect(host.active()).toBe('dashboard');
    });

    it('exposes listbox semantics on the host', () => {
      expect(selectEl.getAttribute('aria-multiselectable')).toBe('false');
      expect(selectEl.getAttribute('aria-orientation')).toBe('vertical');
      expect(staticEl.hasAttribute('aria-multiselectable')).toBe(false);
    });

    it('keeps the title outside the selection machinery', () => {
      const title = selectEl.querySelector('[title]') as HTMLElement;
      expect(title.hasAttribute('role')).toBe(false);
      expect(title.hasAttribute('aria-selected')).toBe(false);
    });
  });
});
