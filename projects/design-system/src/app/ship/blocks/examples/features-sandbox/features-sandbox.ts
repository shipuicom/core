import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockFeaturesVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockFeature, ShipBlockFeatures } from '@ship-ui/core/ship-block';
import { ShipIcon } from '@ship-ui/core/ship-icon';

// subset: 'shicon:arrows-out-line-horizontal' 'shicon:lightning' 'shicon:palette' 'shicon:puzzle-piece' 'shicon:sliders-horizontal' 'shicon:wheelchair'
@Component({
  selector: 'app-features-sandbox',
  imports: [ShipBlockFeatures, ShipBlockFeature, ShipIcon],
  templateUrl: './features-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesSandbox {
  variant = input<ShipBlockFeaturesVariant>('');
  color = input<ShipColor>('primary');

  features = [
    { icon: 'palette', title: 'Themed by default', text: 'Every block reads your palette, shape and density tokens.' },
    { icon: 'arrows-out-line-horizontal', title: 'Container aware', text: 'Blocks reflow to their own width, not the viewport.' },
    { icon: 'puzzle-piece', title: 'Slot based', text: 'Put an h2, a p and some buttons in; the block lays them out.' },
    { icon: 'lightning', title: 'Lazy styles', text: 'A block ships its CSS with the component, nothing global.' },
    { icon: 'wheelchair', title: 'Accessible', text: 'Real headings, landmarks and focus styles out of the box.' },
    { icon: 'sliders-horizontal', title: 'Overridable', text: 'All ShipUI CSS sits in one layer, so your CSS always wins.' },
  ];
}
