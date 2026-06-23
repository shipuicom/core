import { describe, beforeEach, it, expect, vi } from 'vitest';
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipBlueprint, BlueprintNode } from './ship-blueprint';


const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  bezierCurveTo: vi.fn(),
  clearRect: vi.fn(),
  set lineWidth(val: any) {},
  get lineWidth() { return 1; },
  set strokeStyle(val: any) {},
  get strokeStyle() { return ''; },
  set fillStyle(val: any) {},
  get fillStyle() { return ''; }
};

if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = function (type: string) {
    if (type === '2d') {
      return mockCtx as any;
    }
    return null;
  } as any;
}

const createMockMouseEvent = (type: string, clientX: number, clientY: number) => {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clientX', { value: clientX });
  Object.defineProperty(event, 'clientY', { value: clientY });
  return event;
};

@Component({
  template: `
    <sh-blueprint
      [(nodes)]="nodes"
      [forceUnique]="forceUnique()"
      [autoLayout]="autoLayout()"></sh-blueprint>
  `,
  standalone: true,
  imports: [ShipBlueprint],
})
class TestHostComponent {
  nodes = signal<BlueprintNode[]>([
    {
      id: 'node-1',
      name: 'Start Node',
      coordinates: [100, 100],
      inputs: [],
      outputs: [{ id: 'out-1', name: 'Output 1' }],
      connections: [{ fromNode: 'node-1', fromPort: 'out-1', toNode: 'node-2', toPort: 'in-1' }],
    },
    {
      id: 'node-2',
      name: 'End Node',
      coordinates: [400, 100],
      inputs: [{ id: 'in-1', name: 'Input 1' }],
      outputs: [],
      connections: [],
    },
  ]);
  forceUnique = signal(true);
  autoLayout = signal(false);

  blueprintComponent = viewChild.required(ShipBlueprint);
}

describe('ShipBlueprint', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;
  let comp: ShipBlueprint;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    comp = host.blueprintComponent();

    
    vi.spyOn(fixture.nativeElement.querySelector('sh-blueprint'), 'getBoundingClientRect').mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {}
    } as DOMRect);

    comp.updateCanvasSize();
    fixture.detectChanges();
  });

  it('should create the blueprint component', () => {
    expect(comp).toBeTruthy();
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });

  it('should detect duplicate nodes or ports validation errors', () => {
    expect(comp.validationErrors()).toBeNull();

    
    host.forceUnique.set(false);
    fixture.detectChanges();

    
    host.nodes.set([
      {
        id: 'dup-1',
        coordinates: [10000, 10000],
        inputs: [],
        outputs: [],
        connections: [],
      },
      {
        id: 'dup-1', 
        coordinates: [10100, 10100],
        inputs: [],
        outputs: [],
        connections: [],
      },
    ]);
    fixture.detectChanges();

    
    comp.ngAfterViewInit();
    fixture.detectChanges();

    expect(comp.validationErrors()?.duplicateNodeIds).toContain('dup-1');
  });

  it('should determine visible nodes based on coordinates and canvas dimensions', () => {
    
    expect(comp.visibleNodes().length).toBe(2);

    
    host.nodes.update((nodes) => [
      ...nodes,
      {
        id: 'outside-node',
        coordinates: [5000, 5000],
        inputs: [],
        outputs: [],
        connections: [],
      },
    ]);
    fixture.detectChanges();

    
    expect(comp.visibleNodes().length).toBe(2);
    expect(comp.visibleNodes().some((n) => n.id === 'outside-node')).toBe(false);
  });

  it('should support zooming and panning changes', () => {
    expect(comp.zoomLevel()).toBe(1);
    expect(comp.panX()).toBe(0);

    const canvasContainer = fixture.nativeElement.querySelector('.canvas-container');
    
    
    const wheelEvent = new WheelEvent('wheel', { deltaY: -50, clientX: 100, clientY: 100 });
    canvasContainer.dispatchEvent(wheelEvent);
    fixture.detectChanges();

    expect(comp.zoomLevel()).toBeGreaterThan(1);

    
    comp.panX.set(0);
    comp.panY.set(0);

    
    const mousedown = createMockMouseEvent('mousedown', 200, 200);
    comp.startPan(mousedown);

    const mousemove = createMockMouseEvent('mousemove', 250, 270);
    comp.pan(mousemove);
    fixture.detectChanges();

    expect(comp.panX()).toBe(50);
    expect(comp.panY()).toBe(70);

    comp.endPan();
  });

  it('should drag nodes to update coordinates', () => {
    const startCoords = comp.nodes()[0].coordinates;
    expect(startCoords).toEqual([100, 100]);

    
    comp.startNodeDrag(createMockMouseEvent('mousedown', 150, 150), 'node-1');
    fixture.detectChanges();

    
    comp.nodeDrag(createMockMouseEvent('mousemove', 250, 250) as any);
    fixture.detectChanges();

    
    comp.endNodeDrag();
    fixture.detectChanges();

    
    const finalCoords = comp.nodes()[0].coordinates;
    expect(finalCoords[0]).toBeGreaterThan(100);
    expect(finalCoords[1]).toBeGreaterThan(100);
  });

  it('should support port dragging to connect nodes', () => {
    expect(comp.draggingConnection()).toBeNull();

    
    const event = new MouseEvent('click');
    comp.startPortDrag(event, 'node-1', 'out-1');
    fixture.detectChanges();

    expect(comp.draggingConnection()).toBeTruthy();
    expect(comp.draggingConnection()?.fromNode).toBe('node-1');
    expect(comp.draggingConnection()?.fromPort).toBe('out-1');

    
    comp.endPortDrag(event, 'node-2', 'in-1');
    fixture.detectChanges();

    expect(comp.draggingConnection()).toBeNull();
  });
});
