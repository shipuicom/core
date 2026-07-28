import { BaseBlockBehavior, BaseInlineBehavior } from './editor-behaviors';
import {
  ASTBlockNode,
  ASTDocument,
  ASTInlineNode,
  ASTMark,
  LogicalPosition,
  LogicalSelection,
  TransactionResult,
} from './editor.types';

export function handleEscapeHatch(
  doc: ASTDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult | null {
  if (!sel.isCollapsed) return null;
  const blockIndex = sel.start.blockIndex;
  const block = doc[blockIndex];
  if (!block) return null;
  const behavior = blocks.get(block.type);

  let isAtStart = false;
  if (behavior?.category === 'container') {
    if ((sel.start.itemIndex ?? 0) === 0 && sel.start.inlineIndex === 0 && sel.start.offset === 0) isAtStart = true;
  } else {
    if (sel.start.inlineIndex === 0 && sel.start.offset === 0) isAtStart = true;
  }

  if (!isAtStart) return null;

  if (blockIndex === 0) {
    const isEmptyParagraph =
      block.type === 'paragraph' &&
      (block.content.length === 0 || (block.content.length === 1 && (block.content[0] as ASTInlineNode).text === ''));
    if (isEmptyParagraph) return null;

    const newDoc = structuredClone(doc);
    newDoc.unshift({ type: 'paragraph', content: [{ type: 'text', text: '' }] });
    const newPos = { blockIndex: 0, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
  } else {
    const prevIndex = blockIndex - 1;
    const prevBlock = doc[prevIndex];
    const prevBehavior = blocks.get(prevBlock.type);

    let targetOffset = 0;
    let targetInlineIndex = 0;
    let targetItemIndex: number | undefined;

    if (prevBehavior?.category === 'container') {
      const items = prevBlock.content as ASTBlockNode[];
      targetItemIndex = Math.max(0, items.length - 1);
      const targetItem = items[targetItemIndex];
      if (targetItem) {
        const itemContent = targetItem.content as ASTInlineNode[];
        targetInlineIndex = Math.max(0, itemContent.length - 1);
        targetOffset = itemContent[targetInlineIndex]?.text?.length || 0;
      }
    } else if (prevBehavior?.category !== 'void') {
      const content = prevBlock.content as ASTInlineNode[];
      targetInlineIndex = Math.max(0, content.length - 1);
      targetOffset = content[targetInlineIndex]?.text?.length || 0;
    }
    const newPos: LogicalPosition = { blockIndex: prevIndex, inlineIndex: targetInlineIndex, offset: targetOffset };
    if (targetItemIndex !== undefined) newPos.itemIndex = targetItemIndex;
    return { doc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
  }
}

export function handleEnter(
  doc: ASTDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult {

  let draft = doc,
    currentSel = sel;
  if (!sel.isCollapsed) {
    const res = deleteRange(doc, sel, blocks);
    draft = res.doc;
    currentSel = res.selectionShift!;
  }

  const newDoc = structuredClone(draft);
  const blockIdx = currentSel.start.blockIndex;
  const block = newDoc[blockIdx];
  const behavior = blocks.get(block.type);
  if (!behavior) return { doc: newDoc };

  const physics = behavior.enterPhysics;

  if (behavior.category === 'void' || physics.strategy === 'insert-default-below') {
    const defaultType = physics.defaultSplitTarget || 'paragraph';
    newDoc.splice(blockIdx + 1, 0, { type: defaultType, content: [{ type: 'text', text: '' }] });
    const pos = { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  if (behavior.category === 'container') {
    const items = block.content as ASTBlockNode[];
    const itemIdx = currentSel.start.itemIndex ?? 0;
    const item = items[itemIdx];
    const isItemEmpty =
      !item.content ||
      item.content.length === 0 ||
      (item.content.length === 1 && (item.content[0] as ASTInlineNode).text === '');

    if (isItemEmpty) {
      items.splice(itemIdx, 1);
      const escapePara: ASTBlockNode = { type: 'paragraph', content: [{ type: 'text', text: '' }] };
      if (items.length === 0) {
        newDoc.splice(blockIdx, 1, escapePara);
        return {
          doc: newDoc,
          selectionShift: {
            start: { blockIndex: blockIdx, inlineIndex: 0, offset: 0 },
            end: { blockIndex: blockIdx, inlineIndex: 0, offset: 0 },
            isCollapsed: true,
          },
        };
      } else if (itemIdx >= items.length) {
        newDoc.splice(blockIdx + 1, 0, escapePara);
        return {
          doc: newDoc,
          selectionShift: {
            start: { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 },
            end: { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 },
            isCollapsed: true,
          },
        };
      } else if (itemIdx === 0) {
        newDoc.splice(blockIdx, 0, escapePara);
        return {
          doc: newDoc,
          selectionShift: {
            start: { blockIndex: blockIdx, inlineIndex: 0, offset: 0 },
            end: { blockIndex: blockIdx, inlineIndex: 0, offset: 0 },
            isCollapsed: true,
          },
        };
      } else {
        const rightItems = items.splice(itemIdx);
        const newList: ASTBlockNode = { type: block.type, attrs: block.attrs, content: rightItems };
        newDoc.splice(blockIdx + 1, 0, escapePara, newList);
        return {
          doc: newDoc,
          selectionShift: {
            start: { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 },
            end: { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 },
            isCollapsed: true,
          },
        };
      }
    }

    const leftContent = extractLeft(
      item.content as ASTInlineNode[],
      currentSel.start.inlineIndex,
      currentSel.start.offset
    );
    const rightContent = extractRight(
      item.content as ASTInlineNode[],
      currentSel.start.inlineIndex,
      currentSel.start.offset
    );
    item.content = normalizeInlineNodes(leftContent);
    const newItem: ASTBlockNode = { type: 'list-item', content: normalizeInlineNodes(rightContent) };
    items.splice(itemIdx + 1, 0, newItem);

    const newPos = { blockIndex: blockIdx, itemIndex: itemIdx + 1, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
  }

  const inlines = block.content as ASTInlineNode[];
  const isAtEnd =
    currentSel.start.inlineIndex === inlines.length - 1 &&
    currentSel.start.offset === inlines[inlines.length - 1]?.text.length;

  if (physics.strategy === 'breakout' && isAtEnd) {
    const escapeType = physics.defaultSplitTarget || 'paragraph';
    newDoc.splice(blockIdx + 1, 0, { type: escapeType, content: [{ type: 'text', text: '' }] });
    const pos = { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  if (physics.strategy === 'newline') {
    const nodeIndex = currentSel.start.inlineIndex;
    const node = inlines[nodeIndex];
    if (node) {
      if (isAtEnd && node.text.endsWith('\n')) {

        node.text = node.text.replace(/\n$/, '');
        if (node.text === '' && inlines.length > 1) inlines.pop();
        const escapeType = physics.defaultSplitTarget || 'paragraph';
        newDoc.splice(blockIdx + 1, 0, { type: escapeType, content: [{ type: 'text', text: '' }] });
        const pos = { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 };
        return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
      }

      const textBefore =
        inlines
          .slice(0, nodeIndex)
          .map((n) => n.text)
          .join('') + node.text.slice(0, currentSel.start.offset);
      const indentMatch = textBefore
        .split('\n')
        .pop()
        ?.match(/^[ \t]*/);

      const left = extractLeft(inlines, nodeIndex, currentSel.start.offset);
      const right = extractRight(inlines, nodeIndex, currentSel.start.offset);
      const injected: ASTInlineNode = { type: 'text', text: '\n' + (indentMatch ? indentMatch[0] : '') };

      block.content = normalizeInlineNodes([...left, injected, ...right]);
      const newOffset = left.reduce((acc, curr) => acc + curr.text.length, 0) + injected.text.length;
      const res = resolveInlinePosition(block.content as ASTInlineNode[], newOffset);
      const newPos = { blockIndex: blockIdx, inlineIndex: res.inlineIndex, offset: res.offset };
      return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
    }
  }

  const leftContent = extractLeft(inlines, currentSel.start.inlineIndex, currentSel.start.offset);
  const rightContent = extractRight(inlines, currentSel.start.inlineIndex, currentSel.start.offset);

  block.content = normalizeInlineNodes(leftContent);
  const newBlock: ASTBlockNode = { type: block.type, attrs: block.attrs, content: normalizeInlineNodes(rightContent) };
  newDoc.splice(blockIdx + 1, 0, newBlock);
  const pos = { blockIndex: blockIdx + 1, inlineIndex: 0, offset: 0 };
  return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
}

export function handleBackspace(
  doc: ASTDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult {

  if (!sel.isCollapsed) return deleteRange(doc, sel, blocks);

  const blockIndex = sel.start.blockIndex;
  const block = doc[blockIndex];
  if (!block) return { doc };

  const behavior = blocks.get(block.type);
  let isAtStart = false;
  let itemIndex = 0;

  if (behavior?.category === 'container') {
    itemIndex = sel.start.itemIndex ?? 0;
    if (sel.start.offset === 0 && sel.start.inlineIndex === 0) isAtStart = true;
  } else {
    isAtStart = sel.start.inlineIndex === 0 && sel.start.offset === 0;
  }

  if (isAtStart) {
    if (behavior?.category === 'container') {
      const items = block.content as ASTBlockNode[];
      const item = items[itemIndex];
      const isItemEmpty =
        !item.content ||
        item.content.length === 0 ||
        (item.content.length === 1 && (item.content[0] as ASTInlineNode).text === '');

      if (isItemEmpty) {
        const newDoc = structuredClone(doc);
        const newItems = newDoc[blockIndex].content as ASTBlockNode[];
        newItems.splice(itemIndex, 1);

        if (newItems.length === 0) {
          newDoc.splice(blockIndex, 1, { type: 'paragraph', content: [{ type: 'text', text: '' }] });
          const pos = { blockIndex, inlineIndex: 0, offset: 0 };
          return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
        }

        if (itemIndex > 0) {
          const prevItem = newItems[itemIndex - 1];
          const prevContent = prevItem.content as ASTInlineNode[];
          const targetInline = Math.max(0, prevContent.length - 1);
          const targetOffset = prevContent[targetInline]?.text.length || 0;
          const pos = { blockIndex, itemIndex: itemIndex - 1, inlineIndex: targetInline, offset: targetOffset };
          return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
        }
        const pos = { blockIndex, itemIndex: 0, inlineIndex: 0, offset: 0 };
        return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
      }

      const itemBehavior = blocks.get(item.type);
      if (itemBehavior?.backspacePhysics.fallbackType === 'outdent') {
        const newDoc = structuredClone(doc);
        const newItems = newDoc[blockIndex].content as ASTBlockNode[];
        const extracted = newItems.splice(itemIndex, 1)[0];
        const para: ASTBlockNode = { type: 'paragraph', content: extracted.content };

        if (newItems.length === 0) {
          newDoc.splice(blockIndex, 1, para);
          return {
            doc: newDoc,
            selectionShift: {
              start: { blockIndex, inlineIndex: 0, offset: 0 },
              end: { blockIndex, inlineIndex: 0, offset: 0 },
              isCollapsed: true,
            },
          };
        } else if (itemIndex === 0) {
          newDoc.splice(blockIndex, 0, para);
          return {
            doc: newDoc,
            selectionShift: {
              start: { blockIndex, inlineIndex: 0, offset: 0 },
              end: { blockIndex, inlineIndex: 0, offset: 0 },
              isCollapsed: true,
            },
          };
        } else if (itemIndex >= newItems.length) {
          newDoc.splice(blockIndex + 1, 0, para);
          return {
            doc: newDoc,
            selectionShift: {
              start: { blockIndex: blockIndex + 1, inlineIndex: 0, offset: 0 },
              end: { blockIndex: blockIndex + 1, inlineIndex: 0, offset: 0 },
              isCollapsed: true,
            },
          };
        } else {
          const rightItems = newItems.splice(itemIndex);
          const newList: ASTBlockNode = { type: block.type, attrs: block.attrs, content: rightItems };
          newDoc.splice(blockIndex + 1, 0, para, newList);
          return {
            doc: newDoc,
            selectionShift: {
              start: { blockIndex: blockIndex + 1, inlineIndex: 0, offset: 0 },
              end: { blockIndex: blockIndex + 1, inlineIndex: 0, offset: 0 },
              isCollapsed: true,
            },
          };
        }
      }
    }

    if (behavior?.category === 'void') {
      const newDoc = structuredClone(doc);
      if (doc.length === 1) {
        newDoc[0] = { type: 'paragraph', content: [{ type: 'text', text: '' }] };
        const newPos = { blockIndex: 0, inlineIndex: 0, offset: 0 };
        return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
      }
      newDoc.splice(blockIndex, 1);
      const prevIdx = Math.max(0, blockIndex - 1);
      const prevBlock = newDoc[prevIdx];
      const prevBehavior = blocks.get(prevBlock.type);

      let targetOffset = 0,
        targetInline = 0,
        targetItemIndex: number | undefined;

      if (prevBehavior?.category === 'container') {
        const items = prevBlock.content as ASTBlockNode[];
        targetItemIndex = Math.max(0, items.length - 1);
        const inlines = (items[targetItemIndex]?.content as ASTInlineNode[]) || [];
        targetInline = Math.max(0, inlines.length - 1);
        targetOffset = inlines[targetInline]?.text.length || 0;
      } else if (prevBehavior?.category !== 'void') {
        const inlines = prevBlock.content as ASTInlineNode[];
        targetInline = Math.max(0, inlines.length - 1);
        targetOffset = inlines[targetInline]?.text.length || 0;
      }
      const pos: LogicalPosition = { blockIndex: prevIdx, inlineIndex: targetInline, offset: targetOffset };
      if (targetItemIndex !== undefined) pos.itemIndex = targetItemIndex;
      return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
    }

    if (behavior?.backspacePhysics.fallbackType && block.type !== behavior.backspacePhysics.fallbackType) {
      const newDoc = structuredClone(doc);
      newDoc[blockIndex].type = behavior.backspacePhysics.fallbackType;
      delete newDoc[blockIndex].attrs;
      return { doc: newDoc, selectionShift: sel };
    }

    if (blockIndex === 0) return { doc };

    const newDoc = structuredClone(doc);
    const currBlock = newDoc[blockIndex];
    const prevBlock = newDoc[blockIndex - 1];
    const prevBehavior = blocks.get(prevBlock.type);

    if (prevBehavior?.category === 'void') {
      newDoc.splice(blockIndex - 1, 1);
      const pos: LogicalPosition = {
        blockIndex: blockIndex - 1,
        inlineIndex: sel.start.inlineIndex,
        offset: sel.start.offset,
      };
      if (sel.start.itemIndex !== undefined) pos.itemIndex = sel.start.itemIndex;
      return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
    }

    let targetOffset = 0;
    let targetInlineIdx = 0;
    let targetItemIndex: number | undefined;

    if (prevBehavior?.category === 'container') {
      const items = prevBlock.content as ASTBlockNode[];
      if (items.length > 0) {
        targetItemIndex = items.length - 1;
        const lastItem = items[targetItemIndex];
        const prevContent = lastItem.content as ASTInlineNode[];

        let currContent: ASTInlineNode[] = [];
        if (behavior?.category === 'container') {
          const currItems = currBlock.content as ASTBlockNode[];
          if (currItems.length > 0) {
            currContent = currItems[0].content as ASTInlineNode[];
            items.push(...currItems.slice(1));
          }
        } else {
          currContent = currBlock.content as ASTInlineNode[];
        }

        targetInlineIdx = Math.max(0, prevContent.length - 1);
        targetOffset = prevContent[targetInlineIdx]?.text.length || 0;
        lastItem.content = normalizeInlineNodes([...prevContent, ...currContent]);
      }
    } else {
      const prevContent = prevBlock.content as ASTInlineNode[];
      let currContent: ASTInlineNode[] = [];

      if (behavior?.category === 'container') {
        const currItems = currBlock.content as ASTBlockNode[];
        if (currItems.length > 0) {
          currContent = currItems[0].content as ASTInlineNode[];
        }
      } else {
        currContent = currBlock.content as ASTInlineNode[];
      }

      targetInlineIdx = Math.max(0, prevContent.length - 1);
      targetOffset = prevContent[targetInlineIdx]?.text.length || 0;
      prevBlock.content = normalizeInlineNodes([...prevContent, ...currContent]);

      if (behavior?.category === 'container') {
        const currItems = currBlock.content as ASTBlockNode[];
        if (currItems.length > 1) {
          const extraParas = currItems.slice(1).map((it) => ({ type: 'paragraph', content: it.content }));
          newDoc.splice(blockIndex, 1, ...(extraParas as ASTBlockNode[]));
          const pos: LogicalPosition = {
            blockIndex: blockIndex - 1,
            inlineIndex: targetInlineIdx,
            offset: targetOffset,
          };
          return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
        }
      }
    }

    newDoc.splice(blockIndex, 1);
    const pos: LogicalPosition = { blockIndex: blockIndex - 1, inlineIndex: targetInlineIdx, offset: targetOffset };
    if (targetItemIndex !== undefined) pos.itemIndex = targetItemIndex;
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  const newDoc = structuredClone(doc);
  const b = newDoc[blockIndex];

  let content: ASTInlineNode[];
  let inlineIdx = sel.start.inlineIndex;
  let offset = sel.start.offset;

  if (behavior?.category === 'container') {
    const item = (b.content as ASTBlockNode[])[itemIndex];
    content = item.content as ASTInlineNode[];
  } else {
    content = b.content as ASTInlineNode[];
  }

  let absOffset = 0;
  for (let i = 0; i < sel.start.inlineIndex; i++) absOffset += content[i].text.length;
  absOffset += sel.start.offset;

  if (absOffset > 0) {
    absOffset -= 1;
    let currentPos = 0;
    for (let i = 0; i < content.length; i++) {
      if (currentPos + content[i].text.length > absOffset) {
        const localOffset = absOffset - currentPos;
        content[i].text = content[i].text.slice(0, localOffset) + content[i].text.slice(localOffset + 1);
        if (content[i].text.length === 0) content.splice(i, 1);
        break;
      }
      currentPos += content[i].text.length;
    }
    if (content.length === 0) content.push({ type: 'text', text: '' });
  }

  const res = resolveInlinePosition(content, absOffset);
  const pos: LogicalPosition = { blockIndex, inlineIndex: res.inlineIndex, offset: res.offset };
  if (behavior?.category === 'container') pos.itemIndex = itemIndex;

  return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
}

export function deleteRange(
  doc: ASTDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult {
  const newDoc = structuredClone(doc);
  const { start, end } = sel;

  if (start.blockIndex === end.blockIndex) {
    const block = newDoc[start.blockIndex];
    const behavior = blocks.get(block.type);

    if (behavior?.category === 'container') {
      const items = block.content as ASTBlockNode[];
      const startItemIdx = start.itemIndex ?? 0;
      const endItemIdx = end.itemIndex ?? 0;

      if (startItemIdx === endItemIdx) {
        const item = items[startItemIdx];
        const content = item.content as ASTInlineNode[];
        const left = extractLeft(content, start.inlineIndex, start.offset);
        const right = extractRight(content, end.inlineIndex, end.offset);
        item.content = normalizeInlineNodes([...left, ...right]);
      } else {
        const startItem = items[startItemIdx];
        const endItem = items[endItemIdx];

        const left = extractLeft(startItem.content as ASTInlineNode[], start.inlineIndex, start.offset);
        const right = extractRight(endItem.content as ASTInlineNode[], end.inlineIndex, end.offset);

        startItem.content = normalizeInlineNodes([...left, ...right]);
        items.splice(startItemIdx + 1, endItemIdx - startItemIdx);
      }
    } else {
      const content = block.content as ASTInlineNode[];
      const left = extractLeft(content, start.inlineIndex, start.offset);
      const right = extractRight(content, end.inlineIndex, end.offset);
      block.content = normalizeInlineNodes([...left, ...right]);
    }
    return { doc: newDoc, selectionShift: { start: sel.start, end: sel.start, isCollapsed: true } };
  }

  const startBlock = newDoc[start.blockIndex];
  const endBlock = newDoc[end.blockIndex];

  const startBehavior = blocks.get(startBlock.type);
  const endBehavior = blocks.get(endBlock.type);

  let leftContent: ASTInlineNode[] = [];
  let rightContent: ASTInlineNode[] = [];
  let startItemTarget: ASTBlockNode | null = null;

  if (startBehavior?.category === 'container') {
    const items = startBlock.content as ASTBlockNode[];
    const sItemIdx = start.itemIndex ?? 0;
    startItemTarget = items[sItemIdx];
    items.splice(sItemIdx + 1);
    leftContent = extractLeft(startItemTarget.content as ASTInlineNode[], start.inlineIndex, start.offset);
  } else {
    leftContent = extractLeft(startBlock.content as ASTInlineNode[], start.inlineIndex, start.offset);
  }

  if (endBehavior?.category === 'container') {
    const items = endBlock.content as ASTBlockNode[];
    const eItemIdx = end.itemIndex ?? 0;
    const endItem = items[eItemIdx];
    rightContent = extractRight(endItem.content as ASTInlineNode[], end.inlineIndex, end.offset);
  } else {
    rightContent = extractRight(endBlock.content as ASTInlineNode[], end.inlineIndex, end.offset);
  }

  const mergedContent = normalizeInlineNodes([...leftContent, ...rightContent]);

  if (startItemTarget) {
    startItemTarget.content = mergedContent;
  } else {
    startBlock.content = mergedContent;
  }

  if (endBehavior?.category === 'container') {

    const endItems = endBlock.content as ASTBlockNode[];
    endItems.splice(0, (end.itemIndex ?? 0) + 1);
    const removeCount =
      endItems.length > 0
        ? end.blockIndex - start.blockIndex - 1
        : end.blockIndex - start.blockIndex;
    newDoc.splice(start.blockIndex + 1, removeCount);
  } else {
    newDoc.splice(start.blockIndex + 1, end.blockIndex - start.blockIndex);
  }

  return { doc: newDoc, selectionShift: { start: sel.start, end: sel.start, isCollapsed: true } };
}

function toBlockOfType(
  targetType: string,
  targetAttrs: Record<string, any> | undefined,
  source: ASTBlockNode,
  sourceContent: ASTInlineNode[],
  targetIsVoid: boolean
): ASTBlockNode {
  if (targetIsVoid) {
    return {
      type: targetType,
      attrs: {
        ...(targetAttrs ?? {}),
        stashed: {
          type: source.type,
          attrs: source.attrs ? structuredClone(source.attrs) : undefined,
          content: structuredClone(sourceContent),
        },
      },
      content: [],
    };
  }
  return { type: targetType, attrs: targetAttrs, content: structuredClone(sourceContent) };
}

export function setBlockType(
  doc: ASTDocument,
  sel: LogicalSelection,
  targetType: string,
  blocks: Map<string, BaseBlockBehavior>,
  attrs?: Record<string, any>
): TransactionResult {
  const targetBehavior = blocks.get(targetType);
  if (!targetBehavior) return { doc, selectionShift: sel };

  let draft = doc;
  let currentSel = sel;

  const newDoc = structuredClone(draft);
  const startIdx = currentSel.start.blockIndex;
  const endIdx = currentSel.end.blockIndex;

  let allMatch = true;
  for (let i = startIdx; i <= endIdx; i++) {
    const block = newDoc[i];
    if (!block) continue;

    const typeMatch = block.type === targetType;
    const attrsMatch = attrs
      ? Object.entries(attrs).every(([k, v]) => block.attrs?.[k] === v)
      : true;

    if (!typeMatch || !attrsMatch) {
      allMatch = false;
      break;
    }
  }

  const finalType = allMatch ? 'paragraph' : targetType;
  const finalBehavior = blocks.get(finalType);

  if (finalBehavior?.category === 'container') {
    if (allMatch) {

      let shift = 0;
      for (let i = endIdx; i >= startIdx; i--) {
        const block = newDoc[i];
        if (block.type === targetType) {
          const items = block.content as ASTBlockNode[];
          const paras: ASTBlockNode[] = items.map((item) => ({ type: 'paragraph', content: item.content }));
          newDoc.splice(i, 1, ...paras);
          shift += paras.length - 1;
        }
      }
      return {
        doc: newDoc,
        selectionShift: {
          start: { blockIndex: startIdx, inlineIndex: 0, offset: 0 },
          end: { blockIndex: endIdx + shift, inlineIndex: 0, offset: 0 },
          isCollapsed: false,
        },
      };
    } else {

      const listItems: ASTBlockNode[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const block = newDoc[i];
        const cat = blocks.get(block.type)?.category;
        if (cat === 'void') {

          const stashed = block.attrs?.['stashed'] as { content?: ASTInlineNode[] } | undefined;
          if (stashed?.content) {
            listItems.push({ type: 'list-item', content: structuredClone(stashed.content) });
          }
          continue;
        }
        if (cat === 'container') {
          listItems.push(...(block.content as ASTBlockNode[]));
        } else {
          listItems.push({ type: 'list-item', content: block.content });
        }
      }
      newDoc.splice(startIdx, endIdx - startIdx + 1, { type: finalType, attrs, content: listItems });
      const pos: LogicalPosition = { blockIndex: startIdx, itemIndex: 0, inlineIndex: 0, offset: 0 };
      return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
    }
  }

  if (finalType === 'code-block') {
    const rawText = newDoc
      .slice(startIdx, endIdx + 1)
      .map((block) => {
        if (blocks.get(block.type)?.category === 'container') {
          return (block.content as ASTBlockNode[])
            .map((item) => (item.content as ASTInlineNode[]).map((n) => n.text).join(''))
            .join('\n');
        }
        if (blocks.get(block.type)?.category === 'void') return '';
        return (block.content as ASTInlineNode[]).map((n) => n.text).join('');
      })
      .join('\n');

    newDoc.splice(startIdx, endIdx - startIdx + 1, { type: 'code-block', content: [{ type: 'text', text: rawText }] });
    const pos: LogicalPosition = { blockIndex: startIdx, inlineIndex: 0, offset: rawText.length };
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  if (allMatch && targetType === 'code-block') {
    const newBlocks: ASTBlockNode[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      const block = newDoc[i];
      const rawText = (block.content as ASTInlineNode[]).map((n) => n.text).join('');
      const lines = rawText.split('\n');
      for (const line of lines) {
        newBlocks.push({
          type: 'paragraph',
          content: line.length > 0 ? [{ type: 'text', text: line }] : [{ type: 'text', text: '' }],
        });
      }
    }
    newDoc.splice(startIdx, endIdx - startIdx + 1, ...newBlocks);
    const pos: LogicalPosition = { blockIndex: startIdx, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  const finalAttrs = allMatch ? undefined : attrs;
  const finalIsVoid = finalBehavior?.category === 'void';
  const finalIsText = finalBehavior?.category === 'text';
  const replacementBlocks: ASTBlockNode[] = [];
  for (let i = startIdx; i <= endIdx; i++) {
    const block = newDoc[i];
    const behavior = blocks.get(block.type);

    if (behavior?.category === 'container' && finalType !== block.type) {
      for (const item of block.content as ASTBlockNode[]) {
        replacementBlocks.push(toBlockOfType(finalType, finalAttrs, item, item.content as ASTInlineNode[], finalIsVoid));
      }
    } else if (behavior?.category === 'text') {
      replacementBlocks.push(toBlockOfType(finalType, finalAttrs, block, block.content as ASTInlineNode[], finalIsVoid));
    } else if (behavior?.category === 'void' && finalIsText) {

      const stashed = block.attrs?.['stashed'] as { content?: ASTInlineNode[] } | undefined;
      replacementBlocks.push({
        type: finalType,
        attrs: finalAttrs,
        content: stashed?.content ? structuredClone(stashed.content) : [{ type: 'text', text: '' }],
      });
    } else {
      replacementBlocks.push(block);
    }
  }
  newDoc.splice(startIdx, endIdx - startIdx + 1, ...replacementBlocks);

  const shiftRes = structuredClone(currentSel);
  delete shiftRes.start.itemIndex;
  delete shiftRes.end.itemIndex;
  return { doc: newDoc, selectionShift: shiftRes };
}

export function executeInsertText(
  doc: ASTDocument,
  sel: LogicalSelection,
  text: string,
  inlines: Map<string, BaseInlineBehavior>,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult {
  // Copy only the path to the caret rather than structuredClone(doc). Everything
  // off that path is untouched here, so it can stay shared with the previous
  // document. Deep-cloning to insert one character measured ~3 ms on a
  // 1000-block document against ~0.0002 ms for this.
  //
  // Safe because this function mutates nothing outside the copied path, and the
  // one place that mutates a `marks` array in place (applyMarkToContent) is
  // reached only through callers that still clone first.
  const blockIndex = sel.start.blockIndex;
  const source = doc[blockIndex];
  if (!source) return { doc, selectionShift: sel };

  const newDoc = doc.slice();
  const block: ASTBlockNode = { ...source };
  newDoc[blockIndex] = block;

  let content: ASTInlineNode[];
  const inlineIndex = sel.start.inlineIndex;
  const offset = sel.start.offset;

  const behavior = blocks.get(block.type);
  const itemIdx = sel.start.itemIndex ?? 0;

  if (behavior?.category === 'container') {
    const items = (block.content as ASTBlockNode[]).slice();
    const item: ASTBlockNode = { ...(items[itemIdx] as ASTBlockNode) };
    content = (item.content as ASTInlineNode[]).slice();
    item.content = content;
    items[itemIdx] = item;
    block.content = items;
  } else {
    content = (block.content as ASTInlineNode[]).slice();
    block.content = content;
  }

  const node = content[inlineIndex];

  if (node) {
    const isAtEnd = offset === node.text.length;
    let keepMarks = node.marks;

    if (isAtEnd && node.marks && node.marks.length > 0) {
      keepMarks = node.marks.filter((m) => inlines.get(m.type)?.isSticky !== false);
      if (keepMarks.length !== node.marks.length) {
        content.splice(inlineIndex + 1, 0, { type: 'text', text, marks: keepMarks.length ? keepMarks : undefined });
        const newPos: LogicalPosition = { ...sel.start, inlineIndex: inlineIndex + 1, offset: text.length };
        if (behavior?.category === 'container') newPos.itemIndex = itemIdx;
        return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
      }
    }
    // The previous document still references the original node — and the undo
    // stack holds on to it — so replace rather than mutate.
    content[inlineIndex] = {
      ...node,
      text: node.text.slice(0, offset) + text + node.text.slice(offset),
      ...(node.marks ? { marks: node.marks.slice() } : {}),
    };
  } else {
    content.push({ type: 'text', text });
  }

  const newPos: LogicalPosition = { ...sel.start, offset: offset + text.length };
  if (behavior?.category === 'container') newPos.itemIndex = itemIdx;
  return { doc: newDoc, selectionShift: { start: newPos, end: newPos, isCollapsed: true } };
}

export function deleteForward(
  doc: ASTDocument,
  sel: LogicalSelection,
  blocks: Map<string, BaseBlockBehavior>
): TransactionResult {
  if (!sel.isCollapsed) return deleteRange(doc, sel, blocks);
  const block = doc[sel.start.blockIndex];
  if (!block) return { doc };

  const behavior = blocks.get(block.type);
  let content: ASTInlineNode[];
  const itemIdx = sel.start.itemIndex ?? 0;

  if (behavior?.category === 'container') {
    const item = block.content[itemIdx] as ASTBlockNode;
    content = item.content as ASTInlineNode[];
  } else {
    content = block.content as ASTInlineNode[];
  }

  let absOffset = 0;
  for (let i = 0; i < sel.start.inlineIndex; i++) absOffset += content[i].text.length;
  absOffset += sel.start.offset;

  const totalLen = content.reduce((s, n) => s + n.text.length, 0);

  if (absOffset < totalLen) {
    const newDoc = structuredClone(doc);
    const b = newDoc[sel.start.blockIndex];
    const c =
      behavior?.category === 'container'
        ? ((b.content[itemIdx] as ASTBlockNode).content as ASTInlineNode[])
        : (b.content as ASTInlineNode[]);

    let currentPos = 0;
    for (let i = 0; i < c.length; i++) {
      if (currentPos + c[i].text.length > absOffset) {
        const localOffset = absOffset - currentPos;
        c[i].text = c[i].text.slice(0, localOffset) + c[i].text.slice(localOffset + 1);
        if (c[i].text.length === 0) c.splice(i, 1);
        break;
      }
      currentPos += c[i].text.length;
    }
    if (c.length === 0) c.push({ type: 'text', text: '' });

    const res = resolveInlinePosition(c, absOffset);
    const pos: LogicalPosition = { blockIndex: sel.start.blockIndex, inlineIndex: res.inlineIndex, offset: res.offset };
    if (behavior?.category === 'container') pos.itemIndex = itemIdx;

    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  if (behavior?.category === 'container' && itemIdx < (block.content as ASTBlockNode[]).length - 1) {
    const newDoc = structuredClone(doc);
    const targetBlock = newDoc[sel.start.blockIndex];
    const items = targetBlock.content as ASTBlockNode[];
    const currItem = items[itemIdx];
    const nextItem = items[itemIdx + 1];

    const merged = [...(currItem.content as ASTInlineNode[]), ...(nextItem.content as ASTInlineNode[])].filter(
      (n) => n.text.length > 0
    );
    currItem.content = normalizeInlineNodes(merged);
    if (currItem.content.length === 0) currItem.content = [{ type: 'text', text: '' }];

    items.splice(itemIdx + 1, 1);
    return { doc: newDoc, selectionShift: sel };
  }

  if (sel.start.blockIndex >= doc.length - 1) return { doc };

  const newDoc = structuredClone(doc);
  const currBlock = newDoc[sel.start.blockIndex];
  const nextBlock = newDoc[sel.start.blockIndex + 1];
  const nextBehavior = blocks.get(nextBlock.type);

  let currContentTarget: ASTBlockNode | ASTDocument = currBlock;
  if (behavior?.category === 'container') {
    currContentTarget = (currBlock.content as ASTBlockNode[])[itemIdx] as ASTBlockNode;
  }

  let nextContentSource: ASTInlineNode[] = [];
  if (nextBehavior?.category === 'container') {
    const nextItems = nextBlock.content as ASTBlockNode[];
    if (nextItems.length > 0) {
      nextContentSource = nextItems[0].content as ASTInlineNode[];
      nextItems.splice(0, 1);
      if (nextItems.length === 0) newDoc.splice(sel.start.blockIndex + 1, 1);
    } else {
      newDoc.splice(sel.start.blockIndex + 1, 1);
    }
  } else {
    nextContentSource = nextBlock.content as ASTInlineNode[];
    newDoc.splice(sel.start.blockIndex + 1, 1);
  }

  const merged = [...(currContentTarget.content as ASTInlineNode[]), ...nextContentSource].filter(
    (n) => n.text.length > 0
  );
  currContentTarget.content = normalizeInlineNodes(merged);
  if (currContentTarget.content.length === 0) currContentTarget.content = [{ type: 'text', text: '' }];

  return { doc: newDoc, selectionShift: sel };
}

export function toggleMark(
  doc: ASTDocument,
  sel: LogicalSelection,
  markType: string,
  attrs?: Record<string, any>,
  blocks?: Map<string, BaseBlockBehavior>,
  force?: 'add' | 'remove'
): TransactionResult {
  if (sel.isCollapsed) return { doc };

  const newDoc = structuredClone(doc);
  const block = newDoc[sel.start.blockIndex];
  const behavior = blocks?.get(block.type);
  const blockIdx = sel.start.blockIndex;

  if (sel.start.blockIndex !== sel.end.blockIndex) {
    return toggleMarkAcrossBlocks(newDoc, sel, markType, attrs, blocks, force);
  }

  if (behavior?.category === 'container') {
    const items = block.content as ASTBlockNode[];
    const startItemIdx = sel.start.itemIndex ?? 0;
    const endItemIdx = sel.end.itemIndex ?? 0;

    let startChar = 0;
    for (let i = 0; i < sel.start.inlineIndex; i++)
      startChar += (items[startItemIdx].content as ASTInlineNode[])[i].text.length;
    startChar += sel.start.offset;

    let endChar = 0;
    for (let i = 0; i < sel.end.inlineIndex; i++)
      endChar += (items[endItemIdx].content as ASTInlineNode[])[i].text.length;
    endChar += sel.end.offset;

    for (let itemIdx = startItemIdx; itemIdx <= endItemIdx; itemIdx++) {
      const item = items[itemIdx];
      const content = item.content as ASTInlineNode[];

      let itemStartChar = itemIdx === startItemIdx ? startChar : 0;
      let itemEndChar = itemIdx === endItemIdx ? endChar : content.reduce((sum, n) => sum + n.text.length, 0);

      item.content = applyMarkToContent(content, itemStartChar, itemEndChar, markType, attrs, force);
    }

    const startRes = resolveInlinePosition(items[startItemIdx].content as ASTInlineNode[], startChar);
    const endRes = resolveInlinePosition(items[endItemIdx].content as ASTInlineNode[], endChar);

    const newSel: LogicalSelection = {
      start: {
        blockIndex: blockIdx,
        itemIndex: startItemIdx,
        inlineIndex: startRes.inlineIndex,
        offset: startRes.offset,
      },
      end: { blockIndex: blockIdx, itemIndex: endItemIdx, inlineIndex: endRes.inlineIndex, offset: endRes.offset },
      isCollapsed: sel.isCollapsed,
    };

    return { doc: newDoc, selectionShift: newSel };
  }

  const content = block.content as ASTInlineNode[];

  let startChar = 0;
  for (let i = 0; i < sel.start.inlineIndex; i++) startChar += content[i].text.length;
  startChar += sel.start.offset;

  let endChar = 0;
  for (let i = 0; i < sel.end.inlineIndex; i++) endChar += content[i].text.length;
  endChar += sel.end.offset;

  block.content = applyMarkToContent(content, startChar, endChar, markType, attrs, force);

  const startRes = resolveInlinePosition(block.content as ASTInlineNode[], startChar);
  const endRes = resolveInlinePosition(block.content as ASTInlineNode[], endChar);

  const newSel: LogicalSelection = {
    start: { blockIndex: blockIdx, inlineIndex: startRes.inlineIndex, offset: startRes.offset },
    end: { blockIndex: blockIdx, inlineIndex: endRes.inlineIndex, offset: endRes.offset },
    isCollapsed: false,
  };
  return { doc: newDoc, selectionShift: newSel };
}

function applyMarkToContent(
  content: ASTInlineNode[],
  startChar: number,
  endChar: number,
  markType: string,
  attrs?: Record<string, any>,
  force?: 'add' | 'remove'
): ASTInlineNode[] {
  const before: ASTInlineNode[] = [];
  const selected: ASTInlineNode[] = [];
  const after: ASTInlineNode[] = [];

  let pos = 0;
  for (const node of content) {
    const nodeEnd = pos + node.text.length;

    if (nodeEnd <= startChar) {
      before.push(structuredClone(node));
    } else if (pos >= endChar) {
      after.push(structuredClone(node));
    } else {
      if (pos < startChar) {
        before.push({ ...structuredClone(node), text: node.text.slice(0, startChar - pos) });
      }

      const sliceStart = Math.max(0, startChar - pos);
      const sliceEnd = Math.min(node.text.length, endChar - pos);
      selected.push({ ...structuredClone(node), text: node.text.slice(sliceStart, sliceEnd) });

      if (nodeEnd > endChar) {
        after.push({ ...structuredClone(node), text: node.text.slice(endChar - pos) });
      }
    }
    pos = nodeEnd;
  }

  const allHaveMark = force
    ? force === 'remove'
    : selected.length > 0 && selected.every((n) => n.marks?.some((m) => m.type === markType));

  if (allHaveMark) {
    for (const node of selected) {
      node.marks = node.marks?.filter((m) => m.type !== markType);
      if (node.marks && node.marks.length === 0) delete node.marks;
    }
  } else {
    const mark: ASTMark = { type: markType };
    if (attrs && Object.keys(attrs).length > 0) mark.attrs = attrs;
    for (const node of selected) {
      if (!node.marks) node.marks = [];
      if (force === 'add') {

        node.marks = node.marks.filter((m) => m.type !== markType);
        node.marks.push({ ...mark });
      } else if (!node.marks.some((m) => m.type === markType)) {
        node.marks.push({ ...mark });
      }
    }
  }

  const result = normalizeInlineNodes([...before, ...selected, ...after]);
  return result.length > 0 ? result : [{ type: 'text', text: '' }];
}

function inlineCharOffset(inlineIndex: number, offset: number, content: ASTInlineNode[]): number {
  let c = 0;
  for (let i = 0; i < inlineIndex && i < content.length; i++) c += content[i].text.length;
  return c + offset;
}

function rangeHasMark(content: ASTInlineNode[], startChar: number, endChar: number, markType: string): boolean {
  if (endChar <= startChar) return true;
  let pos = 0;
  for (const node of content) {
    const nodeEnd = pos + node.text.length;
    const overlaps = pos < endChar && nodeEnd > startChar;
    if (overlaps && !node.marks?.some((m) => m.type === markType)) return false;
    pos = nodeEnd;
  }
  return true;
}

interface MarkSegment {
  content: ASTInlineNode[];
  s: number;
  e: number;
  assign: (next: ASTInlineNode[]) => void;
}

function collectBlockSegments(
  block: ASTBlockNode,
  role: 'start' | 'middle' | 'end',
  sel: LogicalSelection,
  blocks?: Map<string, BaseBlockBehavior>
): MarkSegment[] {
  const category = blocks?.get(block.type)?.category;
  if (category === 'void') return [];

  if (category === 'container') {
    const items = block.content as ASTBlockNode[];
    const startItem = role === 'start' ? sel.start.itemIndex ?? 0 : 0;
    const endItem = role === 'end' ? sel.end.itemIndex ?? 0 : items.length - 1;
    const segs: MarkSegment[] = [];
    for (let ii = startItem; ii <= endItem; ii++) {
      const c = items[ii].content as ASTInlineNode[];
      const total = c.reduce((a, n) => a + n.text.length, 0);
      const s = role === 'start' && ii === startItem ? inlineCharOffset(sel.start.inlineIndex, sel.start.offset, c) : 0;
      const e = role === 'end' && ii === endItem ? inlineCharOffset(sel.end.inlineIndex, sel.end.offset, c) : total;
      segs.push({ content: c, s, e, assign: (next) => (items[ii].content = next) });
    }
    return segs;
  }

  const c = block.content as ASTInlineNode[];
  const total = c.reduce((a, n) => a + n.text.length, 0);
  const s = role === 'start' ? inlineCharOffset(sel.start.inlineIndex, sel.start.offset, c) : 0;
  const e = role === 'end' ? inlineCharOffset(sel.end.inlineIndex, sel.end.offset, c) : total;
  return [{ content: c, s, e, assign: (next) => (block.content = next) }];
}

function toggleMarkAcrossBlocks(
  newDoc: ASTDocument,
  sel: LogicalSelection,
  markType: string,
  attrs: Record<string, any> | undefined,
  blocks?: Map<string, BaseBlockBehavior>,
  callerForce?: 'add' | 'remove'
): TransactionResult {
  const startB = sel.start.blockIndex;
  const endB = sel.end.blockIndex;

  const segments: MarkSegment[] = [];
  for (let bi = startB; bi <= endB; bi++) {
    const role = bi === startB ? 'start' : bi === endB ? 'end' : 'middle';
    segments.push(...collectBlockSegments(newDoc[bi], role, sel, blocks));
  }

  const active = segments.filter((seg) => seg.e > seg.s);
  const allMarked = active.length > 0 && active.every((seg) => rangeHasMark(seg.content, seg.s, seg.e, markType));
  const force: 'add' | 'remove' = callerForce ?? (allMarked ? 'remove' : 'add');

  const startChar = active[0]?.s ?? 0;
  const endSeg = active[active.length - 1];
  const endChar = endSeg?.e ?? 0;

  for (const seg of segments) {
    seg.assign(applyMarkToContent(seg.content, seg.s, seg.e, markType, attrs, force));
  }

  const resolveBoundary = (pos: LogicalPosition, char: number): LogicalPosition => {
    const b = newDoc[pos.blockIndex];
    if (blocks?.get(b.type)?.category === 'container') {
      const item = (b.content as ASTBlockNode[])[pos.itemIndex ?? 0];
      const res = resolveInlinePosition(item.content as ASTInlineNode[], char);
      return { blockIndex: pos.blockIndex, itemIndex: pos.itemIndex ?? 0, inlineIndex: res.inlineIndex, offset: res.offset };
    }
    const res = resolveInlinePosition(b.content as ASTInlineNode[], char);
    return { blockIndex: pos.blockIndex, inlineIndex: res.inlineIndex, offset: res.offset };
  };

  return {
    doc: newDoc,
    selectionShift: {
      start: resolveBoundary(sel.start, startChar),
      end: resolveBoundary(sel.end, endChar),
      isCollapsed: false,
    },
  };
}

export function insertFragment(
  doc: ASTDocument,
  sel: LogicalSelection,
  fragment: ASTDocument,
  blocks?: Map<string, BaseBlockBehavior>
): TransactionResult {
  if (!fragment.length) return { doc };

  const newDoc = structuredClone(doc);
  const blockIndex = sel.start.blockIndex;
  const block = newDoc[blockIndex];

  const behavior = blocks?.get(block.type);
  const isContainer = behavior?.category === 'container';

  let targetContent: ASTInlineNode[];
  let targetItem: ASTBlockNode | null = null;
  const itemIdx = sel.start.itemIndex ?? 0;

  if (isContainer) {
    targetItem = block.content[itemIdx] as ASTBlockNode;
    targetContent = targetItem.content as ASTInlineNode[];
  } else {
    targetContent = block.content as ASTInlineNode[];
  }

  const left = extractLeft(targetContent, sel.start.inlineIndex, sel.start.offset);
  const right = extractRight(targetContent, sel.start.inlineIndex, sel.start.offset);
  let fragClone = structuredClone(fragment);

  // A fragment block whose content holds blocks rather than inline nodes - a
  // pasted list, for instance - cannot be merged into the caret's text run. The
  // merge path below assumes inline content throughout and would read `.text`
  // off a block node. Split the target around the caret and drop the fragment
  // in whole instead.
  const holdsInline = (block: ASTBlockNode) => {
    const content = block.content as unknown[] | undefined;
    return !content || content.length === 0 || typeof (content[0] as ASTInlineNode)?.text === 'string';
  };

  // Pasting into a list: a container in the fragment cannot become one item, so
  // expand it into the items it holds. Without this its child blocks were fed
  // to normalizeInlineNodes, which merges runs with `last.text += node.text` -
  // undefined + undefined, so the item's text became the string "NaN".
  if (isContainer) {
    const flattenToInline = (nodes: ASTBlockNode[]): ASTBlockNode[] => {
      const out: ASTBlockNode[] = [];
      for (const node of nodes) {
        if (holdsInline(node)) out.push(node);
        else out.push(...flattenToInline(node.content as ASTBlockNode[]));
      }
      return out;
    };
    const flattened = flattenToInline(fragClone);
    fragClone = flattened.length ? flattened : [{ type: 'paragraph', content: [{ type: 'text', text: '' }] }];
  }

  if (!isContainer && fragClone.some((b) => !holdsInline(b))) {
    const resultBlocks: ASTBlockNode[] = [];

    const headHasText = left.length > 0 && !(left.length === 1 && left[0].text === '');
    if (headHasText) resultBlocks.push({ ...block, content: normalizeInlineNodes(left) });

    resultBlocks.push(...fragClone);

    const tailHasText = right.length > 0 && !(right.length === 1 && right[0].text === '');
    if (tailHasText) resultBlocks.push({ ...block, content: normalizeInlineNodes(right) });

    if (resultBlocks.length === 0) resultBlocks.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });

    newDoc.splice(blockIndex, 1, ...resultBlocks);

    // Caret lands at the end of the last block that came from the fragment.
    const fragEndIndex = blockIndex + (headHasText ? 1 : 0) + fragClone.length - 1;
    const landed = newDoc[fragEndIndex];
    if (landed && holdsInline(landed)) {
      const content = landed.content as ASTInlineNode[];
      const end = resolveInlinePosition(content, content.reduce((n, x) => n + (x.text?.length ?? 0), 0));
      const pos = { blockIndex: fragEndIndex, inlineIndex: end.inlineIndex, offset: end.offset };
      return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
    }
    const pos = { blockIndex: fragEndIndex, inlineIndex: 0, offset: 0 };
    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  if (fragClone.length === 1) {
    const fragContent = fragClone[0].content as ASTInlineNode[];
    const merged = normalizeInlineNodes([...left, ...fragContent, ...right]);

    if (targetItem) targetItem.content = merged.length ? merged : [{ type: 'text', text: '' }];
    else block.content = merged.length ? merged : [{ type: 'text', text: '' }];

    const leftLen = left.reduce((s, n) => s + (n.text?.length ?? 0), 0);
    const fragLen = fragContent.reduce((s, n) => s + (n.text?.length ?? 0), 0);
    const totalOffset = leftLen + fragLen;

    const res = resolveInlinePosition(
      targetItem ? (targetItem.content as ASTInlineNode[]) : (block.content as ASTInlineNode[]),
      totalOffset
    );
    const pos: LogicalPosition = { blockIndex, inlineIndex: res.inlineIndex, offset: res.offset };
    if (isContainer) pos.itemIndex = itemIdx;

    return { doc: newDoc, selectionShift: { start: pos, end: pos, isCollapsed: true } };
  }

  const firstFragContent = fragClone[0].content as ASTInlineNode[];
  const lastFrag = fragClone[fragClone.length - 1];
  const lastFragContent = lastFrag.content as ASTInlineNode[];


  const headContent = normalizeInlineNodes([...left, ...firstFragContent]);
  const tailContent = normalizeInlineNodes([...lastFragContent, ...right]);

  if (isContainer) {
    targetItem!.content = headContent.length ? headContent : [{ type: 'text', text: '' }];

    const middleItems: ASTBlockNode[] = [];
    for (let i = 1; i < fragClone.length - 1; i++) {
      middleItems.push({ type: 'list-item', content: fragClone[i].content });
    }
    const tailItem: ASTBlockNode = {
      type: 'list-item',
      content: tailContent.length ? tailContent : [{ type: 'text', text: '' }],
    };

    const containerItems = block.content as ASTBlockNode[];
    containerItems.splice(itemIdx + 1, 0, ...middleItems, tailItem);

    const lastInsertedItemIndex = itemIdx + middleItems.length + 1;
    const lastFragLen = lastFragContent.reduce((s, n) => s + (n.text?.length ?? 0), 0);

    const endRes = resolveInlinePosition(tailItem.content as ASTInlineNode[], lastFragLen);
    const endPos = {
      blockIndex,
      itemIndex: lastInsertedItemIndex,
      inlineIndex: endRes.inlineIndex,
      offset: endRes.offset,
    };
    return { doc: newDoc, selectionShift: { start: endPos, end: endPos, isCollapsed: true } };
  } else {
    const resultBlocks: ASTBlockNode[] = [];
    const headBlock = { ...block, content: headContent.length ? headContent : [{ type: 'text' as const, text: '' }] };
    const headHasContent = headContent.length > 0 && !(headContent.length === 1 && headContent[0].text === '');
    if (headHasContent) resultBlocks.push(headBlock);

    for (let i = 1; i < fragClone.length - 1; i++) {
      resultBlocks.push(fragClone[i]);
    }

    const tailBlock = {
      ...lastFrag,
      content: tailContent.length ? tailContent : [{ type: 'text' as const, text: '' }],
    };
    const tailHasContent = tailContent.length > 0 && !(tailContent.length === 1 && tailContent[0].text === '');
    if (tailHasContent) resultBlocks.push(tailBlock);

    if (resultBlocks.length === 0) resultBlocks.push({ type: 'paragraph', content: [{ type: 'text', text: '' }] });

    newDoc.splice(blockIndex, 1, ...resultBlocks);

    const lastInsertedIndex = blockIndex + resultBlocks.length - 1;
    const lastBlock = newDoc[lastInsertedIndex];
    const lastFragLen = lastFragContent.reduce((s, n) => s + (n.text?.length ?? 0), 0);

    const endRes = resolveInlinePosition(lastBlock.content as ASTInlineNode[], lastFragLen);
    const endPos = { blockIndex: lastInsertedIndex, inlineIndex: endRes.inlineIndex, offset: endRes.offset };
    return { doc: newDoc, selectionShift: { start: endPos, end: endPos, isCollapsed: true } };
  }
}

export function extractLeft(content: ASTInlineNode[], index: number, offset: number): ASTInlineNode[] {
  const res: ASTInlineNode[] = [];
  for (let i = 0; i <= index; i++) {
    if (i === index) {
      if (offset > 0) res.push({ ...content[i], text: content[i].text.slice(0, offset) });
    } else res.push(content[i]);
  }
  return res;
}

export function extractRight(content: ASTInlineNode[], index: number, offset: number): ASTInlineNode[] {
  const res: ASTInlineNode[] = [];
  for (let i = index; i < content.length; i++) {
    if (i === index) {
      if (offset < content[i].text.length) res.push({ ...content[i], text: content[i].text.slice(offset) });
    } else res.push(content[i]);
  }
  return res;
}

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
