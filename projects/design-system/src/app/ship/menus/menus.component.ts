import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { PreviewerComponent } from '../../previewer/previewer.component';
import { PropertyViewerComponent } from '../../property-viewer/property-viewer.component';
import { BaseMenuExampleComponent } from './examples/base-menu-example/base-menu-example.component';
import { IconSuffixMenuComponent } from './examples/icon-suffix-menu/icon-suffix-menu.component';
import { MultiLayerMenuExampleComponent } from './examples/multi-layer-menu-example/multi-layer-menu-example.component';
import { SearchMenuExampleComponent } from './examples/search-menu-example/search-menu-example.component';
import { ToggleSelectMenuExampleComponent } from './examples/toggle-select-menu-example/toggle-select-menu-example.component';

@Component({
  selector: 'app-menus',
  imports: [
    PropertyViewerComponent,
    PreviewerComponent,
    BaseMenuExampleComponent,
    MultiLayerMenuExampleComponent,
    IconSuffixMenuComponent,
    SearchMenuExampleComponent,
    ToggleSelectMenuExampleComponent,
  ],
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class MenusComponent {
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
