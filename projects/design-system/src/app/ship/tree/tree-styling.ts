import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Highlight } from '../../previewer/highlight/highlight';

@Component({
  selector: 'app-tree-styling',
  imports: [Highlight],
  template: `
    <p>Customize the look and feel of the Tree component using CSS variables:</p>
    <app-highlight lang="scss" [content]="stylingCode" />
  `,
  styleUrl: './tree-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class TreeStyling {
  stylingCode = `/* Customizing Tree variables */
sh-tree {
  --tree-bg: var(--base-2);
  --tree-bc: var(--base-3);
  --tree-color: var(--base-12);
  --tree-hover-bg: var(--base-3);
  --tree-active-bg: var(--base-4);
  --tree-selected-bg: var(--base-4);
  --tree-guide-color: var(--base-4);
  --tree-caret-color: var(--base-9);
  --tree-caret-hover-color: var(--base-12);
  --tree-icon-color: var(--base-9);
  --tree-icon-folder-color: var(--primary-8);
}`;
}
