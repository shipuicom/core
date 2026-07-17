import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ShipCard } from '@ship-ui/core/ship-card';
import { ShipChip } from '@ship-ui/core/ship-chip';
import { ComponentMetaService } from './component-meta.service';

/**
 * Renders an auto-generated API reference (inputs, outputs, methods, CSS
 * variables) for a ShipUI component/directive/service, sourced from the
 * metadata produced by the MCP scanner. Look the entry up by class `name`
 * (e.g. "ShipSpotlight") or by `selector` (e.g. "sh-spotlight").
 */
@Component({
  selector: 'app-api-reference',
  standalone: true,
  imports: [ShipChip, ShipCard],
  templateUrl: './api-reference.html',
  styleUrl: './api-reference.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiReference {
  name = input<string>();
  selector = input<string>();

  #meta = inject(ComponentMetaService);

  readonly loading = this.#meta.resource.isLoading;
  readonly error = this.#meta.resource.error;

  readonly component = computed(() => {
    const key = this.name() ?? this.selector();
    if (!key) return undefined;
    return this.#meta.find(key);
  });

  readonly kindLabel = computed(() => {
    switch (this.component()?.kind) {
      case 'directive':
        return 'Directive';
      case 'service':
        return 'Service';
      default:
        return 'Component';
    }
  });

  readonly kindColor = computed(() => {
    switch (this.component()?.kind) {
      case 'directive':
        return 'accent';
      case 'service':
        return 'warn';
      default:
        return 'primary';
    }
  });

  readonly models = computed(() => this.component()?.inputs.filter((i) => i.twoWay) ?? []);
  readonly plainInputs = computed(() => this.component()?.inputs.filter((i) => !i.twoWay) ?? []);
}
