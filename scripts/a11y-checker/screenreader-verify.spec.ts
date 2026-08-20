import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, CDPSession } from '@playwright/test';
import { WPT_ACCNAME_FIXTURES } from './wpt-accname-fixtures';

/**
 * Verifies the sh-screenreader simulator against true WCAG/ARIA behaviour:
 * each fixture is rendered in Chromium, the browser's own accessibility tree
 * (the spec-compliant ground truth) is read via CDP, and the simulator's
 * computeAccessibleName/computeRole must produce the same answer.
 *
 * Known v1 gaps, deliberately NOT covered here (documented in the docs page):
 * CSS generated content (::before/::after), embedded controls inside labels
 * ("Delete <input value=3> items"), table cell row/column context.
 */

interface Fixture {
  title: string;
  html: string;
  /** Selector of the element under test within the fixture. */
  target?: string;
}

const FIXTURES: Fixture[] = [
  { title: 'button with text content', html: '<button id="t">Save changes</button>' },
  { title: 'button with aria-label', html: '<button id="t" aria-label="Close dialog">×</button>' },
  {
    title: 'aria-labelledby joining multiple ids',
    html: '<span id="a">Delete</span><span id="b">file</span><button id="t" aria-labelledby="a b" aria-label="nope">x</button>',
  },
  {
    title: 'aria-labelledby self-reference',
    html: '<button id="t" aria-labelledby="t">Fallback</button>',
  },
  { title: 'label[for] association', html: '<label for="t">Email address</label><input id="t">' },
  { title: 'wrapping label', html: '<label>Subscribe <input id="t" type="checkbox"></label>' },
  { title: 'img alt', html: '<img id="t" alt="Company logo">' },
  { title: 'title fallback', html: '<button id="t" title="Settings"></button>' },
  { title: 'aria-hidden child excluded', html: '<button id="t">Save <span aria-hidden="true">(⌘S)</span></button>' },
  { title: 'submit input value', html: '<input id="t" type="submit" value="Send it">' },
  { title: 'placeholder fallback', html: '<input id="t" placeholder="Search…">' },
  { title: 'link with href', html: '<a id="t" href="/docs">Documentation</a>' },
  { title: 'anchor without href', html: '<a id="t">Not a link</a>' },
  { title: 'heading', html: '<h2 id="t">Overview</h2>' },
  { title: 'role=heading with aria-level', html: '<div id="t" role="heading" aria-level="4">Deep</div>' },
  { title: 'textarea with label', html: '<label for="t">Notes</label><textarea id="t"></textarea>' },
  { title: 'single select', html: '<label for="t">Fruit</label><select id="t"><option>Ape</option></select>' },
  { title: 'multi select', html: '<label for="t">Fruit</label><select id="t" multiple><option>Ape</option></select>' },
  { title: 'input type=email', html: '<label for="t">Email</label><input id="t" type="email">' },
  { title: 'input type=range', html: '<label for="t">Volume</label><input id="t" type="range">' },
  { title: 'input type=number', html: '<label for="t">Count</label><input id="t" type="number">' },
  { title: 'input type=search', html: '<label for="t">Find</label><input id="t" type="search">' },
  { title: 'input type=radio', html: '<label>Medium <input id="t" type="radio" name="size"></label>' },
  { title: 'explicit role wins', html: '<div id="t" role="tab">Pricing</div>' },
  { title: 'fieldset named by legend', html: '<fieldset id="t"><legend>Shipping</legend><input></fieldset>' },
  { title: 'list item', html: '<ul><li id="t">First point</li></ul>' },
  { title: 'nav landmark', html: '<nav id="t" aria-label="Main"></nav>' },
  { title: 'option', html: '<div role="listbox" aria-label="x"><div id="t" role="option">Apples</div></div>' },
  { title: 'plain div has no name or role', html: '<div id="t">Just text</div>' },
];

/** Chromium AX role token → the ARIA token the simulator reports. */
const ROLE_ALIASES: Record<string, string> = {
  image: 'img',
  generic: '',
  genericContainer: '',
  '': '',
};

const BUNDLE = join(__dirname, '.generated', 'screenreader-verify.bundle.js');

test.describe('sh-screenreader vs Chromium accessibility tree', () => {
  test.beforeAll(() => {
    mkdirSync(join(__dirname, '.generated'), { recursive: true });
    execSync(
      `bun build "${join(__dirname, 'screenreader-verify.entry.ts')}" --target=browser --format=esm --outfile="${BUNDLE}"`,
      { stdio: 'pipe' },
    );
  });

  test('name and role match the browser accessibility tree', async ({ page }) => {
    await page.goto('about:blank');
    const session = await page.context().newCDPSession(page);
    await session.send('Accessibility.enable');

    const mismatches: string[] = [];

    for (const fixture of FIXTURES) {
      await page.setContent(`<main>${fixture.html}</main>`);
      await page.addScriptTag({ path: BUNDLE, type: 'module' });

      const selector = fixture.target ?? '#t';
      const truth = await axNode(session, selector);
      const simulated = await page.evaluate((sel) => {
        const el = document.querySelector(sel)!;
        return {
          name: window.__shipScreenreader.computeAccessibleName(el),
          role: window.__shipScreenreader.computeRole(el),
        };
      }, selector);

      const truthRole = ROLE_ALIASES[truth.role] ?? truth.role;
      // Chromium can keep trailing whitespace in the flat name; the accname
      // spec trims it — compare whitespace-normalized.
      truth.name = truth.name.replace(/\s+/g, ' ').trim();
      if (simulated.name !== truth.name || simulated.role !== truthRole) {
        mismatches.push(
        `${fixture.title}: simulator {name: "${simulated.name}", role: "${simulated.role}"} ` +
          `vs Chromium {name: "${truth.name}", role: "${truthRole}" (raw "${truth.role}")}`,
        );
      }
    }

    expect(mismatches, `Simulator diverges from Chromium accessibility tree:\n${mismatches.join('\n')}`).toEqual([]);
  });

  test('W3C web-platform-tests accname conformance', async ({ page }) => {
    await page.goto('about:blank');

    const failures: string[] = [];
    const surprisePasses: string[] = [];
    let passed = 0;

    for (const fixture of WPT_ACCNAME_FIXTURES) {
      await page.setContent(
        `${fixture.css ? `<style>${fixture.css}</style>` : ''}<main>${fixture.html}</main>`,
      );
      await page.addScriptTag({ path: BUNDLE, type: 'module' });

      const name = await page.evaluate(() =>
        window.__shipScreenreader.computeAccessibleName(document.querySelector('#t')!),
      );

      if (fixture.gap) {
        // Documented v1 gap: the case must still fail. A pass means the
        // implementation caught up — remove the gap marker.
        if (name === fixture.expected) surprisePasses.push(fixture.testname);
        continue;
      }

      if (name === fixture.expected) passed++;
      else failures.push(`${fixture.testname}: got "${name}", WPT expects "${fixture.expected}"`);
    }

    const total = WPT_ACCNAME_FIXTURES.filter((fixture) => !fixture.gap).length;
    console.log(`WPT accname: ${passed}/${total} supported cases pass, ${WPT_ACCNAME_FIXTURES.length - total} documented gaps`);

    expect(failures, `WPT accname conformance failures:\n${failures.join('\n')}`).toEqual([]);
    expect(
      surprisePasses,
      `These gap-marked cases now PASS — remove their \`gap\` marker:\n${surprisePasses.join('\n')}`,
    ).toEqual([]);
  });
});

async function axNode(session: CDPSession, selector: string): Promise<{ name: string; role: string }> {
  const { root } = await session.send('DOM.getDocument');
  const { nodeId } = await session.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  const { nodes } = await session.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
  const node = nodes[0];
  if (!node || node.ignored) return { name: '', role: '' };
  return {
    name: String(node.name?.value ?? ''),
    role: String(node.role?.value ?? ''),
  };
}
