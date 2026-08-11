import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-sortables-styling',
  imports: [Highlight],
  template: `
    <p>Use the following CSS classes to customize the appearance of the tree sorting drop indicators.</p>
    <app-highlight lang="scss" [content]="codeStylingExample" />
  `,
  styleUrl: './sortables-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SortablesStyling {
  codeStylingExample = `/* Customizing Tree Drop Indicators */
.sh-sortable-tree {
  // Styles applied to folder node when hovering in the middle
  .drop-inside {
    background: var(--primary-3) !important;
    outline: 2px solid var(--primary-8) !important;
  }

  // Insertion line when hovering near the top
  .drop-before::before {
    background: var(--primary-8) !important;
    height: 2px;
  }

  // Insertion line when hovering near the bottom
  .drop-after::after {
    background: var(--primary-8) !important;
    height: 2px;
  }
}`;
}
