import { defineConfig, Plugin } from 'vitest/config';
import { resolve } from 'path';

const projectRoot = resolve(__dirname, '../..');

/**
 * Vite plugin that resolves @ship-ui/core/* imports to the local source files.
 * This mirrors the tsconfig paths for @ship-ui/core sub-packages.
 * Uses enforce: 'pre' to run before Vite's built-in resolution which otherwise
 * tries to resolve @ship-ui/core as a node_modules package.
 */
function shipUiPathsPlugin(): Plugin {
  return {
    name: 'ship-ui-paths',
    enforce: 'pre',
    resolveId(source) {
      // @ship-ui/core/ship-icon -> projects/ship-ui/ship-icon/public-api.ts
      if (source.startsWith('@ship-ui/core/')) {
        const subPackage = source.replace('@ship-ui/core/', '');
        return resolve(projectRoot, `projects/ship-ui/${subPackage}/public-api.ts`);
      }
      // @ship-ui/core -> projects/ship-ui/src/public-api.ts
      if (source === '@ship-ui/core') {
        return resolve(projectRoot, 'projects/ship-ui/src/public-api.ts');
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [shipUiPathsPlugin()],
  test: {
    environment: 'jsdom',
    // No TestBed setup file here on purpose: @angular/build:unit-test injects its
    // own initTestEnvironment. Calling it again with a different platform throws
    // NG0400 and takes down every spec file.
  },
});
