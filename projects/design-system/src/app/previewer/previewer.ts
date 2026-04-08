import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { ShipCard, ShipIcon, ShipTabs } from 'ship-ui';
import { ConfigIndicatorComponent } from '../core/components/config-indicator/config-indicator';
import { HighlightFile } from './highlight-file/highlight-file';

@Component({
  selector: 'app-previewer',
  imports: [HighlightFile, ShipTabs, ShipIcon, ShipCard, ConfigIndicatorComponent],
  templateUrl: './previewer.html',
  styleUrl: './previewer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'anchorId()'
  }
})
export class Previewer {
  path = input.required<string>();

  title = input<string>('');
  noSpace = input<boolean>(false);
  configName = input<keyof import('ship-ui').ShipConfig | null>(null);
  view = signal('');

  anchorId = computed(() => {
    const pathValue = this.path();
    const parts = pathValue.split('/');
    return parts[parts.length - 1] || 'example';
  });

  isCopied = signal(false);

  copyLink(event: MouseEvent) {
    event.preventDefault();
    const url = new URL(window.location.href);
    url.hash = this.anchorId();
    navigator.clipboard.writeText(url.toString()).then(() => {
      this.isCopied.set(true);
      setTimeout(() => {
        this.isCopied.set(false);
      }, 2000);
    });
  }
}
