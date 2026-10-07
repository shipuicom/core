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
  --tree-c: var(--base-12);
  --tree-bg-h: var(--base-3);
  --tree-bg-a: var(--base-4);
  --tree-bg-s: var(--base-4);
  --tree-guide-c: var(--base-4);
  --tree-caret-c: var(--base-9);
  --tree-caret-c-h: var(--base-12);
  --tree-ic: var(--base-9);
  --tree-folder-ic: var(--primary-8);
}`;
}
