/**
 * Visual regression snapshots of every docs page (overview + tabs) in light and dark.
 *
 *   bun run snap:baseline   # writes .baseline/<page>--<theme>.png
 *   bun run snap:compare    # writes .current/, .diff/ and REPORT.md; exits 1 on unexpected diffs
 *
 * Env: SNAP_URL (default http://localhost:4205), SNAP_FILTER (substring of the route, e.g. "toggle"),
 *      SNAP_THEMES (default "light,dark"), SNAP_WORKERS (default 4).
 * expected-diffs.json lists pages that are allowed to differ: { "<page>" | "<page>--<theme>": "reason" }.
 */
import { chromium, type BrowserContext, type Page } from 'playwright';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'playwright-core/lib/utilsBundle';

const MODE = process.argv[2];
if (MODE !== 'baseline' && MODE !== 'compare') {
  console.error('usage: snap.ts <baseline|compare>');
  process.exit(2);
}

const ROOT = import.meta.dir;
const BASE_URL = process.env['SNAP_URL'] ?? 'http://localhost:4205';
const FILTER = process.env['SNAP_FILTER'] ?? '';
const THEMES = (process.env['SNAP_THEMES'] ?? 'light,dark').split(',') as Array<'light' | 'dark'>;
const WORKERS = Number(process.env['SNAP_WORKERS'] ?? 4);
const TABS = ['', 'api', 'examples', 'service', 'parts', 'styling'];
const MAX_DIFF_RATIO = 0.001;
const VIEWPORT = { width: 1280, height: 900 };
const MAX_HEIGHT = 12000;
const CHANNEL_TOLERANCE = 8;

const BASELINE = join(ROOT, '.baseline');
const CURRENT = join(ROOT, '.current');
const DIFF = join(ROOT, '.diff');
const REPORT = join(ROOT, 'REPORT.md');
const EXPECTED: Record<string, string> = existsSync(join(ROOT, 'expected-diffs.json'))
  ? JSON.parse(readFileSync(join(ROOT, 'expected-diffs.json'), 'utf8'))
  : {};

/** Freeze motion and hide nodes whose pixels are non-deterministic between runs. */
const FREEZE_CSS = `
  *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
  sh-video, sh-spinner, sh-blueprint canvas, .sh-chat-typing, sh-progress-bar.indeterminate { visibility: hidden !important; }
  /* docs demos with clocks, random ids or peer presence */
  app-live-updates-input-datepicker, app-live-updates-range-slider, .collab-toolbar { visibility: hidden !important; }
`;

const slugOf = (pathname: string) => (pathname === '/' ? 'home' : pathname.replace(/^\//, '').replace(/\//g, '_'));

async function discoverPages(page: Page): Promise<string[]> {
  await page.goto(BASE_URL + '/');
  await page.waitForLoadState('networkidle');
  const links: string[] = await page.evaluate(() =>
    Array.from(document.querySelectorAll('button[routerlink]'))
      .map((b) => b.getAttribute('routerlink')!)
      .filter((l) => l && l.startsWith('/')),
  );
  const roots = Array.from(new Set(['/', ...links])).filter((r) => r.includes(FILTER));
  return roots;
}

async function capture(page: Page, pathname: string, theme: string, outDir: string): Promise<string | null> {
  const res = await page.goto(BASE_URL + pathname, { waitUntil: 'networkidle' });
  if (!res || res.status() >= 400) return null;
  // Unknown tabs fall through the page's `**` route back to the overview: skip those.
  const landed = new URL(page.url()).pathname.replace(/\/$/, '') || '/';
  if (landed !== pathname) return null;
  await page.addStyleTag({ content: FREEZE_CSS });
  // The docs app scrolls inside <main>, not the body, so `fullPage` alone captures one viewport.
  // Scroll the container to trigger viewport-deferred demos, then grow the viewport to its full height.
  const scrollPass = () =>
    page.evaluate(async () => {
      const el = document.querySelector('main') ?? document.documentElement;
      const step = el.clientHeight || window.innerHeight;
      for (let y = 0; y < el.scrollHeight; y += step) {
        el.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      el.scrollTo(0, 0);
      return el.scrollHeight;
    });
  let height = await scrollPass();
  height = Math.min(Math.max(height, VIEWPORT.height), MAX_HEIGHT);
  await page.setViewportSize({ width: VIEWPORT.width, height });
  await scrollPass();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(400);
  const file = join(outDir, `${slugOf(pathname)}--${theme}.png`);
  await page.screenshot({ path: file, animations: 'disabled' });
  await page.setViewportSize(VIEWPORT);
  return file;
}

async function contextFor(theme: 'light' | 'dark'): Promise<BrowserContext> {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: theme,
  });
  // Mirror SHIP_THEME_INIT_SCRIPT so the html class is set before first paint.
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('shipTheme', t);
      document.documentElement.classList.add(t);
    } catch {}
  }, theme);
  return ctx;
}

type Result = { slug: string; theme: string; ratio: number; expected: string | null; note?: string };

function comparePng(baselineFile: string, currentFile: string, diffFile: string): { ratio: number; note?: string } {
  const a = PNG.sync.read(readFileSync(baselineFile));
  const b = PNG.sync.read(readFileSync(currentFile));
  if (a.width !== b.width || a.height !== b.height) {
    return { ratio: 1, note: `size ${a.width}x${a.height} → ${b.width}x${b.height}` };
  }
  const out = new PNG({ width: a.width, height: a.height });
  let diff = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const changed =
      Math.abs(a.data[i] - b.data[i]) > CHANNEL_TOLERANCE ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > CHANNEL_TOLERANCE ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > CHANNEL_TOLERANCE ||
      Math.abs(a.data[i + 3] - b.data[i + 3]) > CHANNEL_TOLERANCE;
    if (changed) {
      diff++;
      out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 0; out.data[i + 3] = 255;
    } else {
      const g = Math.round(0.3 * b.data[i] + 0.59 * b.data[i + 1] + 0.11 * b.data[i + 2]);
      out.data[i] = out.data[i + 1] = out.data[i + 2] = 160 + Math.round(g * 0.35);
      out.data[i + 3] = 255;
    }
  }
  const ratio = diff / (a.width * a.height);
  if (ratio > 0) writeFileSync(diffFile, PNG.sync.write(out));
  return { ratio };
}

async function main() {
  const outDir = MODE === 'baseline' ? BASELINE : CURRENT;
  // A filtered run refreshes only its own pages; an unfiltered one starts clean.
  if (!FILTER) rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  if (MODE === 'compare') {
    if (!existsSync(BASELINE) || readdirSync(BASELINE).length === 0) {
      console.error('No baseline: run `bun run snap:baseline` first.');
      process.exit(2);
    }
    rmSync(DIFF, { recursive: true, force: true });
    mkdirSync(DIFF, { recursive: true });
  }

  const discovery = await contextFor('light');
  const roots = await discoverPages(await discovery.newPage());
  await discovery.browser()?.close();
  const targets = roots.flatMap((root) => TABS.map((tab) => (tab ? `${root.replace(/\/$/, '')}/${tab}` : root)));
  console.log(`${roots.length} pages × ${TABS.length} tab candidates × ${THEMES.length} themes → probing…`);

  const captured: Array<{ pathname: string; theme: string; file: string }> = [];
  for (const theme of THEMES) {
    const ctx = await contextFor(theme);
    const queue = [...targets];
    await Promise.all(
      Array.from({ length: WORKERS }, async () => {
        const page = await ctx.newPage();
        for (let next = queue.shift(); next; next = queue.shift()) {
          try {
            const file = await capture(page, next, theme, outDir);
            if (file) captured.push({ pathname: next, theme, file });
          } catch (e) {
            console.error(`✗ ${next} (${theme}): ${(e as Error).message.split('\n')[0]}`);
          }
        }
        await page.close();
      }),
    );
    await ctx.browser()?.close();
    console.log(`${theme}: ${captured.filter((c) => c.theme === theme).length} screenshots`);
  }

  if (MODE === 'baseline') {
    console.log(`Baseline written to ${BASELINE} (${captured.length} files).`);
    return;
  }

  const results: Result[] = [];
  // With a filter only the matching baseline pages take part, so the rest are not reported as missing.
  const baselineFiles = new Set(readdirSync(BASELINE).filter((f) => f.endsWith('.png') && f.includes(FILTER)));
  for (const { pathname, theme, file } of captured) {
    const slug = slugOf(pathname);
    const name = `${slug}--${theme}.png`;
    const expected = EXPECTED[`${slug}--${theme}`] ?? EXPECTED[slug] ?? null;
    if (!baselineFiles.has(name)) {
      results.push({ slug, theme, ratio: 1, expected, note: 'new page (no baseline)' });
      continue;
    }
    baselineFiles.delete(name);
    const { ratio, note } = comparePng(join(BASELINE, name), file, join(DIFF, name));
    results.push({ slug, theme, ratio, expected, note });
  }
  for (const missing of baselineFiles) {
    const [slug, theme] = missing.replace(/\.png$/, '').split('--');
    results.push({ slug, theme, ratio: 1, expected: EXPECTED[slug] ?? null, note: 'page disappeared' });
  }

  results.sort((x, y) => y.ratio - x.ratio || x.slug.localeCompare(y.slug));
  const changed = results.filter((r) => r.ratio > MAX_DIFF_RATIO);
  const unexpected = changed.filter((r) => !r.expected);
  const lines = [
    `# Visual snapshot report`,
    ``,
    `Base: ${BASE_URL} · ${results.length} captures · ${changed.length} changed (> ${MAX_DIFF_RATIO * 100}%) · ${unexpected.length} unexpected`,
    ``,
    `| page | theme | changed | status | note |`,
    `|---|---|---:|---|---|`,
    ...changed.map(
      (r) =>
        `| ${r.slug} | ${r.theme} | ${(r.ratio * 100).toFixed(3)}% | ${r.expected ? `expected: ${r.expected}` : '**UNEXPECTED**'} | ${r.note ?? ''} |`,
    ),
    ``,
    changed.length ? `Diff images: \`scripts/visual-snapshots/.diff/\`` : `No visual changes.`,
    ``,
  ];
  writeFileSync(REPORT, lines.join('\n'));
  console.log(lines.join('\n'));
  if (unexpected.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
