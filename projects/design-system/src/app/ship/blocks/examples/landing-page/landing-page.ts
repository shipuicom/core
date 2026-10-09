import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import {
  ShipBlockBanner,
  ShipBlockCta,
  ShipBlockFaq,
  ShipBlockFeature,
  ShipBlockFeatures,
  ShipBlockFooter,
  ShipBlockHeader,
  ShipBlockHero,
  ShipBlockLogos,
  ShipBlockPricing,
  ShipBlockPricingTier,
  ShipBlockSplit,
  ShipBlockStat,
  ShipBlockStats,
  ShipBlockTestimonial,
  ShipBlockTestimonials,
} from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ShipIcon } from '@ship-ui/core/ship-icon';

// subset: 'shicon:chart-line-up' 'shicon:file-text' 'shicon:kanban'
@Component({
  selector: 'app-landing-page-example',
  imports: [
    ShipBlockBanner,
    ShipBlockHeader,
    ShipBlockHero,
    ShipBlockLogos,
    ShipBlockFeatures,
    ShipBlockFeature,
    ShipBlockSplit,
    ShipBlockStats,
    ShipBlockStat,
    ShipBlockTestimonials,
    ShipBlockTestimonial,
    ShipBlockPricing,
    ShipBlockPricingTier,
    ShipBlockFaq,
    ShipBlockCta,
    ShipBlockFooter,
    ShipAvatar,
    ShipButton,
    ShipChip,
    ShipIcon,
  ],
  templateUrl: './landing-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageExample {
  features = [
    { icon: 'kanban', title: 'Roadmaps', text: 'Drag work between now, next and later without losing the why.' },
    { icon: 'file-text', title: 'Docs', text: 'Specs live next to the tasks they describe and update together.' },
    { icon: 'chart-line-up', title: 'Metrics', text: 'Charts from your own events, annotated with every release.' },
  ];

  quotes = [
    { name: 'Maya Lindqvist', role: 'Head of Product, Peakform', quote: 'We retired three tools in the first month. Planning meetings got shorter, too.' },
    { name: 'Tomás Rivera', role: 'Engineering Lead, Voltwave', quote: 'Release annotations on the charts settled more arguments than any retro ever did.' },
    { name: 'Aiko Tanaka', role: 'Founder, Orbitly', quote: 'It is the first workspace our designers and engineers both open without being asked.' },
  ];

  tiers = [
    {
      name: 'Starter',
      description: 'For small teams finding their rhythm.',
      price: '$0',
      features: ['Up to 5 members', 'Unlimited projects', 'Community support'],
      cta: 'Start free',
      featured: false,
    },
    {
      name: 'Team',
      description: 'For teams shipping every week.',
      price: '$12',
      features: ['Unlimited members', 'Insights and digests', 'Priority support'],
      cta: 'Start a trial',
      featured: true,
    },
    {
      name: 'Enterprise',
      description: 'For organisations with many teams.',
      price: '$29',
      features: ['SSO and audit log', 'Custom retention', 'Dedicated manager'],
      cta: 'Talk to sales',
      featured: false,
    },
  ];

  faq = [
    { q: 'Is there a free plan?', a: 'Yes. Starter is free for teams of up to five, with no time limit.' },
    { q: 'Can I import from other tools?', a: 'Acme imports issues, docs and boards from the common trackers in a few clicks.' },
    { q: 'Where is my data stored?', a: 'In the EU or the US, your choice, encrypted at rest and in transit.' },
  ];

  footer = [
    { title: 'Product', links: ['Roadmaps', 'Docs', 'Insights', 'Changelog'] },
    { title: 'Company', links: ['About', 'Careers', 'Blog', 'Contact'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Security'] },
  ];
}
