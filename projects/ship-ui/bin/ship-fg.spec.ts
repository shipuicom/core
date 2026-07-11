// @vitest-environment node
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

const projectRoot = resolve(__dirname, '../../..');
const cli = resolve(__dirname, 'ship-fg.ts');
const src = resolve(projectRoot, 'projects/design-system/src');

let workDir: string;
let spawned: ChildProcess[] = [];

function runCli(extraArgs: string[]): ChildProcess {
  const out = mkdtempSync(join(workDir, 'out-'));
  const child = spawn('bun', [cli, `--src=${src}`, `--out=${out}`, ...extraArgs], {
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: projectRoot,
  });
  spawned.push(child);
  return child;
}

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const waitFor = async (predicate: () => boolean, timeoutMs = 20_000): Promise<boolean> => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
};

const exitOf = (child: ChildProcess): Promise<number | null> =>
  new Promise((res) => child.once('exit', (code) => res(code)));

const collect = (child: ChildProcess): (() => string) => {
  let buf = '';
  child.stdout?.on('data', (d) => (buf += d));
  child.stderr?.on('data', (d) => (buf += d));
  return () => buf;
};

describe.skipIf(process.platform === 'win32')('ship-fg process lifecycle', () => {
  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'ship-fg-spec-'));
  });

  afterEach(() => {
    for (const child of spawned) {
      if (child.pid && !child.killed) {
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    }
    spawned = [];
  });

  it('propagates the child exit code and stops the font watcher', async () => {
    // --watch would otherwise keep the font process alive forever.
    const child = runCli(['--watch', 'node', '-e', 'process.exit(3)']);
    await expect(exitOf(child)).resolves.toBe(3);
  }, 30_000);

  it('kills the whole child process tree when the font watcher is interrupted', async () => {
    const pidFile = join(workDir, 'grandchild.pid');
    const kid = join(workDir, 'kid.mjs');
    writeFileSync(
      kid,
      `import { spawn } from 'child_process';
       import { writeFileSync } from 'fs';
       const g = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
       writeFileSync(${JSON.stringify(pidFile)}, String(g.pid));
       setInterval(() => {}, 1000);`,
    );

    const child = runCli(['--watch', 'node', kid]);
    expect(await waitFor(() => existsSync(pidFile))).toBe(true);

    const grandchildPid = Number(readFileSync(pidFile, 'utf-8'));
    expect(isAlive(grandchildPid)).toBe(true);

    process.kill(child.pid!, 'SIGINT');

    // Both the direct child and its descendants must go down with the parent.
    expect(await waitFor(() => !isAlive(grandchildPid))).toBe(true);
    expect(await waitFor(() => !isAlive(child.pid!))).toBe(true);
  }, 30_000);

  it('gives the child a graceful SIGINT so it can shut its own children down', async () => {
    // esbuild (spawned by `ng serve`) deadlocks and dumps a Go stack trace if it
    // is signalled directly. The child must receive SIGINT and be allowed to
    // tear down its own tree, not be SIGKILLed out from under it.
    const marker = join(workDir, 'graceful.marker');
    const child = runCli([
      '--watch',
      'node',
      '-e',
      `process.on('SIGINT', () => {
         require('fs').writeFileSync(${JSON.stringify(marker)}, 'clean');
         process.exit(0);
       });
       setInterval(() => {}, 1000);`,
    ]);

    // Let the child install its handler before interrupting.
    expect(await waitFor(() => isAlive(child.pid!))).toBe(true);
    await new Promise((r) => setTimeout(r, 1500));

    const code = exitOf(child);
    process.kill(child.pid!, 'SIGINT');

    // Child caught SIGINT and exited cleanly, and its 0 propagated up.
    // Poll for the content, not just existence: the file is visible the moment
    // the child creates it, a beat before 'clean' is flushed across processes.
    const readMarker = () => (existsSync(marker) ? readFileSync(marker, 'utf-8') : '');
    expect(await waitFor(() => readMarker() === 'clean')).toBe(true);
    await expect(code).resolves.toBe(0);
  }, 30_000);

  it('accepts a trailing command with no `--` separator (npm strips it)', async () => {
    const child = runCli(['node', '-e', 'console.log("child-ran")']);
    const output = collect(child);
    await exitOf(child);
    expect(output()).toContain('child-ran');
  }, 30_000);

  it('still accepts an explicit `--` separator', async () => {
    const child = runCli(['--', 'node', '-e', 'console.log("child-ran")']);
    const output = collect(child);
    await exitOf(child);
    expect(output()).toContain('child-ran');
  }, 30_000);

  it('does not treat a space-separated option value as the command', async () => {
    const out = mkdtempSync(join(workDir, 'out-'));
    const child = spawn('bun', [cli, '--src', src, '--out', out, '--rootPath', '/'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: projectRoot,
    });
    spawned.push(child);

    await expect(exitOf(child)).resolves.toBe(0);
    expect(existsSync(join(out, 'ship.css'))).toBe(true);
  }, 30_000);

  it('exits non-zero when the command cannot be spawned', async () => {
    const child = runCli(['--watch', 'definitely-not-a-real-binary']);
    const output = collect(child);
    await expect(exitOf(child)).resolves.toBe(1);
    expect(output()).toContain('Failed to spawn');
  }, 30_000);
});
