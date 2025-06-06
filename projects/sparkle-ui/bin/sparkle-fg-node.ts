import { parseArgs } from 'util';
import { main } from './src/sparkle-fg-node.ts'; // Added .js extension for ESM imports

const { values } = parseArgs({
  args: process.argv, // Changed from Bun.argv to process.argv
  options: {
    src: {
      type: 'string',
    },
    out: {
      type: 'string',
    },
    rootPath: {
      type: 'string',
      default: '/',
    },
    watch: {
      type: 'boolean',
      default: false,
    },
    watchLib: {
      type: 'boolean',
      default: false,
    },
    verbose: {
      type: 'boolean',
      default: false,
    },
  },
  allowPositionals: true,
  strict: true,
});

if (values.src === undefined || values.out === undefined) {
  throw new Error('src and out are both required arguments');
}

main(values as any);
