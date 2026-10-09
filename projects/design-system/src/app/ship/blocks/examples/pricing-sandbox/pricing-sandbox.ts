import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipBlockPricingVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockPricing, ShipBlockPricingTier } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { ShipChip } from '@ship-ui/core/ship-chip';

type Billing = 'monthly' | 'yearly';

const TIERS = [
  {
    name: 'Hobby',
    text: 'For side projects and kicking the tyres.',
    prices: { monthly: 0, yearly: 0 },
    features: ['All 60+ components', 'Community support', 'One project', 'MIT licensed core'],
    cta: 'Start for free',
    featured: false,
  },
  {
    name: 'Pro',
    text: 'For freelancers and products that ship weekly.',
    prices: { monthly: 29, yearly: 24 },
    features: ['Everything in Hobby', 'All website blocks', 'Figma kit and themes', 'Unlimited projects', 'Priority email support'],
    cta: 'Start 14-day trial',
    featured: true,
  },
  {
    name: 'Team',
    text: 'For product teams sharing one design system.',
    prices: { monthly: 79, yearly: 64 },
    features: ['Everything in Pro', 'Up to 10 seats', 'Shared design tokens', 'SSO and audit log'],
    cta: 'Contact sales',
    featured: false,
  },
];

@Component({
  selector: 'app-pricing-sandbox',
  imports: [ShipBlockPricing, ShipBlockPricingTier, ShipButton, ShipButtonGroup, ShipChip],
  templateUrl: './pricing-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSandbox {
  variant = input<ShipBlockPricingVariant>('');
  color = input<ShipColor>('primary');

  billing = signal<string | null>('monthly');

  tiers = computed(() => {
    const billing: Billing = this.billing() === 'yearly' ? 'yearly' : 'monthly';

    return TIERS.map((tier) => ({
      ...tier,
      price: tier.prices[billing],
      period: tier.prices[billing] === 0 ? 'free forever' : billing === 'yearly' ? '/month, billed yearly' : '/month',
    }));
  });
}
