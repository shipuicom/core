import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipTabs } from '@ship-ui/core/ship-tabs';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';
import { PropertyViewer } from '../../property-viewer/property-viewer';
import { BasicWindowManager } from './examples/basic-window-manager/basic-window-manager';
import { DockWindowManager } from './examples/dock-window-manager/dock-window-manager';
import { GridMoveWindowManager } from './examples/grid-move-window-manager/grid-move-window-manager';
import { GridWindowManager } from './examples/grid-window-manager/grid-window-manager';
import { TabsWindowManager } from './examples/tabs-window-manager/tabs-window-manager';

@Component({
  selector: 'app-window-manager',
  imports: [
    ShipTabs,
    ApiReference,
    Previewer,
    PropertyViewer,
    Highlight,
    BasicWindowManager,
    TabsWindowManager,
    GridWindowManager,
    GridMoveWindowManager,
    DockWindowManager,
  ],
  templateUrl: './window-manager.html',
  styleUrl: './window-manager.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class WindowManager {
  activeTab = signal('overview');

  usageExample = `import { ShipWindowManager, ShipWindow } from '@ship-ui/core/ship-window-manager';

@Component({
  selector: 'app-desktop',
  imports: [ShipWindowManager, ShipWindow],
  template: \`
    <sh-window-manager mode="dock">
      <ng-template shWindow windowId="editor" windowTitle="Editor" windowIcon="code">
        Editor content…
      </ng-template>
      <ng-template shWindow windowId="preview" windowTitle="Preview" windowIcon="browser">
        Preview content…
      </ng-template>
    </sh-window-manager>\`,
})
export class Desktop {}`;
}
