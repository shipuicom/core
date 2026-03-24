import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { ShipConfig } from 'ship-ui';
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
  });

  private loadConfig(): ShipConfig {
    const saved = this.#ls.getItemParsed<ShipConfig>('ship-config');
    return saved || { sidenavType: 'overlay' };
  }

  get config(): ShipConfig {
    return this._configSignal();
  }

  updateConfig(newConfig: Partial<ShipConfig>) {
    const updated = { ...this._configSignal(), ...newConfig };
    this._configSignal.set(updated);
    this.#ls.setItemParsed('ship-config', updated);
  }

  resetConfig() {
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
