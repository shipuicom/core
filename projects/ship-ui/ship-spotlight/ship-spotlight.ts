import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  model,
  output,
  signal,
  viewChild,
  ViewEncapsulation,
  InjectionToken,
  Provider,
} from '@angular/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipList } from '@ship-ui/core/ship-list';
import { ShipKbd } from '@ship-ui/core/ship-kbd';

export interface ShipSpotlightItem {
  id: string;
  label: string;
  category?: string;
  description?: string;
  icon?: string;
  shortcut?: string;
  data?: any;
}

export interface ShipSpotlightServiceOptions {
  items?: ShipSpotlightItem[];
  placeholder?: string;
  shortcut?: string;
  customFilter?: boolean;
  searchQuery?: string;
}

export interface ShipSpotlightConfig {
  defaultItems?: ShipSpotlightItem[];
  enableShortcuts?: boolean;
}

export const SHIP_SPOTLIGHT_CONFIG = new InjectionToken<ShipSpotlightConfig>('SHIP_SPOTLIGHT_CONFIG');

export function provideShipSpotlight(config: ShipSpotlightConfig): Provider {
  return {
    provide: SHIP_SPOTLIGHT_CONFIG,
    useValue: config,
  };
}

@Component({
  selector: 'sh-spotlight',
  styleUrl: './ship-spotlight.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon, ShipList, ShipKbd],
  template: `
    <div class="sh-spotlight-container">
      <div class="sh-spotlight-search-bar">
        <sh-icon class="sh-spotlight-search-icon">magnifying-glass</sh-icon>
        <input
          #inputRef
          type="text"
          class="sh-spotlight-input"
          [placeholder]="mergedPlaceholder()"
          [value]="searchQuery()"
          (input)="onSearchInput($event)"
          (keydown)="onKeyDown($event)" />
        @if (searchQuery()) {
          <button class="sh-spotlight-clear-btn" (click)="clearSearch()">
            <sh-icon>x-bold</sh-icon>
          </button>
        }
      </div>

      <div #resultsRef class="sh-spotlight-results">
        @if (groupedFilteredItems().length > 0) {
          @for (group of groupedFilteredItems(); track group.category) {
            <div class="sh-spotlight-category">
              <div class="sh-spotlight-category-title">{{ group.category }}</div>
              <sh-list class="type-b">
                @for (itemWithIdx of group.items; track itemWithIdx.item.id) {
                  <button
                    action
                    type="button"
                    [class.active]="itemWithIdx.flatIndex === activeOptionIndex()"
                    (mouseenter)="activeOptionIndex.set(itemWithIdx.flatIndex)"
                    (click)="selectItem(itemWithIdx.item)">
                    @if (itemWithIdx.item.icon) {
                      <sh-icon>{{ itemWithIdx.item.icon }}</sh-icon>
                    }
                    <div class="text-group">
                      <span class="label">{{ itemWithIdx.item.label }}</span>
                      @if (itemWithIdx.item.description) {
                        <span class="description">{{ itemWithIdx.item.description }}</span>
                      }
                    </div>
                    @if (itemWithIdx.item.shortcut) {
                      <span class="shortcut">
                        @for (key of parseShortcutKeys(itemWithIdx.item.shortcut); track key) {
                          <sh-kbd
                            [meta]="key === 'meta' || key === 'cmd' || key === 'command'"
                            [shift]="key === 'shift'"
                            [alt]="key === 'alt' || key === 'option'"
                            [ctrl]="key === 'ctrl' || key === 'control'"
                            [enter]="key === 'enter' || key === 'return'"
                            [escape]="key === 'escape' || key === 'esc'"
                            [backspace]="key === 'backspace'"
                          >
                            @if (!['meta', 'cmd', 'command', 'shift', 'alt', 'option', 'ctrl', 'control', 'enter', 'return', 'escape', 'esc', 'backspace'].includes(key)) {
                              {{ key }}
                            }
                          </sh-kbd>
                        }
                      </span>
                    }
                  </button>
                }
              </sh-list>
            </div>
          }
        } @else {
          <div class="sh-spotlight-no-results">
            <sh-icon class="sh-spotlight-no-results-icon">warning-octagon</sh-icon>
            <span class="sh-spotlight-no-results-text">No results found for "{{ searchQuery() }}"</span>
          </div>
        }
      </div>

      <div class="sh-spotlight-footer">
        <span class="sh-spotlight-footer-tip">
          <sh-kbd>↓</sh-kbd> <sh-kbd>↑</sh-kbd>
          to navigate
        </span>
        <span class="sh-spotlight-footer-tip">
          <sh-kbd enter></sh-kbd>
          to select
        </span>
        <span class="sh-spotlight-footer-tip">
          <sh-kbd escape></sh-kbd>
          to close
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipSpotlight {
  inputRef = viewChild<ElementRef<HTMLInputElement>>('inputRef');
  resultsRef = viewChild<ElementRef<HTMLDivElement>>('resultsRef');

  // Input config passed from ShipDialogService
  data = input<ShipSpotlightServiceOptions>();

  // Standard inputs (fallback)
  items = input<ShipSpotlightItem[]>([]);
  placeholder = input<string>('Search actions, settings, or pages...');
  customFilter = input<boolean>(false);
  searchQuery = model<string>('');

  itemSelected = output<ShipSpotlightItem>();
  closed = output<void>();

  // Merged config properties
  mergedItems = computed(() => this.data()?.items ?? this.items());
  mergedPlaceholder = computed(() => this.data()?.placeholder ?? this.placeholder());
  mergedCustomFilter = computed(() => this.data()?.customFilter ?? this.customFilter());

  activeOptionIndex = signal<number>(0);

  // Computes the scored and filtered flat list of items
  flatFilteredItems = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allItems = this.mergedItems();

    if (this.mergedCustomFilter() || !query) {
      return allItems;
    }

    const scored = allItems
      .map((item) => {
        const labelScore = this.#calculateMatchScore(item.label.toLowerCase(), query);
        const descScore = item.description ? this.#calculateMatchScore(item.description.toLowerCase(), query) : 0;
        return { item, score: Math.max(labelScore, descScore) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((x) => x.item);
  });

  // Groups flat list of items by category and precomputes flat indices
  groupedFilteredItems = computed(() => {
    const flat = this.flatFilteredItems();
    const groups: { category: string; items: { item: ShipSpotlightItem; flatIndex: number }[] }[] = [];
    let currentFlatIndex = 0;

    flat.forEach((item) => {
      const cat = item.category || 'Actions';
      let group = groups.find((g) => g.category === cat);
      if (!group) {
        group = { category: cat, items: [] };
        groups.push(group);
      }
      group.items.push({ item, flatIndex: currentFlatIndex++ });
    });

    return groups;
  });

  constructor() {
    // Sync initial search query if provided in dialog data
    effect(() => {
      const initialQuery = this.data()?.searchQuery;
      if (initialQuery !== undefined) {
        this.searchQuery.set(initialQuery);
      }
    });

    // Auto-focus input when the view is initialized
    effect(() => {
      const inputEl = this.inputRef()?.nativeElement;
      if (inputEl && typeof inputEl.focus === 'function') {
        setTimeout(() => inputEl.focus(), 50);
      }
    });

    // Scroll active item into view
    effect(() => {
      const index = this.activeOptionIndex();
      if (index > -1) {
        queueMicrotask(() => this.scrollToActiveItem());
      }
    });
  }

  validateItemsEffect = effect(() => {
    const items = this.mergedItems();
    for (const item of items) {
      if (item.shortcut) {
        this.#validateShortcut(item.shortcut);
      }
    }
  });

  onSearchInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
    this.activeOptionIndex.set(0);
  }

  clearSearch() {
    this.searchQuery.set('');
    const inputEl = this.inputRef()?.nativeElement;
    if (inputEl) {
      inputEl.value = '';
      if (typeof inputEl.focus === 'function') {
        inputEl.focus();
      }
    }
    this.activeOptionIndex.set(0);
  }

  onKeyDown(event: KeyboardEvent) {
    // Check if the event matches any item shortcut
    const allItems = this.mergedItems();
    const shortcutMatch = allItems.find((item) => item.shortcut && this.#checkShortcutMatch(event, item.shortcut));

    if (shortcutMatch) {
      event.preventDefault();
      event.stopPropagation();
      // Delay selection to ensure the browser honors preventDefault before the DOM node is potentially destroyed
      setTimeout(() => this.selectItem(shortcutMatch), 10);
      return;
    }

    const flat = this.flatFilteredItems();
    if (flat.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIdx = (this.activeOptionIndex() + 1) % flat.length;
      this.activeOptionIndex.set(nextIdx);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIdx = (this.activeOptionIndex() - 1 + flat.length) % flat.length;
      this.activeOptionIndex.set(prevIdx);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      if (event.shiftKey) {
        const prevIdx = (this.activeOptionIndex() - 1 + flat.length) % flat.length;
        this.activeOptionIndex.set(prevIdx);
      } else {
        const nextIdx = (this.activeOptionIndex() + 1) % flat.length;
        this.activeOptionIndex.set(nextIdx);
      }
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = flat[this.activeOptionIndex()];
      if (selected) {
        this.selectItem(selected);
      }
    }
  }

  selectItem(item: ShipSpotlightItem) {
    this.itemSelected.emit(item);
    this.closed.emit();
  }

  scrollToActiveItem() {
    const resultsEl = this.resultsRef()?.nativeElement;
    if (!resultsEl) return;

    const activeEl = resultsEl.querySelector('[action].active') as HTMLElement;
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }

  parseShortcutKeys(shortcut: string): string[] {
    if (!shortcut) return [];
    return shortcut.split('+').map((s) => s.trim().toLowerCase());
  }

  #validateShortcut(shortcut: string) {
    const normalized = shortcut
      .toLowerCase()
      .split('+')
      .map((k) => k.trim())
      .join('+');

    const reserved = [
      'meta+n', 'ctrl+n',
      'meta+t', 'ctrl+t',
      'meta+w', 'ctrl+w',
      'meta+q', 'ctrl+q',
      'meta+r', 'ctrl+r',
      'meta+l', 'ctrl+l',
      'meta+shift+n', 'ctrl+shift+n',
      'meta+shift+t', 'ctrl+shift+t',
      'meta+shift+w', 'ctrl+shift+w',
      'cmd+n', 'cmd+t', 'cmd+w', 'cmd+q', 'cmd+r', 'cmd+l',
      'cmd+shift+n', 'cmd+shift+t', 'cmd+shift+w',
    ];

    if (reserved.includes(normalized)) {
      throw new Error(
        `[ShipUI Error] The shortcut "${shortcut}" uses a reserved browser hotkey that cannot be reliably prevented (e.g. New Window, New Tab). Please choose a different shortcut.`
      );
    }
  }

  #checkShortcutMatch(event: KeyboardEvent, shortcut: string): boolean {
    if (!shortcut) return false;
    const keys = this.parseShortcutKeys(shortcut);

    const needsMeta = keys.includes('meta') || keys.includes('cmd') || keys.includes('command');
    const needsCtrl = keys.includes('ctrl') || keys.includes('control');
    const needsAlt = keys.includes('alt') || keys.includes('option');
    const needsShift = keys.includes('shift');

    if (event.metaKey !== needsMeta) return false;
    if (event.ctrlKey !== needsCtrl) return false;
    if (event.altKey !== needsAlt) return false;
    if (event.shiftKey !== needsShift) return false;

    const mainKeys = keys.filter(
      (k) => !['meta', 'cmd', 'command', 'ctrl', 'control', 'alt', 'option', 'shift'].includes(k),
    );

    if (mainKeys.length === 1) {
      return event.key.toLowerCase() === mainKeys[0].toLowerCase();
    }

    return false;
  }

  #calculateMatchScore(option: string, input: string): number {
    if (!input) return 0;

    let score = 0;
    let lastIndex = -1;
    let matchCount = 0;
    let inSequence = true;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (option.length > lastIndex + 1 && option[lastIndex + 1] === char) {
        score += i === 0 ? 100 : 150;
        lastIndex++;
        matchCount++;
      } else {
        const charIndex = option.indexOf(char, lastIndex + 1);

        if (i > 0) {
          inSequence = false;
        }

        if (charIndex === -1) {
          return 0;
        }

        score += 100;
        lastIndex = charIndex;
        matchCount++;
      }
    }

    if (inSequence && input.length === matchCount) {
      score += 1000;
    }

    score += matchCount * 20;
    return score;
  }
}
