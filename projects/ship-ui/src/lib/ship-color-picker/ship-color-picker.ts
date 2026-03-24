import { isPlatformBrowser } from '@angular/common';
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
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

type R = number;
type G = number;
type B = number;
type A = number;

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
export class ShipColorPicker {
  #document = inject(DOCUMENT);
  #platformId = inject(PLATFORM_ID);

  readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('colorCanvas');
  #canvasData = signal<{
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    centerX: number;
    centerY: number;
    radius: number;
  } | null>(null);

  showDarkColors = input(false);
  renderingType = input<'hsl' | 'grid' | 'hue' | 'rgb' | 'saturation' | 'alpha'>('hsl');
  gridSize = input(20);
  hue = model(0);
  direction = input<'horizontal' | 'vertical'>('horizontal');
  selectedColor = model<[R, G, B, A?]>([255, 255, 255, 1]);
  alpha = model(1);
  currentColor = output<{
    rgb: string;
    rgba: string;
    hex: string;
    hex8: string;
    hsl: string;
    hsla: string;
    hue: number;
    saturation: number;
    alpha: number;
  }>();

  centerLightness = computed(() => (this.showDarkColors() ? 200 : 100));
  isDragging = signal(false);
  markerPosition = signal({ x: '50%', y: '50%' });
  _pos = { x: '0', y: '0' };
  _markerPosition = effect(() => (this._pos = this.markerPosition()));
  #skipMarkerUpdate = false;

  selectedColorRgb = computed(() => {
    const c = this.selectedColor();
    return c[3] !== undefined ? `rgba(${c[0]},${c[1]},${c[2]},${c[3]})` : `rgb(${c[0]},${c[1]},${c[2]})`;
  });
  selectedColorHex = computed(() => this.rgbToHex(...(this.selectedColor() as [number, number, number])));
  selectedColorHsl = computed(() => this.rgbToHsl(...(this.selectedColor() as [number, number, number])).string);

  alphaEffect = effect(
    () => {
      const a = this.alpha();
      const current = untracked(() => this.selectedColor());

      if (current[3] !== a) {
        this.#skipMarkerUpdate = false;
        this.selectedColor.set([current[0], current[1], current[2], a]);
      }
    },
    { allowSignalWrites: true }
  );

  _prevColorStr = '';
  selectedColorEffect = effect(
    () => {
      const selectedColor = this.selectedColor();
      const r = selectedColor[0];
      const g = selectedColor[1];
      const b = selectedColor[2];
      const a = selectedColor[3] ?? 1;

      untracked(() => {
        if (this.alpha() !== a) {
          this.alpha.set(a);
        }
      });

      const str = `${r},${g},${b},${a}`;
      if (this._prevColorStr === str && !this.#skipMarkerUpdate) {
        // We still want to clear skipMarkerUpdate if it was set
        // wait, actually if skipMarkerUpdate is true, it means we JUST dragged. 
        // In that case we do want to emit currentColor. 
      }

      const hsl = this.rgbToHsl(r, g, b);
      const hex = this.rgbToHex(r, g, b);

      if (this.#skipMarkerUpdate) {
        this.#skipMarkerUpdate = false;
        this._prevColorStr = str;
      } else {
        if (this._prevColorStr !== str) {
           this.updateMarkerFromColor(selectedColor);
           this._prevColorStr = str;
        } else {
           // Color is structurally identical and not from a drag event, skip marker jump
        }
      }

      this.currentColor.emit({
        rgb: `rgb(${r}, ${g}, ${b})`,
        rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
        hex: hex,
        hex8: this.rgbaToHex8(r, g, b, a),
        hsl: hsl.string,
        hsla: `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${a})`,
        hue: hsl.h,
        saturation: hsl.s,
        alpha: a,
      });
    },
    { allowSignalWrites: true }
  );

  private alphaColorRedrawEffect = effect(() => {
    const color = this.selectedColor();
    if (this.renderingType() === 'alpha' && this.#canvasData()) {
      untracked(() => this.drawAlpha());
    }
  });

  private rgbaToHex8(r: number, g: number, b: number, a: number): string {
    const alphaHex = Math.round(a * 255)
      .toString(16)
      .padStart(2, '0');
    return this.rgbToHex(r, g, b) + alphaHex;
  }

  @HostListener('window:resize', [])
  onResize() {
    this.setCanvasSize();
  }

  private previousRenderingType: string | null = null;

  private renderingTypeEffect = effect(() => {
    const currentRenderingType = this.renderingType();
    this.hue();
    this.showDarkColors();
    this.gridSize();
    this.direction();

    if (this.#canvasData()) {
      untracked(() => this.drawColorPicker());

      if (this.previousRenderingType !== currentRenderingType) {
        if (currentRenderingType === 'hsl') {
          this.adjustMarkerPosition();
          queueMicrotask(() => this.updateMarkerFromColor(this.selectedColor()));
        } else {
          this.updateMarkerFromColor(this.selectedColor());
        }
        this.previousRenderingType = currentRenderingType;
      } else {
        const pos = untracked(() => this.markerPosition());
        const { canvas, ctx } = untracked(() => this.#canvasData())!;
        let x = (parseFloat(pos.x.replace('%', '')) / 100) * Math.max(1, canvas.width - 1);
        let y = (parseFloat(pos.y.replace('%', '')) / 100) * Math.max(1, canvas.height - 1);
        x = Math.max(0, Math.min(canvas.width - 1, Math.round(x)));
        y = Math.max(0, Math.min(canvas.height - 1, Math.round(y)));

        const color = untracked(() => this.getColorAtPosition(x, y));

        if (this.renderingType() !== 'alpha') {
          color[3] = untracked(() => this.selectedColor()[3] ?? 1);
        }

        this.#skipMarkerUpdate = true;
        this.selectedColor.set(color as any);
      }
    }
  });

  #resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
              this.setCanvasSize();
            }
          }
        })
      : null;

  initColor: [R, G, B, A?] | null = null;
  ngAfterViewInit() {
    this.initColor = this.selectedColor();

    const canvas = this.canvasRef()?.nativeElement;
    if (canvas?.parentElement) {
      this.#resizeObserver?.observe(canvas.parentElement);
    }

    this.setCanvasSize();
    this.initCanvasEvents();
  }

  ngOnDestroy() {
    this.#resizeObserver?.disconnect();
  }

  private updateMarkerFromColor(rgba: [R, G, B, A?]) {
    const [r, g, b, a] = rgba;
    const coords = this.findPositionByColor(r, g, b, a);

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

  private findPositionByColor(r: number, g: number, b: number, a?: number): { x: number; y: number } | null {
    const canvasData = this.#canvasData();
    if (!canvasData || !canvasData.canvas) return null;

    const { canvas, ctx } = canvasData;
    if (canvas.width === 0 || canvas.height === 0) return null;

    if (this.renderingType() === 'alpha') {
      const aVal = a ?? 1;
      if (this.direction() === 'horizontal') {
        return { x: Math.round(aVal * (canvas.width - 1)), y: 0 };
      } else {
        return { x: 0, y: Math.round(aVal * (canvas.height - 1)) };
      }
    }

    if (this.renderingType() === 'hue') {
      const hsl = this.rgbToHsl(r, g, b);
      const ratio = hsl.h / 360;
      if (this.direction() === 'horizontal') {
        return { x: Math.round(ratio * (canvas.width - 1)), y: Math.round((canvas.height - 1) / 2) };
      } else {
        return { x: Math.round((canvas.width - 1) / 2), y: Math.round(ratio * (canvas.height - 1)) };
      }
    }

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
    const { canvas, centerX, centerY, radius } = this.#canvasData()!;
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
    const data = this.#canvasData();
    if (!data) return;
    const { canvas } = data;

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
    if (!isPlatformBrowser(this.#platformId)) return;

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

      this.#canvasData.set({
        canvas,
        ctx,
        centerX: canvas.width / 2,
        centerY: canvas.height / 2,
        radius: Math.min(canvas.width, canvas.height) / 2,
      });

      this.drawColorPicker();
    }
  }

  private getColorAtPosition(mouseX: number, mouseY: number): [R, G, B, A?] {
    const { canvas, ctx } = this.#canvasData()!;
    const w = Math.max(1, canvas.width - 1);
    const h = Math.max(1, canvas.height - 1);
    const xRatio = mouseX / w;
    const yRatio = mouseY / h;

    if (this.renderingType() === 'rgb') {
      return this.hsvToRgbExact(this.hue(), xRatio * 100, (1 - yRatio) * 100);
    } else if (this.renderingType() === 'saturation') {
      const ratio = this.direction() === 'horizontal' ? xRatio : yRatio;
      return this.hslToRgbExact(this.hue(), ratio * 100, 50);
    } else if (this.renderingType() === 'hue') {
      const ratio = this.direction() === 'horizontal' ? xRatio : yRatio;
      return this.hslToRgbExact(ratio * 360, 100, 50);
    } else if (this.renderingType() === 'alpha') {
      const ratio = this.direction() === 'horizontal' ? xRatio : yRatio;
      const current = this.selectedColor();
      return [current[0], current[1], current[2], parseFloat(ratio.toFixed(2))];
    } else {
      const pixelData = ctx.getImageData(mouseX, mouseY, 1, 1).data;
      return [pixelData[0], pixelData[1], pixelData[2]];
    }
  }

  private updateColorAndMarker(event: MouseEvent | Touch, outsideCanvas = false, onlyMarker = false) {
    const { canvas, ctx } = this.#canvasData()!;

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

    if (!onlyMarker) {
      const newColor = this.getColorAtPosition(mouseX, mouseY);
      if (this.renderingType() !== 'alpha') {
        newColor[3] = this.selectedColor()[3] ?? 1;
      }
      this.#skipMarkerUpdate = true;
      this.selectedColor.set(newColor as any);
    }

    const xPercent = ((mouseX / Math.max(1, canvas.width - 1)) * 100).toFixed(2) + '%';
    const yPercent = ((mouseY / Math.max(1, canvas.height - 1)) * 100).toFixed(2) + '%';

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
      case 'alpha':
        this.drawAlpha();
        break;
      case 'rgb':
        this.drawRgb();
        break;
      case 'saturation':
        this.drawSaturation();
        break;
    }
  }

  private drawAlpha() {
    const { canvas, ctx } = this.#canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = Math.max(1, canvas.width - 1);
    const h = Math.max(1, canvas.height - 1);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.direction() === 'horizontal' ? w : 0,
      this.direction() === 'horizontal' ? 0 : h
    );

    const [r, g, b] = this.selectedColor();

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawRgb() {
    const { canvas, ctx } = this.#canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = Math.max(1, canvas.width - 1);
    const h = Math.max(1, canvas.height - 1);

    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gradient2 = ctx.createLinearGradient(0, 0, 0, h);
    gradient2.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient2.addColorStop(1, '#000000');

    ctx.fillStyle = gradient2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawSaturation() {
    const { canvas, ctx } = this.#canvasData()!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = Math.max(1, canvas.width - 1);
    const h = Math.max(1, canvas.height - 1);

    if (this.direction() === 'horizontal') {
      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      gradient.addColorStop(0, `hsl(${this.hue()}, 0%, 50%)`);
      gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, `hsl(${this.hue()}, 0%, 50%)`);
      gradient.addColorStop(1, `hsl(${this.hue()}, 100%, 50%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  private drawHue() {
    const { canvas, ctx } = this.#canvasData()!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = Math.max(1, canvas.width - 1);
    const h = Math.max(1, canvas.height - 1);

    const gradient = ctx.createLinearGradient(
      0,
      0,
      this.direction() === 'horizontal' ? w : 0,
      this.direction() === 'horizontal' ? 0 : h
    );

    for (let i = 0; i <= 360; i += 10) {
      gradient.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  private drawColorWheel() {
    const { canvas, ctx, centerX, centerY, radius } = this.#canvasData()!;

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
    const { canvas, ctx } = this.#canvasData()!;
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

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number; string: string } {
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

    const hDeg = Math.floor(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);

    return {
      h: hDeg,
      s: sPct,
      l: lPct,
      string: `hsl(${hDeg}, ${sPct}%, ${lPct}%)`,
    };
  }

  private hslToRgbExact(h: number, s: number, l: number): [number, number, number] {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
  }

  private hsvToRgbExact(h: number, s: number, v: number): [number, number, number] {
    const sNorm = s / 100;
    const vNorm = v / 100;
    const c = vNorm * sNorm;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = vNorm - c;
    let r = 0,
      g = 0,
      b = 0;
    if (h >= 0 && h < 60) {
      r = c;
      g = x;
      b = 0;
    } else if (h >= 60 && h < 120) {
      r = x;
      g = c;
      b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0;
      g = c;
      b = x;
    } else if (h >= 180 && h < 240) {
      r = 0;
      g = x;
      b = c;
    } else if (h >= 240 && h < 300) {
      r = x;
      g = 0;
      b = c;
    } else if (h >= 300 && h < 360) {
      r = c;
      g = 0;
      b = x;
    }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
}
