import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal, TemplateRef, viewChild } from '@angular/core';
import { ShipTableVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTable, ShipTableColumn, ShipTableContent } from '@ship-ui/core/ship-table';

export interface ConfigUserElement {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  joined: string;
  bio: string;
}

const INITIAL_USERS: ConfigUserElement[] = [
  {
    id: 1,
    name: 'Alice Vance',
    email: 'alice@shipui.com',
    role: 'Administrator',
    active: true,
    joined: '2025-01-15T09:30:00',
    bio: 'Lead platform engineer and architect of the design system components.',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@shipui.com',
    role: 'Developer',
    active: true,
    joined: '2025-03-22T17:15:00',
    bio: 'Frontend engineer specializing in accessible interactive charts and graphs.',
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@shipui.com',
    role: 'Support',
    active: false,
    joined: '2025-06-05T11:00:00',
    bio: 'Customer success advocate passionate about documentation and developer experience.',
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@shipui.com',
    role: 'Product Manager',
    active: true,
    joined: '2024-10-12T08:45:00',
    bio: 'Product strategist steering the integration of AI-assisted coding tools.',
  },
  {
    id: 5,
    name: 'Evan Wright',
    email: 'evan@shipui.com',
    role: 'Designer',
    active: false,
    joined: '2024-12-01T14:20:00',
    bio: 'UI/UX specialist designer who crafted the glassmorphism aesthetic guidelines.',
  },
];

@Component({
  selector: 'config-table',
  standalone: true,
  imports: [CommonModule, ShipTable, ShipTableContent, ShipButton, ShipIcon],
  templateUrl: './config-table.html',
  styleUrl: './config-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigTable {
  variant = input<ShipTableVariant | null>(null);

  // Sample data
  users = signal<ConfigUserElement[]>([...INITIAL_USERS]);
  isLoading = signal<boolean>(false);
  gridMode = signal<boolean>(false);

  // Template viewChild references
  nameTemplate = viewChild.required<TemplateRef<any>>('nameTemplate');
  actionsTemplate = viewChild.required<TemplateRef<any>>('actionsTemplate');

  // Reactively build columns once templates are loaded
  columns = computed<ShipTableColumn<ConfigUserElement>[]>(() => [
    {
      id: 'id',
      header: 'ID',
      type: 'number',
      sortable: true,
      size: '60px',
      sticky: 'start',
    },
    {
      id: 'name',
      header: 'User',
      type: 'string',
      sortable: true,
      size: '220px',
      sticky: 'start',
      cellTemplate: this.nameTemplate(),
      rowHeader: true,
    },
    {
      id: 'role',
      header: 'Role',
      type: 'badge',
      sortable: true,
      size: '150px',
    },
    {
      id: 'active',
      header: 'Active Status',
      type: 'boolean',
      sortable: true,
      size: '120px',
    },
    {
      id: 'joined',
      header: 'Joined Date',
      type: 'date',
      sortable: true,
      size: '140px',
    },
    {
      id: 'bio',
      header: 'Bio',
      type: 'string',
      resizable: true,
      size: '1fr',
    },
    {
      id: 'actions',
      header: 'Actions',
      sticky: 'end',
      cellTemplate: this.actionsTemplate(),
    },
  ]);

  toggleLoading() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  deleteUser(id: number) {
    this.users.update((current) => current.filter((u) => u.id !== id));
  }

  editUser(user: ConfigUserElement) {
    alert(`Editing user: ${user.name}`);
  }

  resetData() {
    this.users.set([...INITIAL_USERS]);
  }
}
