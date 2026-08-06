/**
 * Media-playlist reload timing per RFC 8216 §6.3.4.
 *
 * - Playlist changed, no errors: wait one target duration.
 * - Playlist unchanged: wait half a target duration.
 * - Load errors: exponential backoff `0.5 * 2^(errorCount-1)`, capped at one
 *   target duration.
 *
 * Returns seconds.
 */
export function nextReloadDelay(args: { changed: boolean; targetDuration: number; errorCount: number }): number {
  const { changed, targetDuration, errorCount } = args;

  if (errorCount > 0) {
    return Math.min(targetDuration, 0.5 * 2 ** (errorCount - 1));
  }

  return changed ? targetDuration : targetDuration / 2;
}
