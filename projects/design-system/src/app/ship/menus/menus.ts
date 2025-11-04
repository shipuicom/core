import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BaseMenuExample } from './examples/base-menu-example/base-menu-example';
import { IconSuffixMenu } from './examples/icon-suffix-menu/icon-suffix-menu';
import { MultiLayerMenuExample } from './examples/multi-layer-menu-example/multi-layer-menu-example';
import { SearchMenuExample } from './examples/search-menu-example/search-menu-example';
import { ToggleSelectMenuExample } from './examples/toggle-select-menu-example/toggle-select-menu-example';

@Component({
  selector: 'app-menus',
  imports: [
    PropertyViewer,
    Previewer,
    BaseMenuExample,
    MultiLayerMenuExample,
    IconSuffixMenu,
    SearchMenuExample,
    ToggleSelectMenuExample,
  ],
  templateUrl: './menus.html',
  styleUrl: './menus.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Menus {
  menuItems = signal<any[]>(new Array(2000).fill(0));
  activeItems = signal<number[]>([]);

  fireHello(index: number) {
    console.log('Hello', index);
  }

  toggleActive(index: number) {
    const activeItems = this.activeItems();

    if (activeItems.includes(index)) {
      this.activeItems.set(activeItems.filter((x) => x !== index));
    } else {
      this.activeItems.update((items) => [...items, index]);
    }
  }

  addOption() {
    this.menuItems.update((items) => [...items, Math.random()]);
  }
}
