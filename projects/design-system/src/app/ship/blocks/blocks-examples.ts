import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ShipColor,
  ShipBlockBannerVariant,
  ShipBlockHeaderVariant,
  ShipBlockHeroVariant,
  ShipBlockLogosVariant,
  ShipBlockFeaturesVariant,
  ShipBlockSplitVariant,
  ShipBlockStepsVariant,
  ShipBlockStatsVariant,
  ShipBlockTestimonialsVariant,
  ShipBlockPricingVariant,
  ShipBlockFaqVariant,
  ShipBlockCtaVariant,
  ShipBlockNewsletterVariant,
  ShipBlockTeamVariant,
  ShipBlockPostsVariant,
  ShipBlockContactVariant,
  ShipBlockFooterVariant,
} from '@ship-ui/core';
import { ShipButtonGroup } from '@ship-ui/core/ship-button-group';
import { Previewer } from '../../previewer/previewer';
import { BannerSandbox } from './examples/banner-sandbox/banner-sandbox';
import { HeaderSandbox } from './examples/header-sandbox/header-sandbox';
import { HeroSandbox } from './examples/hero-sandbox/hero-sandbox';
import { LogosSandbox } from './examples/logos-sandbox/logos-sandbox';
import { FeaturesSandbox } from './examples/features-sandbox/features-sandbox';
import { SplitSandbox } from './examples/split-sandbox/split-sandbox';
import { StepsSandbox } from './examples/steps-sandbox/steps-sandbox';
import { StatsSandbox } from './examples/stats-sandbox/stats-sandbox';
import { TestimonialsSandbox } from './examples/testimonials-sandbox/testimonials-sandbox';
import { PricingSandbox } from './examples/pricing-sandbox/pricing-sandbox';
import { FaqSandbox } from './examples/faq-sandbox/faq-sandbox';
import { CtaSandbox } from './examples/cta-sandbox/cta-sandbox';
import { NewsletterSandbox } from './examples/newsletter-sandbox/newsletter-sandbox';
import { TeamSandbox } from './examples/team-sandbox/team-sandbox';
import { PostsSandbox } from './examples/posts-sandbox/posts-sandbox';
import { ContactSandbox } from './examples/contact-sandbox/contact-sandbox';
import { FooterSandbox } from './examples/footer-sandbox/footer-sandbox';

@Component({
  selector: 'app-blocks-examples',
  imports: [
    Previewer,
    ShipButtonGroup,
    BannerSandbox,
    HeaderSandbox,
    HeroSandbox,
    LogosSandbox,
    FeaturesSandbox,
    SplitSandbox,
    StepsSandbox,
    StatsSandbox,
    TestimonialsSandbox,
    PricingSandbox,
    FaqSandbox,
    CtaSandbox,
    NewsletterSandbox,
    TeamSandbox,
    PostsSandbox,
    ContactSandbox,
    FooterSandbox,
  ],
  templateUrl: './blocks-examples.html',
  styleUrl: './blocks-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlocksExamples {
  // Sandbox controls live here (projected into the previewer's [controls] slot)
  // so they never show up in the example's source view.
  colors: ShipColor[] = ['primary', 'accent', 'warn', 'error', 'success'];

  bannerVariant = signal<ShipBlockBannerVariant>('');
  bannerColor = signal<ShipColor>('primary');
  headerVariant = signal<ShipBlockHeaderVariant>('');
  heroVariant = signal<ShipBlockHeroVariant>('');
  heroColor = signal<ShipColor>('primary');
  logosVariant = signal<ShipBlockLogosVariant>('');
  featuresVariant = signal<ShipBlockFeaturesVariant>('');
  featuresColor = signal<ShipColor>('primary');
  splitVariant = signal<ShipBlockSplitVariant>('');
  splitColor = signal<ShipColor>('primary');
  stepsVariant = signal<ShipBlockStepsVariant>('');
  stepsColor = signal<ShipColor>('primary');
  statsVariant = signal<ShipBlockStatsVariant>('');
  statsColor = signal<ShipColor>('primary');
  testimonialsVariant = signal<ShipBlockTestimonialsVariant>('');
  testimonialsColor = signal<ShipColor>('primary');
  pricingVariant = signal<ShipBlockPricingVariant>('');
  pricingColor = signal<ShipColor>('primary');
  faqVariant = signal<ShipBlockFaqVariant>('');
  faqColor = signal<ShipColor>('primary');
  ctaVariant = signal<ShipBlockCtaVariant>('');
  ctaColor = signal<ShipColor>('primary');
  newsletterVariant = signal<ShipBlockNewsletterVariant>('');
  newsletterColor = signal<ShipColor>('primary');
  teamVariant = signal<ShipBlockTeamVariant>('');
  postsVariant = signal<ShipBlockPostsVariant>('');
  contactVariant = signal<ShipBlockContactVariant>('');
  contactColor = signal<ShipColor>('primary');
  footerVariant = signal<ShipBlockFooterVariant>('');
}
