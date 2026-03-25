import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { ShipConfig, defaultThemeColors } from 'ship-ui';
import { LOCALSTORAGE } from './localstorage.token';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  #document = inject(DOCUMENT);
  #ls = inject(LOCALSTORAGE);

  private _configSignal = signal<ShipConfig>(this.loadConfig());
  isEditorOpen = signal<boolean>(this.#ls.getItemParsed<boolean>('ship-editor-open') || false);

  fontSizeEffect = effect(() => {
    this.#ls.setItemParsed('ship-editor-open', this.isEditorOpen());

    const config = this._configSignal();

    if (config.fontSize) {
      this.#document.documentElement.style.setProperty('--font-size', `${config.fontSize}px`);
    } else {
      this.#document.documentElement.style.removeProperty('--font-size');
    }

    if (config.borderRadius !== undefined) {
      this.#document.documentElement.style.setProperty('--shape-scale', `${config.borderRadius}`);
    } else {
      this.#document.documentElement.style.removeProperty('--shape-scale');
    }

    if (config.borderWidth !== undefined) {
      this.#document.documentElement.style.setProperty('--border-width', `${config.borderWidth}px`);
    } else {
      this.#document.documentElement.style.removeProperty('--border-width');
    }

    const ALL_COLORS = ['primary', 'accent', 'warn', 'error', 'success', 'base'];
    ALL_COLORS.forEach(colorName => {
      const hslValue = config.colors?.[colorName as keyof typeof config.colors];
      const distValue = config.distribution?.[colorName as keyof typeof config.distribution];

      const isDefaultColor = !hslValue || hslValue === defaultThemeColors[colorName];
      const isDefaultDist = distValue === undefined || distValue === 1;

      if (isDefaultColor && isDefaultDist) {
        this.clearThemeScale(colorName);
      } else {
        const colorToApply = hslValue || defaultThemeColors[colorName];
        this.applyThemeScale(colorName, colorToApply, distValue ?? 1);
      }
    });
  });

  private clearThemeScale(colorName: string) {
    for (let i = 1; i <= 12; i++) {
      this.#document.body.style.removeProperty(`--${colorName}-${i}`);
    }
    this.#document.body.style.removeProperty(`--${colorName}-g2`);
    this.#document.body.style.removeProperty(`--${colorName}-g3`);
  }

  private applyThemeScale(inputName: string, hsl: string, distribution: number = 1) {
    // e.g. hsl = 'hsl(217, 91%, 60%)'
    const match = hsl.match(/hsl\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)%,\s*(\d+(?:\.\d+)?)%\)/);
    if (!match) return;

    const _h = parseFloat(match[1]);
    const _s = parseFloat(match[2]);
    const _l = parseFloat(match[3]);

    const countLight = 8;
    const countDark = 4;
    const range = _l;
    const clampedRange = range * 0.9;
    const start = _l - clampedRange;

    const lightShades: string[] = [];
    const darkShades: string[] = [];

    // Math curve logic (easing)
    const curve = (i: number, max: number) => Math.pow(i / max, distribution);

    // Light shades (regular theme)
    for (let i = 1; i <= countLight; i++) {
        const light = 100 - (100 - _l) * curve(i, countLight);
        lightShades.push(`hsl(${_h.toFixed(2)}, ${_s.toFixed(2)}%, ${light.toFixed(2)}%)`);
    }
    // Dark shades (regular theme)
    for (let i = 1; i <= countDark; i++) {
        const dark = start + clampedRange * (1 - curve(i, countDark));
        lightShades.push(`hsl(${_h.toFixed(2)}, ${_s.toFixed(2)}%, ${dark.toFixed(2)}%)`);
    }

    // Light shades (dark theme) (Reversed)
    for (let i = 1; i <= countLight; i++) {
        const darkLight = _l * curve(i, countLight);
        darkShades.push(`hsl(${_h.toFixed(2)}, ${_s.toFixed(2)}%, ${darkLight.toFixed(2)}%)`);
    }
    // Dark shades (dark theme) (Reversed)
    for (let i = 1; i <= countDark; i++) {
        const darkDark = 100 - (100 - _l) * (1 - curve(i, countDark));
        darkShades.push(`hsl(${_h.toFixed(2)}, ${_s.toFixed(2)}%, ${darkDark.toFixed(2)}%)`);
    }

    for (let i = 0; i < 12; i++) {
      const idx = i + 1;
      this.#document.body.style.setProperty(`--${inputName}-${idx}`, `light-dark(${lightShades[i]}, ${darkShades[i]})`);
    }

    // Gradients
    // g2 is shade 6 to shade 8, g3 is shade 4 to shade 8
    const g2 = `linear-gradient(180deg, ${lightShades[5]} 0%, ${lightShades[7]} 50%)`;
    const g3 = `linear-gradient(180deg, ${lightShades[3]} 0%, ${lightShades[7]} 50%)`;
    this.#document.body.style.setProperty(`--${inputName}-g2`, g2);
    this.#document.body.style.setProperty(`--${inputName}-g3`, g3);
  }

  private loadConfig(): ShipConfig {
    const saved = this.#ls.getItemParsed<ShipConfig>('ship-config');
    return saved || { sidenavType: 'overlay' };
  }

  get config(): ShipConfig {
    return this._configSignal();
  }

  updateConfig(newConfig: Partial<ShipConfig>) {
    const updated = { ...this._configSignal(), ...newConfig };
    const cleaned = this.cleanConfig(updated);
    
    this._configSignal.set(cleaned);

    const keys = Object.keys(cleaned);
    if (keys.length === 0 || (keys.length === 1 && keys[0] === 'sidenavType' && (!cleaned.sidenavType || cleaned.sidenavType === 'overlay'))) {
      this.#ls.removeItem('ship-config');
    } else {
      this.#ls.setItemParsed('ship-config', cleaned);
    }
  }

  private cleanConfig(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj;
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === '' || value === undefined || value === null) continue;
      
      if (typeof value === 'object') {
        const sub = this.cleanConfig(value);
        if (Object.keys(sub).length > 0) {
          cleaned[key] = sub;
        }
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  resetConfig() {
    // Rely on effect clearing to sweep the styles by omitting colors and distributions
    const initialConfig: ShipConfig = { sidenavType: 'overlay' };
    this._configSignal.set(initialConfig);
    this.#ls.removeItem('ship-config');
  }

  get reactiveConfig(): ShipConfig {
    const sig = this._configSignal;

    return new Proxy({} as ShipConfig, {
      get(target, prop: keyof ShipConfig) {
        const currentConfig = sig();
        const val = currentConfig[prop];

        if (val && typeof val === 'object' && !Array.isArray(val)) {
          return new Proxy(val, {
            get(subTarget, subProp: string | symbol) {
              const latestConfig = sig();
              const latestVal = latestConfig[prop] as any;
              return latestVal ? latestVal[subProp] : undefined;
            },
          });
        }

        return val;
      },
    });
  }
}
