import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-editors-styling',
  imports: [Highlight, PropertyViewer],
  templateUrl: './editors-styling.html',
  styleUrl: './editors-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsStyling {
  stylingExample = `<!-- Google-Docs-style page canvas (variant), like any Ship component -->
<sh-editor variant="document" [(value)]="content"></sh-editor>

<!-- Opt in to image mid-edge (one-axis) resize handles -->
<sh-editor [imageEdgeResize]="true" ...></sh-editor>`;
}
