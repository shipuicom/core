import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import {
  ShipBlockContact,
  ShipBlockFooter,
  ShipBlockHeader,
  ShipBlockHero,
  ShipBlockMember,
  ShipBlockNewsletter,
  ShipBlockPost,
  ShipBlockPosts,
  ShipBlockStep,
  ShipBlockSteps,
  ShipBlockTeam,
} from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-company-page-example',
  imports: [
    ShipBlockHeader,
    ShipBlockHero,
    ShipBlockSteps,
    ShipBlockStep,
    ShipBlockTeam,
    ShipBlockMember,
    ShipBlockPosts,
    ShipBlockPost,
    ShipBlockContact,
    ShipBlockNewsletter,
    ShipBlockFooter,
    ShipAvatar,
    ShipButton,
    ShipChip,
    ShipFormField,
    ShipIcon,
  ],
  templateUrl: './company-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyPageExample {
  team = [
    { name: 'Ingrid Holm', role: 'Co-founder, CEO' },
    { name: 'Ravi Menon', role: 'Co-founder, CTO' },
    { name: 'Lucía Ortega', role: 'Head of Design' },
    { name: 'Jonas Becker', role: 'Staff Engineer' },
  ];

  posts = [
    {
      image: '/examples/blocks/post-1.svg',
      category: 'Product',
      date: '2026-09-30',
      dateLabel: 'Sep 30, 2026',
      title: 'Real-time sync, two years in the making',
      excerpt: 'What it took to make every board, doc and chart update live, and why we rewrote the storage layer twice.',
    },
    {
      image: '/examples/blocks/post-2.svg',
      category: 'Engineering',
      date: '2026-09-12',
      dateLabel: 'Sep 12, 2026',
      title: 'Feature flags as a planning tool',
      excerpt: 'Shipping dark changed how we write specs.',
    },
    {
      image: '/examples/blocks/post-3.svg',
      category: 'Company',
      date: '2026-08-28',
      dateLabel: 'Aug 28, 2026',
      title: 'We are hiring in Copenhagen',
      excerpt: 'Three new roles across design and engineering.',
    },
  ];
}
