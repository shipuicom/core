import { canPlayNativeHls, isMseSupported } from './capabilities';
import { HlsEngine } from './hls-engine';
import { NativeHlsEngine } from './native-engine';
import { ProgressiveEngine } from './progressive-engine';
import { ShipVideoEngine, ShipVideoEngineConfig } from './types';

export function isHlsUrl(src: string): boolean {
  return /\.m3u8(\?|#|$)/.test(src);
}

/**
 * Picks the right engine for a source. `.m3u8` → native HLS where the browser
 * has it (Safari/iOS: built-in ABR, AirPlay, hardware-friendly decode and
 * ManagedMediaSource quirks avoided), otherwise the in-house MSE engine.
 * Plain files bypass both. Returns `null` on SSR.
 */
export function createShipVideoEngine(src: string, config?: ShipVideoEngineConfig): ShipVideoEngine | null {
  if (typeof window === 'undefined') return null;

  if (!isHlsUrl(src)) return new ProgressiveEngine();

  if (canPlayNativeHls()) return new NativeHlsEngine();
  if (isMseSupported()) return new HlsEngine(config);

  // Neither native HLS nor MSE: hand the URL to the media element anyway.
  return new NativeHlsEngine();
}
