import { ShipCodeTheme } from './theme-resolver';

/**
 * ShipCode's built-in dark theme — a restrained One-Dark-adjacent palette
 * tuned for the ship dark surface. The editor chrome (background, gutter)
 * stays with the ship CSS variables; the theme only speaks for tokens.
 */
export const SHIP_DARK: ShipCodeTheme = {
  name: 'ship-dark',
  type: 'dark',
  colors: {
    'editor.foreground': '#abb2bf',
  },
  tokenColors: [
    { scope: 'comment, punctuation.definition.comment', settings: { foreground: '#7d8590', fontStyle: 'italic' } },
    { scope: 'string, punctuation.definition.string', settings: { foreground: '#7ec699' } },
    { scope: 'string.regexp, constant.character.escape', settings: { foreground: '#56b6c2' } },
    { scope: 'constant.numeric', settings: { foreground: '#d19a66' } },
    { scope: 'constant.language, support.constant', settings: { foreground: '#d19a66' } },
    { scope: 'keyword, storage', settings: { foreground: '#c678dd' } },
    { scope: 'keyword.operator', settings: { foreground: '#8fa1b3' } },
    { scope: 'entity.name.function, support.function', settings: { foreground: '#61afef' } },
    { scope: 'entity.name.type, entity.name.class, support.type, support.class', settings: { foreground: '#e5c07b' } },
    { scope: 'entity.name.tag', settings: { foreground: '#e06c75' } },
    { scope: 'entity.other.attribute-name', settings: { foreground: '#d19a66' } },
    { scope: 'variable', settings: { foreground: '#e06c75' } },
    { scope: 'variable.parameter', settings: { foreground: '#abb2bf' } },
    { scope: 'variable.other.property, support.type.property-name, meta.property-name', settings: { foreground: '#e06c75' } },
    { scope: 'punctuation', settings: { foreground: '#8fa1b3' } },
    { scope: 'invalid', settings: { foreground: '#ffffff' } },
  ],
};
