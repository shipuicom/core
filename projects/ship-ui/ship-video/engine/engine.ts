import { canPlayNativeHls, isMseSupported } from './capabilities';
import { HlsEngine } from './hls-engine';
import { NativeHlsEngine } from './native-engine';
import { ProgressiveEngine } from './progressive-engine';
import { ShipVideoEngine, ShipVideoEngineConfig } from './types';

export function isHlsUrl(src: string): boolean {
  return /\.m3u8(\?|#|$)/.test(src);
}

/**
 * Picks the right engine for a source: `.m3u8` → in-house MSE engine, Safari
 * native HLS as fallback, plain progressive otherwise. Returns `null` on SSR.
 */
export function createShipVideoEngine(src: string, config?: ShipVideoEngineConfig): ShipVideoEngine | null {
  if (typeof window === 'undefined') return null;

  if (!isHlsUrl(src)) return new ProgressiveEngine();

  if (isMseSupported()) return new HlsEngine(config);
  if (canPlayNativeHls()) return new NativeHlsEngine();

  // No MSE and no native HLS: hand the URL to the media element anyway.
  return new NativeHlsEngine();
}
