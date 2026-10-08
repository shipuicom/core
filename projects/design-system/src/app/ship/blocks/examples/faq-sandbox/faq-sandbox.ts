import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockFaqVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockFaq } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-faq-sandbox',
  imports: [ShipBlockFaq, ShipButton, ShipIcon],
  templateUrl: './faq-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSandbox {
  variant = input<ShipBlockFaqVariant>('');
  color = input<ShipColor>('primary');

  questions = [
    {
      q: 'Is ShipUI free to use?',
      a: 'The core library is MIT licensed and free forever. The paid plans add website blocks, the Figma kit and priority support.',
    },
    {
      q: 'Which Angular versions are supported?',
      a: 'ShipUI follows Angular closely: every release supports the current major and the one before it, with signal inputs and standalone components throughout.',
    },
    {
      q: 'Can I use my own brand colours?',
      a: 'Yes. Register a palette once and every component, block and chart picks it up through the colour tokens, in light and dark mode.',
    },
    {
      q: 'Do the blocks work without the rest of the library?',
      a: 'Blocks only depend on the core styles. Import the ones you use; each ships its own CSS, so nothing else ends up in your bundle.',
    },
    {
      q: 'How do I override a style?',
      a: 'All ShipUI CSS lives in one cascade layer, so any rule you write wins. Most changes are a single token, like --pricing-cols or --hero-mw.',
    },
    {
      q: 'Can I cancel or switch plans later?',
      a: 'Any time. Upgrades apply right away, downgrades at the end of the billing period, and yearly plans are refunded pro rata.',
    },
  ];
}
