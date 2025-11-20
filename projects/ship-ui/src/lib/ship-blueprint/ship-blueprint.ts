import { isPlatformBrowser, JsonPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
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
import { ShipButton, ShipCard, ShipIcon } from '../../public-api';
import { classMutationSignal } from '../utilities/class-mutation-signal';
import { layoutNodes } from './autolayout';
import { findDuplicateNodeIDs, findDuplicatePortIDs } from './validatePorts';

// TODO - disallow infinite loops
// TODO - Autolayout should take port order into account
// TODO - drag and drop new nodes into the canvas (takes an input creatableNodes without coordinates) this are shown in a right side panel and can be dragged into the canvas

type Port = { id: string; name: string };

export type BlueprintNode = {
  id: string;
  name?: string;
  coordinates: Coordinates;
  inputs: Port[];
  outputs: Port[];
  connections: Connection[];
};

type Connection = { fromNode: string; fromPort: string; toNode: string; toPort: string };
type DragState = { fromNode: string; fromPort: string; x2: number; y2: number };

export type Coordinates = [x: number, y: number];

export const TEST_NODES: BlueprintNode[] = [
  {
    id: 'a1',
    name: 'hello a1',
    coordinates: [0, 0],
    inputs: [],
    outputs: [{ id: 'out-1', name: 'Start Output' }],
    connections: [{ fromNode: 'a1', fromPort: 'out-1', toNode: 'b1', toPort: 'in-1' }],
  },
  {
    id: 'b1',
    coordinates: [0, 0],
    inputs: [
      { id: 'in-1', name: 'Input A' },
      { id: 'in-1', name: 'Another Input A' },
    ],
    outputs: [{ id: 'out-1', name: 'Output B' }],
    connections: [
      { fromNode: 'b1', fromPort: 'out-1', toNode: 'c6', toPort: 'in-1' },
      { fromNode: 'a1', fromPort: 'out-1', toNode: 'b1', toPort: 'in-1' },
    ],
  },
  {
    id: 'c6',
    name: 'hello c6',
    coordinates: [0, 0],
    inputs: [{ id: 'in-1', name: 'Input C' }],
    outputs: [{ id: 'out-1', name: 'Output D' }],
    connections: [{ fromNode: 'b1', fromPort: 'out-1', toNode: 'c6', toPort: 'in-1' }],
  },
];

type ValidationErrors = {
  duplicateNodeIds: string[];
  duplicatePortIds: {
    nodeId: string;
    duplicatePortIds: string[];
  }[];
};

@Component({
  selector: 'sh-blueprint',
  imports: [ShipCard, ShipIcon, JsonPipe, ShipButton],
  template: `
    <div
      class="canvas-container"
      [class.locked]="isLocked()"
      [class.hovering-connection]="highlightedConnection()"
      (mousedown)="startPan($event)"
      (mousemove)="pan($event)"
      (wheel)="zoom($event)"
      (touchstart)="handleTouchStart($event)"
      (touchmove)="handleTouchMove($event)"
      (touchend)="handleTouchEnd()">
      <div class="action-panel">
        <button shButton (click)="applyAutolayout()" class="small">
          Autolayout
          <sh-icon>tree-structure</sh-icon>
        </button>

        <ng-content />
      </div>

      <canvas #blueprintCanvas></canvas>

      @if (validationErrors()) {
        <sh-card class="validation-errors type-c">
          Something went wrong you have
          <br />
          duplicate node IDs or port IDs
          <pre>{{ validationErrors() | json }}</pre>
        </sh-card>
      } @else {
        <div
          class="nodes-wrapper"
          [style.transform]="'translate(' + panX() + 'px, ' + panY() + 'px) scale(' + zoomLevel() + ')'"
          [style.transform-origin]="'0 0'">
          @for (node of visibleNodes(); track node.id) {
            <sh-card
              class="node type-c"
              [style.transform]="getDisplayCoordinates(node)"
              (mouseenter)="isHoveringNode.set(true)"
              (mouseleave)="isHoveringNode.set(false)">
              <header (mousedown)="startNodeDrag($event, node.id)" (touchstart)="startNodeDrag($event, node.id)">
                <span class="node-title">{{ node.name ? node.name : node.id }}</span>
                <sh-icon>list</sh-icon>
              </header>
              <div class="ports">
                <div class="inputs">
                  @for (inputPort of node.inputs; track inputPort.id) {
                    <div
                      class="port-wrap"
                      [attr.data-node-id]="node.id"
                      [attr.data-port-id]="inputPort.id"
                      (click)="endPortDrag($event, node.id, inputPort.id)">
                      <div class="port input-port"></div>
                      <span class="port-name">{{ inputPort.name }}</span>
                    </div>
                  }
                </div>
                <div class="outputs">
                  @for (outputPort of node.outputs; track outputPort.id) {
                    <div
                      class="port-wrap"
                      [attr.data-node-id]="node.id"
                      [attr.data-port-id]="outputPort.id"
                      (click)="startPortDrag($event, node.id, outputPort.id)">
                      <span class="port-name">{{ outputPort.name }}</span>
                      <div class="port output-port"></div>
                    </div>
                  }
                </div>
              </div>
            </sh-card>
          }

          @if (showMidpointDiv()) {
            <div
              class="midpoint-div"
              (click)="removeConnection()"
              [style.left.px]="midpointDivPosition()?.x"
              [style.top.px]="midpointDivPosition()?.y">
              Remove connection
              <sh-icon>trash</sh-icon>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipBlueprint implements AfterViewInit, OnDestroy {
  readonly #ZOOM_SPEED = 0.01;
  readonly #MAX_ZOOM = 1.5;
  readonly #MIN_ZOOM = 0.5;
  readonly #NODE_WIDTH = 180;
  readonly #NODE_HEADER_HEIGHT = 40;
  readonly #PORT_ROW_HEIGHT = 28;

  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);
  #selfRef = inject(ElementRef<HTMLElement>);
  #currentClass = classMutationSignal();
  #htmlClass = classMutationSignal(this.#document.documentElement);

  asDots = computed(() => this.#currentClass().includes('dots'));
  lightMode = computed(() => this.#htmlClass().includes('light'));

  forceUnique = input<boolean>(true);
  autoLayout = input<boolean>(false);
  gridSize = input(20);
  snapToGrid = input<boolean>(true);
  gridColor = input<[string, string]>(['#d8d8d8', '#2c2c2c']);

  nodes = model<BlueprintNode[]>([]);

  #currentGridColor = computed(() => this.gridColor()[this.lightMode() ? 0 : 1]);

  panX = signal(0);
  panY = signal(0);
  zoomLevel = signal(1);
  gridSnapSize = signal(20);

  isHoveringNode = signal(false);
  midpointDivPosition = signal<{ x: number; y: number } | null>(null);
  showMidpointDiv = signal(false);
  isLocked = signal(false);
  draggingConnection = signal<DragState | null>(null);
  validationErrors = signal<ValidationErrors | null>(null);
  highlightedConnection = signal<Connection | null>(null);

  #draggingNodeCoordinates = signal<Coordinates | null>(null);
  #isDragging = signal(false);
  #lastMouseX = signal(0);
  #lastMouseY = signal(0);
  #initialPinchDistance = signal(0);
  #isNodeDragging = signal(false);
  #draggedNodeId = signal<string | null>(null);
  #dragOffset = signal<Coordinates | null>(null);
  #connections = signal<Connection[]>([]);
  #canvasWidth = signal(0);
  #canvasHeight = signal(0);

  @ViewChild('blueprintCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  #ctx!: CanvasRenderingContext2D;
  #resizeObserver!: ResizeObserver;

  visibleNodes = computed(() => {
    const nodes = this.nodes();
    const panX = this.panX();
    const panY = this.panY();
    const zoom = this.zoomLevel();
    const width = this.#canvasWidth();
    const height = this.#canvasHeight();

    if (width === 0 || height === 0) {
      return nodes;
    }

    const bufferX = width / zoom;
    const bufferY = height / zoom;

    const viewbox = {
      x1: -panX / zoom - bufferX,
      y1: -panY / zoom - bufferY,
      x2: (-panX + width) / zoom + bufferX,
      y2: (-panY + height) / zoom + bufferY,
    };

    return nodes.filter((node) => {
      const [x, y] = node.coordinates;
      return x > viewbox.x1 && x < viewbox.x2 && y > viewbox.y1 && y < viewbox.y2;
    });
  });

  constructor() {
    if (isPlatformBrowser(this.#platformId)) {
      effect(() => {
        this.asDots();
        this.panX();
        this.panY();
        this.zoomLevel();
        this.nodes();
        this.#connections();
        this.draggingConnection();
        this.#currentGridColor();
        this.highlightedConnection();
        this.#draggingNodeCoordinates();

        requestAnimationFrame(() => this.drawCanvas());
      });

      effect(() => {
        const nodes = this.nodes();
        const connectionsFromNodes = nodes.flatMap((node) => node.connections);
        const uniqueConnections = connectionsFromNodes.filter(
          (conn, index, self) =>
            index ===
            self.findIndex(
              (c) =>
                c.fromNode === conn.fromNode &&
                c.fromPort === conn.fromPort &&
                c.toNode === conn.toNode &&
                c.toPort === conn.toPort
            )
        );

        this.#connections.set(uniqueConnections);
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

      if (this.autoLayout()) {
        this.applyAutolayout();
      }

      if (this.forceUnique()) {
        this.#removeDuplicatesAndReinitiate();
      } else {
        this.#validateNodes();
      }
    }
  }

  ngOnDestroy() {
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
    }
  }

  @HostListener('document:mouseup', ['$event']) onMouseUp(event: MouseEvent) {
    if (this.isLocked()) return;

    this.endPan();
    this.endNodeDrag();
  }

  @HostListener('document:click', ['$event']) onClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    if (this.draggingConnection()) {
      if (!target.closest('.port')) {
        this.cancelPortDrag();
      }
    } else if (this.isLocked() && !target.closest('.midpoint-div')) {
      this.closeMidpointDiv();
    } else {
      this.#handleConnectionClick(event);
    }
  }

  @HostListener('document:keydown.escape', []) onEscape() {
    if (this.draggingConnection()) {
      this.cancelPortDrag();
    } else if (this.isLocked()) {
      this.closeMidpointDiv();
    }
  }

  @HostListener('document:mousemove', ['$event']) onMouseMove(event: MouseEvent) {
    if (this.isLocked()) return;
    if (this.#isNodeDragging()) {
      this.nodeDrag(event);
    } else if (this.draggingConnection()) {
      this.updatePathOnMove(event);
    } else {
      this.pan(event);
      if (this.isHoveringNode()) {
        this.highlightedConnection.set(null);
      } else {
        this.#checkConnectionHover(event);
      }
    }
  }

  @HostListener('document:touchmove', ['$event']) onTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (this.isLocked()) return;
    if (this.#isNodeDragging()) {
      this.nodeDrag(event.touches[0]);
    } else if (this.draggingConnection()) {
      this.updatePathOnMove(event.touches[0]);
    } else {
      this.handleTouchMove(event);
    }
  }

  @HostListener('document:touchend', ['$event']) onDocumentTouchEnd(event: TouchEvent) {
    if (this.isLocked()) return;

    this.handleTouchEnd();
  }

  applyAutolayout() {
    const newNodes = layoutNodes(this.nodes());
    this.nodes.set(newNodes);
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

    this.#canvasWidth.set(rect.width);
    this.#canvasHeight.set(rect.height);

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

  drawGrid(ctx: CanvasRenderingContext2D) {
    const { width, height } = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const zoom = this.zoomLevel();
    const panX = this.panX();
    const panY = this.panY();
    const gridSize = this.gridSize();
    const gridColor = this.#currentGridColor();
    const scaledGridSize = gridSize * zoom;
    const dynamicGridSize = scaledGridSize < 20 ? gridSize * 4 : gridSize;
    const startX = Math.floor(-panX / zoom / dynamicGridSize) * dynamicGridSize;
    const startY = Math.floor(-panY / zoom / dynamicGridSize) * dynamicGridSize;
    const endX = startX + width / dpr / zoom + dynamicGridSize;
    const endY = startY + height / dpr / zoom + dynamicGridSize;

    if (this.asDots()) {
      const dotRadius = 1 / zoom;
      ctx.fillStyle = gridColor;
      for (let x = startX; x < endX; x += dynamicGridSize) {
        for (let y = startY; y < endY; y += dynamicGridSize) {
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    } else {
      ctx.beginPath();
      ctx.strokeStyle = gridColor;
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
    const highlighted = this.highlightedConnection();
    ctx.lineWidth = 2 / this.zoomLevel();

    for (const conn of this.#connections()) {
      const isHighlighted =
        highlighted?.fromNode === conn.fromNode &&
        highlighted?.fromPort === conn.fromPort &&
        highlighted?.toNode === conn.toNode &&
        highlighted?.toPort === conn.toPort;

      ctx.strokeStyle = isHighlighted ? '#ffc107' : '#888';
      ctx.beginPath();

      const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
      const endPos = this.getNodePortPosition(conn.toNode, conn.toPort);

      this.drawCurvedPath(ctx, startPos, endPos);
      ctx.stroke();
    }
  }

  drawDraggingPath(ctx: CanvasRenderingContext2D) {
    const conn = this.draggingConnection()!;
    const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
    const endPos = [conn.x2, conn.y2] as Coordinates;
    ctx.strokeStyle = '#5a9cf8';
    ctx.lineWidth = 2 / this.zoomLevel();
    ctx.beginPath();
    this.drawCurvedPath(ctx, startPos, endPos);
    ctx.stroke();
  }

  drawCurvedPath(ctx: CanvasRenderingContext2D, start: Coordinates, end: Coordinates) {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const dx = Math.abs(x1 - x2) * 0.7;
    ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1 + dx, y1, x2 - dx, y2, x2, y2);
  }

  startNodeDrag(event: MouseEvent | TouchEvent, nodeId: string) {
    event.stopPropagation();
    event.preventDefault();

    this.#isNodeDragging.set(true);
    this.#draggedNodeId.set(nodeId);

    const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
    const worldX = (clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
    const worldY = (clientY - blueprintRect.top - this.panY()) / this.zoomLevel();
    const draggedNode = this.nodes().find((n) => n.id === nodeId);

    if (draggedNode) {
      this.#dragOffset.set([worldX - draggedNode.coordinates[0], worldY - draggedNode.coordinates[1]]);
    }

    this.#lastMouseX.set(clientX);
    this.#lastMouseY.set(clientY);
  }

  endNodeDrag() {
    const draggedId = this.#draggedNodeId();
    const finalCoords = this.#draggingNodeCoordinates();

    if (draggedId && finalCoords) {
      this.nodes.update((nodes) => {
        const node = nodes.find((n) => n.id === draggedId);
        if (node) {
          node.coordinates = finalCoords;
        }
        return [...nodes];
      });
    }

    this.#isNodeDragging.set(false);
    this.#draggedNodeId.set(null);
    this.#dragOffset.set(null);
    this.#draggingNodeCoordinates.set(null);
  }

  nodeDrag(event: MouseEvent | Touch) {
    const draggedId = this.#draggedNodeId();
    if (!this.#isNodeDragging() || !draggedId) return;

    const { clientX, clientY } = event;
    const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
    const worldX = (clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
    const worldY = (clientY - blueprintRect.top - this.panY()) / this.zoomLevel();

    let newX = worldX - this.#dragOffset()![0];
    let newY = worldY - this.#dragOffset()![1];

    if (this.snapToGrid() || (event instanceof MouseEvent && event.shiftKey)) {
      const grid = this.gridSnapSize();
      newX = Math.round(newX / grid) * grid;
      newY = Math.round(newY / grid) * grid;
    }

    this.#draggingNodeCoordinates.set([newX, newY]);
    this.#lastMouseX.set(clientX);
    this.#lastMouseY.set(clientY);
  }

  startPortDrag(event: MouseEvent, nodeId: string, portId: string) {
    event.preventDefault();
    event.stopPropagation();

    if (this.draggingConnection()) this.cancelPortDrag();

    const node = this.nodes().find((n) => n.id === nodeId);

    if (node) {
      this.draggingConnection.set({
        fromNode: nodeId,
        fromPort: portId,
        x2: node.coordinates[0],
        y2: node.coordinates[1],
      });
    }

    this.updatePathOnMove(event);
  }

  endPortDrag(_: MouseEvent, toNodeId: string, toPortId: string) {
    if (!this.draggingConnection()) return;

    const from = this.draggingConnection()!;

    if (from.fromNode === toNodeId) {
      this.cancelPortDrag();
      return;
    }

    const newConnection: Connection = {
      fromNode: from.fromNode,
      fromPort: from.fromPort,
      toNode: toNodeId,
      toPort: toPortId,
    };

    this.nodes.update((nodes) => {
      const fromNode = nodes.find((n) => n.id === newConnection.fromNode);
      const toNode = nodes.find((n) => n.id === newConnection.toNode);

      if (fromNode && toNode) {
        const isDuplicateFrom = fromNode.connections.some(
          (c) =>
            c.fromNode === newConnection.fromNode &&
            c.fromPort === newConnection.fromPort &&
            c.toNode === newConnection.toNode &&
            c.toPort === newConnection.toPort
        );

        if (!isDuplicateFrom) {
          fromNode.connections = [...fromNode.connections, newConnection];
        }

        const isDuplicateTo = toNode.connections.some(
          (c) =>
            c.fromNode === newConnection.fromNode &&
            c.fromPort === newConnection.fromPort &&
            c.toNode === newConnection.toNode &&
            c.toPort === newConnection.toPort
        );

        if (!isDuplicateTo) {
          toNode.connections = [...toNode.connections, newConnection];
        }
      }
      return [...nodes];
    });

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

    if (!node) return [0, 0];

    const portEl = this.#selfRef.nativeElement.querySelector(`[data-node-id="${nodeId}"][data-port-id="${portId}"]`);

    if (portEl) {
      const nodeWrapper = this.#selfRef.nativeElement.querySelector('.nodes-wrapper')!;
      const wrapperRect = nodeWrapper.getBoundingClientRect();
      const portRect = portEl.getBoundingClientRect();
      const portCenterX = portRect.left + portRect.width / 2;
      const portCenterY = portRect.top + portRect.height / 2;
      const worldX = (portCenterX - wrapperRect.left) / this.zoomLevel();
      const worldY = (portCenterY - wrapperRect.top) / this.zoomLevel();

      return [worldX, worldY];
    }

    const isInput = node.inputs.some((p) => p.id === portId);
    const portIndex = isInput
      ? node.inputs.findIndex((p) => p.id === portId)
      : node.outputs.findIndex((p) => p.id === portId);

    if (portIndex === -1) return node.coordinates;

    const portYOffset = this.#NODE_HEADER_HEIGHT + portIndex * this.#PORT_ROW_HEIGHT + this.#PORT_ROW_HEIGHT / 2;
    const portXOffset = isInput ? 0 : this.#NODE_WIDTH;

    return [node.coordinates[0] + portXOffset, node.coordinates[1] + portYOffset];
  }

  startPan(event: MouseEvent) {
    if (this.isLocked()) return;
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
    if (!this.#isDragging() || this.isLocked()) return;

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
    event.preventDefault();

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
    this.endNodeDrag();

    if (this.draggingConnection()) {
      this.cancelPortDrag();
    }
  }

  closeMidpointDiv() {
    this.showMidpointDiv.set(false);
    this.midpointDivPosition.set(null);
    this.isLocked.set(false);
  }

  getDisplayCoordinates(node: BlueprintNode) {
    const draggedId = this.#draggedNodeId();
    const draggingCoords = this.#draggingNodeCoordinates();

    if (draggedId === node.id && draggingCoords) {
      return `translate(${draggingCoords[0]}px, ${draggingCoords[1]}px)`;
    }

    return `translate(${node.coordinates[0]}px, ${node.coordinates[1]}px)`;
  }

  removeConnection() {
    const conn = this.highlightedConnection();

    if (!conn) return;

    this.#connections.update((conns) =>
      conns.filter(
        (c) =>
          !(
            c.fromNode === conn.fromNode &&
            c.fromPort === conn.fromPort &&
            c.toNode === conn.toNode &&
            c.toPort === conn.toPort
          )
      )
    );

    this.nodes.update((nodes) =>
      nodes.map((n) => ({
        ...n,
        connections: n.connections.filter(
          (c) =>
            !(
              c.fromNode === conn.fromNode &&
              c.fromPort === conn.fromPort &&
              c.toNode === conn.toNode &&
              c.toPort === conn.toPort
            )
        ),
      }))
    );
    this.highlightedConnection.set(null);
    this.closeMidpointDiv();
  }

  #removeDuplicatesAndReinitiate() {
    const nodes = this.nodes();
    const uniqueNodesMap = new Map<string, BlueprintNode>();
    const uniqueNodes: BlueprintNode[] = [];

    for (const node of nodes) {
      if (!uniqueNodesMap.has(node.id)) {
        uniqueNodesMap.set(node.id, node);
        uniqueNodes.push(node);
      }
    }

    const nodesWithUniquePorts = uniqueNodes.map((node) => {
      const uniqueInputs = new Map<string, Port>();
      const uniqueOutputs = new Map<string, Port>();

      const uniqueNodeInputs = node.inputs.filter((port) => {
        if (!uniqueInputs.has(port.id)) {
          uniqueInputs.set(port.id, port);
          return true;
        }
        return false;
      });

      const uniqueNodeOutputs = node.outputs.filter((port) => {
        if (!uniqueOutputs.has(port.id)) {
          uniqueOutputs.set(port.id, port);
          return true;
        }
        return false;
      });

      return {
        ...node,
        inputs: uniqueNodeInputs,
        outputs: uniqueNodeOutputs,
      };
    });

    const finalNodes = nodesWithUniquePorts.map((node) => {
      const validConnections = node.connections.filter((conn) => {
        const fromNodeExists = nodesWithUniquePorts.some((n) => n.id === conn.fromNode);
        const toNodeExists = nodesWithUniquePorts.some((n) => n.id === conn.toNode);
        const fromPortExists = nodesWithUniquePorts
          .find((n) => n.id === conn.fromNode)
          ?.outputs.some((p) => p.id === conn.fromPort);
        const toPortExists = nodesWithUniquePorts
          .find((n) => n.id === conn.toNode)
          ?.inputs.some((p) => p.id === conn.toPort);

        return fromNodeExists && toNodeExists && fromPortExists && toPortExists;
      });
      return { ...node, connections: validConnections };
    });

    this.nodes.set(finalNodes);
  }

  #handleConnectionClick(event: MouseEvent) {
    if (this.highlightedConnection()) {
      const conn = this.highlightedConnection()!;
      const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
      const endPos = this.getNodePortPosition(conn.toNode, conn.toPort);
      const midpoint = this.#getBezierMidpoint(startPos, endPos);

      this.midpointDivPosition.set({ x: midpoint[0], y: midpoint[1] });
      this.showMidpointDiv.set(true);
      this.isLocked.set(true);
    }
  }

  #getBezierMidpoint(start: Coordinates, end: Coordinates): Coordinates {
    const t = 0.5;
    const [x1, y1] = start;
    const [x2, y2] = end;
    const dx = Math.abs(x1 - x2) * 0.7;
    const cp1x = x1 + dx;
    const cp1y = y1;
    const cp2x = x2 - dx;
    const cp2y = y2;

    const mx =
      Math.pow(1 - t, 3) * x1 +
      3 * Math.pow(1 - t, 2) * t * cp1x +
      3 * (1 - t) * Math.pow(t, 2) * cp2x +
      Math.pow(t, 3) * x2;

    const my =
      Math.pow(1 - t, 3) * y1 +
      3 * Math.pow(1 - t, 2) * t * cp1y +
      3 * (1 - t) * Math.pow(t, 2) * cp2y +
      Math.pow(t, 3) * y2;

    return [mx, my];
  }

  #checkConnectionHover(event: MouseEvent) {
    const blueprintRect = this.#selfRef.nativeElement.getBoundingClientRect();
    const worldX = (event.clientX - blueprintRect.left - this.panX()) / this.zoomLevel();
    const worldY = (event.clientY - blueprintRect.top - this.panY()) / this.zoomLevel();
    const cursorPoint: Coordinates = [worldX, worldY];

    let hoveredConn: Connection | null = null;
    const tolerance = 10 / this.zoomLevel();

    for (const conn of this.#connections()) {
      const startPos = this.getNodePortPosition(conn.fromNode, conn.fromPort);
      const endPos = this.getNodePortPosition(conn.toNode, conn.toPort);

      if (this.#isPointNearBezierCurve(cursorPoint, startPos, endPos, tolerance)) {
        hoveredConn = conn;
        break;
      }
    }

    this.highlightedConnection.set(hoveredConn);
  }

  #isPointNearBezierCurve(point: Coordinates, start: Coordinates, end: Coordinates, tolerance: number = 10): boolean {
    const [x1, y1] = start;
    const [x2, y2] = end;
    const dx = Math.abs(x1 - x2) * 0.7;
    const cp1x = x1 + dx;
    const cp1y = y1;
    const cp2x = x2 - dx;
    const cp2y = y2;

    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;

      const x =
        Math.pow(1 - t, 3) * x1 +
        3 * Math.pow(1 - t, 2) * t * cp1x +
        3 * (1 - t) * Math.pow(t, 2) * cp2x +
        Math.pow(t, 3) * x2;
      const y =
        Math.pow(1 - t, 3) * y1 +
        3 * Math.pow(1 - t, 2) * t * cp1y +
        3 * (1 - t) * Math.pow(t, 2) * cp2y +
        Math.pow(t, 3) * y2;

      const distance = Math.sqrt(Math.pow(point[0] - x, 2) + Math.pow(point[1] - y, 2));
      if (distance < tolerance) {
        return true;
      }
    }

    return false;
  }

  public getNewNodeCoordinates(panToCoordinates = false): Coordinates {
    let lowestY = 0;
    if (this.nodes().length > 0) {
      lowestY = this.nodes().reduce((max, node) => Math.max(max, node.coordinates[1]), 0);
    }

    const newCoordinates: Coordinates = [20, lowestY + 200];

    if (panToCoordinates) {
      this.#panToCoordinates(newCoordinates);
    }

    return newCoordinates;
  }

  #validateNodes() {
    const duplicatePortIds = findDuplicatePortIDs(this.nodes());
    const duplicateNodeIds = findDuplicateNodeIDs(this.nodes());

    this.validationErrors.set({
      duplicateNodeIds,
      duplicatePortIds,
    });
  }

  #panToCoordinates(coords: Coordinates): void {
    const [x, y] = coords;
    const rect = this.#selfRef.nativeElement.getBoundingClientRect();

    this.panX.set(rect.width / 2 - x * this.zoomLevel());
    this.panY.set(rect.height / 2 - y * this.zoomLevel());
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
