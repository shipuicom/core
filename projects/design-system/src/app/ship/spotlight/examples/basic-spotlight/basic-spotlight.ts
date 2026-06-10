import { Component, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipDialog } from '@ship-ui/core/ship-dialog';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipSpotlight, ShipSpotlightItem } from '@ship-ui/core/ship-spotlight';
import { ShipKbd } from '@ship-ui/core/ship-kbd';

@Component({
  selector: 'basic-spotlight-example',
  standalone: true,
  imports: [ShipButton, ShipDialog, ShipSpotlight, ShipCard, ShipKbd],
  templateUrl: './basic-spotlight.html',
  styleUrl: './basic-spotlight.scss',
})
export class BasicSpotlightExample {
  isOpen = signal(false);
  selectedItem = signal<ShipSpotlightItem | null>(null);

  items: ShipSpotlightItem[] = [
    { id: 'welcome', label: 'Welcome to Ship', category: 'Navigation', icon: 'hand-waving', description: 'Go to the welcome guide page', shortcut: 'g+w' },
    { id: 'start', label: 'Getting Started', category: 'Navigation', icon: 'play', description: 'Learn how to install and configure ShipUI' },
    { id: 'theme', label: 'Open Theme Editor', category: 'Actions', icon: 'paint-roller', description: 'Customize component styling and design tokens', shortcut: 'meta+t' },
    { id: 'buttons', label: 'View Buttons', category: 'Components', icon: 'plus', description: 'Check out the Button sandbox examples' },
    { id: 'dialogs', label: 'View Dialogs', category: 'Components', icon: 'info', description: 'Check out the Dialog sandbox examples' },
    { id: 'profile', label: 'View Profile', category: 'Settings', icon: 'gear', description: 'Edit your account settings and preferences', shortcut: 'meta+p' },
    { id: 'logout', label: 'Log Out', category: 'Settings', icon: 'trash', description: 'Safely end your session' }
  ];

  openSpotlight() {
    this.isOpen.set(true);
  }

  onItemSelected(item: ShipSpotlightItem) {
    this.selectedItem.set(item);
    this.isOpen.set(false);
  }

  onClosed() {
    this.isOpen.set(false);
  }
}
