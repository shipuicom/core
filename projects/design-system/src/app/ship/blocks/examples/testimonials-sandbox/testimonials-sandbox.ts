import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ShipBlockTestimonialsVariant, ShipColor } from '@ship-ui/core';
import { ShipAvatar } from '@ship-ui/core/ship-avatar';
import { ShipBlockTestimonial, ShipBlockTestimonials } from '@ship-ui/core/ship-block';
import { ShipIcon } from '@ship-ui/core/ship-icon';

const QUOTES = [
  {
    quote: 'We rebuilt our marketing site in two days. The blocks picked up our theme without a single override.',
    name: 'Maya Lindqvist',
    role: 'Head of Design, Fieldnote',
  },
  {
    quote: 'The dashboard and the landing page finally look like the same product. Our designers stopped filing CSS tickets.',
    name: 'Jonas Okafor',
    role: 'Frontend Lead, Parcelry',
  },
  {
    quote: 'Container queries everywhere means the same pricing table works in our docs sidebar and on the homepage.',
    name: 'Priya Raman',
    role: 'Staff Engineer, Orbit Analytics',
  },
  {
    quote: 'Dark mode, RTL and focus styles were simply there. That alone saved us a sprint.',
    name: 'Tomás Herrera',
    role: 'CTO, Kitebase',
  },
  {
    quote: 'I like that everything sits in one layer. Our own CSS always wins, so we never fight the library.',
    name: 'Hannah Becker',
    role: 'Product Engineer, Tidewater Studio',
  },
  {
    quote: 'Signal inputs, standalone components and lazy styles. It feels like it was written for modern Angular, because it was.',
    name: 'Kenji Watanabe',
    role: 'Founder, Lumen Labs',
  },
];

@Component({
  selector: 'app-testimonials-sandbox',
  imports: [ShipBlockTestimonials, ShipBlockTestimonial, ShipAvatar, ShipIcon],
  templateUrl: './testimonials-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsSandbox {
  variant = input<ShipBlockTestimonialsVariant>('');
  color = input<ShipColor>('primary');

  stars = [1, 2, 3, 4, 5];

  // The featured layout is made for one or two big quotes.
  quotes = computed(() => (this.variant() === 'type-b' ? QUOTES.slice(0, 2) : QUOTES));
}
