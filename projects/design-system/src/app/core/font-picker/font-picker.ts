import { ChangeDetectionStrategy, Component, computed, DOCUMENT, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShipSelect } from '@ship-ui/core/ship-select';
import { AppConfigService } from '../services/app-config.service';

export interface GoogleFont {
  /** Family name as Google Fonts spells it. */
  value: string;
  label: string;
  category: 'sans' | 'serif' | 'mono' | 'display';
}

/** Default family shipped with ShipUI; an empty value in the config means "use it". */
export const DEFAULT_FONT_LABEL = 'Inter Tight (default)';

/** A curated slice of Google Fonts that pair well with the ShipUI type scale. */
export const GOOGLE_FONTS: GoogleFont[] = [
  { value: '', label: DEFAULT_FONT_LABEL, category: 'sans' },
  ...(
    [
      ['Inter', 'sans'],
      ['Roboto', 'sans'],
      ['Open Sans', 'sans'],
      ['Lato', 'sans'],
      ['Montserrat', 'sans'],
      ['Poppins', 'sans'],
      ['Nunito', 'sans'],
      ['Raleway', 'sans'],
      ['Work Sans', 'sans'],
      ['DM Sans', 'sans'],
      ['Manrope', 'sans'],
      ['Source Sans 3', 'sans'],
      ['Rubik', 'sans'],
      ['Figtree', 'sans'],
      ['Plus Jakarta Sans', 'sans'],
      ['Outfit', 'sans'],
      ['Space Grotesk', 'sans'],
      ['IBM Plex Sans', 'sans'],
      ['Karla', 'sans'],
      ['Mulish', 'sans'],
      ['Quicksand', 'sans'],
      ['Barlow', 'sans'],
      ['Fira Sans', 'sans'],
      ['Noto Sans', 'sans'],
      ['Ubuntu', 'sans'],
      ['Playfair Display', 'serif'],
      ['Merriweather', 'serif'],
      ['Lora', 'serif'],
      ['Libre Baskerville', 'serif'],
      ['EB Garamond', 'serif'],
      ['Crimson Text', 'serif'],
      ['Bitter', 'serif'],
      ['Roboto Slab', 'serif'],
      ['Oswald', 'display'],
      ['Josefin Sans', 'display'],
      ['JetBrains Mono', 'mono'],
      ['Space Mono', 'mono'],
    ] as const
  ).map(([value, category]) => ({ value, label: value, category })),
];

/** Google Fonts CSS URL for a family: the whole family (the weights the type scale uses) or only the glyphs of `text`. */
export function googleFontUrl(family: string, text?: string): string {
  const name = encodeURIComponent(family).replace(/%20/g, '+');
  const params = text ? `family=${name}&text=${encodeURIComponent(text)}` : `family=${name}:wght@500;600`;
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Picks the app font from a curated Google Fonts list. Every option renders in its own face: the first time the
 * picker is touched, a tiny per-family subset (only the glyphs of the family name) is fetched for the previews,
 * and the full family is only loaded once it is chosen (see AppConfigService).
 */
@Component({
  selector: 'app-font-picker',
  imports: [FormsModule, ShipSelect],
  templateUrl: './font-picker.html',
  styleUrl: './font-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(pointerenter)': 'loadPreviews()',
    '(focusin)': 'loadPreviews()',
  },
})
export class FontPicker {
  #config = inject(AppConfigService);
  #document = inject(DOCUMENT);
  #previewsLoaded = signal(false);

  readonly fonts = GOOGLE_FONTS;
  /** The chosen family; `''` is the built-in Inter Tight. */
  value = computed(() => this.#config.config.fontFamily ?? '');
  previewsLoaded = this.#previewsLoaded.asReadonly();

  select(family: string) {
    this.#config.updateConfig({ fontFamily: family || undefined });
  }

  /** Font stack for an option's preview text; the default option stays in the app font. */
  previewFamily(font: GoogleFont): string | null {
    return font.value ? `'${font.value}', ${font.category === 'mono' ? 'monospace' : font.category === 'serif' ? 'serif' : 'sans-serif'}` : null;
  }

  /** Injects one subset stylesheet per family (a few hundred bytes each) so the list can show real previews. */
  loadPreviews() {
    if (this.#previewsLoaded()) return;
    this.#previewsLoaded.set(true);
    const head = this.#document.head;
    for (const font of this.fonts) {
      if (!font.value || head.querySelector(`link[data-font-preview="${font.value}"]`)) continue;
      const link = this.#document.createElement('link');
      link.rel = 'stylesheet';
      link.href = googleFontUrl(font.value, font.value);
      link.dataset['fontPreview'] = font.value;
      head.appendChild(link);
    }
  }
}
