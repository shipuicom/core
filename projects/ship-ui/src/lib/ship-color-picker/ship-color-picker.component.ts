import {
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
  output,
  signal,
  viewChild,
} from '@angular/core';

type R = number;
type G = number;
type B = number;
type A = number;

// TODOS
// - Add a color picker input
// - Add alpha support

@Component({
  selector: 'sh-color-picker',
  imports: [],
  template: `
    <canvas #colorCanvas></canvas>
    <div
      class="marker"
      [style.left]="markerPosition().x"
      [style.top]="markerPosition().y"
      [style.background]="selectedColorRgb()"></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'renderingType()',
    '[class.vertical]': '(renderingType() === "hue" || renderingType() === "saturation") && direction() === "vertical"',
  },
})
export class ShipColorPickerComponent {
  #document = inject(DOCUMENT);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('colorCanvas');
  private canvasData = signal<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    centerX: number;
    centerY: number;
    radius: number;
  } | null>(null);

  showDarkColors = input(false);
  renderingType = input<'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation'>('hsl');
  gridSize = input(20);
  hue = input(0);
  direction = input<'horizontal' | 'vertical'>('horizontal');
  selectedColor = model<[R, G, B]>([255, 255, 255]);
  currentColor = output<{ rgb: string; hex: string; hsl: string; hue: number; saturation: number }>();

  centerLightness = computed(() => (this.showDarkColors() ? 200 : 100));
  isDragging = signal(false);
  markerPosition = signal({ x: '50%', y: '50%' });
  _pos = { x: '0', y: '0' };
  _markerPosition = effect(() => (this._pos = this.markerPosition()));

  selectedColorRgb = computed(() => `rgb(${this.selectedColor().join(',')})`);
  selectedColorHex = computed(() => this.rgbToHex(...this.selectedColor()));
  selectedColorHsl = computed(() => this.rgbToHsl(...this.selectedColor()));

  selectedColorEffect = effect(() => {
    const selectedColor = this.selectedColor();
    const hsl = this.rgbToHsl(...selectedColor);
    const hex = this.rgbToHex(...selectedColor);

    this.updateMarkerFromColor(selectedColor);

    this.currentColor.emit({
      rgb: `rgb(${selectedColor.join(',')})`,
      hex: hex,
      hsl: hsl,
      hue: hsl.match(/\d+/g)!.map(Number)[0],
      saturation: hsl.match(/\d+/g)!.map(Number)[1],
    });
  });

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.setCanvasSize();
  }

  private renderingTypeEffect = effect(() => {
    const currentRenderingType = this.renderingType();

    if (this.canvasData()) {
      this.drawColorPicker();

      if (currentRenderingType === 'hsl') {
        this.adjustMarkerPosition();

        queueMicrotask(() => this.updateMarkerFromColor(this.selectedColor()));
      } else {
        this.updateMarkerFromColor(this.selectedColor());
      }
    }
  });

  initColor: [R, G, B] | null = null;
  ngAfterViewInit() {
    this.initColor = this.selectedColor();

    this.setCanvasSize();
    this.initCanvasEvents();
  }

  private updateMarkerFromColor(rgb: [R, G, B]) {
    const [r, g, b] = rgb;
    const coords = this.findPositionByColor(r, g, b);

    if (coords === null) return;

    const { x, y } = coords;

    const mockEvent = {
      offsetX: x,
      offsetY: y,
      clientX: x,
      clientY: y,
      touches: [{ clientX: x, clientY: y }],
    };

    this.updateColorAndMarker(mockEvent as any, false, true);
  }

  private findPositionByColor(r: number, g: number, b: number): { x: number; y: number } | null {
    const canvasData = this.canvasData();
    if (!canvasData || !canvasData.canvas) return null;

    const { canvas, ctx } = canvasData;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    let bestMatch = { x: 0, y: 0, distance: Infinity };

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const pixelR = imageData[index];
        const pixelG = imageData[index + 1];
        const pixelB = imageData[index + 2];

        const distance = Math.sqrt(Math.pow(r - pixelR, 2) + Math.pow(g - pixelG, 2) + Math.pow(b - pixelB, 2));

        if (distance < bestMatch.distance) {
          bestMatch = { x, y, distance };
        }
      }
    }

    return { x: bestMatch.x, y: bestMatch.y };
  }

  private adjustMarkerPosition() {
    const { canvas, centerX, centerY, radius } = this.canvasData()!;
    let { x, y } = this._pos;

    let markerX = (parseFloat(x.replace('%', '')) / 100) * canvas.width;
    let markerY = (parseFloat(y.replace('%', '')) / 100) * canvas.height;

    const distance = Math.sqrt(Math.pow(markerX - centerX, 2) + Math.pow(markerY - centerY, 2));

    if (distance > radius) {
      const angle = Math.atan2(markerY - centerY, markerX - centerX);
      markerX = centerX + radius * Math.cos(angle);
      markerY = centerY + radius * Math.sin(angle);

      x = ((markerX / canvas.width) * 100).toFixed(2) + '%';
      y = ((markerY / canvas.height) * 100).toFixed(2) + '%';
      this.markerPosition.set({ x, y });
    }
  }

  private initCanvasEvents() {
    const { canvas } = this.canvasData()!;

    canvas.addEventListener('mousedown', (event) => {
      this.isDragging.set(true);
      this.updateColorAndMarker(event);
    });

    this.#document.addEventListener('mousemove', (event) => {
      if (this.isDragging()) {
        event.preventDefault();
        this.updateColorAndMarker(event, true);
      }
    });

    this.#document.addEventListener('mouseup', () => this.isDragging.set(false));

    canvas.addEventListener('touchstart', (_) => this.isDragging.set(true));
    this.#document.addEventListener('touchmove', (event) => {
      if (this.isDragging()) {
        event.preventDefault();
        this.updateColorAndMarker(event.touches[0], true);
      }
    });

    this.#document.addEventListener('touchend', () => this.isDragging.set(false));
    this.#document.addEventListener('touchcancel', () => this.isDragging.set(false));
  }

  private setCanvasSize() {
    const canvas = this.canvasRef()?.nativeElement;

    if (canvas) {
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      }) as CanvasRenderingContext2D;
      const parentWidth = canvas.parentElement?.offsetWidth || canvas.offsetWidth;
      canvas.width = parentWidth;
      canvas.height = parentWidth;

      this.canvasData.set({
        canvas,
        ctx,
        centerX: canvas.width / 2,
        centerY: canvas.height / 2,
        radius: Math.min(canvas.width, canvas.height) / 2,
      });

      this.drawColorPicker();
    }
  }

  private updateColorAndMarker(event: MouseEvent | Touch, outsideCanvas = false, onlyMarker = false) {
    const { canvas, ctx } = this.canvasData()!;

    let mouseX = event instanceof MouseEvent ? event.offsetX : event.clientX;
    let mouseY = event instanceof MouseEvent ? event.offsetY : event.clientY;

    if (outsideCanvas) {
      const rect = canvas.getBoundingClientRect();
      mouseX = Math.round(event.clientX - rect.left);
      mouseY = Math.round(event.clientY - rect.top);
    }

    if (this.renderingType() === 'hsl') {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2;

      const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

      if (distance > radius) {
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        mouseX = centerX + radius * Math.cos(angle);
        mouseY = centerY + radius * Math.sin(angle);
      }
    }

    mouseX = Math.max(0, Math.min(canvas.width - 1, Math.round(mouseX)));
    mouseY = Math.max(0, Math.min(canvas.height - 1, Math.round(mouseY)));

    const pixelData = ctx.getImageData(mouseX, mouseY, 1, 1).data;
    const [r, g, b] = pixelData;

    if (!onlyMarker) {
      this.selectedColor.set([r, g, b]);
    }

    const xPercent = ((mouseX / canvas.width) * 100).toFixed(2) + '%';
    const yPercent = ((mouseY / canvas.height) * 100).toFixed(2) + '%';

    this.markerPosition.set({ x: xPercent, y: yPercent });
  }

  private drawColorPicker() {
    switch (this.renderingType()) {
      case 'hsl':
        this.drawColorWheel();
        break;
      case 'grid':
        this.drawGrid();
        break;
      case 'hue':
        this.drawHue();
        break;
      case 'rgb':
        this.drawRgb();
        break;
      case 'saturation':
        this.drawSaturation();
        break;
    }
  }

  private drawRgb() {
    const { canvas, ctx } = this.canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient2 = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient2.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient2.addColorStop(1, 'black');

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawSaturation() {
    const { canvas, ctx } = this.canvasData()!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (this.direction() === 'horizontal') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, `hsl(${this.hue()}, 0%, 50%)`);
      gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, `hsl(${this.hue()}, 0%, 50%)`);
      gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  private drawHue() {
    const { canvas, ctx } = this.canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.direction() === 'horizontal' ? canvas.width : 0,
      this.direction() === 'horizontal' ? 0 : canvas.height
    );

    for (let i = 0; i <= 360; i += 10) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawColorWheel() {
    const { canvas, ctx, centerX, centerY, radius } = this.canvasData()!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));

        if (distance <= radius + 2) {
          const angle = Math.atan2(y - centerY, x - centerX);
          const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
          ctx.fillStyle = `hsl(${hue}, 100%, ${100 - (this.centerLightness() / 100) * (distance / radius) * 50}%)`;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }

  private drawGrid() {
    const { canvas, ctx } = this.canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gridSize = this.gridSize();
    const cellSize = canvas.width / gridSize;
    const inputHue = this.hue();
    const reversedHue = (inputHue + 180) % 360;
    const maxDistance = Math.sqrt(2) * (gridSize - 1);

    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);
        const distanceTopLeft = Math.sqrt(cellX * cellX + cellY * cellY);
        const l = Math.floor((distanceTopLeft / maxDistance) * 100);
        const h = cellX >= cellY ? inputHue : reversedHue;
        const distanceFromCenter = Math.abs(cellX - cellY) / (gridSize - 1);
        const s = Math.floor(distanceFromCenter * 100);

        ctx.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  private rgbToHsl(r: number, g: number, b: number): string {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return `hsl(${Math.floor(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }
}
