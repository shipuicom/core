import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipLayoutRankingVariant } from '@ship-ui/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipLayoutRanking, ShipLayoutRankingItem } from '@ship-ui/core/ship-layout';

@Component({
  selector: 'app-ranking-sandbox',
  imports: [ShipLayoutRanking, ShipLayoutRankingItem, ShipCard, ShipButton, ShipIcon],
  templateUrl: './ranking-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingSandbox {
  variant = input<ShipLayoutRankingVariant>('');

  pages = [
    { path: '/pricing', views: 1240 },
    { path: '/docs/getting-started', views: 986 },
    { path: '/blog/launch', views: 712 },
    { path: '/changelog', views: 431 },
    { path: '/about', views: 208 },
  ];
}
