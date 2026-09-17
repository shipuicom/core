import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { alignSparklinePoints, ShipChartSparkline } from './ship-chart-sparkline';

@Component({
  template: `
    <sh-chart-sparkline [data]="data()" [color]="color()" [area]="area()" [dot]="dot()" />
  `,
  imports: [ShipChartSparkline],
})
class Host {
  data = signal<number[]>([1, 3, 2]);
  color = signal<'primary' | 'accent' | ''>('');
  area = signal(false);
  dot = signal(false);
}

describe('ShipChartSparkline', () => {
  let host: Host;
  let element: HTMLElement;
  let fixture: ComponentFixture<Host>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Host);
    host = fixture.componentInstance;
    await fixture.whenStable();
    element = fixture.nativeElement.querySelector('sh-chart-sparkline');
  });

  it('draws the values as a line in a 0..100 box', () => {
    expect(element.querySelector('path.line')?.getAttribute('d')).toBe('M0,100L50,0L100,50');
    expect(element.querySelector('path.area')).toBeNull();
    expect(element.getAttribute('role')).toBe('img');
    expect(element.getAttribute('aria-label')).toContain('3 values from 1 to 3');
  });

  it('adds the area, dot and palette class on request', async () => {
    host.area.set(true);
    host.dot.set(true);
    host.color.set('accent');
    await fixture.whenStable();
    expect(element.querySelector('path.area')?.getAttribute('d')).toBe('M0,100L50,0L100,50L100,100L0,100Z');
    expect((element.querySelector('.dot') as HTMLElement).style.getPropertyValue('--x')).toBe('100');
    expect(element.classList.contains('accent')).toBe(true);
  });

  it('handles empty data without throwing', async () => {
    host.data.set([]);
    await fixture.whenStable();
    expect(element.querySelector('path.line')?.getAttribute('d')).toBe('');
    expect(element.getAttribute('aria-label')).toBe('Empty sparkline');
  });
});

describe('ShipChartSparkline dot during a tween', () => {
  it('rides the right edge while the entering point is still outside', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.componentInstance.dot.set(true);
    await fixture.whenStable();
    const sparkline = fixture.debugElement.query((el) => el.name === 'sh-chart-sparkline')
      .componentInstance as ShipChartSparkline;
    sparkline.drawn.set([
      { x: 0, y: 50 },
      { x: 80, y: 20 },
      { x: 120, y: 60 },
    ]);
    expect(sparkline.last()).toEqual({ x: 100, y: 40 });
  });
});

describe('alignSparklinePoints', () => {
  const pts = (ys: number[]) => ys.map((y, i) => ({ x: (100 / (ys.length - 1)) * i, y }));

  it('slides the window: dropped value exits left, new value enters from the right', () => {
    const fromData = [1, 2, 3];
    const toData = [2, 3, 4];
    const [from, to] = alignSparklinePoints(pts([90, 80, 70]), fromData, pts([80, 70, 60]), toData);
    expect(from).toEqual([
      { x: 0, y: 90 },
      { x: 50, y: 80 },
      { x: 100, y: 70 },
      { x: 150, y: 60 },
    ]);
    expect(to).toEqual([
      { x: -50, y: 90 },
      { x: 0, y: 80 },
      { x: 50, y: 70 },
      { x: 100, y: 60 },
    ]);
  });

  it('compresses when a value is appended without dropping', () => {
    const [from, to] = alignSparklinePoints(pts([50, 50]), [1, 1], pts([50, 50, 50]), [1, 1, 1]);
    expect(from.map((p) => p.x)).toEqual([0, 100, 200]);
    expect(to.map((p) => p.x)).toEqual([0, 50, 100]);
  });

  it('resamples unrelated data to a common length', () => {
    const [from, to] = alignSparklinePoints(pts([0, 100]), [1, 2], pts([0, 50, 100]), [7, 8, 9]);
    expect(from.length).toBe(3);
    expect(to.length).toBe(3);
    expect(from[1]).toEqual({ x: 50, y: 50 });
  });
});
