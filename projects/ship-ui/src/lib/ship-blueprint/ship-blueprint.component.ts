import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  PLATFORM_ID,
  signal,
  ViewChild,
} from '@angular/core';
import { ShipCardComponent, ShipIconComponent } from 'ship-ui';
import { classMutationSignal } from '../utilities/class-mutation-signal';

// Type definitions
type Port = { id: string; name: string };
type BaseNode = { id: string; x: number; y: number; inputs: Port[]; outputs: Port[] };
type Connection = { fromNode: string; fromPort: string; toNode: string; toPort: string };
type DragState = { fromNode: string; fromPort: string; x2: number; y2: number };
type Coordinates = { x: number; y: number };

const TEST_NODES: BaseNode[] = [
  { id: 'Start', x: -300, y: -200, inputs: [], outputs: [{ id: 'out-1', name: 'Start Output' }] },
  {
    id: 'Node 1',
    x: 0,
    y: 0,
    inputs: [{ id: 'in-1', name: 'Input A' }],
    outputs: [{ id: 'out-1', name: 'Output B' }],
  },
  {
    id: 'Node 2',
    x: 300,
    y: 200,
    inputs: [{ id: 'in-1', name: 'Input C' }],
    outputs: [{ id: 'out-1', name: 'Output D' }],
  },
];

@Component({
  selector: 'sh-blueprint',
  imports: [ShipCardComponent, ShipIconComponent],
  template: `
    <div
      class="canvas-container"
      (mousedown)="startPan($event)"
      (mousemove)="pan($event)"
      (wheel)="zoom($event)"
      (touchstart)="handleTouchStart($event)"
      (touchmove)="handleTouchMove($event)"
      (touchend)="handleTouchEnd()">
      <canvas #blueprintCanvas></canvas>

      <div
        class="nodes-wrapper"
        [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + zoomLevel() + ')'"
        [style.transform-origin]="'0 0'">
        @for (node of nodes(); track node.id) {
          <sh-card class="node type-c" [style.transform]="'translate(' + node.x + 'px, ' + node.y + 'px)'">
            <header (mousedown)="startNodeDrag($event, node.id)" (touchstart)="startNodeDrag($event, node.id)">
              <span class="node-title">{{ node.id }}</span>
              <sh-icon>list</sh-icon>
            </header>
            <div class="ports">
              <div class="inputs">
                @for (inputPort of node.inputs; track inputPort.id) {
                  <div class="port-wrap">
                    <div
                      class="port input-port"
                      [attr.data-node-id]="node.id"
                      [attr.data-port-id]="inputPort.id"
                      (click)="endPortDrag($event, node.id, inputPort.id)"></div>
                    <span class="port-name">{{ inputPort.name }}</span>
                  </div>
                }
              </div>
              <div class="outputs">
                @for (outputPort of node.outputs; track outputPort.id) {
                  <div class="port-wrap">
                    <span class="port-name">{{ outputPort.name }}</span>
                    <div
                      class="port output-port"
                      [attr.data-node-id]="node.id"
                      [attr.data-port-id]="outputPort.id"
                      (click)="startPortDrag($event, node.id, outputPort.id)"></div>
                  </div>
                }
              </div>
            </div>
          </sh-card>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlueprintComponent implements AfterViewInit, OnDestroy {
  readonly #ZOOM_SPEED = 0.01;
  readonly #MAX_ZOOM = 1.5;
  readonly #MIN_ZOOM = 0.5;

  #platformId = inject(PLATFORM_ID);
  #selfRef = inject(ElementRef<HTMLElement>);
  #currentClass = classMutationSignal();

  gridSize = input(20);
  snapToGrid = input<boolean>(true);
  asDots = computed(() => this.#currentClass().includes('dots'));
  nodes = model<BaseNode[]>(TEST_NODES);

  panX = signal(0);
  panY = signal(0);
  zoomLevel = signal(1);
  gridSnapSize = signal(20);

  #isDragging = signal(false);
  #lastMouseX = signal(0);
  #lastMouseY = signal(0);
  #initialPinchDistance = signal(0);
  #isNodeDragging = signal(false);
  #draggedNodeId = signal<string | null>(null);
  #dragOffset = signal<Coordinates | null>(null);
  connections = signal<Connection[]>([]);
  draggingConnection = signal<DragState | null>(null);

  @ViewChild('blueprintCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  #ctx!: CanvasRenderingContext2D;
  #resizeObserver!: ResizeObserver;

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      effect(() => {
        this.asDots();
        this.panX();
        this.panY();
        this.zoomLevel();
        this.nodes();
        this.connections();
        this.draggingConnection();

        // CHANGED: Use requestAnimationFrame to prevent timing issues
        requestAnimationFrame(() => this.drawCanvas());
      });
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.#platformId)) {
      const canvas = this.canvasRef.nativeElement;
      this.#ctx = canvas.getContext('2d')!;
      this.#resizeObserver = new ResizeObserver(() => this.updateCanvasSize());
      this.#resizeObserver.observe(this.#selfRef.nativeElement);
      this.updateCanvasSize();
    }
  }

  ngOnDestroy() {
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
  }

  updateCanvasSize() {
    const canvas = this.canvasRef.nativeElement;
    const rect = this.#selfRef.nativeElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    this.#ctx.scale(dpr, dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    this.drawCanvas();
  }

  drawCanvas() {
    if (!this.#ctx) return;
    const ctx = this.#ctx;
    const { width, height } = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, width / dpr, height / dpr);
    ctx.save();
    ctx.translate(this.panX(), this.panY());
    ctx.scale(this.zoomLevel(), this.zoomLevel());
    this.drawGrid(ctx);
    this.drawConnections(ctx);
    if (this.draggingConnection()) {
      this.drawDraggingPath(ctx);
    }
    ctx.restore();
  }

  // CHANGED: Updated drawGrid with dot logic
  drawGrid(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const zoom = this.zoomLevel();
    const panX = this.panX();
    const panY = this.panY();
    const gridSize = this.gridSize();
    const scaledGridSize = gridSize * zoom;
    const dynamicGridSize = scaledGridSize < 20 ? gridSize * 4 : gridSize;
    const startX = Math.floor(-panX / zoom / dynamicGridSize) * dynamicGridSize;
    const startY = Math.floor(-panY / zoom / dynamicGridSize) * dynamicGridSize;
    const endX = startX + width / dpr / zoom + dynamicGridSize;
    const endY = startY + height / dpr / zoom + dynamicGridSize;

    if (this.asDots()) {
      const dotRadius = 1 / zoom;
      ctx.fillStyle = '#d0d0d0';
      for (let x = startX; x < endX; x += dynamicGridSize) {
        for (let y = startY; y < endY; y += dynamicGridSize) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    } else {
      ctx.beginPath();
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1 / zoom;
      for (let x = startX; x < endX; x += dynamicGridSize) {
        ctx.moveTo(x, startY);
        ctx.lineTo(x, endY);
      }
      for (let y = startY; y < endY; y += dynamicGridSize) {
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
      }
      ctx.stroke();
    }
  }

  drawConnections(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2 / this.zoomLevel();
    for (const conn of this.connections()) {
      const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
      const endPos = this.getNodePortPosition(conn.toNode, conn.toPort);
      ctx.beginPath();
      this.drawCurvedPath(ctx, startPos, endPos);
      ctx.stroke();
    }
  }

  drawDraggingPath(ctx: CanvasRenderingContext2D) {
    const conn = this.draggingConnection()!;
    const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
    const endPos = { x: conn.x2, y: conn.y2 };
    ctx.strokeStyle = '#5a9cf8';
    ctx.lineWidth = 2 / this.zoomLevel();
    ctx.beginPath();
    this.drawCurvedPath(ctx, startPos, endPos);
    ctx.stroke();
  }

  drawCurvedPath(ctx: CanvasRenderingContext2D, start: Coordinates, end: Coordinates) {
    const { x: x1, y: y1 } = start;
    const { x: x2, y: y2 } = end;
    const dx = Math.abs(x1 - x2) * 0.7;
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
  }

  // --- All other event handlers and logic methods remain the same ---
  // (The full component code from the previous step follows)
  @HostListener('document:mouseup', ['$event']) onMouseUp(event: MouseEvent) {
    this.endPan();
    this.endNodeDrag();
  }
  @HostListener('document:click', ['$event']) onClick(event: MouseEvent) {
    if (this.draggingConnection()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.port')) {
        this.cancelPortDrag();
      }
    }
  }
  @HostListener('document:keydown.escape', ['$event']) onEscape(event: KeyboardEvent) {
    if (this.draggingConnection()) {
      this.cancelPortDrag();
    }
  }
  @HostListener('document:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.#isNodeDragging()) {
      this.nodeDrag(event);
    } else if (this.draggingConnection()) {
      this.updatePathOnMove(event);
    } else {
      this.pan(event);
    }
  }
  @HostListener('document:touchmove', ['$event']) onTouchMove(event: TouchEvent) {
    if (this.#isNodeDragging()) {
      this.nodeDrag(event.touches[0]);
    } else if (this.draggingConnection()) {
      this.updatePathOnMove(event.touches[0]);
    } else {
      this.handleTouchMove(event);
    }
  }
  startNodeDrag(event: MouseEvent | TouchEvent, nodeId: string) {
    event.stopPropagation();
    this.#isNodeDragging.set(true);
    this.#draggedNodeId.set(nodeId);
    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
    const worldX = (clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
    const worldY = (clientY - blueprintRect.top - this.panY()) / this.zoomLevel();
    const draggedNode = this.nodes().find((n) => n.id === nodeId);
    if (draggedNode) {
      this.#dragOffset.set({ x: worldX - draggedNode.x, y: worldY - draggedNode.y });
    }
    this.#lastMouseX.set(clientX);
    this.#lastMouseY.set(clientY);
  }
  endNodeDrag() {
    this.#isNodeDragging.set(false);
    this.#draggedNodeId.set(null);
    this.#dragOffset.set(null);
  }
  nodeDrag(event: MouseEvent | Touch) {
    const draggedId = this.#draggedNodeId();
    if (!this.#isNodeDragging() || !draggedId) return;
    const { clientX, clientY } = event;
    this.nodes.update((nodes) => {
      const node = nodes.find((n) => n.id === draggedId);
      if (node) {
        if (this.snapToGrid() || (event instanceof MouseEvent && event.shiftKey)) {
          const grid = this.gridSnapSize();
          const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
          const worldX = (clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
          const worldY = (clientY - blueprintRect.top - this.panY()) / this.zoomLevel();
          node.x = Math.round((worldX - this.#dragOffset()!.x) / grid) * grid;
          node.y = Math.round((worldY - this.#dragOffset()!.y) / grid) * grid;
        } else {
          const dx = (clientX - this.#lastMouseX()) / this.zoomLevel();
          const dy = (clientY - this.#lastMouseY()) / this.zoomLevel();
          node.x += dx;
          node.y += dy;
        }
      }
      return [...nodes];
    });
    this.#lastMouseX.set(clientX);
    this.#lastMouseY.set(clientY);
  }
  startPortDrag(event: MouseEvent, nodeId: string, portId: string) {
    event.stopPropagation();
    if (this.draggingConnection()) this.cancelPortDrag();
    const node = this.nodes().find((n) => n.id === nodeId);
    if (node) {
      this.draggingConnection.set({ fromNode: nodeId, fromPort: portId, x2: node.x, y2: node.y });
    }
    this.updatePathOnMove(event);
  }
  endPortDrag(event: MouseEvent, toNodeId: string, toPortId: string) {
    if (!this.draggingConnection()) return;
    const from = this.draggingConnection()!;
    if (from.fromNode === toNodeId) {
      this.cancelPortDrag();
      return;
    }
    const newConnection: Connection = { ...from, toNode: toNodeId, toPort: toPortId };
    const isDuplicate = this.connections().some(
      (c) =>
        c.fromNode === newConnection.fromNode &&
        c.fromPort === newConnection.fromPort &&
        c.toNode === newConnection.toNode &&
        c.toPort === newConnection.toPort
    );
    if (!isDuplicate) {
      this.connections.update((conns) => [...conns, newConnection]);
    }
    this.cancelPortDrag();
  }
  cancelPortDrag() {
    this.draggingConnection.set(null);
  }
  updatePathOnMove(event: MouseEvent | Touch) {
    if (!this.draggingConnection()) return;
    const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
    const x2 = (event.clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
    const y2 = (event.clientY - blueprintRect.top - this.panY()) / this.zoomLevel();
    this.draggingConnection.update((conn) => (conn ? { ...conn, x2, y2 } : conn));
  }
  getNodePortPosition(nodeId: string, portId: string): Coordinates {
    const node = this.nodes().find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const portEl = this.#selfRef.nativeElement.querySelector(`[data-node-id="${nodeId}"][data-port-id="${portId}"]`);
    if (!portEl) return { x: node.x, y: node.y };
    const nodeWrapper = this.#selfRef.nativeElement.querySelector('.nodes-wrapper')!;
    const wrapperRect = nodeWrapper.getBoundingClientRect();
    const portRect = portEl.getBoundingClientRect();
    const portCenterX = portRect.left + portRect.width / 2;
    const portCenterY = portRect.top + portRect.height / 2;
    const worldX = (portCenterX - wrapperRect.left) / this.zoomLevel();
    const worldY = (portCenterY - wrapperRect.top) / this.zoomLevel();
    return { x: worldX, y: worldY };
  }
  startPan(event: MouseEvent) {
    if (event.target instanceof HTMLElement && event.target.closest('.node')) return;
    event.preventDefault();
    this.#isDragging.set(true);
    this.#lastMouseX.set(event.clientX);
    this.#lastMouseY.set(event.clientY);
  }
  endPan() {
    this.#isDragging.set(false);
  }
  pan(event: MouseEvent) {
    if (!this.#isDragging()) return;
    const dx = event.clientX - this.#lastMouseX();
    const dy = event.clientY - this.#lastMouseY();
    this.panX.update((x) => x + dx);
    this.panY.update((y) => y + dy);
    this.#lastMouseX.set(event.clientX);
    this.#lastMouseY.set(event.clientY);
  }
  zoom(event: WheelEvent) {
    event.preventDefault();
    const oldZoom = this.zoomLevel();
    const newZoom = this.#clamp(oldZoom * (1 - event.deltaY * this.#ZOOM_SPEED), this.#MIN_ZOOM, this.#MAX_ZOOM);
    const panRatio = newZoom / oldZoom;
    const newPanX = event.clientX - (event.clientX - this.panX()) * panRatio;
    const newPanY = event.clientY - (event.clientY - this.panY()) * panRatio;
    this.zoomLevel.set(newZoom);
    this.panX.set(newPanX);
    this.panY.set(newPanY);
  }
  handleTouchStart(event: TouchEvent) {
    if (event.target instanceof HTMLElement && event.target.closest('.node')) return;
    event.preventDefault();
    if (event.touches.length === 1) {
      this.#isDragging.set(true);
      this.#lastMouseX.set(event.touches[0].clientX);
      this.#lastMouseY.set(event.touches[0].clientY);
    } else if (event.touches.length === 2) {
      this.#isDragging.set(false);
      this.#initialPinchDistance.set(this.#getDistance(event.touches[0], event.touches[1]));
    }
  }
  handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && this.#isDragging()) {
      const dx = event.touches[0].clientX - this.#lastMouseX();
      const dy = event.touches[0].clientY - this.#lastMouseY();
      this.panX.update((x) => x + dx);
      this.panY.update((y) => y + dy);
      this.#lastMouseX.set(event.touches[0].clientX);
      this.#lastMouseY.set(event.touches[0].clientY);
    } else if (event.touches.length === 2) {
      const newPinchDistance = this.#getDistance(event.touches[0], event.touches[1]);
      const pinchRatio = newPinchDistance / this.#initialPinchDistance();
      const oldZoom = this.zoomLevel();
      const newZoom = this.#clamp(oldZoom * pinchRatio, this.#MIN_ZOOM, this.#MAX_ZOOM);
      const pinchCenterX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const pinchCenterY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
      const panRatio = newZoom / oldZoom;
      const newPanX = pinchCenterX - (pinchCenterX - this.panX()) * panRatio;
      const newPanY = pinchCenterY - (pinchCenterY - this.panY()) * panRatio;
      this.zoomLevel.set(newZoom);
      this.panX.set(newPanX);
      this.panY.set(newPanY);
      this.#initialPinchDistance.set(newPinchDistance);
    }
  }
  handleTouchEnd() {
    this.#isDragging.set(false);
  }
  #getDistance(touch1: Touch, touch2: Touch) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  #clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }
}
