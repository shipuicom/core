import { existsSync } from 'fs';
import { dirname, join } from 'path';

/**
 * Spec helper: absolute path to the ffmpeg-generated TS fixture.
 * import.meta.url is http-scheme under jsdom and cwd varies between runners,
 * so walk up from cwd to the repo root.
 */
export function tsFixturePath(): string {
  let dir = process.cwd();
  while (!existsSync(join(dir, 'projects/ship-ui'))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error('repo root not found');
    dir = parent;
  }
  return join(dir, 'projects/ship-ui/ship-video/engine/transmux/fixtures/sample-ts.bin');
}
