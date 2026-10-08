import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ShipBlockNewsletterVariant, ShipColor } from '@ship-ui/core';
import { ShipBlockNewsletter } from '@ship-ui/core/ship-block';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipFormField } from '@ship-ui/core/ship-form-field';
import { ShipIcon } from '@ship-ui/core/ship-icon';

@Component({
  selector: 'app-newsletter-sandbox',
  imports: [ShipBlockNewsletter, ShipButton, ShipFormField, ShipIcon],
  templateUrl: './newsletter-sandbox.html',
  styleUrl: '../sandbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterSandbox {
  variant = input<ShipBlockNewsletterVariant>('');
  color = input<ShipColor>('primary');
}
