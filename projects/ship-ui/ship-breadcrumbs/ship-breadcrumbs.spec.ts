import { describe, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipLayoutPage } from '@ship-ui/core/ship-layout';
import { ShipBreadcrumbs } from './ship-breadcrumbs';

@Component({
  template: `
    <sh-breadcrumbs class="custom" [variant]="variant()" [separator]="separator()">
      <a href="/">Home</a>
      <a href="/projects">Projects</a>
      <span aria-current="page">Ship</span>
    </sh-breadcrumbs>
  `,
  imports: [ShipBreadcrumbs],
})
class TestHostComponent {
  variant = signal<'' | 'type-b' | 'type-c'>('');
  separator = signal('/');
}

@Component({
  template: `
    <sh-lo-page>
      <sh-breadcrumbs><a href="/">Home</a><span>Page</span></sh-breadcrumbs>
      <h1>Title</h1>
    </sh-lo-page>
  `,
  imports: [ShipLayoutPage, ShipBreadcrumbs],
})
class PageHostComponent {}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  const el = fixture.nativeElement.querySelector('sh-breadcrumbs') as HTMLElement;
  return { fixture, el };
}

describe('ShipBreadcrumbs', () => {
  it('is a labelled navigation landmark', () => {
    const { el } = setup();
    expect(el.getAttribute('role')).toBe('navigation');
    expect(el.getAttribute('aria-label')).toBe('Breadcrumb');
  });

  it('falls back to the base variant next to consumer classes', () => {
    const { el } = setup();
    expect(el.classList).toContain('base');
    expect(el.classList).toContain('custom');
  });

  it('stamps the variant input', () => {
    const { fixture, el } = setup();
    fixture.componentInstance.variant.set('type-c');
    fixture.detectChanges();
    expect(el.classList).toContain('type-c');
    expect(el.classList).not.toContain('base');
  });

  it('uses the ShipConfig default', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SHIP_CONFIG, useValue: { breadcrumbs: { variant: 'type-b', size: 'small' } } }],
    });
    const { el } = setup();
    expect(el.classList).toContain('type-b');
    expect(el.classList).toContain('small');
  });

  it('exposes the separator as a quoted CSS string', () => {
    const { fixture, el } = setup();
    expect(el.style.getPropertyValue('--breadcrumbs-sep')).toBe('"/"');
    fixture.componentInstance.separator.set('›');
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--breadcrumbs-sep')).toBe('"›"');
  });

  it("slots into sh-lo-page's nav area", () => {
    const fixture = TestBed.createComponent(PageHostComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('sh-lo-page > .head > .nav > sh-breadcrumbs')).toBeTruthy();
  });
});
