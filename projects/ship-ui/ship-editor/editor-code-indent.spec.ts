import { describe, expect, it } from 'vitest';
import { toColumnar } from './editor-columnar';
import { enterOp, flatPosOfBlockChar, indentUnitOf, insertTextOp } from './editor-columnar-mutations';
import * as Behaviors from './standard-behaviors';
import { BaseBlockBehavior } from './editor-behaviors';

const blocks = new Map<string, BaseBlockBehavior>();
[new Behaviors.ParagraphBehavior(), new Behaviors.CodeBlockBehavior()].forEach((b) => blocks.set(b.type, b));
const inlines = new Map();

const code = (text: string) => toColumnar([{ type: 'code-block', content: [{ type: 'text', text }] }]);
const caretAtEnd = (cd: ReturnType<typeof code>) => {
  const pos = flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: Number.MAX_SAFE_INTEGER });
  return { from: pos, to: pos };
};

describe('code auto-indent', () => {
  describe('indentUnitOf', () => {
    it('prefers a tab when the block indents with tabs', () => {
      expect(indentUnitOf('a {\n\tb\n}')).toBe('\t');
    });
    it('matches the shallowest space indent, clamped', () => {
      expect(indentUnitOf('a {\n    b\n}')).toBe('    ');
      expect(indentUnitOf('a {\n b\n}')).toBe('  '); // 1 clamps up to 2
    });
    it('defaults to two spaces with no indentation yet, ignoring blank lines', () => {
      expect(indentUnitOf('flat()')).toBe('  ');
      expect(indentUnitOf('a\n\t\nb')).toBe('  '); // whitespace-only line does not vote
    });
  });

  describe('Enter in a code block', () => {
    it('deepens by one unit after an opening brace', () => {
      const cd = code('if (ok) {');
      const mutation = enterOp(cd, caretAtEnd(cd), blocks)!;
      expect(cd.textOf(0)).toBe('if (ok) {\n  ');
      expect(mutation.selAfter.from).toBe(flatPosOfBlockChar(cd, { blockIndex: 0, charOffset: 12 }));
    });

    it('uses the block’s own unit for the bump', () => {
      const cd = code('fn x() {\n\ta();\n\tif (y) {');
      enterOp(cd, caretAtEnd(cd), blocks);
      expect(cd.textOf(0)).toBe('fn x() {\n\ta();\n\tif (y) {\n\t\t');
    });

    it('deepens after a trailing colon (Python-style)', () => {
      const cd = code('def f():');
      enterOp(cd, caretAtEnd(cd), blocks);
      expect(cd.textOf(0)).toBe('def f():\n  ');
    });

    it('only inherits indentation on ordinary lines', () => {
      const cd = code('a {\n\tb();');
      enterOp(cd, caretAtEnd(cd), blocks);
      expect(cd.textOf(0)).toBe('a {\n\tb();\n\t');
    });

    it('double Enter on an indented blank line breaks out of the block', () => {
      const cd = code('a {\n\t');
      const mutation = enterOp(cd, caretAtEnd(cd), blocks)!;
      expect(cd.textOf(0)).toBe('a {');
      expect(cd.rows).toBe(2);
      expect(cd.typeOf(1)).toBe('paragraph');
      expect(mutation.selAfter.from).toBe(flatPosOfBlockChar(cd, { blockIndex: 1, charOffset: 0 }));
    });
  });

  describe('typing a closer on an empty line', () => {
    it('outdents one unit before inserting', () => {
      const cd = code('if (ok) {\n\t\tx();\n\t\t');
      const sel = caretAtEnd(cd);
      const mutation = insertTextOp(cd, sel, '}', blocks, inlines, null)!;
      expect(cd.textOf(0)).toBe('if (ok) {\n\t\tx();\n\t}');
      expect(mutation.selAfter!.from).toBe(sel.from); // one dropped, one inserted
    });

    it('applies to ) and ] too', () => {
      const cd = code('call(\n  a,\n  ');
      insertTextOp(cd, caretAtEnd(cd), ')', blocks, inlines, null);
      expect(cd.textOf(0)).toBe('call(\n  a,\n)');
    });

    it('leaves a closer after content alone', () => {
      const cd = code('a {\n\tb(); ');
      insertTextOp(cd, caretAtEnd(cd), '}', blocks, inlines, null);
      expect(cd.textOf(0)).toBe('a {\n\tb(); }');
    });

    it('never fires outside whitespace-preserving blocks', () => {
      const cd = toColumnar([{ type: 'paragraph', content: [{ type: 'text', text: 'x\t' }] }]);
      insertTextOp(cd, caretAtEnd(cd), '}', blocks, inlines, null);
      expect(cd.textOf(0)).toBe('x\t}');
    });
  });
});
