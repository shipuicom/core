import { ShipCodeTheme } from './theme-resolver';

/**
 * ShipCode's built-in light theme — the dark palette's hues, darkened for a
 * light surface. Chrome colors stay with the ship CSS variables.
 */
export const SHIP_LIGHT: ShipCodeTheme = {
  name: 'ship-light',
  type: 'light',
  colors: {
    'editor.foreground': '#383a42',
  },
  tokenColors: [
    { scope: 'comment, punctuation.definition.comment', settings: { foreground: '#8b919c', fontStyle: 'italic' } },
    { scope: 'string, punctuation.definition.string', settings: { foreground: '#3d8a5a' } },
    { scope: 'string.regexp, constant.character.escape', settings: { foreground: '#0f7f8b' } },
    { scope: 'constant.numeric', settings: { foreground: '#b25f13' } },
    { scope: 'constant.language, support.constant', settings: { foreground: '#b25f13' } },
    { scope: 'keyword, storage', settings: { foreground: '#a626a4' } },
    { scope: 'keyword.operator', settings: { foreground: '#5b6470' } },
    { scope: 'entity.name.function, support.function', settings: { foreground: '#2a63bf' } },
    { scope: 'entity.name.type, entity.name.class, support.type, support.class', settings: { foreground: '#9a6a03' } },
    { scope: 'entity.name.tag', settings: { foreground: '#ca3e47' } },
    { scope: 'entity.other.attribute-name', settings: { foreground: '#b25f13' } },
    { scope: 'variable', settings: { foreground: '#ca3e47' } },
    { scope: 'variable.parameter', settings: { foreground: '#383a42' } },
    { scope: 'variable.other.property, support.type.property-name, meta.property-name', settings: { foreground: '#ca3e47' } },
    { scope: 'punctuation', settings: { foreground: '#5b6470' } },
    { scope: 'invalid', settings: { foreground: '#ffffff' } },
  ],
};
