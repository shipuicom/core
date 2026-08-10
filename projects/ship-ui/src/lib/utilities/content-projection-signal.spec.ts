import { describe, beforeEach, it, expect } from 'vitest';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { contentProjectionSignal } from './content-projection-signal';

@Component({
  selector: 'test-projection-host',
  template: `<ng-content />`,
})
class ProjectionHost {
  items = contentProjectionSignal<HTMLSpanElement>('span.item');
  firstItem = contentProjectionSignal<HTMLSpanElement>('span.item', undefined, 0);
  secondItem = contentProjectionSignal<HTMLSpanElement>('span.item', undefined, 1);
}

@Component({
  imports: [ProjectionHost],
  template: `
    <test-projection-host>
      @for (label of labels(); track label) {
        <span class="item">{{ label }}</span>
      }
      @if (showExtra()) {
        <b class="not-an-item">extra</b>
      }
    </test-projection-host>
  `,
})
class Wrapper {
  labels = signal(['a', 'b']);
  showExtra = signal(false);
}

async function settle(fixture: ComponentFixture<unknown>) {
  fixture.detectChanges();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('contentProjectionSignal', () => {
  let fixture: ComponentFixture<Wrapper>;
  let wrapper: Wrapper;
  let host: ProjectionHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Wrapper] }).compileComponents();
    fixture = TestBed.createComponent(Wrapper);
    wrapper = fixture.componentInstance;
    await settle(fixture);
    host = fixture.debugElement.children[0].componentInstance;
  });

  it('returns all projected elements matching the selector', () => {
    const items = host.items();
    expect(items.length).toBe(2);
    expect(items.map((el) => el.textContent)).toEqual(['a', 'b']);
  });

  it('ignores elements that do not match the selector', async () => {
    wrapper.showExtra.set(true);
    await settle(fixture);
    expect(host.items().length).toBe(2);
  });

  it('reacts to elements being added', async () => {
    wrapper.labels.set(['a', 'b', 'c']);
    await settle(fixture);
    expect(host.items().map((el) => el.textContent)).toEqual(['a', 'b', 'c']);
  });

  it('reacts to elements being removed', async () => {
    wrapper.labels.set(['b']);
    await settle(fixture);
    expect(host.items().map((el) => el.textContent)).toEqual(['b']);
  });

  it('returns the element at the given index when a trailing index is passed', () => {
    expect(host.firstItem()?.textContent).toBe('a');
    expect(host.secondItem()?.textContent).toBe('b');
  });

  it('returns undefined when the index is out of range', async () => {
    wrapper.labels.set(['a']);
    await settle(fixture);
    expect(host.secondItem()).toBeUndefined();
  });

  it('keeps the indexed element reference stable when unrelated elements change', async () => {
    const before = host.firstItem();
    wrapper.labels.set(['a', 'b', 'c']);
    await settle(fixture);
    expect(host.firstItem()).toBe(before);
  });

  it('tracks a later element moving into the index slot', async () => {
    const secondBefore = host.items()[1];
    wrapper.labels.set(['b']);
    await settle(fixture);
    expect(host.firstItem()).toBe(secondBefore);
  });
});
