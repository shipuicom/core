import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';

type R = number;
type G = number;
type B = number;

type CanvasData = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  centerX: number;
  centerY: number;
  radius: number;
};

@Component({
  selector: 'spk-color-picker',
  imports: [],
  templateUrl: './sparkle-color-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'renderingType()',
    '[class.vertical]': '(renderingType() === "hue" || renderingType() === "saturation") && direction() === "vertical"',
  },
})
export class SparkleColorPickerComponent {
  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('colorCanvas');
  private canvasData = signal<CanvasData | null>(null);

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

  selectedColorRgb = computed(() => `rgb(${this.selectedColor().join(',')})`);
  selectedColorHex = computed(() => this.rgbToHex(...this.selectedColor()));
  selectedColorHsl = computed(() => this.rgbToHsl(...this.selectedColor()));

  selectedColorEffect = effect(() => {
    const selectedColor = this.selectedColor();
    const hsl = this.rgbToHsl(...selectedColor);

    this.currentColor.emit({
      rgb: `rgb(${selectedColor.join(',')})`,
      hex: this.rgbToHex(...selectedColor),
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
    this.renderingType();

    if (this.canvasData()) {
      this.drawColorPicker();
      this.updateColorAndMarker();
    }
  });

  ngAfterViewInit() {
    this.setCanvasSize();
    this.initCanvasEvents();
  }

  private initCanvasEvents() {
    const { canvas } = this.canvasData()!;

    canvas.addEventListener('mousedown', (event) => {
      this.isDragging.set(true);
      this.updateColorAndMarker(event);
    });

    document.addEventListener('mousemove', (event) => {
      this.isDragging() && this.updateColorAndMarker(event, true);
    });

    document.addEventListener('mouseup', () => this.isDragging.set(false));
  }

  private setCanvasSize() {
    const canvas = this.canvasRef()?.nativeElement;

    if (canvas) {
      const ctx = canvas.getContext('2d', {
        willReadFrequently: true,
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

  lastEvent: MouseEvent | null = null;

  private updateColorAndMarker(event?: MouseEvent, outsideCanvas = false) {
    const { canvas, ctx } = this.canvasData()!;

    const _event = event ?? this.lastEvent;

    if (!_event) return;

    this.lastEvent = _event;

    let mouseX = _event.offsetX;
    let mouseY = _event.offsetY;

    if (outsideCanvas) {
      const rect = canvas.getBoundingClientRect();
      mouseX = Math.round(_event.clientX - rect.left);
      mouseY = Math.round(_event.clientY - rect.top);
    }

    if (this.renderingType() === 'hsl') {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 2;

      // Calculate distance and angle from center
      const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

      // If outside the circle with a 1px margin, get the closest pixel on the circumference
      if (distance > radius - 2) {
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
        mouseX = centerX + (radius - 2) * Math.cos(angle);
        mouseY = centerY + (radius - 2) * Math.sin(angle);
      }
    }

    // Clamp mouse position to canvas bounds
    mouseX = Math.max(0, Math.min(canvas.width - 1, Math.round(mouseX))); // Clamp to width - 1 for pixel index
    mouseY = Math.max(0, Math.min(canvas.height - 1, Math.round(mouseY))); // Clamp to height - 1 for pixel index

    // Get the color data of the pixel at the mouse position
    const pixelData = ctx.getImageData(mouseX, mouseY, 1, 1).data;
    const [r, g, b] = pixelData;

    this.selectedColor.set([r, g, b]);

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

    if (this.direction() === 'horizontal') {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      for (let i = 0; i <= 360; i++) {
        gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      for (let i = 0; i <= 360; i++) {
        gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the entire canvas
    }
  }

  private drawColorWheel() {
    const { canvas, ctx, centerX, centerY, radius } = this.canvasData()!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance <= radius) {
          const angle = Math.atan2(y - centerY, x - centerX);
          const hue = ((angle + Math.PI) / (2 * Math.PI)) * 360;
          const saturation = 100;
          const lightness = 100 - (this.centerLightness() / 100) * (distance / radius) * 50;
          const rgb = this.hslToRgb(hue, saturation, lightness);
          const i = (y * canvas.width + x) * 4;
          data[i] = rgb[0];
          data[i + 1] = rgb[1];
          data[i + 2] = rgb[2];
          data[i + 3] = 255;
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  private drawGrid() {
    const { canvas, ctx } = this.canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gridSize = this.gridSize();
    const cellSize = canvas.width / gridSize;

    for (let y = 0; y < canvas.height; y += cellSize) {
      for (let x = 0; x < canvas.width; x += cellSize) {
        const cellX = Math.floor(x / cellSize);
        const cellY = Math.floor(y / cellSize);

        const r = Math.floor((cellY / (gridSize - 1)) * 255);
        const g = Math.floor((cellX / (gridSize - 1)) * 255);
        const b = Math.floor(((cellX + cellY) / (2 * (gridSize - 1))) * 255);

        let [h, s, l] = this.rgbToHsl(r, g, b).match(/\d+/g)!.map(Number);

        h = h + this.hue();

        const newRgb = this.hslToRgb(h, s, l);

        ctx.fillStyle = `rgb(${newRgb.join(',')})`;
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  private hslToRgb(h: number, s: number, l: number): [R, G, B] {
    h = h % 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (0 <= h && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (60 <= h && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (120 <= h && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (180 <= h && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (240 <= h && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (300 <= h && h < 360) {
      r = c;
      g = 0;
      b = x;
    }

    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [r, g, b];
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
      h = s = 0; // achromatic
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

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }
}
