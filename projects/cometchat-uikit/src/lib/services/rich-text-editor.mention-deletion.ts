export function handleMentionDeletionImpl(ctx: any, event: KeyboardEvent): boolean {
  const selection = ctx.selectionManager.getSelection();
  if (!selection || selection.rangeCount === 0) { return false; }
  const range = selection.getRangeAt(0);
  if (!range.collapsed) {
    const mentionsInRange = ctx.getMentionsInRange(range);
    if (mentionsInRange.length > 0) {
      event.preventDefault();
      mentionsInRange.forEach((mention: Node) => {
        mention.parentNode?.removeChild(mention);
      });
      range.deleteContents();
      ctx.pushToHistory();
      ctx.emitUpdate();
      return true;
    }
    return false;
  }
  let mentionNode: Node | null = null;
  let trailingTextNode: Node | null = null;
  if (event.key === 'Backspace') {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const offset = range.startOffset;
      if (offset === 0 && textNode.previousSibling && ctx.isMentionNode(textNode.previousSibling)) {
        mentionNode = textNode.previousSibling;
      } else if (
        offset <= 1 &&
        textNode.previousSibling &&
        ctx.isMentionNode(textNode.previousSibling)
      ) {
        mentionNode = textNode.previousSibling;
        trailingTextNode = textNode;
      } else if (
        textNode.textContent &&
        textNode.textContent.length <= 2 &&
        offset === textNode.textContent.length &&
        textNode.previousSibling &&
        ctx.isMentionNode(textNode.previousSibling)
      ) {
        mentionNode = textNode.previousSibling;
        trailingTextNode = textNode;
      }
    } else {
      const nodeBefore = range.startContainer.childNodes[range.startOffset - 1];
      if (nodeBefore && ctx.isMentionNode(nodeBefore)) { mentionNode = nodeBefore; }
    }
  } else if (event.key === 'Delete') {
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const offset = range.startOffset;
      const len = textNode.textContent?.length ?? 0;
      if (offset === len && textNode.nextSibling && ctx.isMentionNode(textNode.nextSibling)) {
        mentionNode = textNode.nextSibling;
      } else if (textNode.nextSibling && ctx.isMentionNode(textNode.nextSibling)) {
        if (offset === len) { mentionNode = textNode.nextSibling; }
      }
    } else {
      const nodeAfter = range.startContainer.childNodes[range.startOffset];
      if (nodeAfter && ctx.isMentionNode(nodeAfter)) { mentionNode = nodeAfter; }
    }
  }
  if (mentionNode) {
    event.preventDefault();
    const parent = mentionNode.parentNode;
    if (trailingTextNode && trailingTextNode.parentNode) {
      trailingTextNode.parentNode.removeChild(trailingTextNode);
    }
    if (event.key === 'Backspace' && !trailingTextNode) {
      const nextSibling = mentionNode.nextSibling;
      if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
        const text = nextSibling.textContent || '';
        if (text === '\u00A0' || text === ' ') { nextSibling.parentNode?.removeChild(nextSibling); }
      }
    }
    parent?.removeChild(mentionNode);
    ctx.pushToHistory();
    ctx.emitUpdate();
    return true;
  }
  return false;
}

export function protectMentionsFromFormattingImpl(ctx: any): void {
  const mentions = ctx.contentEditable.querySelectorAll('span[data-uid]');
  const inlineTags = ['strong', 'em', 'u', 's', 'b', 'i', 'del', 'strike'];
  mentions.forEach((mention: Element) => {
    const innerFormatTags = mention.querySelectorAll(inlineTags.join(', '));
    innerFormatTags.forEach((tag: Element) => {
      const parent = tag.parentNode;
      while (tag.firstChild) { parent?.insertBefore(tag.firstChild, tag); }
      parent?.removeChild(tag);
    });
    let ancestor = mention.parentElement;
    while (ancestor && ancestor !== ctx.contentEditable) {
      const nextAncestor = ancestor.parentElement;
      if (inlineTags.includes(ancestor.tagName.toLowerCase())) {
        const parent = ancestor.parentNode;
        if (parent) {
          while (ancestor.firstChild) { parent.insertBefore(ancestor.firstChild, ancestor); }
          parent.removeChild(ancestor);
        }
      }
      ancestor = nextAncestor;
    }
  });
}

export function convertMentionsToPlainTextImpl(ctx: any, container: Element): void {
  const mentions = container.querySelectorAll('[data-uid]');
  mentions.forEach((mention: Element) => {
    const textNode = document.createTextNode(mention.textContent || '');
    mention.parentNode?.replaceChild(textNode, mention);
  });
}
