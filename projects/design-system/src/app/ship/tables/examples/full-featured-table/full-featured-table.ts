import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipTableVariant, ShipTooltip } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCheckbox } from '@ship-ui/core/ship-checkbox';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipResize, ShipSort, ShipStickyColumns, ShipTable } from '@ship-ui/core/ship-table';
import { ShipFormField } from 'ship-ui/ship-form-field';

export interface UserElement {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive' | 'pending';
  lastActive: Date;
  location: string;
  joined: string;
  bio: string;
}

const INITIAL_USERS: UserElement[] = [
  {
    id: 1,
    name: 'Alice Vance',
    email: 'alice@shipui.com',
    role: 'Administrator',
    status: 'active',
    lastActive: new Date('2026-06-10T09:30:00'),
    location: 'San Francisco, CA',
    joined: 'Jan 2025',
    bio: 'Lead platform engineer and architect of the design system components.',
  },
  {
    id: 2,
    name: 'Bob Smith',
    email: 'bob@shipui.com',
    role: 'Developer',
    status: 'active',
    lastActive: new Date('2026-06-09T17:15:00'),
    location: 'Seattle, WA',
    joined: 'Mar 2025',
    bio: 'Frontend engineer specializing in accessible interactive charts and graphs.',
  },
  {
    id: 3,
    name: 'Charlie Brown',
    email: 'charlie@shipui.com',
    role: 'Support',
    status: 'pending',
    lastActive: new Date('2026-06-08T11:00:00'),
    location: 'Austin, TX',
    joined: 'Jun 2025',
    bio: 'Customer success advocate passionate about documentation and developer experience.',
  },
  {
    id: 4,
    name: 'Diana Prince',
    email: 'diana@shipui.com',
    role: 'Product Manager',
    status: 'active',
    lastActive: new Date('2026-06-10T08:45:00'),
    location: 'New York, NY',
    joined: 'Oct 2024',
    bio: 'Product strategist steering the integration of AI-assisted coding tools.',
  },
  {
    id: 5,
    name: 'Evan Wright',
    email: 'evan@shipui.com',
    role: 'Designer',
    status: 'inactive',
    lastActive: new Date('2026-05-24T14:20:00'),
    location: 'London, UK',
    joined: 'Dec 2024',
    bio: 'UI/UX specialist designer who crafted the glassmorphism aesthetic guidelines.',
  },
  {
    id: 6,
    name: 'Fiona Gallagher',
    email: 'fiona@shipui.com',
    role: 'Developer',
    status: 'active',
    lastActive: new Date('2026-06-10T10:05:00'),
    location: 'Chicago, IL',
    joined: 'Feb 2025',
    bio: 'Full stack developer focusing on micro-services and database query optimization.',
  },
  {
    id: 7,
    name: 'George Clark',
    email: 'george@shipui.com',
    role: 'Security Specialist',
    status: 'active',
    lastActive: new Date('2026-06-10T07:10:00'),
    location: 'Boston, MA',
    joined: 'Jul 2024',
    bio: 'AppSec lead responsible for penetration testing and client data safety protocols.',
  },
  {
    id: 8,
    name: 'Hannah Abbott',
    email: 'hannah@shipui.com',
    role: 'QA Lead',
    status: 'pending',
    lastActive: new Date('2026-06-09T16:40:00'),
    location: 'Denver, CO',
    joined: 'Nov 2024',
    bio: 'Quality assurance manager developing end-to-end component testing suites.',
  },
];

@Component({
  selector: 'full-featured-table',
  standalone: true,
  imports: [
    CommonModule,
    ShipTable,
    ShipSort,
    ShipResize,
    ShipStickyColumns,
    ShipCheckbox,
    ShipButton,
    ShipIcon,
    ShipChip,
    ShipTooltip,
    FormsModule,
    ShipFormField,
  ],
  templateUrl: './full-featured-table.html',
  styleUrl: './full-featured-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullFeaturedTable {
  variant = input<ShipTableVariant | null>(null);

  // States
  users = signal<UserElement[]>([...INITIAL_USERS]);
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);
  sortByColumn = signal<string | null>(null);
  selectedUserIds = signal<Set<number>>(new Set());
  expandedUserIds = signal<Set<number>>(new Set());

  // Filtered and sorted data
  displayedUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const currentUsers = this.users();
    const sort = this.sortByColumn();

    // 1. Filter
    let result = query
      ? currentUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query) ||
            u.status.toLowerCase().includes(query)
        )
      : [...currentUsers];

    // 2. Sort
    if (sort) {
      const column = sort.startsWith('-') ? sort.slice(1) : sort;
      const isDescending = sort.startsWith('-');

      result.sort((a: any, b: any) => {
        const valA = a[column];
        const valB = b[column];
        let comp = 0;

        if (typeof valA === 'number' && typeof valB === 'number') {
          comp = valA - valB;
        } else if (valA instanceof Date && valB instanceof Date) {
          comp = valA.getTime() - valB.getTime();
        } else {
          comp = (valA ?? '').toString().localeCompare((valB ?? '').toString(), undefined, { sensitivity: 'base' });
        }

        return isDescending ? -comp : comp;
      });
    }

    return result;
  });

  // Checkbox state helpers
  isAllSelected = computed(() => {
    const data = this.displayedUsers();
    if (data.length === 0) return false;
    return data.every((u) => this.selectedUserIds().has(u.id));
  });

  isSomeSelected = computed(() => {
    const data = this.displayedUsers();
    if (data.length === 0) return false;
    const selectedCount = data.filter((u) => this.selectedUserIds().has(u.id)).length;
    return selectedCount > 0 && selectedCount < data.length;
  });

  toggleSelectAll(checked: boolean) {
    const data = this.displayedUsers();
    const nextSelected = new Set(this.selectedUserIds());
    if (checked) {
      data.forEach((u) => nextSelected.add(u.id));
    } else {
      data.forEach((u) => nextSelected.delete(u.id));
    }
    this.selectedUserIds.set(nextSelected);
  }

  toggleSelectUser(id: number, checked: boolean) {
    const nextSelected = new Set(this.selectedUserIds());
    if (checked) {
      nextSelected.add(id);
    } else {
      nextSelected.delete(id);
    }
    this.selectedUserIds.set(nextSelected);
  }

  toggleExpandUser(id: number, event: MouseEvent) {
    event.stopPropagation();
    const nextExpanded = new Set(this.expandedUserIds());
    if (nextExpanded.has(id)) {
      nextExpanded.delete(id);
    } else {
      nextExpanded.add(id);
    }
    this.expandedUserIds.set(nextExpanded);
  }

  toggleLoading() {
    this.isLoading.set(true);
    setTimeout(() => {
      this.isLoading.set(false);
    }, 1200);
  }

  deleteSelected() {
    const selectedIds = this.selectedUserIds();
    this.users.update((current) => current.filter((u) => !selectedIds.has(u.id)));
    this.selectedUserIds.set(new Set());
    this.expandedUserIds.set(new Set());
  }

  deleteUser(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.users.update((current) => current.filter((u) => u.id !== id));

    const nextSelected = new Set(this.selectedUserIds());
    nextSelected.delete(id);
    this.selectedUserIds.set(nextSelected);

    const nextExpanded = new Set(this.expandedUserIds());
    nextExpanded.delete(id);
    this.expandedUserIds.set(nextExpanded);
  }

  editUser(user: UserElement, event: MouseEvent) {
    event.stopPropagation();
    alert(`Editing user: ${user.name} (${user.email})`);
  }

  resetData() {
    this.users.set([...INITIAL_USERS]);
    this.selectedUserIds.set(new Set());
    this.expandedUserIds.set(new Set());
    this.searchQuery.set('');
    this.sortByColumn.set(null);
  }
}
