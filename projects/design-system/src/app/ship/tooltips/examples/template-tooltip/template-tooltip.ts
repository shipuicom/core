import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { ShipButton } from '@ship-ui/core/ship-button';
import { ShipIcon } from '@ship-ui/core/ship-icon';
import { ShipTooltip } from '@ship-ui/core';

type Timeout = ReturnType<typeof setTimeout>;

@Component({
  selector: 'app-template-tooltip',
  imports: [ShipIcon, ShipButton, ShipTooltip],
  templateUrl: './template-tooltip.html',
  styleUrl: './template-tooltip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateTooltip implements OnInit, OnDestroy {
  toggle = signal(false);

  intervalId?: Timeout;

  value = signal('Tooltip A');

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.toggle.update((v) => !v);
      this.value.set(this.toggle() ? 'Tooltip A' : 'Tooltip B');
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
