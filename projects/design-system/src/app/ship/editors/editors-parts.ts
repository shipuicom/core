import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';
import { Highlight } from '../../previewer/highlight/highlight';
import { PropertyViewer } from '../../property-viewer/property-viewer';

@Component({
  selector: 'app-editors-parts',
  imports: [ApiReference, Highlight, PropertyViewer],
  templateUrl: './editors-parts.html',
  styleUrl: './editors-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class EditorsParts {
  behaviorExample = `import { BaseInlineBehavior, ASTMark } from '@ship-ui/core/ship-editor';

// A custom "highlight" mark, registered via the [behaviors] input.
class HighlightBehavior extends BaseInlineBehavior {
  readonly type = 'highlight';
  override isSticky = true;
  parseDOM(el: HTMLElement) {
    return el.tagName.toLowerCase() === 'mark' ? { type: this.type } : null;
  }
  renderHTML(_mark: ASTMark, text: string) {
    return \`<mark>\${text}</mark>\`;
  }
}

// <sh-editor [behaviors]="[new HighlightBehavior()]" ...>`;
}
