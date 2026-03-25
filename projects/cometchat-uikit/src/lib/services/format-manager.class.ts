/**
 * FormatManager Class
 *
 * Handles text formatting operations using document.execCommand and Selection API.
 * Provides methods for applying inline and block formatting to contenteditable content.
 *
 * @module services/format-manager
 * @see Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { RichTextFormatState } from './rich-text-editor.interfaces';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * FormatManager handles all text formatting operations for a contenteditable element.
 * It uses document.execCommand with fallbacks for browser compatibility.
 */
export class FormatManager {
  private element: HTMLElement;

  /**
   * Create a new FormatManager instance
   * @param element - The contenteditable element to manage
   */
  constructor(element: HTMLElement) {
    this.element = element;
  }

  // ==================== Inline Formatting ====================

  /**
   * Apply bold formatting to selected text
   * Uses document.execCommand('bold') with fallback to manual wrapping
   * Skips mention spans to preserve their appearance (Req 1.10)
   * @see Requirement 2.1
   */
  applyBold(): void {
    this.element.focus();
    if (this.isInsideFormattedElement('pre')) return;
    this.applyFormatSkippingMentions('bold', 'strong');
  }

  /**
   * Apply italic formatting to selected text
   * Uses document.execCommand('italic') with fallback to manual wrapping
   * Skips mention spans to preserve their appearance (Req 1.10)
   * @see Requirement 2.2
   */
  applyItalic(): void {
    this.element.focus();
    if (this.isInsideFormattedElement('pre')) return;
    this.applyFormatSkippingMentions('italic', 'em');
  }

  /**
   * Apply underline formatting to selected text
   * Uses document.execCommand('underline') with fallback to manual wrapping
   * Skips mention spans to preserve their appearance (Req 1.10)
   * @see Requirement 2.3
   */
  applyUnderline(): void {
    this.element.focus();
    if (this.isInsideFormattedElement('pre')) return;
    this.applyFormatSkippingMentions('underline', 'u');
  }

  /**
   * Apply strikethrough formatting to selected text
   * Uses document.execCommand('strikeThrough') with fallback to manual wrapping
   * Skips mention spans to preserve their appearance (Req 1.10)
   * @see Requirement 2.4
   */
  applyStrikethrough(): void {
    this.element.focus();
    if (this.isInsideFormattedElement('pre')) return;
    this.applyFormatSkippingMentions('strikeThrough', 's');
  }

  /**
   * Apply inline code formatting to selected text
   * Wraps selection in <code> tag with custom class
   * @see Requirement 2.5
   */
  applyInlineCode(): void {
    this.element.focus();

    // Inline code doesn't have a standard execCommand, so we use manual wrapping
    this.wrapSelection('code', 'cometchat-rich-text__code');
  }

  // ==================== Block Formatting ====================

  /**
   * Apply code block formatting
   * Creates a <pre><code> block for the current selection
   * Handles both single and multiline selections
   * @see Requirement 2.6
   */
  applyCodeBlock(): void {
    this.element.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    // Check if we're already in a code block - if so, exit all selected blocks
    if (this.isInsideOrContainsFormattedElement('pre')) {
      this.exitBlockFormat('pre');
      return;
    }

    // Mutual exclusivity: remove blockquote before applying code block (Req 1.16)
    if (this.isInsideOrContainsFormattedElement('blockquote')) {
      this.exitBlockFormat('blockquote');
    }

    // Apply code block to all selected blocks
    this.applyBlockFormat('pre', 'cometchat-rich-text__code-block');
  }

  /**
   * Apply blockquote formatting
   * Creates a <blockquote> block for the current selection
   * Handles both single and multiline selections
   * @see Requirement 2.7
   */
  applyBlockquote(): void {
    this.element.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    // Check if we're already in a blockquote - if so, exit all selected blocks
    if (this.isInsideOrContainsFormattedElement('blockquote')) {
      this.exitBlockFormat('blockquote');
      return;
    }

    // Mutual exclusivity: remove code block before applying blockquote (Req 1.16)
    if (this.isInsideOrContainsFormattedElement('pre')) {
      this.exitBlockFormat('pre');
    }

    // Apply blockquote to all selected blocks
    this.applyBlockFormat('blockquote', 'cometchat-rich-text__blockquote');
  }

  /**
   * Apply ordered list formatting
   * Creates a numbered list
   * @see Requirement 3.1
   */
  applyOrderedList(): void {
    this.element.focus();

    // Mutual exclusivity: remove code block before applying list (Req 1.17)
    if (this.isInsideOrContainsFormattedElement('pre')) {
      this.exitBlockFormat('pre');
      // After exiting code block, wrap bare text nodes in a div for execCommand compatibility
      this.ensureBlockWrapping();
    }

    try {
      let success = false;
      if (document.execCommand) {
        success = document.execCommand('insertOrderedList', false);
      }
      // Fallback: manually create list if execCommand didn't work
      if (!success && !this.element.querySelector('ol')) {
        this.manuallyCreateList('ol');
      }
    } catch (error) {
      this.manuallyCreateList('ol');
    }
  }

  /**
   * Apply bullet list formatting
   * Creates an unordered list
   * @see Requirement 3.2
   */
  applyBulletList(): void {
    this.element.focus();

    // Mutual exclusivity: remove code block before applying list (Req 1.17)
    if (this.isInsideOrContainsFormattedElement('pre')) {
      this.exitBlockFormat('pre');
      // After exiting code block, wrap bare text nodes in a div for execCommand compatibility
      this.ensureBlockWrapping();
    }

    try {
      let success = false;
      if (document.execCommand) {
        success = document.execCommand('insertUnorderedList', false);
      }
      // Fallback: manually create list if execCommand didn't work
      if (!success && !this.element.querySelector('ul')) {
        this.manuallyCreateList('ul');
      }
    } catch (error) {
      this.manuallyCreateList('ul');
    }
  }

  // ==================== Format State ====================

  /**
   * Check if a specific format is currently active at the cursor position
   * @param format - The format to check (e.g., 'bold', 'italic')
   * @returns True if the format is active
   */
  isActive(format: string): boolean {
    try {
      if (document.queryCommandState) {
        return document.queryCommandState(format);
      }
    } catch (error) {
      // Fallback: check if cursor is inside a formatted element
      return this.isInsideFormattedElement(format);
    }

    return false;
  }

  /**
   * Get the current format state for all supported formats
   * @returns Object containing boolean flags for each format
   */
  getCurrentFormats(): RichTextFormatState {
    const isLink = this.isInsideFormattedElement('a');
    // When inside a link, queryCommandState('underline') returns true because
    // browsers treat link text-decoration as underline. We check for an actual
    // <u> tag instead to avoid false positives.
    const isUnderline = isLink ? this.isInsideFormattedElement('u') : this.isActive('underline');

    return {
      bold: this.isActive('bold'),
      italic: this.isActive('italic'),
      underline: isUnderline,
      strikethrough: this.isActive('strikeThrough'),
      code: this.isInsideFormattedElement('code'),
      blockquote: this.isInsideFormattedElement('blockquote'),
      codeBlock: this.isInsideFormattedElement('pre'),
      orderedList: this.isActive('insertOrderedList'),
      bulletList: this.isActive('insertUnorderedList'),
      link: isLink,
    };
  }

  // ==================== Utilities ====================

  /**
   * Apply inline formatting while skipping mention spans (Req 1.10).
   *
   * When the selection contains mention elements ([data-uid]), the formatting
   * is applied only to non-mention text nodes. Mentions are left untouched so
   * their appearance and data attributes are preserved.
   *
   * Uses a manual wrapping approach (creating <strong>/<em>/etc. elements
   * around text nodes) instead of document.execCommand, because execCommand
   * applies to the entire selection and cannot skip individual nodes.
   *
   * @param command - The execCommand name (used when no mentions are present)
   * @param tagName - The HTML tag to wrap non-mention text with
   * @private
   */
  private applyFormatSkippingMentions(command: string, tagName: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);

    // Check if selection contains any mentions
    const container = range.commonAncestorContainer;
    const searchRoot =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement)
        : container.parentElement || this.element;

    const allMentions = searchRoot.querySelectorAll('[data-uid]');
    const mentionsInRange: Element[] = [];

    allMentions.forEach(mention => {
      try {
        const mentionRange = document.createRange();
        mentionRange.selectNode(mention);
        if (
          range.compareBoundaryPoints(Range.START_TO_END, mentionRange) > 0 &&
          range.compareBoundaryPoints(Range.END_TO_START, mentionRange) < 0
        ) {
          mentionsInRange.push(mention);
        }
      } catch (_e) {
        /* node not in document */
      }
    });

    if (mentionsInRange.length === 0) {
      // No mentions — apply normally via execCommand with fallback
      try {
        if (document.execCommand) {
          document.execCommand(command, false);
        } else {
          this.wrapSelection(tagName);
        }
      } catch (_error) {
        this.wrapSelection(tagName);
      }
      return;
    }

    // Collect all text nodes inside the selection that are NOT inside a mention
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(searchRoot, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        // Must be within the selection range
        try {
          const nodeRange = document.createRange();
          nodeRange.selectNode(node);
          const inRange =
            range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
            range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0;
          if (!inRange) return NodeFilter.FILTER_REJECT;
        } catch (_e) {
          return NodeFilter.FILTER_REJECT;
        }

        // Must NOT be inside a mention span
        let parent = node.parentElement;
        while (parent && parent !== searchRoot) {
          if (parent.hasAttribute('data-uid')) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      if (textNode.textContent && textNode.textContent.length > 0) {
        textNodes.push(textNode);
      }
    }

    // Wrap each non-mention text node in the formatting tag
    for (const tn of textNodes) {
      // Skip if already wrapped in this tag
      let alreadyWrapped = false;
      let p = tn.parentElement;
      while (p && p !== this.element) {
        if (p.tagName.toLowerCase() === tagName.toLowerCase()) {
          alreadyWrapped = true;
          break;
        }
        p = p.parentElement;
      }
      if (alreadyWrapped) continue;

      const wrapper = document.createElement(tagName);
      tn.parentNode?.insertBefore(wrapper, tn);
      wrapper.appendChild(tn);
    }

    // Restore selection across the full range
    try {
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (_e) {
      /* selection restoration best-effort */
    }
  }

  /**
   * Apply block formatting to all blocks in the selection
   * @param tagName - The HTML tag name to wrap with
   * @param className - Optional CSS class to apply
   * @private
   */
  private applyBlockFormat(tagName: string, className?: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const blocks = this.getSelectedBlocks(range);

    if (blocks.length === 0) {
      // No blocks found, wrap the selection directly
      this.wrapSelection(tagName, className);

      // Ensure cursor is inside the newly created element
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const rng = sel.getRangeAt(0);
          const container = rng.commonAncestorContainer;

          // Find the wrapper element we just created
          let wrapper: HTMLElement | null = null;
          if (container.nodeType === Node.ELEMENT_NODE) {
            wrapper = container as HTMLElement;
          } else if (container.parentElement) {
            wrapper = container.parentElement;
          }

          // If we found the wrapper and it's empty or has only a br, place cursor inside
          if (wrapper && wrapper.tagName.toLowerCase() === tagName.toLowerCase()) {
            if (!wrapper.textContent || wrapper.textContent.trim() === '') {
              // Ensure there's a br for cursor placement
              if (!wrapper.querySelector('br')) {
                wrapper.appendChild(document.createElement('br'));
              }

              // Place cursor at the start of the wrapper
              const newRange = document.createRange();
              newRange.setStart(wrapper, 0);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          }
        }
      }, 0);

      return;
    }

    // Wrap each block in the specified tag
    blocks.forEach(block => {
      const wrapper = document.createElement(tagName);
      if (className) {
        wrapper.className = className;
      }

      // Move the block's content into the wrapper
      wrapper.innerHTML = block.innerHTML || '<br>';

      // Strip inline formatting inside code blocks (Req 1.19)
      if (tagName === 'pre') {
        const inlineTags = wrapper.querySelectorAll('strong, em, u, s, b, i, del, strike');
        inlineTags.forEach(tag => {
          const parent = tag.parentNode;
          while (tag.firstChild) {
            parent?.insertBefore(tag.firstChild, tag);
          }
          parent?.removeChild(tag);
        });
      }

      // Snapshot mention metadata before stripping (Req 1.22)
      if (tagName === 'pre') {
        const mentionsToSnapshot = wrapper.querySelectorAll('[data-uid]');
        if (mentionsToSnapshot.length > 0) {
          const mentionData: { uid: string; label: string; type: string; className: string }[] = [];
          mentionsToSnapshot.forEach(mention => {
            mentionData.push({
              uid: mention.getAttribute('data-uid') || '',
              label: mention.textContent || '',
              type: mention.getAttribute('data-mention-type') || 'other',
              className: (mention as HTMLElement).className || '',
            });
          });
          wrapper.setAttribute('data-mention-snapshot', JSON.stringify(mentionData));
        }
      }

      // Strip mentions inside code blocks (Req 1.11)
      if (tagName === 'pre') {
        const mentions = wrapper.querySelectorAll('[data-mention-id], [data-uid]');
        mentions.forEach(mention => {
          const textNode = document.createTextNode(mention.textContent || '');
          mention.parentNode?.replaceChild(textNode, mention);
        });
      }

      // Replace the block with the wrapper
      if (block.parentNode) {
        block.parentNode.replaceChild(wrapper, block);
      }

      // Strip inline formatting ancestors wrapping the code block (Req 1.19)
      if (tagName === 'pre') {
        const inlineAncestorTags = ['strong', 'em', 'u', 's', 'b', 'i', 'del', 'strike'];
        let ancestor = wrapper.parentElement;
        while (ancestor && ancestor !== this.element) {
          const nextAncestor = ancestor.parentElement;
          if (inlineAncestorTags.includes(ancestor.tagName.toLowerCase())) {
            // Unwrap: move all children of ancestor before ancestor, then remove ancestor
            const parent = ancestor.parentNode;
            if (parent) {
              while (ancestor.firstChild) {
                parent.insertBefore(ancestor.firstChild, ancestor);
              }
              parent.removeChild(ancestor);
            }
          }
          ancestor = nextAncestor;
        }
      }
    });

    // Restore selection
    if (blocks.length > 0 && selection) {
      const newRange = document.createRange();
      newRange.setStart(blocks[0].parentNode || this.element, 0);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Exit block formatting for all selected blocks
   * Converts blocks back to text nodes with <br> tags instead of <p> tags
   * This maintains the original spacing when reverting from block formats
   * Preserves line breaks within blocks
   * Preserves selection after conversion
   * @param tagName - The HTML tag name to exit from
   * @private
   */
  private exitBlockFormat(tagName: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const blocks = this.getSelectedBlocksOfType(range, tagName);

    if (blocks.length === 0) {
      // No blocks found, try unwrapping current selection
      this.unwrapSelection(tagName);
      return;
    }

    // Get the first block's parent for insertion point
    const firstBlock = blocks[0];
    const insertionPoint = firstBlock;

    // Create a document fragment to hold all the converted content
    const fragment = document.createDocumentFragment();
    const insertedNodes: Node[] = [];

    // Convert each block to text nodes with <br>
    blocks.forEach((block, index) => {
      // Get the innerHTML to preserve <br> tags
      const innerHTML = block.innerHTML || '';

      // Create a temporary div to parse the HTML and extract text + br tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = innerHTML;

      // Walk through the child nodes and extract text nodes and br tags
      const childNodes = Array.from(tempDiv.childNodes);
      childNodes.forEach((node, nodeIndex) => {
        if (node.nodeType === Node.TEXT_NODE) {
          // Text node - clone it
          const textNode = document.createTextNode(node.textContent || '');
          fragment.appendChild(textNode);
          insertedNodes.push(textNode);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === 'br') {
            // BR tag - clone it
            const br = document.createElement('br');
            fragment.appendChild(br);
            insertedNodes.push(br);
          } else {
            // Other element - extract its text content
            const textContent = element.textContent || '';
            if (textContent) {
              const textNode = document.createTextNode(textContent);
              fragment.appendChild(textNode);
              insertedNodes.push(textNode);
            }
          }
        }
      });

      // Add a <br> after each block (except the last one)
      if (index < blocks.length - 1) {
        const br = document.createElement('br');
        fragment.appendChild(br);
        insertedNodes.push(br);
      }
    });

    // Restore mentions from snapshot when exiting code block (Req 1.22)
    if (tagName === 'pre') {
      blocks.forEach(block => {
        const snapshotAttr = block.getAttribute('data-mention-snapshot');
        if (snapshotAttr) {
          try {
            const mentionData = JSON.parse(snapshotAttr) as {
              uid: string;
              label: string;
              type: string;
              className: string;
            }[];

            // Walk through text nodes in the fragment and restore mentions
            for (const mention of mentionData) {
              const label = mention.label;
              if (!label) continue;

              // Re-walk each time since the tree mutates on each restoration
              const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_TEXT);
              let textNode: Text | null;
              let found = false;

              while (!found && (textNode = walker.nextNode() as Text | null)) {
                const content = textNode.textContent || '';
                const idx = content.indexOf(label);
                if (idx < 0 || !textNode.parentNode) continue;

                found = true;
                const before = content.substring(0, idx);
                const after = content.substring(idx + label.length);

                // Create mention span
                const mentionSpan = document.createElement('span');
                mentionSpan.className = mention.className;
                mentionSpan.setAttribute('data-uid', mention.uid);
                mentionSpan.setAttribute('data-mention-type', mention.type);
                mentionSpan.setAttribute('contenteditable', 'false');
                mentionSpan.textContent = label;

                const parent = textNode.parentNode;
                if (before) {
                  const beforeNode = document.createTextNode(before);
                  parent.insertBefore(beforeNode, textNode);
                  // Update insertedNodes: replace textNode with beforeNode + mentionSpan + afterNode
                  const tnIdx = insertedNodes.indexOf(textNode);
                  if (tnIdx >= 0) {
                    insertedNodes.splice(tnIdx, 0, beforeNode);
                  }
                }
                parent.insertBefore(mentionSpan, textNode);
                insertedNodes.push(mentionSpan);

                if (after) {
                  const afterNode = document.createTextNode(after);
                  parent.insertBefore(afterNode, textNode);
                  insertedNodes.push(afterNode);
                }

                // Remove the original text node
                const origIdx = insertedNodes.indexOf(textNode);
                if (origIdx >= 0) {
                  insertedNodes.splice(origIdx, 1);
                }
                parent.removeChild(textNode);
              }
            }
          } catch (_e) {
            // JSON parse error, skip restoration
          }
        }
      });
    }

    // Insert the fragment before the first block
    if (insertionPoint.parentNode) {
      insertionPoint.parentNode.insertBefore(fragment, insertionPoint);
    }

    // Remove all the blocks
    blocks.forEach(block => block.remove());

    // Restore selection to the converted content
    if (insertedNodes.length > 0) {
      const newRange = document.createRange();
      const firstNode = insertedNodes[0];
      const lastNode = insertedNodes[insertedNodes.length - 1];

      // Select from start of first node to end of last node
      newRange.setStartBefore(firstNode);
      newRange.setEndAfter(lastNode);

      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Get all block-level elements within the selection
   * @param range - The selection range
   * @returns Array of block elements
   * @private
   */
  private getSelectedBlocks(range: Range): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    const commonAncestor = range.commonAncestorContainer;

    // Find the root element to search within
    let searchRoot: HTMLElement;
    if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      searchRoot = commonAncestor as HTMLElement;
    } else {
      searchRoot = commonAncestor.parentElement || this.element;
    }

    // Block-level tags to look for
    const blockTags = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'];

    // Find all block elements within the search root
    blockTags.forEach(tag => {
      const elements = searchRoot.querySelectorAll(tag);
      elements.forEach(el => {
        if (this.isNodeInRange(el, range)) {
          blocks.push(el as HTMLElement);
        }
      });
    });

    // If no blocks found, check if we're inside a single block
    if (blocks.length === 0) {
      let node: Node | null = range.startContainer;
      while (node && node !== this.element) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          const tagName = element.tagName.toLowerCase();
          if (blockTags.includes(tagName)) {
            blocks.push(element);
            break;
          }
        }
        node = node.parentNode;
      }
    }

    return blocks;
  }

  /**
   * Get all blocks of a specific type within the selection
   * @param range - The selection range
   * @param tagName - The tag name to filter by
   * @returns Array of block elements
   * @private
   */
  private getSelectedBlocksOfType(range: Range, tagName: string): HTMLElement[] {
    const blocks: HTMLElement[] = [];
    const commonAncestor = range.commonAncestorContainer;

    // Find the root element to search within
    let searchRoot: HTMLElement;
    if (commonAncestor.nodeType === Node.ELEMENT_NODE) {
      searchRoot = commonAncestor as HTMLElement;
    } else {
      searchRoot = commonAncestor.parentElement || this.element;
    }

    // Find all elements of the specified type
    const elements = searchRoot.querySelectorAll(tagName);
    elements.forEach(el => {
      if (this.isNodeInRange(el, range)) {
        blocks.push(el as HTMLElement);
      }
    });

    // If no blocks found, check if we're inside a single block of this type
    if (blocks.length === 0) {
      let node: Node | null = range.startContainer;
      while (node && node !== this.element) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === tagName.toLowerCase()) {
            blocks.push(element);
            break;
          }
        }
        node = node.parentNode;
      }
    }

    return blocks;
  }

  /**
   * Check if a node intersects with a range
   * @param node - The node to check
   * @param range - The range to check against
   * @returns True if the node intersects with the range
   * @private
   */
  private isNodeInRange(node: Node, range: Range): boolean {
    try {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);

      // Check if ranges intersect
      return (
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0 &&
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Wrap the current selection in a specified tag
   * @param tagName - The HTML tag name to wrap with
   * @param className - Optional CSS class to apply
   * @private
   */
  private wrapSelection(tagName: string, className?: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Check if we're already inside this tag type - if so, unwrap instead
    if (this.isInsideFormattedElement(tagName)) {
      this.unwrapSelection(tagName);
      return;
    }

    // Extract the selected content
    const selectedContent = range.extractContents();

    // Create the wrapper element
    const wrapper = document.createElement(tagName);
    if (className) {
      wrapper.className = className;
    }

    // Append the selected content to the wrapper
    wrapper.appendChild(selectedContent);

    // Strip inline formatting inside code blocks (Req 1.19)
    if (tagName === 'pre') {
      const inlineTags = wrapper.querySelectorAll('strong, em, u, s, b, i, del, strike');
      inlineTags.forEach(tag => {
        const parent = tag.parentNode;
        while (tag.firstChild) {
          parent?.insertBefore(tag.firstChild, tag);
        }
        parent?.removeChild(tag);
      });
    }

    // Snapshot mention metadata before stripping in wrapSelection (Req 1.22)
    if (tagName === 'pre') {
      const mentionsToSnapshot = wrapper.querySelectorAll('[data-uid]');
      if (mentionsToSnapshot.length > 0) {
        const mentionData: { uid: string; label: string; type: string; className: string }[] = [];
        mentionsToSnapshot.forEach(mention => {
          mentionData.push({
            uid: mention.getAttribute('data-uid') || '',
            label: mention.textContent || '',
            type: mention.getAttribute('data-mention-type') || 'other',
            className: (mention as HTMLElement).className || '',
          });
        });
        wrapper.setAttribute('data-mention-snapshot', JSON.stringify(mentionData));
      }
    }

    // Strip mentions inside code/pre elements (Req 1.11)
    if (tagName === 'pre' || tagName === 'code') {
      const mentions = wrapper.querySelectorAll('[data-mention-id], [data-uid]');
      mentions.forEach(mention => {
        const textNode = document.createTextNode(mention.textContent || '');
        mention.parentNode?.replaceChild(textNode, mention);
      });
    }

    // For empty inline elements (e.g. toggling inline code with no selection),
    // insert a zero-width space so the browser anchors the cursor inside the element.
    const isEmptyInline = wrapper.textContent === '' && tagName !== 'pre';
    if (isEmptyInline) {
      wrapper.appendChild(document.createTextNode('\u200B'));
    }

    // Insert the wrapper at the selection point
    range.insertNode(wrapper);

    // Strip inline formatting ancestors wrapping the code block (Req 1.19)
    if (tagName === 'pre') {
      const inlineAncestorTags = ['strong', 'em', 'u', 's', 'b', 'i', 'del', 'strike'];
      let ancestor = wrapper.parentElement;
      while (ancestor && ancestor !== this.element) {
        const nextAncestor = ancestor.parentElement;
        if (inlineAncestorTags.includes(ancestor.tagName.toLowerCase())) {
          const parent = ancestor.parentNode;
          if (parent) {
            while (ancestor.firstChild) {
              parent.insertBefore(ancestor.firstChild, ancestor);
            }
            parent.removeChild(ancestor);
          }
        }
        ancestor = nextAncestor;
      }
    }

    // Restore selection: for empty inline elements, collapse cursor inside
    // so subsequent typing goes into the formatted element
    selection.removeAllRanges();
    const newRange = document.createRange();
    if (isEmptyInline) {
      // Place cursor after the ZWS (position 1 inside the text node)
      const textNode = wrapper.firstChild!;
      newRange.setStart(textNode, 1);
      newRange.collapse(true);
    } else {
      newRange.selectNodeContents(wrapper);
    }
    selection.addRange(newRange);
  }

  /**
   * Unwrap content from a specified tag
   * Preserves the selection after unwrapping
   * @param tagName - The HTML tag name to unwrap
   * @private
   */
  private unwrapSelection(tagName: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Store the current selection offsets
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;
    const startContainer = range.startContainer;
    const endContainer = range.endContainer;

    // Find the parent element with the specified tag
    let node = selection.anchorNode;
    let targetElement: HTMLElement | null = null;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === tagName.toLowerCase()) {
          targetElement = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!targetElement) {
      return;
    }

    // Replace the target element with its contents
    const parent = targetElement.parentNode;
    if (!parent) {
      return;
    }

    // Store the first and last child for selection restoration
    const firstChild = targetElement.firstChild;
    const lastChild = targetElement.lastChild;

    // Move all children out of the target element
    const movedNodes: Node[] = [];
    while (targetElement.firstChild) {
      const child = targetElement.firstChild;
      parent.insertBefore(child, targetElement);
      movedNodes.push(child);
    }

    // Remove the now-empty target element
    parent.removeChild(targetElement);

    // Restore selection
    if (movedNodes.length > 0) {
      const newRange = document.createRange();

      try {
        // Try to restore the original selection offsets
        if (startContainer === endContainer && movedNodes.length === 1) {
          // Single text node case
          const textNode = movedNodes[0];
          if (textNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
            newRange.setEnd(textNode, Math.min(endOffset, textNode.textContent?.length || 0));
          } else {
            // Element node - select all contents
            newRange.selectNodeContents(textNode);
          }
        } else {
          // Multiple nodes or complex selection - select all moved content
          newRange.setStartBefore(movedNodes[0]);
          newRange.setEndAfter(movedNodes[movedNodes.length - 1]);
        }

        selection.removeAllRanges();
        selection.addRange(newRange);
      } catch (error) {
        // Fallback: select all moved content
        try {
          newRange.setStartBefore(movedNodes[0]);
          newRange.setEndAfter(movedNodes[movedNodes.length - 1]);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (fallbackError) {
          // If all else fails, just place cursor at the end
          CometChatLogger.warn('FormatManager', 'Failed to restore selection after unwrap', fallbackError);
        }
      }
    }
  }

  /**
   * Manually create a list from the current selection content.
   * Fallback when execCommand doesn't support list creation.
   * @param listTag - 'ol' or 'ul'
   * @private
   */
  private manuallyCreateList(listTag: string): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const content = range.extractContents();
    const textContent = content.textContent || '';

    const list = document.createElement(listTag);
    const lines = textContent.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      lines.push(textContent || '');
    }
    lines.forEach(line => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });

    range.insertNode(list);

    // Select the list contents
    const newRange = document.createRange();
    newRange.selectNodeContents(list);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Ensure the current selection content is wrapped in a block element.
   * After exitBlockFormat, content may be bare text nodes which execCommand
   * cannot convert to lists. This wraps them in a <div> for compatibility.
   * @private
   */
  private ensureBlockWrapping(): void {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    const content = range.extractContents();
    const div = document.createElement('div');
    div.appendChild(content);
    range.insertNode(div);

    // Select the div contents
    const newRange = document.createRange();
    newRange.selectNodeContents(div);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Check if the current selection is inside or contains an element with the specified tag.
   * This is more robust than isInsideFormattedElement alone because it also checks
   * if the selection range contains elements of the given type (e.g., when selecting
   * the entire contenteditable element that contains a <pre>).
   * @param tagName - The HTML tag name to check for
   * @returns True if inside or containing the specified element
   * @private
   */
  private isInsideOrContainsFormattedElement(tagName: string): boolean {
    // First check ancestor chain
    if (this.isInsideFormattedElement(tagName)) {
      return true;
    }
    // Then check if the element itself contains the tag within the selection
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const searchRoot =
      container.nodeType === Node.ELEMENT_NODE
        ? (container as HTMLElement)
        : container.parentElement || this.element;
    // Check if searchRoot itself matches or contains the tag
    if (searchRoot.tagName?.toLowerCase() === tagName.toLowerCase()) {
      return true;
    }
    return searchRoot.querySelector(tagName) !== null;
  }

  /**
   * Check if the current selection is inside an element with the specified tag
   * @param tagName - The HTML tag name to check for
   * @returns True if inside the specified element
   * @private
   */
  private isInsideFormattedElement(tagName: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let node = selection.anchorNode;

    while (node && node !== this.element) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === tagName.toLowerCase()) {
          return true;
        }
      }
      node = node.parentNode;
    }

    return false;
  }
}
