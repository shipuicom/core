// @vitest-environment jsdom

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipEditor } from './ship-editor';

@Component({
  imports: [ShipEditor],
  template: `<sh-editor [variant]="variant()" />`,
})
class Host {
  variant = signal<'base' | 'document' | null>(null);
}

function render(config: object | null, variant: 'base' | 'document' | null) {
  TestBed.configureTestingModule({ providers: config ? [{ provide: SHIP_CONFIG, useValue: config }] : [] });
  const fixture = TestBed.createComponent(Host);
  fixture.componentInstance.variant.set(variant);
  fixture.detectChanges();
  return (fixture.nativeElement as HTMLElement).querySelector('sh-editor')!;
}

describe('sh-editor variant', () => {
  it('uses the project default when the input is unset', () => {
    expect(render({ editor: { variant: 'document' } }, null).classList.contains('document')).toBe(true);
  });

  it('lets variant="base" override a project default of document', () => {
    expect(render({ editor: { variant: 'document' } }, 'base').classList.contains('document')).toBe(false);
  });

  it('never stamps a base class', () => {
    const el = render(null, 'base');
    expect(el.classList.contains('base')).toBe(false);
    expect(el.classList.contains('document')).toBe(false);
  });
});
