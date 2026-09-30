import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipColor, ShipLayoutTableViewVariant } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipDivider } from '@ship-ui/core/ship-divider';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutTableView, ShipLayoutToolbar } from '@ship-ui/core/ship-layout';
import { ShipTable } from '@ship-ui/core/ship-table';
import { ShipTooltip } from '@ship-ui/core/ship-tooltip';

type Status = 'Active' | 'Trial' | 'Churned';

interface Customer {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: Status;
  mrr: string;
  joined: string;
}

@Component({
  selector: 'app-table-view-sandbox',
  imports: [
    ShipLayoutTableView,
    ShipLayoutToolbar,
    ShipTable,
    ShipAvatar,
    ShipButton,
    ShipButtonGroup,
    ShipCheckbox,
    ShipChip,
    ShipDivider,
    ShipFormField,
    ShipIcon,
    ShipTooltip,
  ],
  templateUrl: './table-view-sandbox.html',
  styleUrl: './table-view-sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableViewSandbox {
  variant = input<ShipLayoutTableViewVariant>('');

  query = signal('');
  status = signal<'' | Status>('');
  selected = signal(new Set<number>());

  statusColor: Record<Status, ShipColor> = { Active: 'success', Trial: 'primary', Churned: 'error' };

  customers: Customer[] = [
    {
      id: 1,
      name: 'Sofia Lund',
      email: 'sofia@northwind.io',
      plan: 'Team',
      status: 'Active',
      mrr: '$240',
      joined: 'Mar 3, 2025',
    },
    {
      id: 2,
      name: 'Mads Holm',
      email: 'mads@holm.dk',
      plan: 'Pro',
      status: 'Active',
      mrr: '$49',
      joined: 'Apr 18, 2025',
    },
    {
      id: 3,
      name: 'Freja Berg',
      email: 'freja@bergdesign.com',
      plan: 'Pro',
      status: 'Trial',
      mrr: '$0',
      joined: 'Sep 21, 2026',
    },
    {
      id: 4,
      name: 'Jonas Krog',
      email: 'jonas@krog.io',
      plan: 'Enterprise',
      status: 'Active',
      mrr: '$1,200',
      joined: 'Jan 9, 2024',
    },
    {
      id: 5,
      name: 'Ida Moller',
      email: 'ida@studio-m.com',
      plan: 'Team',
      status: 'Churned',
      mrr: '$0',
      joined: 'Jun 2, 2025',
    },
    {
      id: 6,
      name: 'Emil Dahl',
      email: 'emil@dahl.co',
      plan: 'Pro',
      status: 'Active',
      mrr: '$49',
      joined: 'Jul 14, 2025',
    },
    {
      id: 7,
      name: 'Clara Skov',
      email: 'clara@skovlabs.com',
      plan: 'Team',
      status: 'Trial',
      mrr: '$0',
      joined: 'Sep 25, 2026',
    },
    {
      id: 8,
      name: 'Oscar Friis',
      email: 'oscar@friis.dev',
      plan: 'Pro',
      status: 'Active',
      mrr: '$49',
      joined: 'Nov 30, 2025',
    },
    {
      id: 9,
      name: 'Alma Juhl',
      email: 'alma@juhl.io',
      plan: 'Enterprise',
      status: 'Active',
      mrr: '$980',
      joined: 'Feb 11, 2025',
    },
    {
      id: 10,
      name: 'Noah Vang',
      email: 'noah@vang.net',
      plan: 'Pro',
      status: 'Churned',
      mrr: '$0',
      joined: 'Aug 5, 2025',
    },
    {
      id: 11,
      name: 'Ella Riis',
      email: 'ella@riis.studio',
      plan: 'Team',
      status: 'Active',
      mrr: '$240',
      joined: 'Oct 22, 2025',
    },
    {
      id: 12,
      name: 'Viktor Lind',
      email: 'viktor@lind.app',
      plan: 'Pro',
      status: 'Trial',
      mrr: '$0',
      joined: 'Sep 27, 2026',
    },
  ];

  rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const status = this.status();
    return this.customers.filter(
      (c) =>
        (!status || c.status === status) &&
        (!q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
    );
  });

  allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.selected().has(row.id));
  });

  toggle(id: number, checked: boolean) {
    const next = new Set(this.selected());
    if (checked) next.add(id);
    else next.delete(id);
    this.selected.set(next);
  }

  toggleAll(checked: boolean) {
    this.selected.set(checked ? new Set(this.rows().map((row) => row.id)) : new Set());
  }
}
