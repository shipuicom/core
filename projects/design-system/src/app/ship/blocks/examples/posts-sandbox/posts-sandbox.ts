import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockPostsVariant, ShipColor } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipBlockPost, ShipBlockPosts } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

interface DemoPost {
  image: string;
  category: string;
  color: ShipColor;
  date: string;
  dateLabel: string;
  readTime: number;
  title: string;
  excerpt: string;
  author: string;
}

@Component({
  selector: 'app-posts-sandbox',
  imports: [ShipBlockPosts, ShipBlockPost, ShipAvatar, ShipButton, ShipChip, ShipIcon],
  templateUrl: './posts-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostsSandbox {
  variant = input<ShipBlockPostsVariant>('');

  posts: DemoPost[] = [
    {
      image: '/examples/blocks/post-1.svg',
      category: 'Release',
      color: 'primary',
      date: '2026-10-02',
      dateLabel: 'Oct 2, 2026',
      readTime: 6,
      title: 'ShipUI 0.28: website blocks for every page',
      excerpt:
        'Headers, heroes, pricing tables and footers that follow your theme, reflow to their own width and ship their CSS with the component. Here is what is new and how to adopt it.',
      author: 'Maya Lindqvist',
    },
    {
      image: '/examples/blocks/post-2.svg',
      category: 'Engineering',
      color: 'accent',
      date: '2026-09-18',
      dateLabel: 'Sep 18, 2026',
      readTime: 9,
      title: 'Container queries changed how we build layouts',
      excerpt:
        'Why every block is an inline-size container, what broke when we switched, and the one rule that keeps responsive styles predictable.',
      author: 'Jonas Okafor',
    },
    {
      image: '/examples/blocks/post-3.svg',
      category: 'Design',
      color: 'success',
      date: '2026-09-04',
      dateLabel: 'Sep 4, 2026',
      readTime: 5,
      title: 'One colour token to rule every variant',
      excerpt:
        'How the --c-* tokens let a single stylesheet cover every colour, and why the grey fallback matters more than the colours themselves.',
      author: 'Priya Raman',
    },
  ];
}
