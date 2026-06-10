import { Component, OnDestroy, effect, inject, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipSpotlightItem, ShipSpotlightService } from '@ship-ui/core/ship-spotlight';
import { ShipToggle } from '@ship-ui/core/ship-toggle';
import { ShipKbd } from '@ship-ui/core/ship-kbd';

@Component({
  selector: 'service-spotlight-example',
  standalone: true,
  imports: [ShipButton, ShipCard, ShipToggle, ShipKbd],
  templateUrl: './service-spotlight.html',
  styleUrl: './service-spotlight.scss',
})
export class ServiceSpotlightExample implements OnDestroy {
  #spotlight = inject(ShipSpotlightService);

  selectedItem = signal<ShipSpotlightItem | null>(null);

  isContextualActive = this.#spotlight.hasOverwriteItems;
  isShortcutsEnabled = this.#spotlight.isShortcutsEnabled;

  items: ShipSpotlightItem[] = [
    {
      id: 'welcome',
      label: 'Welcome to Ship (Service)',
      category: 'Navigation',
      icon: 'hand-waving',
      description: 'Go to the welcome guide page',
    },
    {
      id: 'start',
      label: 'Getting Started',
      category: 'Navigation',
      icon: 'play',
      description: 'Learn how to install and configure ShipUI',
    },
    {
      id: 'new-file',
      label: 'Create New Document',
      category: 'Actions',
      icon: 'plus',
      description: 'Open file creation workflow',
      shortcut: 'meta+e',
    },
    {
      id: 'search-users',
      label: 'Search Users',
      category: 'Actions',
      icon: 'magnifying-glass',
      description: 'Find registered users in directory',
    },
    {
      id: 'general-settings',
      label: 'General Preferences',
      category: 'Settings',
      icon: 'gear',
      description: 'Edit core preferences',
      shortcut: 'meta+,',
    },
  ];

  contextualItems: ShipSpotlightItem[] = [
    {
      id: 'ctx-1',
      label: 'Contextual Action 1',
      category: 'Page Actions',
      icon: 'sparkle',
      description: 'Available only on this page',
    },
    {
      id: 'ctx-2',
      label: 'Contextual Settings',
      category: 'Page Settings',
      icon: 'gear',
      description: 'Specific to this view',
    },
  ];

  #globalSelectedItemsEffect = effect(() => {
    const item = this.#spotlight.globalItemSelected();
    if (item) {
      this.selectedItem.set(item);
    }
  });

  constructor() {
    this.#spotlight.registerItems(this.items);
  }

  ngOnDestroy() {
    this.#spotlight.disableGlobalShortcuts();
  }

  openSpotlight() {
    const spotlightRef = this.#spotlight.open({
      placeholder: 'Search files, users or settings...',
    });

    spotlightRef.itemSelected.subscribe((item) => {
      this.selectedItem.set(item);
    });
  }

  onContextualToggle(checked: boolean) {
    if (checked) {
      this.#spotlight.setContextualItems(this.contextualItems, true);
    } else {
      this.#spotlight.clearContextualItems();
    }
  }

  onShortcutsToggle(checked: boolean) {
    if (checked) {
      this.#spotlight.enableGlobalShortcuts();
    } else {
      this.#spotlight.disableGlobalShortcuts();
    }
  }
}
