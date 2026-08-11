import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ShipEditor, ShipEditorActionDirective, ShipEditorToolbar } from '@ship-ui/core/ship-editor';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { Highlight } from '../../previewer/highlight/highlight';
import { Previewer } from '../../previewer/previewer';

@Component({
  selector: 'app-editors-overview',
  imports: [Highlight, Previewer, ShipEditor, ShipEditorToolbar, ShipEditorActionDirective, ShipIcon],
  templateUrl: './editors-overview.html',
  styleUrl: './editors-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsOverview {
  usageExample = `import { Component, signal } from '@angular/core';
import { ShipEditor, ShipEditorToolbar, ShipEditorActionDirective } from '@ship-ui/core/ship-editor';

@Component({
  selector: 'app-my-editor',
  imports: [ShipEditor, ShipEditorToolbar, ShipEditorActionDirective],
  template: \`
    <sh-editor [(value)]="content" format="html">
      <sh-editor-toolbar position="top">
        <button shEditorAction="bold" aria-label="Bold">B</button>
        <button shEditorAction="italic" aria-label="Italic">I</button>
        <button shEditorAction="heading" [shEditorActionAttrs]="{ level: 1 }">H1</button>
      </sh-editor-toolbar>
    </sh-editor>\`,
})
export class MyEditor {
  content = signal('<p>Hello, world.</p>');
}`;

  basicValue = signal(
    '<h2>Start here</h2><p>A <strong>basic</strong> editor — try <em>formatting</em>, headings, lists and links.</p><ul><li>Bold, italic, headings</li><li>Bullet lists</li></ul>'
  );
}
