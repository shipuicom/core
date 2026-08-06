/** SSR-safe MSE / native-HLS capability detection. */

type ManagedMediaSourceWindow = Window & { ManagedMediaSource?: typeof MediaSource };

export function getMediaSourceCtor(): typeof MediaSource | null {
  if (typeof window === 'undefined') return null;

  const managed = (window as ManagedMediaSourceWindow).ManagedMediaSource;
  if (managed) return managed;
  if (typeof MediaSource !== 'undefined') return MediaSource;
  return null;
}

export function isMseSupported(mimeType?: string): boolean {
  const ctor = getMediaSourceCtor();
  if (!ctor) return false;
  if (!mimeType) return true;
  return typeof ctor.isTypeSupported === 'function' ? ctor.isTypeSupported(mimeType) : true;
}

export function canPlayNativeHls(probe?: HTMLVideoElement): boolean {
  if (typeof document === 'undefined') return false;

  const video = probe ?? document.createElement('video');
  return video.canPlayType('application/vnd.apple.mpegurl') !== '';
}
