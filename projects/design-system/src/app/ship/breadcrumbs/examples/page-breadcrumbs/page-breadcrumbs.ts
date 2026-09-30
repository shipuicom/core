import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { ShipBreadcrumbs } from '@ship-ui/core/ship-breadcrumbs';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutEmptyState, ShipLayoutPage } from '@ship-ui/core/ship-layout';
import { ShipList } from '@ship-ui/core/ship-list';

interface Page {
  id: string;
  title: string;
  description: string;
  icon: string;
  parent?: string;
}

// Icons only named in data need registering for the icon font subset:
// subset: 'shicon:house' 'shicon:folder-simple' 'shicon:package' 'shicon:book-open' 'shicon:gear'
// 'shicon:sliders' 'shicon:users' 'shicon:user-plus' 'shicon:shield-check'

// In an app these are your routes: each crumb is an `a[routerLink]` to its parent route.
const PAGES: Page[] = [
  { id: 'home', title: 'Home', description: 'Everything in your workspace.', icon: 'house' },
  { id: 'projects', parent: 'home', title: 'Projects', description: 'Apps and sites you ship.', icon: 'folder-simple' },
  { id: 'ship-ui', parent: 'projects', title: 'Ship UI', description: 'The component library.', icon: 'package' },
  { id: 'docs', parent: 'projects', title: 'Docs', description: 'The documentation site.', icon: 'book-open' },
  { id: 'settings', parent: 'home', title: 'Settings', description: 'Workspace preferences.', icon: 'gear' },
  { id: 'general', parent: 'settings', title: 'General', description: 'Name, region and language.', icon: 'sliders' },
  { id: 'team', parent: 'settings', title: 'Team', description: 'People and permissions.', icon: 'users' },
  { id: 'members', parent: 'team', title: 'Members', description: 'Invite and remove people.', icon: 'user-plus' },
  { id: 'roles', parent: 'team', title: 'Roles', description: 'Who can do what.', icon: 'shield-check' },
];

const byId = new Map(PAGES.map((page) => [page.id, page]));

@Component({
  selector: 'app-page-breadcrumbs-example',
  imports: [ShipLayoutPage, ShipLayoutEmptyState, ShipBreadcrumbs, ShipIcon, ShipList],
  templateUrl: './page-breadcrumbs.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageBreadcrumbs {
  currentId = signal('members');

  current = computed(() => byId.get(this.currentId())!);
  children = computed(() => PAGES.filter((page) => page.parent === this.currentId()));

  // Walk up the parents to build the trail, root first.
  trail = computed(() => {
    const trail: Page[] = [];
    for (let page = this.current(); page; page = byId.get(page.parent!)!) {
      trail.unshift(page);
      if (!page.parent) break;
    }
    return trail;
  });

  open(id: string) {
    this.currentId.set(id);
  }
}
