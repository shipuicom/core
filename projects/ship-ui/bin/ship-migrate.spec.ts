// @vitest-environment node
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrateSource, projectChecks, styleFlags } from './ship-migrate';

const v026 = MIGRATIONS.find((m) => m.version === '0.26.0')!;

describe('ship-migrate 0.26', () => {
  it('renames breadcrumb variables by prefix everywhere', () => {
    const r = migrateSource('sh-breadcrumbs { --breadcrumbs-c-h: red; --breadcrumbs-sep: "/"; }', '.scss', v026);
    expect(r.text).toBe('sh-breadcrumbs { --crumb-c-h: red; --crumb-sep: "/"; }');
    expect(r.changes).toHaveLength(2);
  });

  it('renames scoped variables only when the file targets that component', () => {
    const scoped = migrateSource('sh-checkbox { --box-bc: red; --box-shadow: none; }', '.scss', v026);
    expect(scoped.text).toBe('sh-checkbox { --cb-bc: red; --box-shadow: none; }');

    const foreign = migrateSource('.mine { --box-bc: red; --caret-size: 4px; }', '.scss', v026);
    expect(foreign.text).toBe('.mine { --box-bc: red; --caret-size: 4px; }');
    expect(foreign.warnings.map((w) => w.rule)).toEqual(['css-var', 'css-var']);
  });

  it('does not touch variables that only share a suffix', () => {
    const r = migrateSource('sh-select { --ff-miw: 1px; --miw: 2px; }', '.scss', v026);
    expect(r.text).toBe('sh-select { --ff-miw: 1px; --select-miw: 2px; }');
  });

  it('renames sass flags in styles only', () => {
    const rules = { version: '9.9.9', sassFlags: [{ from: '$shipStat', to: '$shipLayoutStat' }, { from: '$shipStatRing', to: '$shipLayoutStatRing' }] };
    const scss = "@use '@ship-ui/core/styles' with ($shipStat: false, $shipStatRing: true);";
    expect(migrateSource(scss, '.scss', rules).text).toBe("@use '@ship-ui/core/styles' with ($shipLayoutStat: false, $shipLayoutStatRing: true);");
    expect(migrateSource(scss, '.ts', rules).text).toBe(scss);
  });

  it('renames colour classes on the listed tags and warns elsewhere', () => {
    // Swipe action buttons keep `.danger` as an alias, so they are not rewritten.
    const html = '<sh-form-field class="warning big"></sh-form-field>\n<div class="warning">x</div>\n<sh-list-item-swipe><button actionLeft class="danger"></button></sh-list-item-swipe>';
    const r = migrateSource(html, '.html', v026);
    expect(r.text).toBe('<sh-form-field class="warn big"></sh-form-field>\n<div class="warning">x</div>\n<sh-list-item-swipe><button actionLeft class="danger"></button></sh-list-item-swipe>');
    expect(r.changes.map((c) => c.detail)).toEqual(['.warning → .warn']);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0].line).toBe(2);
  });

  it('renames every token in the class list, with either quote style', () => {
    expect(migrateSource('<sh-form-field class="warning warning">', '.html', v026).text).toBe('<sh-form-field class="warn warn">');
    expect(migrateSource("<sh-form-field class='x warning'>", '.html', v026).text).toBe("<sh-form-field class='x warn'>");
    expect(migrateSource('<sh-form-field class="warnings warning-x">', '.html', v026).text).toBe('<sh-form-field class="warnings warning-x">');
    expect(migrateSource("<div class='warning'>", '.html', v026).warnings).toHaveLength(1);
  });

  it('does not read `//` as a comment in HTML or CSS, nor inside strings and urls', () => {
    const html = '<sh-form-field label="a // b">\n<div class="warning">x</div>\n<sh-card title="see // note">\n<my-el color="red">';
    const r = migrateSource(html, '.html', v026);
    expect(r.text).toBe(html);
    expect(r.changes).toEqual([]);
    expect(migrateSource('<!-- <sh-select> --><div [style.--miw]="x">', '.html', v026).text).toBe('<!-- <sh-select> --><div [style.--miw]="x">');
    expect(migrateSource('sh-select { background: url(//x); }\n.other { --miw: 1px; }', '.scss', v026).text).toBe('sh-select { background: url(//x); }\n.other { --miw: 1px; }');
    expect(migrateSource("sh-select { content: '//'; }\n.other { --miw: 1px; }", '.scss', v026).text).toBe("sh-select { content: '//'; }\n.other { --miw: 1px; }");
    expect(migrateSource('sh-select { } // comment\n.other { --miw: 1px; }', '.css', v026).text).toBe('sh-select { } // comment\n.other { --miw: 1px; }');
  });

  it('renames the alert container selector', () => {
    const r = migrateSource('<ship-alert-container></ship-alert-container>', '.html', v026);
    expect(r.text).toBe('<sh-alert-container></sh-alert-container>');
  });

  it('drops removed inputs from the tag and leaves live ones alone', () => {
    const r = migrateSource('<sh-card color="primary" variant="type-b">a</sh-card><sh-tabs [variant]="v" color="accent"></sh-tabs><sh-chip color="warn"></sh-chip>', '.html', v026);
    expect(r.text).toBe('<sh-card variant="type-b">a</sh-card><sh-tabs color="accent"></sh-tabs><sh-chip color="warn"></sh-chip>');
    expect(r.changes).toHaveLength(2);
  });

  it('works on inline templates and style bindings in .ts files', () => {
    const ts = "template: `<sh-card color=\"x\"></sh-card>`, host: { '[style.--breadcrumbs-sep]': 'sep()' }";
    const r = migrateSource(ts, '.ts', v026);
    expect(r.text).toBe("template: `<sh-card></sh-card>`, host: { '[style.--crumb-sep]': 'sep()' }");
  });

  it('points at removed SHIP_CONFIG keys without rewriting them', () => {
    const r = migrateSource("import { ShipAlertModule } from '@ship-ui/core/ship-alert';\nprovide: SHIP_CONFIG, useValue: { alertVariant: 'flat', 'event-card': { color: 'primary' } }", '.ts', v026);
    expect(r.changes).toHaveLength(0);
    expect(r.warnings.map((w) => w.rule)).toEqual(['config', 'config', 'config']);
  });

  it('renames the Sh*-prefixed classes', () => {
    const r = migrateSource("import { ShEditorRemoteCursors } from '@ship-ui/core/ship-editor-collab'; class X extends ShEditorRemoteCursors {}", '.ts', v026);
    expect(r.text).toBe("import { ShipEditorRemoteCursors } from '@ship-ui/core/ship-editor-collab'; class X extends ShipEditorRemoteCursors {}");
    expect(r.changes).toHaveLength(2);
  });

  it('renames scoped variables only inside rules for that component, not elsewhere in the same file', () => {
    const r = migrateSource('sh-select { color: red }\n.sidebar { --miw: 200px; }\nsh-select .x { --miw: 1px; }\n// sh-popover notes\n.y { --overlay: 1; }', '.scss', v026);
    expect(r.text).toBe('sh-select { color: red }\n.sidebar { --miw: 200px; }\nsh-select .x { --select-miw: 1px; }\n// sh-popover notes\n.y { --overlay: 1; }');
    expect(r.changes).toHaveLength(1);
    expect(r.warnings.map((w) => w.line)).toEqual([2, 5]);
  });

  it('renames scoped variables in templates only on that tag', () => {
    const r = migrateSource('<sh-select [style.--miw]="w"></sh-select><div style="--miw: 1px"></div>', '.html', v026);
    expect(r.text).toBe('<sh-select [style.--select-miw]="w"></sh-select><div style="--miw: 1px"></div>');
    expect(r.changes).toHaveLength(1);
    expect(r.warnings).toHaveLength(1);
  });

  it('renames element selectors in stylesheets too', () => {
    const r = migrateSource('ship-theme-toggle { margin: 0 }\n.ship-theme-toggle-x { }\nship-alert-container sh-alert { }', '.scss', v026);
    expect(r.text).toBe('sh-theme-toggle { margin: 0 }\n.ship-theme-toggle-x { }\nsh-alert-container sh-alert { }');
    expect(r.changes).toHaveLength(2);
  });

  it('leaves renamed element names alone outside selector position', () => {
    const scss = "x { background: url(ship-theme-toggle.svg); content: 'ship-theme-toggle' }\n$ship-theme-toggle: 1;\n// ship-theme-toggle is old\nship-theme-toggle, .a { }";
    const r = migrateSource(scss, '.scss', v026);
    expect(r.text).toBe("x { background: url(ship-theme-toggle.svg); content: 'ship-theme-toggle' }\n$ship-theme-toggle: 1;\n// ship-theme-toggle is old\nsh-theme-toggle, .a { }");
    expect(r.changes).toHaveLength(1);
  });

  it('ignores braces and tag names inside comments and strings when scoping', () => {
    expect(migrateSource('/* sh-select { */\n.y { --miw: 1 }', '.scss', v026).text).toBe('/* sh-select { */\n.y { --miw: 1 }');
    expect(migrateSource('sh-select { // a } comment\n  --miw: 1 }', '.scss', v026).text).toBe('sh-select { // a } comment\n  --select-miw: 1 }');
    expect(migrateSource('sh-select { content: "}"; --miw: 1 }', '.scss', v026).text).toBe('sh-select { content: "}"; --select-miw: 1 }');
    expect(migrateSource('<sh-select [x]="a > b" [style.--miw]="x">', '.html', v026).text).toBe('<sh-select [x]="a > b" [style.--select-miw]="x">');
  });

  it('reaches inline styles strings in .ts files', () => {
    const ts = "@Component({ template: '<sh-select [style.--miw]=\"x\">', styles: 'sh-select { --miw: 1 } .z { --miw: 2 }' })";
    const r = migrateSource(ts, '.ts', v026);
    expect(r.text).toBe("@Component({ template: '<sh-select [style.--select-miw]=\"x\">', styles: 'sh-select { --select-miw: 1 } .z { --miw: 2 }' })");
    expect(r.warnings).toHaveLength(1);
  });

  it('ends an open tag only at a real `>`, not one inside an attribute value', () => {
    const r = migrateSource('<sh-card [x]="a > b" color="warn" class="c">x</sh-card>\n<sh-form-field [y]="n > 0" class="warning"></sh-form-field>', '.html', v026);
    expect(r.text).toBe('<sh-card [x]="a > b" class="c">x</sh-card>\n<sh-form-field [y]="n > 0" class="warn"></sh-form-field>');
    expect(r.changes).toHaveLength(2);
  });

  it('still sees single-quoted inline templates in .ts files', () => {
    const r = migrateSource("template: '<sh-card color=\"x\" [a]=\"b > c\"></sh-card>'", '.ts', v026);
    expect(r.text).toBe("template: '<sh-card [a]=\"b > c\"></sh-card>'");
  });

  it('does not read apostrophes in HTML text content as strings', () => {
    const pre = "<p>Don't</p>\n";
    const post = "\n<p>it's</p>";
    // css-var scoped to a tag
    expect(migrateSource(pre + '<sh-select [style.--miw]="w"></sh-select>' + post, '.html', v026).text).toBe(pre + '<sh-select [style.--select-miw]="w"></sh-select>' + post);
    // class rename on a listed tag
    expect(migrateSource(pre + '<sh-form-field class="warning"></sh-form-field>' + post, '.html', v026).text).toBe(pre + '<sh-form-field class="warn"></sh-form-field>' + post);
    // removed input
    expect(migrateSource(pre + '<sh-card color="primary"></sh-card>' + post, '.html', v026).text).toBe(pre + '<sh-card></sh-card>' + post);
    // selector rename
    expect(migrateSource(pre + '<ship-theme-toggle></ship-theme-toggle>' + post, '.html', v026).text).toBe(pre + '<sh-theme-toggle></sh-theme-toggle>' + post);
    // the same inside a .ts template literal
    const ts = "template: `<p>Don't</p><sh-card color=\"x\"></sh-card><p>it's</p>`";
    expect(migrateSource(ts, '.ts', v026).text).toBe("template: `<p>Don't</p><sh-card></sh-card><p>it's</p>`");
    // quotes inside attribute values still hide tags and `>`
    expect(migrateSource('<sh-card title="it\'s <sh-x>" [x]="a > b" color="w"></sh-card>', '.html', v026).text).toBe('<sh-card title="it\'s <sh-x>" [x]="a > b"></sh-card>');
  });

  it('renames --bar-pct on sh-lo-ranking-item (and sh-lo-ranking)', () => {
    expect(migrateSource('<sh-lo-ranking-item [style.--bar-pct]="p"></sh-lo-ranking-item>', '.html', v026).text).toBe('<sh-lo-ranking-item [style.--ranking-pct]="p"></sh-lo-ranking-item>');
    expect(migrateSource('sh-lo-ranking-item .bar { --bar-pct: 3; }\nsh-lo-ranking { --bar-pct: 1; }', '.scss', v026).text).toBe('sh-lo-ranking-item .bar { --ranking-pct: 3; }\nsh-lo-ranking { --ranking-pct: 1; }');
    expect(migrateSource('.x { --bar-pct: 1; }', '.scss', v026).warnings).toHaveLength(1);
  });

  it('renames list tokens on sh-list-item-swipe as well as sh-list', () => {
    const r = migrateSource('sh-list-item-swipe { --list-color: red; --list-active-bg: blue; }\nsh-list { --list-active-bs: none; --list-item-active-b: 0; }', '.scss', v026);
    expect(r.text).toBe('sh-list-item-swipe { --list-c: red; --list-bg-a: blue; }\nsh-list { --list-bs-a: none; --list-item-b-a: 0; }');
    expect(migrateSource('<sh-list-item-swipe [style.--list-color]="c"></sh-list-item-swipe>', '.html', v026).text).toBe('<sh-list-item-swipe [style.--list-c]="c"></sh-list-item-swipe>');
  });

  it('drops removed inputs in every static and bound form, and warns on the rest', () => {
    const r = migrateSource("<sh-card color='primary'></sh-card><sh-table color=accent></sh-table><sh-tabs variant></sh-tabs><sh-card [color]='c'></sh-card><sh-card colorful=\"x\" data-color=\"y\"></sh-card>", '.html', v026);
    expect(r.text).toBe('<sh-card></sh-card><sh-table></sh-table><sh-tabs></sh-tabs><sh-card></sh-card><sh-card colorful="x" data-color="y"></sh-card>');
    expect(r.changes).toHaveLength(4);
    expect(r.warnings).toEqual([]);
    const w = migrateSource('<sh-card bind-color="c" [(color)]="d"></sh-card>', '.html', v026);
    expect(w.text).toBe('<sh-card bind-color="c" [(color)]="d"></sh-card>');
    expect(w.warnings.map((x) => x.rule)).toEqual(['removed-input']);
  });

  it('warns on interpolated or bound class lists mentioning a renamed class', () => {
    const r = migrateSource("<sh-form-field class=\"{{ ok ? '' : 'warning' }}\"></sh-form-field>\n<sh-form-field [class]=\"x ? 'warning' : ''\"></sh-form-field>\n<div [ngClass]=\"{ warning: bad }\"></div>\n<div [ngClass]=\"{ warnings: bad }\"></div>", '.html', v026);
    expect(r.changes).toEqual([]);
    expect(r.warnings.map((w) => w.line)).toEqual([1, 2, 3]);
  });

  it('treats a quote as a string only after = and never lets an unclosed quote swallow the file', () => {
    const apostrophe = migrateSource(`<img alt=don't src=x>\n<sh-form-field class="warning"></sh-form-field>`, '.html', v026);
    expect(apostrophe.text).toBe(`<img alt=don't src=x>\n<sh-form-field class="warn"></sh-form-field>`);
    const unclosed = migrateSource(`<div title="oops>\n<sh-form-field class="warning"></sh-form-field>`, '.html', v026);
    expect(unclosed.text).toContain('<sh-form-field class="warn">');
    const interp = migrateSource(`<p>{{ "open }}</p><sh-form-field class="warning"></sh-form-field>`, '.html', v026);
    expect(interp.text).toContain('<sh-form-field class="warn">');
  });

  it('renames and warns on unquoted class values', () => {
    expect(migrateSource('<sh-form-field class=warning></sh-form-field>', '.html', v026).text).toBe('<sh-form-field class=warn></sh-form-field>');
    expect(migrateSource('<div class=warning></div>', '.html', v026).warnings).toHaveLength(1);
    expect(migrateSource('<sh-form-field class=warnings></sh-form-field>', '.html', v026).text).toBe('<sh-form-field class=warnings></sh-form-field>');
  });

  it('is idempotent', () => {
    const once = migrateSource('<sh-card color="a" class="warning"></sh-card> --breadcrumbs-c', '.html', v026).text;
    const twice = migrateSource(once, '.html', v026);
    expect(twice.text).toBe(once);
    expect(twice.changes).toHaveLength(0);
    const tricky = "<p>Don't</p><sh-card color='a'></sh-card><sh-lo-ranking-item [style.--bar-pct]=\"p\"></sh-lo-ranking-item><p>it's</p>";
    const a = migrateSource(tricky, '.html', v026).text;
    expect(migrateSource(a, '.html', v026).changes).toHaveLength(0);
  });
});

describe('ship-migrate project checks', () => {
  // Explicit root: test runners relocate the module, so the import.meta-based default may not point at the package.
  const flags = styleFlags(resolve(process.cwd(), 'projects/ship-ui'))!;

  it('reads the flag inventory from the package styles', () => {
    expect(flags.known.has('$shipColors')).toBe(true);
    expect(flags.known.has('$useInterTight')).toBe(true);
    expect(flags.reserved.has('$shipTable')).toBe(true);
    expect(flags.reserved.has('$shipToggle')).toBe(false);
  });

  it('warns when no stylesheet loads @ship-ui/core/styles', () => {
    const notes = projectChecks([{ file: 'styles.scss', text: 'body { margin: 0 }' }], flags);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain("@use '@ship-ui/core/styles'");
    expect(projectChecks([{ file: 'styles.scss', text: "@use '@ship-ui/core/styles';" }], flags)).toEqual([]);
    // A workspace that points into the library's styles folder counts too.
    expect(projectChecks([{ file: 'styles.scss', text: "@use '../../ship-ui/styles/index.scss' with ($useInterTight: true);" }], flags)).toEqual([]);
  });

  it('points at unknown and not-yet-honoured flags in the with() block', () => {
    const notes = projectChecks(
      [{ file: 'styles.scss', text: "@use '@ship-ui/core/styles' with ($useInterTight: false, $shipTable: false, $shipTabel: false);" }],
      flags,
    );
    expect(notes.map((n) => n.split('`')[1])).toEqual(['$shipTable', '$shipTabel']);
    expect(notes[0]).toContain('not honoured');
    expect(notes[1]).toContain('not a flag');
  });
});
