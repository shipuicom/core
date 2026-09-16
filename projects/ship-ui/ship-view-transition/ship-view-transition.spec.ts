import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, Routes, ViewTransitionInfo } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fadeIn, fadeOut, slideFromRight, slideToLeft } from './ship-view-transition.animations';
import { provideShipViewTransitions } from './ship-view-transition.provider';
import { ShipViewTransitions } from './ship-view-transition.service';
import { createViewTransition } from './ship-view-transition.types';

@Component({ template: '' })
class Page {}

const routes: Routes = [
  { path: '', component: Page },
  { path: 'search', component: Page },
  { path: 'profile', component: Page },
  { path: 'detail/:id', component: Page },
  { path: 'quiet', component: Page, data: { shipViewTransition: false } },
];

interface FakeTransition extends ViewTransition {
  done(): Promise<void>;
  finish(): Promise<void>;
}

// A transition whose phases the test drives by hand, so cleanup does not run
// before the assertions do.
function fakeTransition(): FakeTransition {
  let resolveDone!: () => void;
  let resolveFinished!: () => void;
  const updateCallbackDone = new Promise<void>((resolve) => (resolveDone = resolve));
  const finished = new Promise<void>((resolve) => (resolveFinished = resolve));
  const tick = () => new Promise<void>((resolve) => setTimeout(resolve));
  return {
    skipTransition: vi.fn(),
    updateCallbackDone,
    ready: updateCallbackDone,
    finished,
    done: () => (resolveDone(), tick()),
    finish: () => (resolveDone(), resolveFinished(), tick()),
  } as unknown as FakeTransition;
}

function allCss() {
  const adopted = (document.adoptedStyleSheets ?? []).map((sheet) =>
    [...sheet.cssRules].map((rule) => rule.cssText).join('\n')
  );
  const styles = [...document.querySelectorAll('style[data-sh-view-transitions]')].map(
    (style) => style.textContent ?? ''
  );
  return [...adopted, ...styles].join('\n');
}

describe('ShipViewTransitions', () => {
  let service: ShipViewTransitions;
  let router: Router;

  async function snapshot(url: string): Promise<ActivatedRouteSnapshot> {
    await router.navigateByUrl(url);
    return router.routerState.snapshot.root;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideShipViewTransitions({
          forward: { in: slideFromRight, out: slideToLeft },
          back: { in: fadeIn, out: fadeOut },
          animations: [fadeIn],
          respectReducedMotion: false,
        }),
      ],
    });
    service = TestBed.inject(ShipViewTransitions);
    router = TestBed.inject(Router);
  });

  async function transitionBetween(fromUrl: string, toUrl: string) {
    const from = await snapshot(fromUrl);
    const to = await snapshot(toUrl);
    const transition = fakeTransition();
    service.onCreated({ transition, from, to });
    return transition;
  }

  it('treats a deeper url as forward and a shallower one as back', async () => {
    let transition = await transitionBetween('/', '/detail/1');
    expect(service.direction()).toBe('forward');
    await transition.finish();
    expect(service.direction()).toBeNull();

    transition = await transitionBetween('/detail/1', '/');
    expect(service.direction()).toBe('back');
    await transition.finish();
  });

  it('orders sibling routes by their position in the route config', async () => {
    let transition = await transitionBetween('/search', '/profile');
    expect(service.direction()).toBe('forward');
    await transition.finish();

    transition = await transitionBetween('/profile', '/search');
    expect(service.direction()).toBe('back');
    await transition.finish();
  });

  it('skips routes that opt out through route data', async () => {
    const transition = await transitionBetween('/', '/quiet');
    expect(transition.skipTransition).toHaveBeenCalled();
    expect(service.direction()).toBeNull();
  });

  it('skips the transition when no outlet reported a change', async () => {
    const transition = await transitionBetween('/', '/search');
    await transition.done();
    expect(transition.skipTransition).toHaveBeenCalled();
    await transition.finish();
  });

  it('writes old/new rules and injects only the keyframes that are used', async () => {
    const transition = await transitionBetween('/', '/search');
    service.activated('outlet-a', null, true);
    await transition.done();
    expect(transition.skipTransition).not.toHaveBeenCalled();

    const css = allCss();
    expect(css).toContain('@keyframes sh-vt-slide-from-right');
    expect(css).toContain('@keyframes sh-vt-slide-to-left');
    expect(css).not.toContain('@keyframes sh-vt-fade-in');
    expect(css).toContain('::view-transition-group(outlet-a-frame)');
    await transition.finish();
  });

  it('resolves names from the registry and warns on unknown ones', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const transition = await transitionBetween('/', '/search');
    service.activated('outlet-b', { in: 'sh-vt-fade-in', out: 'nope' }, false);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"nope"'));
    const css = allCss();
    expect(css).toContain('@keyframes sh-vt-fade-in');
    warn.mockRestore();
    await transition.finish();
  });

  it('accepts animations made with createViewTransition', async () => {
    const wipe = createViewTransition('spec-wipe', 'to { clip-path: inset(0) }');
    const transition = await transitionBetween('/', '/search');
    service.activated('outlet-c', { in: wipe }, false);
    const css = allCss();
    expect(css).toContain('@keyframes spec-wipe');
    await transition.finish();
  });
});
