import { describe, expect, it } from 'vitest';
import { ShipConfig } from '@ship-ui/core';
import { exportShipEditorJson, exportShipTs, parseShipConfigImport, sanitizeShipConfig } from './ship-config-export';

const ok = (text: string) => {
  const r = parseShipConfigImport(text);
  if ('error' in r) throw new Error(r.error);
  return r;
};

describe('sanitizeShipConfig', () => {
  it('drops wrongly typed values and lists them', () => {
    const { config, ignored } = sanitizeShipConfig({
      colors: { primary: 5, accent: 'hsl(1, 2%, 3%)' },
      distribution: { primary: 'x', base: 1.2 },
      fontSize: '16',
      borderRadius: 2,
      button: { color: 3, variant: 'outlined', sharp: 'yes', bogus: 1 },
      chip: 'raised',
      sidenavType: 'weird',
    });
    expect(config).toEqual({
      colors: { accent: 'hsl(1, 2%, 3%)' },
      distribution: { base: 1.2 },
      borderRadius: 2,
      button: { variant: 'outlined' },
    });
    expect(ignored.join('|')).toContain('colors.primary');
    expect(ignored.join('|')).toContain('fontSize');
    expect(ignored.join('|')).toContain('button.sharp');
    expect(ignored.join('|')).toContain('chip');
  });

  it('never throws on garbage', () => {
    for (const raw of [null, 5, 'x', [], { colors: [] }, { button: null }]) expect(() => sanitizeShipConfig(raw)).not.toThrow();
  });

  it('migrates legacy keys and drops unknown ones', () => {
    const { config, ignored } = sanitizeShipConfig({
      'event-card': { variant: 'outlined' },
      alertVariant: 'flat',
      cardType: 'type-b',
      table: { color: 'primary' },
      tableType: 'type-b',
      somethingOld: true,
    });
    expect(config).toEqual({
      eventCard: { variant: 'outlined' },
      alert: { variant: 'flat' },
      card: { variant: 'type-b' },
      table: { color: 'primary', variant: 'type-b' },
    });
    expect(ignored.some(i => i.startsWith('somethingOld'))).toBe(true);
  });
});

describe('parseShipConfigImport', () => {
  it('sanitizes a non-string colour instead of persisting it', () => {
    const r = ok('{"config":{"colors":{"primary":5}}}');
    expect(r.config).toEqual({});
    expect(r.ignored[0]).toContain('colors.primary');
    expect(() => exportShipEditorJson(r.config, r.styles)).not.toThrow();
  });

  it('round-trips ship-config.json', () => {
    const config: ShipConfig = {
      colors: { primary: 'hsl(10, 50%, 50%)' },
      distribution: { primary: 1.4 },
      fontSize: 15,
      fontFamily: 'Inter',
      button: { variant: 'outlined', sharp: true },
      icon: { disableUnfocus: true },
    };
    const styles = { colors: ['primary'] };
    const r = ok(exportShipEditorJson(config, styles));
    expect(r.source).toBe('json');
    expect(r.config).toEqual(config);
    expect(r.styles).toEqual(styles);
    expect(r.ignored).toEqual([]);
  });

  it('round-trips app.config.ts component defaults', () => {
    const config: ShipConfig = {
      button: { variant: 'outlined', color: "it's", sharp: true },
      eventCard: { size: 'small' },
      dialogType: 'type-b',
    };
    const r = ok(exportShipTs({ ...config, fontSize: 18, colors: { primary: 'hsl(1, 1%, 1%)' } }));
    expect(r.source).toBe('ts');
    expect(r.config).toEqual(config);
  });

  it('quotes non-identifier keys so a stale export stays valid TypeScript', () => {
    const ts = exportShipTs({ ['event-card' as never]: { variant: 'x' } } as ShipConfig);
    expect(ts).toContain("'event-card': {");
    expect(ok(ts).config).toEqual({ eventCard: { variant: 'x' } });
  });
});
