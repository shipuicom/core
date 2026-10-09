import { ChangeDetectionStrategy, Component, ElementRef, input, model, viewChild, ViewEncapsulation } from '@angular/core';
import { generateUniqueId, shipComponentClasses } from '@ship-ui/core';
import { ShipBlockHeaderVariant } from '@ship-ui/core';
import { ShipIcon } from '@ship-ui/core/ship-icon';

/**
 * Site navigation bar: `[logo]` (brand link or image), `nav` (`a` links, directly or in a `ul`; mark the current one
 * with `aria-current="page"`), `[actions]` (buttons such as Sign in / Get started) and any other content, which sits
 * with the actions. Below a medium width the nav and actions collapse into a panel behind a menu button the block
 * renders itself; Escape or following a link closes it. Wrap it in a `<header>` (or give it `role="banner"`) for the
 * landmark, and add the class `sticky` to pin it to the top of the page.
 */
@Component({
  selector: 'sh-bl-header',
  styleUrl: './ship-header.scss',
  encapsulation: ViewEncapsulation.None,
  imports: [ShipIcon],
  template: `
    <div class="inner">
      <div class="logo"><ng-content select="[logo]" /></div>
      <button
        #toggle
        type="button"
        class="toggle"
        aria-label="Menu"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="panelId"
        (click)="open.set(!open())">
        @if (open()) {
          <sh-icon>x-bold</sh-icon>
        } @else {
          <sh-icon>list</sh-icon>
        }
      </button>
      <div class="panel" [id]="panelId" [class.open]="open()" (click)="onPanelClick($event)">
        <ng-content select="nav" />
        <div class="actions">
          <ng-content select="[actions]" />
          <ng-content />
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'hostClasses()',
    '(keydown.escape)': 'onEscape()',
  },
})
export class ShipBlockHeader {
  /** Visual variant: default logo and nav on the left with the actions at the end, `type-b` the nav centred between logo and actions, `type-c` a floating rounded bar inset from the edges. Project default via `ShipConfig.blockHeader.variant`. */
  variant = input<ShipBlockHeaderVariant | null>(null);
  /** Whether the collapsed (narrow) menu panel is open. */
  open = model<boolean>(false);

  protected panelId = 'sh-bl-header-' + generateUniqueId();
  private toggle = viewChild.required<ElementRef<HTMLButtonElement>>('toggle');

  hostClasses = shipComponentClasses('blockHeader', { variant: this.variant });

  protected onPanelClick(event: MouseEvent) {
    if (this.open() && (event.target as Element | null)?.closest('a')) {
      this.open.set(false);
    }
  }

  protected onEscape() {
    if (!this.open()) return;

    this.open.set(false);
    this.toggle().nativeElement.focus();
  }
}
