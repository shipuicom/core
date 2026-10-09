import { describe, expect, it } from 'vitest';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SHIP_CONFIG } from '@ship-ui/core';
import { ShipBlockBanner } from './ship-banner';
import { ShipBlockFaq } from './ship-faq';
import { ShipBlockFeature, ShipBlockFeatures } from './ship-features';
import { ShipBlockFooter } from './ship-footer';
import { ShipBlockHeader } from './ship-header';
import { ShipBlockHero } from './ship-hero';
import { ShipBlockPricing, ShipBlockPricingTier } from './ship-pricing';
import { ShipBlockTestimonial, ShipBlockTestimonials } from './ship-testimonials';

@Component({
  imports: [
    ShipBlockHero,
    ShipBlockFeatures,
    ShipBlockFeature,
    ShipBlockPricing,
    ShipBlockPricingTier,
    ShipBlockTestimonials,
    ShipBlockTestimonial,
    ShipBlockFaq,
    ShipBlockFooter,
  ],
  template: `
    <sh-bl-hero variant="type-b" color="accent" class="custom">
      <span eyebrow>New</span>
      <h1>Title</h1>
      <p>Lead</p>
      <button>Go</button>
      <small>Fine print</small>
      <img alt="" />
    </sh-bl-hero>
    <sh-bl-features>
      <h2>Features</h2>
      <p>Intro</p>
      <sh-bl-feature>
        <span icon>★</span>
        <h3>Fast</h3>
        <p>Very</p>
      </sh-bl-feature>
    </sh-bl-features>
    <sh-bl-pricing>
      <h2>Pricing</h2>
      <sh-bl-pricing-tier featured color="success">
        <h3>Pro</h3>
        <div price><b>$9</b></div>
        <ul><li>One</li></ul>
        <button>Buy</button>
      </sh-bl-pricing-tier>
    </sh-bl-pricing>
    <sh-bl-testimonials>
      <sh-bl-testimonial>
        <blockquote>Great</blockquote>
        <b>Ada</b>
        <span>CTO</span>
      </sh-bl-testimonial>
    </sh-bl-testimonials>
    <sh-bl-faq>
      <details><summary>Q</summary><p>A</p></details>
    </sh-bl-faq>
    <sh-bl-footer>
      <a logo href="#">Logo</a>
      <nav aria-label="Product"><h3>Product</h3><a href="#">One</a></nav>
      <small>©</small>
    </sh-bl-footer>
  `,
})
class SlotHost {}

function setup<T>(host: new () => T) {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  const el: HTMLElement = fixture.nativeElement;
  return { fixture, q: (selector: string) => el.querySelector(selector) as HTMLElement };
}

describe('ship-block', () => {
  it('stamps variant and colour next to consumer classes', () => {
    const { q } = setup(SlotHost);
    const hero = q('sh-bl-hero');
    expect(hero.classList).toContain('type-b');
    expect(hero.classList).toContain('accent');
    expect(hero.classList).toContain('custom');
  });

  it('routes hero slots into text and media', () => {
    const { q } = setup(SlotHost);
    expect(q('sh-bl-hero > .inner > .text > [eyebrow]').textContent).toBe('New');
    expect(q('sh-bl-hero > .inner > .text > h1').textContent).toBe('Title');
    expect(q('sh-bl-hero > .inner > .text > .actions > button').textContent).toBe('Go');
    expect(q('sh-bl-hero > .inner > .text > small').textContent).toBe('Fine print');
    expect(q('sh-bl-hero > .inner > .media > img')).toBeTruthy();
  });

  it('puts the section header apart from the items', () => {
    const { q } = setup(SlotHost);
    expect(q('sh-bl-features > .inner > .head > h2').textContent).toBe('Features');
    expect(q('sh-bl-features > .inner > .head > p').textContent).toBe('Intro');
    expect(q('sh-bl-features > .inner > .items > sh-bl-feature > .text > h3').textContent).toBe('Fast');
    expect(q('sh-bl-feature > .icon > [icon]')).toBeTruthy();
    expect(q('sh-bl-feature > .text > p').textContent).toBe('Very');
  });

  it('marks a featured pricing tier and keeps its own colour', () => {
    const { q } = setup(SlotHost);
    const tier = q('sh-bl-pricing-tier');
    expect(tier.classList).toContain('featured');
    expect(tier.classList).toContain('success');
    expect(q('sh-bl-pricing-tier [price] b').textContent).toBe('$9');
  });

  it('renders a testimonial as a figure with a caption', () => {
    const { q } = setup(SlotHost);
    expect(q('sh-bl-testimonial figure blockquote').textContent).toBe('Great');
    expect(q('sh-bl-testimonial figcaption b').textContent).toBe('Ada');
  });

  it('keeps native details in the faq and nav columns in the footer', () => {
    const { q } = setup(SlotHost);
    expect(q('sh-bl-faq details > summary').textContent).toBe('Q');
    expect(q('sh-bl-footer nav h3').textContent).toBe('Product');
    expect(q('sh-bl-footer [logo]').textContent).toBe('Logo');
  });

  it('falls back to the ShipConfig variant', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: SHIP_CONFIG, useValue: { blockFeatures: { variant: 'type-c' }, blockHero: { variant: 'type-c' } } }],
    });
    const { q } = setup(SlotHost);
    expect(q('sh-bl-features').classList).toContain('type-c');
    // An explicit input wins over the config.
    expect(q('sh-bl-hero').classList).toContain('type-b');
    expect(q('sh-bl-hero').classList).not.toContain('type-c');
  });
});

@Component({
  imports: [ShipBlockHeader, ShipBlockBanner],
  template: `
    <sh-bl-banner dismissible [(open)]="bannerOpen">Hello</sh-bl-banner>
    <sh-bl-header [(open)]="menuOpen">
      <a logo href="#">Logo</a>
      <nav><a href="#" id="link">Docs</a></nav>
      <button actions>Sign in</button>
    </sh-bl-header>
  `,
})
class InteractiveHost {
  bannerOpen = signal(true);
  menuOpen = signal(false);
}

describe('ship-block interaction', () => {
  it('toggles the header menu and wires the button to the panel', () => {
    const { fixture, q } = setup(InteractiveHost);
    const toggle = q('sh-bl-header .toggle');
    const panel = q('sh-bl-header .panel');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(q('sh-bl-header .panel > nav')).toBeTruthy();
    expect(q('sh-bl-header .panel > .actions > [actions]')).toBeTruthy();

    toggle.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList).toContain('open');
  });

  it('closes the header menu on a link click and on Escape', () => {
    const { fixture, q } = setup(InteractiveHost);
    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();
    q('#link').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(false);

    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();
    q('sh-bl-header').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.menuOpen()).toBe(false);
    expect(document.activeElement).toBe(q('sh-bl-header .toggle'));
  });

  it('hides a dismissed banner', () => {
    const { fixture, q } = setup(InteractiveHost);
    const banner = q('sh-bl-banner');
    expect(banner.hasAttribute('hidden')).toBe(false);
    (q('sh-bl-banner .dismiss') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.bannerOpen()).toBe(false);
    expect(banner.hasAttribute('hidden')).toBe(true);
  });
});
