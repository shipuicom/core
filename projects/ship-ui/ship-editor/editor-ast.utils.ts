import { ASTInlineNode } from './editor.types';

/**
 * Shared inline-node helpers.
 *
 * The tree-navigating mutation primitives that used to live here moved onto
 * the columnar document (editor-columnar-mutations.ts); what remains is the
 * normalization the op format and serializers still rely on, and the
 * run-resolution the flat position maths uses.
 */

export function normalizeInlineNodes(nodes: ASTInlineNode[]): ASTInlineNode[] {
  const result: ASTInlineNode[] = [];
  for (const node of nodes) {
    if (node.text === '') continue;
    if (result.length > 0) {
      const last = result[result.length - 1];
      if (JSON.stringify(last.marks || []) === JSON.stringify(node.marks || [])) {
        last.text += node.text;
        continue;
      }
    }
    result.push({ ...node, marks: node.marks ? structuredClone(node.marks) : undefined });
  }
  if (result.length === 0) result.push({ type: 'text', text: '' });
  return result;
}

export function resolveInlinePosition(
  content: ASTInlineNode[],
  charOffset: number
): { inlineIndex: number; offset: number } {
  let remaining = charOffset;
  for (let i = 0; i < content.length; i++) {
    const len = content[i].text.length;
    if (remaining <= len) return { inlineIndex: i, offset: remaining };
    remaining -= len;
  }
  const lastIdx = Math.max(0, content.length - 1);
  return { inlineIndex: lastIdx, offset: content[lastIdx]?.text.length || 0 };
}
