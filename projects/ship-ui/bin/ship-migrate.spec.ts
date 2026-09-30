// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { MIGRATIONS, migrateSource } from './ship-migrate';

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
    const r = migrateSource("@use '@ship-ui/core/styles' with ($shipStat: false, $shipStatRing: true);", '.scss', v026);
    expect(r.text).toBe("@use '@ship-ui/core/styles' with ($shipLayoutStat: false, $shipLayoutStatRing: true);");
  });

  it('renames colour classes on the listed tags and warns elsewhere', () => {
    const html = '<sh-form-field class="warning big"></sh-form-field>\n<div class="warning">x</div>\n<sh-list-item-swipe [class.danger]="d"></sh-list-item-swipe>';
    const r = migrateSource(html, '.html', v026);
    expect(r.text).toBe('<sh-form-field class="warn big"></sh-form-field>\n<div class="warning">x</div>\n<sh-list-item-swipe [class.error]="d"></sh-list-item-swipe>');
    expect(r.changes.map((c) => c.detail)).toEqual(['.warning → .warn', '.danger → .error']);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0].line).toBe(2);
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

  it('is idempotent', () => {
    const once = migrateSource('<sh-card color="a" class="warning"></sh-card> --breadcrumbs-c', '.html', v026).text;
    const twice = migrateSource(once, '.html', v026);
    expect(twice.text).toBe(once);
    expect(twice.changes).toHaveLength(0);
  });
});
