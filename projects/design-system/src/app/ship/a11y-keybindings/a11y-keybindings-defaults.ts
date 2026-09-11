import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DEFAULT_KEYBINDINGS, formatShortcut } from '@ship-ui/core/ship-a11y-keybindings';
import { PropertyViewer } from '../../property-viewer/property-viewer';

interface Group {
  name: string;
  rows: { action: string; keys: string[] }[];
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

/** Groups DEFAULT_KEYBINDINGS by the prefix before the first dot, so the table never drifts from the service. */
function group(): Group[] {
  const groups = new Map<string, Group>();
  for (const [action, binding] of Object.entries(DEFAULT_KEYBINDINGS)) {
    const name = action.split('.')[0];
    const g = groups.get(name) ?? { name, rows: [] };
    g.rows.push({
      action,
      keys: binding.split(',').map((k) => formatShortcut(k.trim(), isMac)),
    });
    groups.set(name, g);
  }
  return [...groups.values()];
}

@Component({
  selector: 'app-a11y-keybindings-defaults',
  imports: [PropertyViewer],
  templateUrl: './a11y-keybindings-defaults.html',
  styleUrl: './a11y-keybindings-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class A11yKeybindingsDefaults {
  groups = group();
}
