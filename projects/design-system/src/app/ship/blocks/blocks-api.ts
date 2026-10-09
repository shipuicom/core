import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ApiReference } from '../../api-reference/api-reference';

@Component({
  selector: 'app-blocks-api',
  imports: [ApiReference],
  template: `
    @for (name of names; track name) {
      <app-api-reference [name]="name" />
    }
  `,
  styleUrl: './blocks-tab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BlocksApi {
  names = [
    'ShipBlockBanner',
    'ShipBlockHeader',
    'ShipBlockHero',
    'ShipBlockLogos',
    'ShipBlockFeatures',
    'ShipBlockFeature',
    'ShipBlockSplit',
    'ShipBlockSteps',
    'ShipBlockStep',
    'ShipBlockStats',
    'ShipBlockStat',
    'ShipBlockTestimonials',
    'ShipBlockTestimonial',
    'ShipBlockPricing',
    'ShipBlockPricingTier',
    'ShipBlockFaq',
    'ShipBlockCta',
    'ShipBlockNewsletter',
    'ShipBlockTeam',
    'ShipBlockMember',
    'ShipBlockPosts',
    'ShipBlockPost',
    'ShipBlockContact',
    'ShipBlockFooter',
  ];
}
