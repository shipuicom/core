import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { formatShortcut, matchKeybinding, parseKeybinding } from './keybinding-utils';
import { SHIP_A11Y_KEYBINDINGS_OVERRIDE } from './ship-a11y-keybindings-override.token';
import { ShipA11yKeybindingsService } from './ship-a11y-keybindings.service';

describe('Keybinding Utilities', () => {
  describe('parseKeybinding', () => {
    it('should parse single key correctly', () => {
      const parsed = parseKeybinding('enter', false);
      expect(parsed.key).toBe('enter');
      expect(parsed.ctrlKey).toBe(false);
      expect(parsed.metaKey).toBe(false);
      expect(parsed.shiftKey).toBe(false);
      expect(parsed.altKey).toBe(false);
    });

    it('should parse key code mapping (starts with key or digit)', () => {
      const parsed = parseKeybinding('KeyA', false);
      expect(parsed.code).toBe('keya');
      expect(parsed.key).toBeUndefined();
    });

    it('should parse modifier keys correctly', () => {
      const parsed = parseKeybinding('ctrl+shift+alt+k', false);
      expect(parsed.ctrlKey).toBe(true);
      expect(parsed.shiftKey).toBe(true);
      expect(parsed.altKey).toBe(true);
      expect(parsed.metaKey).toBe(false);
      expect(parsed.key).toBe('k');
    });

    it('should resolve ctrlOrCmd key dynamically based on OS', () => {
      
      const parsedWindows = parseKeybinding('ctrlOrCmd+KeyK', false);
      expect(parsedWindows.ctrlKey).toBe(true);
      expect(parsedWindows.metaKey).toBe(false);
      expect(parsedWindows.code).toBe('keyk');

      
      const parsedMac = parseKeybinding('ctrlOrCmd+KeyK', true);
      expect(parsedMac.ctrlKey).toBe(false);
      expect(parsedMac.metaKey).toBe(true);
      expect(parsedMac.code).toBe('keyk');
    });
  });

  describe('matchKeybinding', () => {
    it('should match KeyboardEvent correctly', () => {
      const parsed = parseKeybinding('ctrl+shift+k', false);
      const matchedEvent = {
        ctrlKey: true,
        shiftKey: true,
        metaKey: false,
        altKey: false,
        key: 'k',
        code: 'KeyK',
      } as KeyboardEvent;

      const unmatchedEvent = {
        ctrlKey: true,
        shiftKey: false, 
        metaKey: false,
        altKey: false,
        key: 'k',
        code: 'KeyK',
      } as KeyboardEvent;

      expect(matchKeybinding(matchedEvent, parsed)).toBe(true);
      expect(matchKeybinding(unmatchedEvent, parsed)).toBe(false);
    });

    it('should match spaces correctly', () => {
      const parsed = parseKeybinding('space', false);
      const spaceEvent = {
        ctrlKey: false,
        shiftKey: false,
        metaKey: false,
        altKey: false,
        key: ' ',
      } as KeyboardEvent;

      expect(matchKeybinding(spaceEvent, parsed)).toBe(true);
    });
  });

  describe('formatShortcut', () => {
    it('should format shorthand for Windows/Linux (with +)', () => {
      const formatted = formatShortcut('ctrlOrCmd+shift+KeyK', false);
      expect(formatted).toBe('Ctrl+Shift+K');
    });

    it('should format shorthand for macOS (with symbol string)', () => {
      const formatted = formatShortcut('ctrlOrCmd+shift+KeyK', true);
      expect(formatted).toBe('⌘⇧K');
    });

    it('should format arrow keys and other names', () => {
      const formatted = formatShortcut('ctrl+arrowup', false);
      expect(formatted).toBe('Ctrl+Arrowup');
    });
  });
});

describe('ShipA11yKeybindingsService', () => {
  let service: ShipA11yKeybindingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ShipA11yKeybindingsService],
    });
    service = TestBed.inject(ShipA11yKeybindingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should register defaults and match them', () => {
    service.registerDefaults({
      'table.next-page': 'arrowright',
      'table.prev-page': 'arrowleft',
    });

    expect(service.getShortcut('table.next-page')).toBe('arrowright');

    const event = {
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      metaKey: false,
      key: 'ArrowRight',
    } as KeyboardEvent;

    expect(service.matches(event, 'table.next-page')).toBe(true);
  });

  it('should allow overriding registered defaults at runtime', () => {
    service.registerDefaults({
      'table.next-page': 'arrowright',
    });

    expect(service.getShortcut('table.next-page')).toBe('arrowright');

    service.registerOverrides({
      'table.next-page': 'ctrlOrCmd+arrowright',
    });

    expect(service.getShortcut('table.next-page')).toBe('ctrlOrCmd+arrowright');
  });
});

describe('ShipA11yKeybindingsService with SHIP_A11Y_KEYBINDINGS_OVERRIDE', () => {
  let service: ShipA11yKeybindingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ShipA11yKeybindingsService,
        {
          provide: SHIP_A11Y_KEYBINDINGS_OVERRIDE,
          useValue: {
            'global.help': 'ctrlOrCmd+h',
          },
        },
      ],
    });
    service = TestBed.inject(ShipA11yKeybindingsService);
  });

  it('should apply overrides provided via InjectionToken during construction', () => {
    expect(service.getShortcut('global.help')).toBe('ctrlOrCmd+h');

    
    service.registerDefaults({
      'global.help': 'f1',
    });

    expect(service.getShortcut('global.help')).toBe('ctrlOrCmd+h');
    expect(service.getDefaultShortcut('global.help')).toBe('f1');
  });
});
