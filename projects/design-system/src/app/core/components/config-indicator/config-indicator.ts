import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AppConfigService } from '../../services/app-config.service';
import { ShipConfig, ShipIcon } from 'ship-ui';

@Component({
  selector: 'app-config-indicator',
  standalone: true,
  imports: [ShipIcon],
  template: `
    @if (isAltered()) {
      <div class="indicator" title="Altered by global config">
        <sh-icon>gear</sh-icon> Modified by Global Config
      </div>
    }
  `,
  styles: `
    .indicator {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 500;
      border-radius: 4px;
      background: var(--primary-alpha-10);
      color: var(--primary-11);
      margin-bottom: 12px;
      border: 1px solid var(--primary-alpha-20);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigIndicatorComponent {
  componentName = input.required<keyof ShipConfig>();
  configService = inject(AppConfigService);

  get isAltered() {
    return () => {
      const configObj = this.configService.config[this.componentName()] as any;
      if (!configObj) return false;
      return Object.values(configObj).some(val => val !== '' && val !== null && val !== undefined);
    };
  }
}
