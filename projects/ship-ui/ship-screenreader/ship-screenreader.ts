import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { ShipScreenreaderService } from './ship-screenreader.service';

/**
 * Floating screen-reader simulator panel for accessibility debugging. Drop
 * it anywhere in the app during development: it transcribes what assistive
 * tech would announce for focus moves and `aria-live` changes, with an
 * optional SpeechSynthesis voice-over. The panel removes itself from the
 * accessibility tree so it never announces itself.
 */
@Component({
  selector: 'sh-screenreader',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    'data-ship-screenreader': '',
    '[class]': '"position-" + position()',
  },
  template: `
    <div class="panel">
      <div class="toolbar">
        <span class="title">Screen reader</span>
        <button type="button" (click)="toggle()">
          {{ service.enabled() ? 'On' : 'Off' }}
        </button>
        <button
          type="button"
          [disabled]="!service.speechSupported"
          [title]="service.speechSupported ? 'Speak announcements aloud' : 'SpeechSynthesis not supported in this browser'"
          (click)="service.toggleSpeech()"
        >
          {{ service.speechEnabled() ? '🔊' : '🔇' }}
        </button>
        <button type="button" (click)="service.clearLog()">Clear</button>
      </div>
      <div class="transcript">
        @for (utterance of service.log(); track utterance.id) {
          <div class="utterance" [attr.data-source]="utterance.source">
            <span class="badge">{{ badge(utterance.source) }}</span>
            <span class="text">{{ utterance.text }}</span>
          </div>
        } @empty {
          <div class="empty">
            {{ service.enabled() ? 'Move focus (Tab) or trigger a live region…' : 'Simulator is off' }}
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './ship-screenreader.scss',
})
export class ShipScreenreader {
  readonly service = inject(ShipScreenreaderService);

  /** Start the simulator as soon as the panel renders. */
  startEnabled = input<boolean, string | boolean>(false, { transform: booleanAttribute });
  /** Screen corner the panel is pinned to. */
  position = input<'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'>('bottom-right');

  constructor() {
    afterNextRender(() => {
      if (this.startEnabled()) this.service.enable();
    });
  }

  toggle(): void {
    this.service.enabled() ? this.service.disable() : this.service.enable();
  }

  badge(source: string): string {
    switch (source) {
      case 'focus':
        return 'focus';
      case 'live-assertive':
        return 'assertive';
      case 'live-polite':
        return 'polite';
      default:
        return 'manual';
    }
  }
}
