import { ShipVideoQualityLevel } from './engine/types';

/** Common MIMEs autocomplete; `(string & {})` keeps any other string valid without losing literals. */
export type ShipVideoMimeType = 'video/mp4' | 'video/webm' | 'application/vnd.apple.mpegurl' | (string & {});

/** Common BCP-47 codes typed out; regionals and anything else fall through to `(string & {})`. */
export type ShipVideoLang =
  | 'en' | 'da' | 'sv' | 'no' | 'de' | 'nl' | 'fr' | 'es' | 'it' | 'pt'
  | 'pl' | 'fi' | 'ja' | 'ko' | 'zh' | 'ar' | 'hi' | 'ru' | 'tr' | 'uk'
  | 'en-US' | 'en-GB' | 'pt-BR' | 'zh-Hans' | 'zh-Hant'
  | (string & {});

export type ShipVideoSource = {
  src: string;
  type?: ShipVideoMimeType;
  /** Quality variant height, e.g. `1080` → menu label `1080p`, sorted numerically. */
  height?: number;
  /** Label override for the quality menu (`4K`, `HD`). */
  label?: string;
  /** BCP-47 language of this variant, for per-language progressive sources. */
  lang?: ShipVideoLang;
};

export type ShipVideoTrack = {
  src: string;
  srclang: ShipVideoLang;
  label: string;
  kind?: 'subtitles' | 'captions';
  default?: boolean;
};

export type ShipVideoAdCreative = {
  /** Source(s) of the advertisement video played before the content. */
  src: string | ShipVideoSource[];
  /** Seconds until the skip button appears; `null` disables skipping. Defaults to `5`. */
  skipAfter?: number | null;
  /** Click-through link shown while the ad plays. */
  clickThroughUrl?: string;
  /** Label of the click-through link. Defaults to `Visit advertiser`. */
  clickThroughLabel?: string;
  /** Badge text shown while the ad plays. Defaults to `Ad`. */
  label?: string;
};

/**
 * An ad is an inline creative or an async resolver returning one —
 * a VAST client later becomes just another resolver, no breaking change.
 */
export type ShipVideoAd = ShipVideoAdCreative | (() => Promise<ShipVideoAdCreative>);

/** Chapter/cut markers rendered on the scrubber. */
export type ShipVideoMarker = { time: number; label?: string };

export type ShipVideoPlaylistItem = {
  title: string;
  subtitle?: string;
  poster?: string;
  /** Preformatted duration badge, e.g. `12:34`. */
  duration?: string;
  sources: string | ShipVideoSource[];
  ad?: ShipVideoAd;
  tracks?: ShipVideoTrack[];
};

export type ShipVideoTimeRange = { start: number; end: number };

export function shipVideoToSourceArray(value: string | ShipVideoSource[] | null | undefined): ShipVideoSource[] {
  if (!value) return [];
  return typeof value === 'string' ? [{ src: value }] : value;
}

export function shipVideoQualityLabel(source: ShipVideoSource): string {
  return source.label ?? (source.height != null ? `${source.height}p` : 'Default');
}

/** Progressive `height`-tagged variants normalized into the same level shape the engine emits. */
export function shipVideoLevelsFromSources(sources: ShipVideoSource[]): ShipVideoQualityLevel[] {
  const variants = sources.filter((source) => source.height != null || source.label != null);
  if (variants.length < 2) return [];

  return variants
    .slice()
    .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
    .map((source, index) => ({
      id: index,
      height: source.height,
      bitrate: 0,
      label: shipVideoQualityLabel(source),
    }));
}

/** Formats seconds as `m:ss` or `h:mm:ss`. */
export function shipVideoFormatTime(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, '0');

  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
