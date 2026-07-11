#!/usr/bin/env node

import { parseArgs } from 'util';
import { spawn, type ChildProcess } from 'child_process';
import { main } from './src/ship-fg.ts';

const VALUE_OPTIONS = new Set(['--src', '--out', '--rootPath']);

/**
 * `npm run script -- ng serve` swallows the `--`, so the trailing command
 * arrives as bare argv. Split at the first positional instead of requiring it.
 */
function splitArgs(argv: string[]): { own: string[]; command: string[] } {
  const dashDashIdx = argv.indexOf('--');
  if (dashDashIdx !== -1) {
    return { own: argv.slice(0, dashDashIdx), command: argv.slice(dashDashIdx + 1) };
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (VALUE_OPTIONS.has(arg)) {
      i++;
      continue;
    }
    if (!arg.startsWith('-')) {
      return { own: argv.slice(0, i), command: argv.slice(i) };
    }
  }

  return { own: argv, command: [] };
}

const { own: argsToParse, command: commandToSpawn } = splitArgs(process.argv.slice(2));

const { values } = parseArgs({
  args: argsToParse,
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

const isWin = process.platform === 'win32';

/** How long the child gets to shut its own children down before we force it. */
const SHUTDOWN_GRACE_MS = 5_000;

let childProcess: ChildProcess | null = null;
let childExited = false;
let shuttingDown = false;

/**
 * Signal only the direct child, never its group. `ng serve` owns an esbuild
 * service process, and esbuild deadlocks and dumps a Go stack trace if it is
 * signalled directly instead of having its stdin closed by its parent.
 */
function signalChild(signal: NodeJS.Signals): void {
  if (!childProcess?.pid || childExited) {
    return;
  }

  try {
    childProcess.kill(signal);
  } catch {
    // Already gone.
  }
}

/**
 * Last resort: the child is detached, so it leads its own process group and a
 * negative pid reaps anything it left behind (esbuild, vite workers).
 */
function killChildGroup(): void {
  if (!childProcess?.pid || isWin) {
    return;
  }

  try {
    process.kill(-childProcess.pid, 'SIGKILL');
  } catch {
    // The whole group is already gone.
  }
}

/** Ask the child to stop, then reap survivors if it overstays the grace period. */
function shutdownChild(signal: NodeJS.Signals): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  console.log('\n✅ Stopping icon font watcher and the spawned command…');
  signalChild(signal);

  const timer = setTimeout(() => {
    killChildGroup();
    process.exit(1);
  }, SHUTDOWN_GRACE_MS);

  // Don't hold the event loop open just for the fallback.
  timer.unref();
}

if (commandToSpawn.length > 0) {
  // Tell main()'s watch mode to cede signal handling to this wrapper, so its
  // own SIGINT handler doesn't process.exit() before the child shuts down.
  process.env.SHIP_FG_MANAGED = '1';

  childProcess = spawn(commandToSpawn[0], commandToSpawn.slice(1), {
    stdio: 'inherit',
    shell: isWin,
    detached: !isWin,
  });

  // Child died -> take the font process down with it, plus anything it orphaned.
  childProcess.on('exit', (code, signal) => {
    childExited = true;
    killChildGroup();
    process.exit(code ?? (signal ? 1 : 0));
  });

  childProcess.on('error', (error) => {
    childExited = true;
    console.error(`Failed to spawn '${commandToSpawn.join(' ')}':`, error.message);
    process.exit(1);
  });

  // Font process interrupted -> ask the child to stop, then wait for its exit
  // handler above to end this process with the child's code.
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    process.on(signal, () => shutdownChild(signal));
  }

  // Whatever ends this process, leave nothing behind holding the dev port.
  process.on('exit', () => killChildGroup());
}

main(values as any).catch((error) => {
  console.error(error);
  shutdownChild('SIGINT');
  process.exit(1);
});
