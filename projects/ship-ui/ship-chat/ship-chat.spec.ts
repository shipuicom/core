import { describe, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipChat } from './ship-chat';

@Component({
  template: `
    <sh-chat class="custom" [variant]="variant()" [typing]="typing()">
      <span avatar>A</span>
      <b>Alex</b>
      <time>09:41</time>
      <p>Hello there</p>
      <span footer>Seen</span>
    </sh-chat>
    <sh-chat outgoing continued color="primary">Hi!</sh-chat>
  `,
  imports: [ShipChat],
})
class TestHostComponent {
  variant = signal<'' | 'type-b' | 'type-c'>('');
  typing = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
  const [first, second] = fixture.nativeElement.querySelectorAll('sh-chat') as NodeListOf<HTMLElement>;
  return { fixture, first, second };
}

describe('ShipChat', () => {
  it('routes the slots', () => {
    const { first } = setup();
    expect(first.querySelector(':scope > .avatar > [avatar]')?.textContent).toBe('A');
    expect(first.querySelector(':scope > .body > .meta > b')?.textContent).toBe('Alex');
    expect(first.querySelector(':scope > .body > .meta > time')?.textContent).toBe('09:41');
    expect(first.querySelector(':scope > .body > .bubble > p')?.textContent).toBe('Hello there');
    expect(first.querySelector(':scope > .body > .footer > [footer]')?.textContent).toBe('Seen');
  });

  it('stamps flags and color next to consumer classes', () => {
    const { first, second } = setup();
    expect(first.classList).not.toContain('base');
    expect(first.classList).toContain('custom');
    expect(first.classList).not.toContain('outgoing');
    expect(second.classList).toContain('outgoing');
    expect(second.classList).toContain('continued');
    expect(second.classList).toContain('primary');
  });

  it('stamps the variant input', () => {
    const { fixture, first } = setup();
    fixture.componentInstance.variant.set('type-c');
    fixture.detectChanges();
    expect(first.classList).toContain('type-c');
  });

  it('uses the ShipConfig default', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SHIP_CONFIG, useValue: { chat: { variant: 'type-b', color: 'accent' } } }],
    });
    const { first } = setup();
    expect(first.classList).toContain('type-b');
    expect(first.classList).toContain('accent');
  });

  it('swaps the content for a typing indicator', () => {
    const { fixture, first } = setup();
    fixture.componentInstance.typing.set(true);
    fixture.detectChanges();
    const indicator = first.querySelector('.bubble > .typing');
    expect(indicator?.getAttribute('role')).toBe('status');
    expect(first.querySelector('.bubble > p')).toBeNull();
    expect(first.classList).toContain('typing');
  });
});
