import { describe, expect, it } from 'vitest';
import { ShipVirtualWindow } from './virtual-window';

describe('ShipVirtualWindow', () => {
  it('starts with estimated geometry and an empty window', () => {
    const win = new ShipVirtualWindow({ count: 100, estimate: 40, overscan: 0 });
    expect(win.count).toBe(100);
    expect(win.totalSize()).toBe(4000);
    expect(win.start()).toBe(0);
    expect(win.end()).toBe(0);
    expect(win.padStart()).toBe(0);
    expect(win.padEnd()).toBe(4000);
  });

  it('update mounts the slice covering the viewport plus overscan', () => {
    const win = new ShipVirtualWindow({ count: 100, estimate: 40, overscan: 80 });
    const moved = win.update(1000, 400);
    expect(moved).toBe(true);
    // 1000 - 80 = 920 → block 23; 1000 + 400 + 80 = 1480 → block 37 (+1 exclusive)
    expect(win.start()).toBe(23);
    expect(win.end()).toBe(38);
    expect(win.padStart()).toBe(23 * 40);
    expect(win.padEnd()).toBe(4000 - 38 * 40);
  });

  it('update reports when the window did not move', () => {
    const win = new ShipVirtualWindow({ count: 100, estimate: 40, overscan: 0 });
    win.update(0, 400);
    expect(win.update(1, 400)).toBe(false);
  });

  it('setRange sets the window imperatively', () => {
    const win = new ShipVirtualWindow({ count: 100, estimate: 40, overscan: 0 });
    expect(win.setRange(0, 25)).toBe(true);
    expect(win.end()).toBe(25);
    expect(win.setRange(0, 25)).toBe(false);
  });

  it('measurements reshape the spacers', () => {
    const win = new ShipVirtualWindow({ count: 10, estimate: 40, overscan: 0 });
    win.update(0, 100);
    expect(win.measure(0, 100)).toBe(true);
    expect(win.totalSize()).toBe(100 + 9 * 100); // estimate follows the rolling average
    expect(win.measure(0, 100)).toBe(false);
  });

  it('measureElements uses offsetTop deltas on the vertical axis', () => {
    const win = new ShipVirtualWindow({ count: 3, estimate: 40, overscan: 0 });
    const els = [
      { offsetTop: 0, offsetHeight: 50 },
      { offsetTop: 60, offsetHeight: 30 }, // 10px margin folded into item 0
      { offsetTop: 90, offsetHeight: 25 },
    ] as unknown as HTMLElement[];
    expect(win.measureElements(els, 0)).toBe(true);
    expect(win.heights.heightOf(0)).toBe(60);
    expect(win.heights.heightOf(1)).toBe(30);
    expect(win.heights.heightOf(2)).toBe(25);
    expect(win.measureElements(els, 0)).toBe(false);
  });

  it('measureElements uses offsetLeft deltas on the horizontal axis', () => {
    const win = new ShipVirtualWindow({ count: 2, estimate: 96, overscan: 0, axis: 'horizontal' });
    const els = [
      { offsetLeft: 0, offsetWidth: 120 },
      { offsetLeft: 130, offsetWidth: 80 }, // 10px gap folded into item 0
    ] as unknown as HTMLElement[];
    expect(win.measureElements(els, 0)).toBe(true);
    expect(win.heights.heightOf(0)).toBe(130);
    expect(win.heights.heightOf(1)).toBe(80);
  });

  it('setCount rebuilds while keeping the learned estimate', () => {
    const win = new ShipVirtualWindow({ count: 10, estimate: 40, overscan: 0 });
    win.measure(0, 100);
    win.setCount(20);
    expect(win.count).toBe(20);
    expect(win.totalSize()).toBe(20 * 100); // rebuilt at the learned average
    win.setCount(5, 30); // explicit estimate wins on rebuild
    expect(win.totalSize()).toBe(150);
  });

  it('splice keeps geometry consistent', () => {
    const win = new ShipVirtualWindow({ count: 10, estimate: 40, overscan: 0 });
    win.splice(2, 3, 1);
    expect(win.count).toBe(8);
    expect(win.totalSize()).toBe(8 * 40);
  });
});
