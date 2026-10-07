import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';
import { SHIP_CONFIG, shipComponentClasses, ShipColor, ShipSize } from '@ship-ui/core';

/** Number of deterministic hue buckets `sh-avatar` picks from when no `color` is given. */
export const SHIP_AVATAR_HUES = 8;

/**
 * Initials for a name: the first letters of the first and last word (`Simon Pedersen` → `SP`),
 * one letter for a single word (`simon` → `S`), `?` for an empty name.
 */
export function shipAvatarInitials(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0][0].toUpperCase();

  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Stable hue bucket in `[0, SHIP_AVATAR_HUES)` for a name, so the same name always gets the same colour. */
export function shipAvatarHue(name: string | null | undefined): number {
  const text = (name ?? '').trim().toLowerCase();
  let hash = 0;

  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }

  return hash % SHIP_AVATAR_HUES;
}

/**
 * A stacked row of avatars. Shows the first `max` and folds the rest into a `+N` badge.
 * The group's `size` applies to every avatar that has none of its own.
 */
@Component({
  selector: 'sh-avatar-group',
  styleUrl: './ship-avatar.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (overflow() > 0) {
      <span class="sh-avatar-overflow" [attr.aria-label]="overflow() + ' more'">+{{ overflow() }}</span>
    }
  `,
  host: {
    role: 'group',
    '[class.small]': "size() === 'small'",
  },
})
export class ShipAvatarGroup {
  /** How many avatars stay visible before the rest collapse into `+N`. */
  max = input<number, number | string>(3, { transform: (v) => Math.max(0, Number(v) || 0) });
  /** Size applied to avatars in the group that do not set their own. */
  size = input<ShipSize | null>(null);

  avatars = contentChildren(ShipAvatar);

  /** How many avatars are folded into the `+N` badge. */
  overflow = computed(() => Math.max(0, this.avatars().length - this.max()));

  /** Whether the given avatar is past `max` and therefore hidden. */
  isHidden(avatar: ShipAvatar): boolean {
    return this.avatars().indexOf(avatar) >= this.max();
  }
}

/**
 * An avatar: a picture when `src` loads, otherwise 1–2 initials from `name` on a background colour
 * derived from the name (or the given `color`). Put `shTooltip` on it for the full name.
 */
@Component({
  selector: 'sh-avatar',
  styleUrl: './ship-avatar.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showImage()) {
      <img [src]="src()" [alt]="name()" (error)="imageFailed.set(true)" />
    } @else {
      <span class="initials" aria-hidden="true">{{ initials() }}</span>
    }
  `,
  host: {
    class: 'sh-avatar',
    role: 'img',
    '[attr.aria-label]': 'name()',
    '[class]': 'hostClasses()',
    '[class.ring]': 'ring()',
    '[class.hidden]': 'hiddenInGroup()',
  },
})
export class ShipAvatar {
  #group = inject(ShipAvatarGroup, { optional: true });
  #config = inject(SHIP_CONFIG, { optional: true });

  /** The person's name: the source of the initials, the colour and the accessible label. */
  name = input<string>('');
  /** Image URL; the initials show until it loads and again if it fails. */
  src = input<string | null | undefined>(null);
  /** Size preset: `small` or the regular size. Falls back to the enclosing group's size. */
  size = input<ShipSize | null>(null);
  /** Semantic colour scale instead of the name-derived hue. */
  color = input<ShipColor | null>(null);
  /** Draws an activity ring around the avatar (for "is dragging", "is editing" and similar states). */
  ring = input<boolean, boolean | string>(false, { transform: booleanAttribute });
  /** Colour scale of the ring; defaults to `primary`. */
  ringColor = input<ShipColor | null>(null);

  /** Set by the image's error event; a new `src` resets it. */
  imageFailed = linkedSignal({ source: this.src, computation: () => false });

  initials = computed(() => shipAvatarInitials(this.name()));
  hue = computed(() => shipAvatarHue(this.name()));
  showImage = computed(() => !!this.src() && !this.imageFailed());
  effectiveSize = computed(() => this.size() ?? this.#group?.size() ?? null);
  hiddenInGroup = computed(() => this.#group?.isHidden(this) ?? false);

  /** `color` falls back to `ShipConfig.avatar.color`; the name-derived hue only applies when neither is set. */
  effectiveColor = computed(() => this.color() ?? this.#config?.avatar?.color ?? null);

  #configClasses = shipComponentClasses('avatar', { color: this.effectiveColor, size: this.effectiveSize });

  hostClasses = computed(() => {
    const classes: string[] = [];
    const configClasses = this.#configClasses();
    const ringColor = this.ringColor();

    if (configClasses) classes.push(configClasses);
    if (!this.effectiveColor()) classes.push(`hue-${this.hue()}`);
    if (ringColor) classes.push(`ring-${ringColor}`);

    return classes.join(' ');
  });
}
