import { describe, beforeEach, afterEach, it, expect, vi } from 'vitest';
import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { contentProjectionSignal } from './content-projection-signal';
import { createInputSignal } from './create-input-signal';

@Component({
  template: `
    @if (show()) {
      <input #el [value]="initialDomValue" />
    }
  `,
})
class ViewChildHost {
  show = signal(true);
  initialDomValue = 'hello';
  el = viewChild<ElementRef<HTMLInputElement>>('el');
  value = createInputSignal<string>(this.el);
}

@Component({
  template: ``,
})
class RawElementHost {
  raw = signal<HTMLInputElement | undefined>(undefined);
  value = createInputSignal<number>(this.raw, { forceType: 'number' });
}

@Component({
  template: `<input #el value="2026-08-27" />`,
})
class TransformHost {
  el = viewChild<ElementRef<HTMLInputElement>>('el');
  value = createInputSignal<Date | null>(this.el, {
    transform: (value) => (value ? new Date(value) : null),
    compare: (a, b) => (a?.getTime() ?? null) === (b?.getTime() ?? null),
  });
}

@Component({
  template: `<input #el />`,
})
class DebounceHost {
  el = viewChild<ElementRef<HTMLInputElement>>('el');
  value = createInputSignal<string>(this.el, { debounce: 100 });
}

@Component({
  template: `<input #el value="seeded" />`,
})
class AdoptedSeedHost {
  el = viewChild<ElementRef<HTMLInputElement>>('el');
  store = signal<string | null | undefined>('');
  value = createInputSignal<string>(this.el, { signal: this.store });
}

@Component({
  template: `<input #el />`,
})
class OriginHost {
  el = viewChild<ElementRef<HTMLInputElement>>('el');
  calls: Array<{ value: string | null | undefined; source: 'user' | 'programmatic' }> = [];
  value = createInputSignal<string>(this.el, {
    onDomChange: (value, source) => this.calls.push({ value, source }),
  });
}

@Component({
  selector: 'test-conjunction-host',
  template: `<ng-content />`,
})
class ConjunctionHost {
  input = contentProjectionSignal<HTMLInputElement>('input.target', undefined, 0);
  value = createInputSignal<string>(this.input);
}

@Component({
  imports: [ConjunctionHost],
  template: `
    <test-conjunction-host>
      @if (show()) {
        <input class="target" value="projected" />
      }
      <input class="decoy" value="decoy" />
    </test-conjunction-host>
  `,
})
class ConjunctionWrapper {
  show = signal(true);
}

function typeInto(input: HTMLInputElement, text: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value');
  descriptor!.set!.call(input, text);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

async function flush(fixture: ComponentFixture<unknown>, ms = 1) {
  fixture.detectChanges();
  await Promise.resolve();
  vi.advanceTimersByTime(ms);
  await Promise.resolve();
  fixture.detectChanges();
}

describe('createInputSignal', () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [
        ViewChildHost,
        RawElementHost,
        TransformHost,
        DebounceHost,
        OriginHost,
        AdoptedSeedHost,
        ConjunctionWrapper,
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with a viewChild ElementRef', () => {
    let fixture: ComponentFixture<ViewChildHost>;
    let host: ViewChildHost;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ViewChildHost);
      host = fixture.componentInstance;
      await flush(fixture);
    });

    function inputEl(): HTMLInputElement {
      return fixture.nativeElement.querySelector('input');
    }

    it('syncs the initial DOM value into the signal', () => {
      expect(host.value()).toBe('hello');
    });

    it('updates the signal when the user types', async () => {
      typeInto(inputEl(), 'typed');
      await flush(fixture);
      expect(host.value()).toBe('typed');
    });

    it('does not rewrite the field for input-originated changes', async () => {
      typeInto(inputEl(), 'typed');
      await flush(fixture);
      expect(inputEl().value).toBe('typed');
    });

    it('writes external set() calls to the DOM and dispatches input', async () => {
      const events: string[] = [];
      inputEl().addEventListener('input', () => events.push(inputEl().value));

      host.value.set('external');
      await flush(fixture);

      expect(inputEl().value).toBe('external');
      expect(events).toContain('external');
    });

    it('catches programmatic value assignment through the interceptor', async () => {
      inputEl().value = 'programmatic';
      await flush(fixture);
      expect(host.value()).toBe('programmatic');
    });

    it('retains the last value when the element is removed', async () => {
      typeInto(inputEl(), 'kept');
      await flush(fixture);

      host.show.set(false);
      await flush(fixture);

      expect(host.value()).toBe('kept');
    });

    it('writes the retained value into a recreated element', async () => {
      typeInto(inputEl(), 'kept');
      await flush(fixture);

      host.show.set(false);
      await flush(fixture);
      host.initialDomValue = '';
      host.show.set(true);
      await flush(fixture);

      expect(inputEl().value).toBe('kept');
    });
  });

  describe('with a raw element signal', () => {
    it('accepts a bare element and applies forceType number', async () => {
      const fixture = TestBed.createComponent(RawElementHost);
      const host = fixture.componentInstance;
      await flush(fixture);

      expect(host.value()).toBeUndefined();

      const el = document.createElement('input');
      el.value = '42';
      host.raw.set(el);
      await flush(fixture);

      expect(host.value()).toBe(42);
      expect(typeof host.value()).toBe('number');

      typeInto(el, 'not a number');
      await flush(fixture);
      expect(host.value()).toBeUndefined();
    });
  });

  describe('transform and compare', () => {
    let fixture: ComponentFixture<TransformHost>;
    let host: TransformHost;

    beforeEach(async () => {
      fixture = TestBed.createComponent(TransformHost);
      host = fixture.componentInstance;
      await flush(fixture);
    });

    it('applies the transform to the initial value', () => {
      expect(host.value()).toBeInstanceOf(Date);
      expect(host.value()!.getFullYear()).toBe(2026);
    });

    it('keeps the previous reference when compare reports equality', async () => {
      const before = host.value();
      typeInto(fixture.nativeElement.querySelector('input'), '2026-08-27');
      await flush(fixture);
      expect(host.value()).toBe(before);
    });

    it('keeps the raw text in the field while the transformed value tracks behind it', async () => {
      const input = fixture.nativeElement.querySelector('input');
      typeInto(input, '2026-09-01');
      await flush(fixture);

      expect(input.value).toBe('2026-09-01');
      expect(host.value()!.getMonth()).toBe(8);
    });
  });

  describe('debounce', () => {
    it('coalesces rapid input events into one update', async () => {
      const fixture = TestBed.createComponent(DebounceHost);
      const host = fixture.componentInstance;
      await flush(fixture, 150);

      const input = fixture.nativeElement.querySelector('input');

      typeInto(input, 'a');
      vi.advanceTimersByTime(50);
      typeInto(input, 'ab');
      vi.advanceTimersByTime(50);
      expect(host.value()).toBeUndefined();

      vi.advanceTimersByTime(100);
      expect(host.value()).toBe('ab');
    });
  });

  describe('adopted signal on attach', () => {
    it('does not stomp externally-seeded DOM state on the attach transition', async () => {
      const fixture = TestBed.createComponent(AdoptedSeedHost);
      const host = fixture.componentInstance;
      await flush(fixture);

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(input.value).toBe('seeded');
      expect(host.store()).toBe('');
    });

    it('resumes signal-to-DOM enforcement after attach', async () => {
      const fixture = TestBed.createComponent(AdoptedSeedHost);
      const host = fixture.componentInstance;
      await flush(fixture);

      host.store.set('next');
      await flush(fixture);

      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      expect(input.value).toBe('next');
    });
  });

  describe('onDomChange origin reporting', () => {
    let fixture: ComponentFixture<OriginHost>;
    let host: OriginHost;

    beforeEach(async () => {
      fixture = TestBed.createComponent(OriginHost);
      host = fixture.componentInstance;
      await flush(fixture);
    });

    function inputEl(): HTMLInputElement {
      return fixture.nativeElement.querySelector('input');
    }

    it('reports typing as user', async () => {
      typeInto(inputEl(), 'hi');
      await flush(fixture);
      expect(host.calls).toEqual([{ value: 'hi', source: 'user' }]);
    });

    it('reports an outside value assignment as programmatic', async () => {
      inputEl().value = 'prog';
      await flush(fixture);
      expect(host.calls).toEqual([{ value: 'prog', source: 'programmatic' }]);
    });

    it('never fires for signal-originated set() or its echo', async () => {
      host.value.set('ext');
      await flush(fixture);
      expect(inputEl().value).toBe('ext');
      expect(host.calls).toEqual([]);
    });
  });

  describe('in conjunction with contentProjectionSignal', () => {
    let fixture: ComponentFixture<ConjunctionWrapper>;
    let wrapper: ConjunctionWrapper;
    let host: ConjunctionHost;

    beforeEach(async () => {
      fixture = TestBed.createComponent(ConjunctionWrapper);
      wrapper = fixture.componentInstance;
      await flush(fixture);
      host = fixture.debugElement.children[0].componentInstance;
    });

    function targetInput(): HTMLInputElement | null {
      return fixture.nativeElement.querySelector('input.target');
    }

    it('binds to the projected element selected by index', () => {
      expect(host.value()).toBe('projected');
    });

    it('ignores non-matching projected elements', async () => {
      typeInto(fixture.nativeElement.querySelector('input.decoy'), 'noise');
      await flush(fixture);
      expect(host.value()).toBe('projected');
    });

    it('syncs typing on the projected element', async () => {
      typeInto(targetInput()!, 'via projection');
      await flush(fixture);
      expect(host.value()).toBe('via projection');
    });

    it('writes external set() calls to the projected element', async () => {
      host.value.set('from signal');
      await flush(fixture);
      expect(targetInput()!.value).toBe('from signal');
    });

    it('rebinds when the projected element is recreated', async () => {
      wrapper.show.set(false);
      await flush(fixture);
      expect(targetInput()).toBeNull();

      wrapper.show.set(true);
      await flush(fixture);

      typeInto(targetInput()!, 'rebound');
      await flush(fixture);
      expect(host.value()).toBe('rebound');
    });
  });
});
