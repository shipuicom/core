import { describe, expect, it } from 'vitest';
import { dedentPastedCode } from './editor-serializers';

describe('dedentPastedCode', () => {
  it('strips the common indentation of the lines after an unindented first line', () => {
    const pasted = 'if (this.navDebug) {\n\t\t\tconst paths = [];\n\t\t\t\tdeep();\n\t\t}';
    expect(dedentPastedCode(pasted)).toBe('if (this.navDebug) {\n\tconst paths = [];\n\t\tdeep();\n}');
  });

  it('works with space indentation', () => {
    const pasted = 'function f() {\n        return 1;\n      }';
    expect(dedentPastedCode(pasted)).toBe('function f() {\n  return 1;\n}');
  });

  it('leaves a self-consistent snippet (indented first line) untouched', () => {
    const pasted = '  if (a) {\n    b();\n  }';
    expect(dedentPastedCode(pasted)).toBe(pasted);
  });

  it('leaves a snippet with a flush later line untouched', () => {
    const pasted = 'line one\n\tindented\nflush\n\tindented again';
    expect(dedentPastedCode(pasted)).toBe(pasted);
  });

  it('blank lines neither vote nor break the common prefix', () => {
    const pasted = 'a() {\n\n\t\tb();\n\n\t}';
    expect(dedentPastedCode(pasted)).toBe('a() {\n\n\tb();\n\n}');
  });

  it('mixed tabs and spaces only share what literally matches', () => {
    // "\t " and "\t\t" share only "\t" — the safe common prefix.
    const pasted = 'x {\n\t a();\n\t\tb();\n}';
    expect(dedentPastedCode(pasted)).toBe(pasted); // "}" is flush → untouched
    const noClose = 'x {\n\t a();\n\t\tb();';
    expect(dedentPastedCode(noClose)).toBe('x {\n a();\n\tb();');
  });

  it('single lines and all-blank tails pass through', () => {
    expect(dedentPastedCode('just one line')).toBe('just one line');
    expect(dedentPastedCode('one\n\n')).toBe('one\n\n');
  });

  it('an empty first line (full-line copy with leading newline) still dedents the body', () => {
    const pasted = '\n\t\tfirst();\n\t\tsecond();';
    expect(dedentPastedCode(pasted)).toBe('\nfirst();\nsecond();');
  });
});
