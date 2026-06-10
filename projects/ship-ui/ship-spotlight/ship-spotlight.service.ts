import { computed, DOCUMENT, inject, Injectable, OutputEmitterRef, signal, DestroyRef } from '@angular/core';
import { ShipDialogService } from '@ship-ui/core/ship-dialog';
import { ShipSpotlight, ShipSpotlightItem, ShipSpotlightServiceOptions, SHIP_SPOTLIGHT_CONFIG } from './ship-spotlight';

export interface ShipSpotlightInstance {
  close: () => void;
  itemSelected: OutputEmitterRef<ShipSpotlightItem>;
  closed: OutputEmitterRef<any>;
}

interface SpotlightItemRegistryEntry {
  id: number;
  items: ShipSpotlightItem[];
  overwrite: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ShipSpotlightService {
  #document = inject(DOCUMENT);
  #dialogService = inject(ShipDialogService);
  #config = inject(SHIP_SPOTLIGHT_CONFIG, { optional: true });

  #nextId = 0;
  #registries = signal<SpotlightItemRegistryEntry[]>([]);

  #globalItemSelected = signal<ShipSpotlightItem | null>(null);
  globalItemSelected = this.#globalItemSelected.asReadonly();

  #isShortcutsEnabled = signal(false);
  isShortcutsEnabled = this.#isShortcutsEnabled.asReadonly();

  #aggregatedItems = computed(() => {
    const registries = this.#registries();
    const defaults = this.#config?.defaultItems ?? [];
    let aggregated: ShipSpotlightItem[] = [...defaults];

    for (const entry of registries) {
      if (entry.overwrite) {
        aggregated = [...entry.items];
      } else {
        aggregated.push(...entry.items);
      }
    }
    return aggregated;
  });

  hasOverwriteItems = computed(() => this.#registries().some((r) => r.overwrite));

  constructor() {
    if (this.#config?.enableGlobalEventListener !== false) {
      this.enableGlobalShortcuts();
    }
  }

  registerItems(items: ShipSpotlightItem[], overwrite = false): () => void {
    const id = this.#nextId++;
    this.#registries.update((regs) => [...regs, { id, items, overwrite }]);

    const cleanup = () => {
      this.#registries.update((regs) => regs.filter((r) => r.id !== id));
    };

    try {
      const destroyRef = inject(DestroyRef);
      destroyRef.onDestroy(cleanup);
    } catch {
      // Ignore if not called in injection context
    }

    return cleanup;
  }

  #contextualRegistryId: number | null = null;

  setContextualItems(items: ShipSpotlightItem[], overwrite = false) {
    if (this.#contextualRegistryId !== null) {
      const oldId = this.#contextualRegistryId;
      this.#registries.update((regs) => regs.filter((r) => r.id !== oldId));
    }
    const id = this.#nextId++;
    this.#contextualRegistryId = id;
    this.#registries.update((regs) => [...regs, { id, items, overwrite }]);
  }

  clearContextualItems() {
    if (this.#contextualRegistryId !== null) {
      const oldId = this.#contextualRegistryId;
      this.#registries.update((regs) => regs.filter((r) => r.id !== oldId));
      this.#contextualRegistryId = null;
    }
  }

  #globalShortcutListener: ((event: KeyboardEvent) => void) | null = null;
  #globalShortcutOptions: Partial<ShipSpotlightServiceOptions> | null = null;

  enableGlobalShortcuts(options?: Partial<ShipSpotlightServiceOptions>): void {
    if (this.#globalShortcutListener) {
      this.disableGlobalShortcuts();
    }
    
    if (options) {
      this.#globalShortcutOptions = options;
    }

    this.#isShortcutsEnabled.set(true);

    this.#globalShortcutListener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();

        const instance = this.open(this.#globalShortcutOptions || undefined);

        const sub = instance.itemSelected.subscribe((item) => {
          this.#globalItemSelected.set(item);
        });

        instance.closed.subscribe(() => sub.unsubscribe());
      }
    };

    this.#document.addEventListener('keydown', this.#globalShortcutListener);
  }

  disableGlobalShortcuts(): void {
    if (this.#globalShortcutListener) {
      this.#document.removeEventListener('keydown', this.#globalShortcutListener);
      this.#globalShortcutListener = null;
    }
    this.#isShortcutsEnabled.set(false);
  }

  open(options?: ShipSpotlightServiceOptions): ShipSpotlightInstance {
    const finalOptions = {
      ...options,
      items: options?.items ?? this.#aggregatedItems(),
    };

    const dialogClass = options?.dialogClass ?? 'type-c';

    const dialogRef = this.#dialogService.open(ShipSpotlight, {
      data: finalOptions,
      class: `spotlight-dialog ${dialogClass}`,
      closeOnOutsideClick: true,
      closeOnEsc: true,
      width: '600px',
      maxWidth: '90vw',
    });

    return {
      close: () => dialogRef.close(),
      itemSelected: dialogRef.component.itemSelected,
      closed: dialogRef.closed,
    };
  }
}
