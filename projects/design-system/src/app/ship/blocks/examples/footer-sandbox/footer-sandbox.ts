import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ShipBlockFooterVariant } from '@ship-ui/core';
import { ShipBlockFooter } from '@ship-ui/core/ship-block';
import { ShipIcon } from '@ship-ui/core/ship-icon';

const COLUMNS = [
  { title: 'Product', links: ['Components', 'Blocks', 'Themes', 'Pricing', 'Changelog'] },
  { title: 'Resources', links: ['Documentation', 'Guides', 'Examples', 'MCP server'] },
  { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'Licence'] },
];

@Component({
  selector: 'app-footer-sandbox',
  imports: [ShipBlockFooter, ShipIcon],
  templateUrl: './footer-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterSandbox {
  variant = input<ShipBlockFooterVariant>('');

  // The inline variants put every link in one row, so they get the top links of each column only.
  columns = computed(() =>
    this.variant() ? COLUMNS.map((column) => ({ ...column, links: column.links.slice(0, 2) })) : COLUMNS
  );
}
