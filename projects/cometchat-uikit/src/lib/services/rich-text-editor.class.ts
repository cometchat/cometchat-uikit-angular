/**
 * RichTextEditor Class
 *
 * Core class for managing a rich text editor instance using native contenteditable.
 * Handles event listeners, content management, and formatting operations.
 *
 * @module services/rich-text-editor
 * @see Requirements 12.1, 12.2, 12.3, 12.4
 */

import {
  RichTextEditorConfig,
  RichTextFormatState,
  SelectionState,
  HistoryEntry,
} from './rich-text-editor.interfaces';
import { ContentEditableManager } from './content-editable-manager.class';
import { SelectionManager } from './selection-manager.class';
import { FormatManager } from './format-manager.class';
import { HistoryManager } from './history-manager.class';
import { ListManager } from './list-manager.class';
import { LinkManager } from './link-manager.class';
import { CometChatMentionsFormatter } from '../formatters/cometchat-mentions-formatter';
import { CometChatTextFormatter } from '../formatters/cometchat-text-formatter';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { CometChatLogger } from '../utils/CometChatLogger';

/**
 * RichTextEditor manages a single contenteditable element and its associated state.
 * It coordinates between various manager classes to provide rich text editing functionality.
 */
export class RichTextEditor {
  private element: HTMLElement;
  private contentEditable: HTMLDivElement;
  private config: RichTextEditorConfig;
  private destroyed = false;
  private eventListeners: {
    target: EventTarget;
    type: string;
    listener: EventListener;
  }[] = [];

  // Flag to prevent clearing formatting that was just applied
  private justAppliedFormatting = false;

  // Timer for debounced custom formatter application.
  // Formatting is deferred so DOM manipulation doesn't steal focus during active typing.
  private customFormatterTimer: ReturnType<typeof setTimeout> | null = null;

  // Manager instances
  private contentEditableManager: ContentEditableManager;
  private selectionManager: SelectionManager;
  private formatManager: FormatManager;
  private historyManager: HistoryManager;
  private listManager: ListManager;
  private linkManager: LinkManager;
  private mentionsFormatter: CometChatMentionsFormatter | null = null;

  // Custom text formatters for live pattern highlighting (e.g., hashtags)
  private customFormatters: CometChatTextFormatter[] = [];

  // ARIA live region for format announcements
  private ariaLiveRegion: HTMLDivElement | null = null;

  // Pending link click data (used to coordinate mousedown/click for first-click detection)
  private _pendingLinkClick: { url: string; text: string; x: number; y: number } | null = null;

  // Saved selection range for restoring after blur (Safari loses selection on blur)
  private lastSavedRange: Range | null = null;

  // Current format state
  private currentFormatState: RichTextFormatState = {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    blockquote: false,
    codeBlock: false,
    orderedList: false,
    bulletList: false,
    link: false,
  };

  /**
   * Create a new RichTextEditor instance
   * @param config - Configuration options
   * @param element - Optional container element (will create one if not provided)
   */
  constructor(config: RichTextEditorConfig, element?: HTMLElement) {
    this.config = config;

    // Create or use provided container element
    if (element) {
      this.element = element;
    } else {
      this.element = document.createElement('div');
      this.element.className = 'cometchat-rich-text-editor';
    }

    // Create contenteditable element
    this.contentEditable = document.createElement('div');
    this.contentEditable.className = 'cometchat-rich-text-editor__content';
    this.contentEditable.contentEditable = 'true';
    this.contentEditable.setAttribute('role', 'textbox');
    this.contentEditable.setAttribute('aria-multiline', 'true');
    this.contentEditable.setAttribute('aria-label', config.ariaLabel || 'Rich text editor');

    // Set data-placeholder attribute for CSS :empty pseudo-class
    this.contentEditable.setAttribute('data-placeholder', config.placeholder || '');

    // Initialize ContentEditableManager
    this.contentEditableManager = new ContentEditableManager(this.contentEditable);
    this.contentEditableManager.initialize({
      editable: config.editable,
    });

    // Initialize SelectionManager
    this.selectionManager = new SelectionManager(this.contentEditable);

    // Initialize FormatManager
    this.formatManager = new FormatManager(this.contentEditable);

    // Initialize HistoryManager
    this.historyManager = new HistoryManager();

    // Initialize ListManager
    this.listManager = new ListManager(this.contentEditable, this.selectionManager);

    // Initialize LinkManager
    this.linkManager = new LinkManager(this.contentEditable, this.selectionManager);

    // Append contenteditable to container first
    this.element.appendChild(this.contentEditable);

    // Create ARIA live region for format announcements
    this.createAriaLiveRegion();

    // Set initial content if provided
    if (config.content) {
      this.setHTML(config.content);
    }

    // Setup event listeners
    this.attachEventListeners();

    // Handle autofocus
    if (config.autofocus) {
      setTimeout(() => {
        this.focus(config.autofocus);
      }, 0);
    }
  }

  /**
   * Create ARIA live region for format announcements
   * @private
   * @see Requirements 13.4, 13.5
   */
  private createAriaLiveRegion(): void {
    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.className = 'cometchat-rich-text-editor__aria-live';
    this.ariaLiveRegion.setAttribute('role', 'status');
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    // Visually hidden but accessible to screen readers
    this.ariaLiveRegion.style.position = 'absolute';
    this.ariaLiveRegion.style.left = '-10000px';
    this.ariaLiveRegion.style.width = '1px';
    this.ariaLiveRegion.style.height = '1px';
    this.ariaLiveRegion.style.overflow = 'hidden';
    this.element.appendChild(this.ariaLiveRegion);
  }

  /**
   * Announce a message to screen readers via ARIA live region
   * @param message - Message to announce
   * @private
   * @see Requirements 13.2, 13.3, 13.5
   */
  private announceToScreenReader(message: string): void {
    if (!this.ariaLiveRegion) return;

    // Clear previous message
    this.ariaLiveRegion.textContent = '';

    // Set new message after a brief delay to ensure it's announced
    setTimeout(() => {
      if (this.ariaLiveRegion) {
        this.ariaLiveRegion.textContent = message;
      }
    }, 100);
  }

  /**
   * Attach event listeners to the contenteditable element
   * @private
   */
  private attachEventListeners(): void {
    // Input event for content changes
    const inputListener = () => this.handleInput();
    this.addEventListener(this.contentEditable, 'input', inputListener);

    // Beforeinput event to prevent editing inside mention nodes
    const beforeInputListener = (e: Event) => this.handleBeforeInput(e as InputEvent);
    this.addEventListener(this.contentEditable, 'beforeinput', beforeInputListener);

    // Keydown event for keyboard shortcuts
    const keydownListener = (e: Event) => this.handleKeyDown(e as KeyboardEvent);
    this.addEventListener(this.contentEditable, 'keydown', keydownListener);

    // Selection change for format state updates
    const selectionListener = () => this.handleSelectionChange();
    this.addEventListener(document, 'selectionchange', selectionListener);

    // Focus and blur events
    const focusListener = () => this.handleFocus();
    this.addEventListener(this.contentEditable, 'focus', focusListener);

    const blurListener = () => this.handleBlur();
    this.addEventListener(this.contentEditable, 'blur', blurListener);

    // Paste event
    const pasteListener = (e: Event) => this.handlePaste(e as ClipboardEvent);
    this.addEventListener(this.contentEditable, 'paste', pasteListener);

    // Copy event
    const copyListener = (e: Event) => this.handleCopy(e as ClipboardEvent);
    this.addEventListener(this.contentEditable, 'copy', copyListener);

    // Drop event
    const dropListener = (e: Event) => this.handleDrop(e as DragEvent);
    this.addEventListener(this.contentEditable, 'drop', dropListener);

    // Click event for link editing
    const clickListener = (e: Event) => this.handleClick(e as MouseEvent);
    this.addEventListener(this.contentEditable, 'click', clickListener);

    // Mousedown event for link detection (fires before focus, catches first click)
    const mousedownListener = (e: Event) => this.handleMouseDown(e as MouseEvent);
    this.addEventListener(this.contentEditable, 'mousedown', mousedownListener);
  }

  /**
   * Add an event listener and track it for cleanup
   * @param target - Event target
   * @param type - Event type
   * @param listener - Event listener
   * @private
   */
  private addEventListener(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    this.eventListeners.push({ target, type, listener });
  }

  /**
   * Handle beforeinput event to prevent editing inside mention nodes.
   * This is a safety net that catches browser-initiated edits (e.g., IME,
   * autocorrect, drag-drop) that target mention spans, ensuring they remain
   * atomic and non-editable.
   * @param event - InputEvent from beforeinput
   * @private
   */
  private handleBeforeInput(event: InputEvent): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const node = range.startContainer;

    // If the cursor/selection is inside a mention node, cancel the input
    const mentionAncestor = this.findMentionAncestor(node);
    if (mentionAncestor) {
      event.preventDefault();
      return;
    }

    // Also check the end container for non-collapsed selections
    if (!range.collapsed) {
      const endMention = this.findMentionAncestor(range.endContainer);
      if (endMention) {
        event.preventDefault();
        return;
      }
    }
  }

  /**
   * Handle input event
   * Clears formatting containers when content becomes empty after deletion
   * Does not clear formatting that was just applied programmatically
   * Auto-converts "1. " or "- " patterns to lists (Slack-style)
   * Auto-converts markdown syntax to formatted text
   * @private
   */
  private handleInput(): void {
    // If formatting was just applied, don't clear it
    if (this.justAppliedFormatting) {
      this.justAppliedFormatting = false;
      this.pushToHistory();
      this.emitUpdate();
      return;
    }

    // Save cursor position when inside a blockquote before any DOM operations.
    // Various operations below (cleanupZeroWidthSpaces, empty-content checks,
    // custom formatters) can normalize or mutate the DOM, which causes browsers
    // to reset the caret to position 0 inside <blockquote> elements.
    const insideBlockquote = this.isInBlockquote();
    let savedOffset = -1;
    if (insideBlockquote) {
      savedOffset = this.getCharacterOffset();
    }

    // Clean up zero-width spaces from inline code elements once real content is typed
    this.cleanupZeroWidthSpaces();

    // Only run markdown auto-formatting and auto-list when formatting is enabled
    if (this.config.enableFormatting !== false) {
      // Check for markdown auto-formatting patterns
      if (this.detectAndConvertMarkdown()) {
        this.pushToHistory();
        this.emitUpdate();
        return;
      }

      // Check for auto-list patterns (Slack-style)
      // Only check if not already in a list
      if (!this.listManager.isInList()) {
        if (this.detectAndConvertAutoList()) {
          // Auto-list was applied, skip the rest
          this.pushToHistory();
          this.emitUpdate();
          return;
        }
      }
    }

    // Check if content is empty (only whitespace or empty formatting tags)
    const text = this.getText().trim();

    // Only clear formatting if text is empty AND we have actual empty containers
    // This prevents clearing when user just applies formatting to empty editor
    if (text === '') {
      const html = this.contentEditable.innerHTML.trim();

      // If content is empty or only contains <br> tags, clear completely
      // This ensures :empty pseudo-class works for placeholder
      if (html === '' || /^(<br\s*\/?>)+$/i.test(html)) {
        this.contentEditable.innerHTML = '';
        this.updateFormatState();
        this.pushToHistory();
        this.emitUpdate();
        return;
      }

      // Check if we have formatting containers with only empty elements (br, empty text nodes)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Get all text content including nested elements
      const allTextContent = tempDiv.textContent || '';

      // Only clear if we have formatting containers but absolutely no text content
      // and the HTML contains line breaks or empty elements (indicating user deleted content)
      if (allTextContent.trim() === '' && html !== '') {
        const hasFormatting = tempDiv.querySelector('ol, ul, blockquote, pre') !== null;

        // Check if the formatting container has only <br> or empty elements
        // For lists: check for empty <li> elements
        // For blockquote/pre: check if they only contain <br> or are empty
        const hasOnlyEmptyElements =
          html.includes('<br>') ||
          html.includes('<li></li>') ||
          html.includes('<li><br></li>') ||
          html.includes('<pre><br></pre>') ||
          html.includes('<pre></pre>') ||
          html.includes('<blockquote><br></blockquote>') ||
          html.includes('<blockquote></blockquote>') ||
          // Also check for pre with code inside
          html.includes('<pre><code><br></code></pre>') ||
          html.includes('<pre><code></code></pre>');

        if (hasFormatting && hasOnlyEmptyElements) {
          this.contentEditable.innerHTML = '';
          // Update format state to reflect no formatting
          this.updateFormatState();
        }
      }
    }

    // Apply custom text formatters (e.g., hashtag highlighting) to text nodes.
    // Debounced so the heavy DOM manipulation (unwrap → normalize → rewrap)
    // doesn't run during active typing, which would steal focus from the
    // contenteditable and force the user to click back into the editor.
    this.scheduleCustomFormatters();

    // Restore cursor position inside blockquote if it was displaced by DOM operations.
    if (insideBlockquote && savedOffset >= 0) {
      const currentOffset = this.getCharacterOffset();
      if (currentOffset !== savedOffset) {
        this.restoreCharacterOffset(savedOffset);
      }
    }

    this.pushToHistory();
    this.emitUpdate();
    this.scrollCursorIntoView();
  }

  /**
   * Remove zero-width space characters from inline code elements
   * that now contain real user-typed content. The ZWS is inserted
   * as a cursor anchor when toggling inline code on an empty selection;
   * once the user types, it should be stripped so it doesn't leak into output.
   * @private
   */
  private cleanupZeroWidthSpaces(): void {
    const selection = this.selectionManager.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

    const codeElements = this.contentEditable.querySelectorAll('code');
    codeElements.forEach(code => {
      const text = code.textContent || '';
      // Only strip ZWS if there is other real content alongside it
      if (text.length > 1 && text.includes('\u200B')) {
        const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT);
        let node: Text | null;
        while ((node = walker.nextNode() as Text | null)) {
          if (node.data.includes('\u200B')) {
            // Adjust cursor if it's inside this text node
            const zwsIndex = node.data.indexOf('\u200B');
            if (range && range.startContainer === node && range.startOffset > zwsIndex) {
              range.setStart(node, range.startOffset - 1);
            }
            if (range && range.endContainer === node && range.endOffset > zwsIndex) {
              range.setEnd(node, range.endOffset - 1);
            }
            node.data = node.data.replace(/\u200B/g, '');
          }
        }
      }
    });

    // Restore adjusted selection
    if (range && selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  /**
   * Scroll the outer composer container so the cursor stays visible.
   * The inner contentEditable has overflow:visible (no own scrollbar),
   * so the browser won't auto-scroll the outer wrapper when the cursor
   * moves above or below the visible area.
   * @private
   */
  private scrollCursorIntoView(): void {
    requestAnimationFrame(() => {
      if (this.destroyed) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        return;
      }

      // Find the scroll container — the outer wrapper with overflow-y: auto
      let scrollContainer: HTMLElement | null = this.contentEditable.parentElement;
      while (scrollContainer) {
        const style = window.getComputedStyle(scrollContainer);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }

      if (!scrollContainer || scrollContainer.scrollHeight <= scrollContainer.clientHeight) {
        return;
      }

      // Get cursor position via a temporary collapsed range
      const range = selection.getRangeAt(0).cloneRange();
      range.collapse(false);

      let cursorRect = range.getBoundingClientRect();

      // If range rect is empty (e.g. cursor at end of line), use the
      // anchor node's parent element rect as a fallback
      if (cursorRect.height === 0) {
        const node = selection.focusNode;
        const el = node?.nodeType === Node.ELEMENT_NODE
          ? node as HTMLElement
          : node?.parentElement;
        if (el) {
          cursorRect = el.getBoundingClientRect();
        }
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const padding = 4; // small buffer so cursor isn't flush against edge

      if (cursorRect.bottom > containerRect.bottom - padding) {
        // Cursor is below visible area — scroll down
        scrollContainer.scrollTop += cursorRect.bottom - containerRect.bottom + padding;
      } else if (cursorRect.top < containerRect.top + padding) {
        // Cursor is above visible area — scroll up
        scrollContainer.scrollTop -= containerRect.top - cursorRect.top + padding;
      }
    });
  }

  /**
   * Detect and convert markdown patterns to formatted text
   * Converts **text** to bold, *text* to italic, __text__ to underline, ~~text~~ to strikethrough, `code` to inline code
   * Triggers immediately when closing marker is typed (no space required)
   * @returns True if markdown was converted
   * @private
   */
  private detectAndConvertMarkdown(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    // Only process text nodes
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return false;
    }

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Get text before cursor
    const textBeforeCursor = text.substring(0, cursorPos);

    // Check for markdown patterns (triggered immediately after closing marker)
    // Bold: **text**
    const boldMatch = textBeforeCursor.match(/\*\*([^\*]+)\*\*$/);
    if (boldMatch) {
      this.applyMarkdownFormat(textNode, range, boldMatch, 'bold', 2);
      return true;
    }

    // Bold: *text* (single asterisk, not part of **) — Req 2.23
    const singleBoldMatch = textBeforeCursor.match(/(?<!\*)\*([^\*]+)\*$/);
    if (singleBoldMatch) {
      this.applyMarkdownFormat(textNode, range, singleBoldMatch, 'bold', 1);
      return true;
    }

    // Italic: _text_ (single underscore, not part of __) — Req 2.23
    const italicUnderscoreMatch = textBeforeCursor.match(/(?<!_)_([^_]+)_$/);
    if (italicUnderscoreMatch) {
      this.applyMarkdownFormat(textNode, range, italicUnderscoreMatch, 'italic', 1);
      return true;
    }

    // Underline: __text__
    const underlineMatch = textBeforeCursor.match(/__([^_]+)__$/);
    if (underlineMatch) {
      this.applyMarkdownFormat(textNode, range, underlineMatch, 'underline', 2);
      return true;
    }

    // Strikethrough: ~~text~~
    const strikethroughMatch = textBeforeCursor.match(/~~([^~]+)~~$/);
    if (strikethroughMatch) {
      this.applyMarkdownFormat(textNode, range, strikethroughMatch, 'strikethrough', 2);
      return true;
    }

    // Inline code: `code`
    const codeMatch = textBeforeCursor.match(/`([^`]+)`$/);
    if (codeMatch) {
      this.applyMarkdownFormat(textNode, range, codeMatch, 'code', 1);
      return true;
    }

    return false;
  }

  /**
   * Apply markdown formatting to matched text
   * @param textNode - Text node containing the markdown
   * @param range - Current selection range
   * @param match - Regex match result
   * @param format - Format type to apply
   * @param markerLength - Length of the markdown marker (1 for *, 2 for **)
   * @private
   */
  private applyMarkdownFormat(
    textNode: Node,
    range: Range,
    match: RegExpMatchArray,
    format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code',
    markerLength: number
  ): void {
    const fullMatch = match[0];
    const content = match[1];
    const matchStart = (textNode.textContent || '').lastIndexOf(fullMatch);
    const matchEnd = matchStart + fullMatch.length;

    // Create a range for the matched text
    const matchRange = document.createRange();
    matchRange.setStart(textNode, matchStart);
    matchRange.setEnd(textNode, matchEnd);

    // Delete the markdown syntax
    matchRange.deleteContents();

    // Create formatted element
    let formattedElement: HTMLElement;
    switch (format) {
      case 'bold':
        formattedElement = document.createElement('strong');
        break;
      case 'italic':
        formattedElement = document.createElement('em');
        break;
      case 'underline':
        formattedElement = document.createElement('u');
        break;
      case 'strikethrough':
        formattedElement = document.createElement('s');
        break;
      case 'code':
        formattedElement = document.createElement('code');
        break;
    }

    formattedElement.textContent = content;

    // Insert the formatted element
    matchRange.insertNode(formattedElement);

    // Create a zero-width space after the formatted element to allow cursor positioning
    const zeroWidthSpace = document.createTextNode('\u200B');
    matchRange.setStartAfter(formattedElement);
    matchRange.insertNode(zeroWidthSpace);

    // Move cursor after the zero-width space (outside the formatted block)
    matchRange.setStartAfter(zeroWidthSpace);
    matchRange.collapse(true);

    const selection = this.selectionManager.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(matchRange);
    }

    this.justAppliedFormatting = true;
    this.updateFormatState();
  }

  /**
   * Detect and convert auto-list patterns (Slack-style)
   * Converts "1. " or "1) " to ordered list
   * Converts "- " or "* " to bullet list
   * @returns True if auto-list was applied
   * @private
   */
  private detectAndConvertAutoList(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    // Only process text nodes
    if (textNode.nodeType !== Node.TEXT_NODE) {
      return false;
    }

    const text = textNode.textContent || '';
    const cursorPos = range.startOffset;

    // Get text from start of line to cursor
    const textBeforeCursor = text.substring(0, cursorPos);

    // Check for ordered list patterns: "1. " or "1) "
    const orderedListMatch = textBeforeCursor.match(/^(\d+)(\.|\))\s$/);
    if (orderedListMatch) {
      // Remove the pattern text
      const patternLength = orderedListMatch[0].length;
      range.setStart(textNode, 0);
      range.setEnd(textNode, patternLength);
      range.deleteContents();

      // Apply ordered list
      this.justAppliedFormatting = true;
      this.listManager.toggleOrderedList();
      this.updateFormatState();

      return true;
    }

    // Check for bullet list patterns: "- " or "* "
    const bulletListMatch = textBeforeCursor.match(/^(-|\*)\s$/);
    if (bulletListMatch) {
      // Remove the pattern text
      const patternLength = bulletListMatch[0].length;
      range.setStart(textNode, 0);
      range.setEnd(textNode, patternLength);
      range.deleteContents();

      // Apply bullet list
      this.justAppliedFormatting = true;
      this.listManager.toggleBulletList();
      this.updateFormatState();

      return true;
    }

    return false;
  }

  /**
   * Handle keydown event
   * @param event - Keyboard event
   * @private
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Handle mention deletion (Backspace/Delete on atomic mention nodes)
    if (event.key === 'Backspace' || event.key === 'Delete') {
      if (this.handleMentionDeletion(event)) {
        return;
      }
    }

    // Handle formatting shortcuts (Ctrl/Cmd+B/I/U) — only when formatting is enabled
    if (isCtrlOrCmd && !event.shiftKey && this.config.enableFormatting !== false) {
      if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        this.applyBold();
        return;
      }
      if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        this.applyItalic();
        return;
      }
      if (event.key === 'u' || event.key === 'U') {
        event.preventDefault();
        this.applyUnderline();
        return;
      }
    }

    // Handle Ctrl/Cmd+Z for undo
    if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.undo();
      return;
    }

    // Handle Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo
    if (
      isCtrlOrCmd &&
      (event.key === 'y' ||
        event.key === 'Y' ||
        (event.key === 'z' && event.shiftKey) ||
        (event.key === 'Z' && event.shiftKey))
    ) {
      event.preventDefault();
      this.redo();
      return;
    }

    // Handle Enter key in lists and code blocks
    if (event.key === 'Enter') {
      // Check if we're in a blockquote
      if (this.isInBlockquote()) {
        if (event.shiftKey) {
          // Shift+Enter in blockquote - check for double line break to exit
          if (this.shouldExitBlockquote()) {
            event.preventDefault();
            this.exitBlockquote();
            this.pushToHistory();
            this.emitUpdate();
            return;
          }
          // Otherwise, allow default behavior (insert line break)
        }
        // Regular Enter in blockquote - allow default behavior
        return;
      }

      // Check if we're in a code block
      if (this.isInCodeBlock()) {
        if (event.shiftKey) {
          // Shift+Enter in code block - check for double line break to exit
          if (this.shouldExitCodeBlock()) {
            event.preventDefault();
            this.exitCodeBlock();
            this.pushToHistory();
            this.emitUpdate();
            return;
          }
          // Otherwise, allow default behavior (insert line break)
        }
        // Regular Enter in code block - allow default behavior
        return;
      }

      // Handle Enter in lists - check BEFORE any other logic
      const listItem = this.getCurrentListItem();
      if (listItem) {
        // We're definitely in a list item
        // Always prevent default for both Enter and Shift+Enter in lists
        event.preventDefault();

        // Check if list item is empty
        const isEmpty = listItem.textContent?.trim() === '';
        const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';

        if (isEmpty || hasOnlyBr) {
          // Empty list item - exit the list
          this.listManager.exitList();
          this.pushToHistory();
          this.emitUpdate();
          return;
        } else {
          // List item has content - create new list item
          this.listManager.createNewListItem();
          this.pushToHistory();
          this.emitUpdate();
          return;
        }
      }
    }

    // Handle Tab key in lists
    if (event.key === 'Tab' && !event.shiftKey) {
      if (this.listManager.handleTabKey(event)) {
        this.pushToHistory();
        this.emitUpdate();
        return;
      }
    }

    // Handle Shift+Tab key in lists
    if (event.key === 'Tab' && event.shiftKey) {
      if (this.listManager.handleShiftTabKey(event)) {
        this.pushToHistory();
        this.emitUpdate();
        return;
      }
    }

    // Scroll cursor into view after navigation keys
    if (['ArrowUp', 'ArrowDown', 'Enter', 'Backspace', 'Delete'].includes(event.key)) {
      this.scrollCursorIntoView();
    }
  }

  /**
   * Check if cursor is currently inside a blockquote element
   * @returns True if inside a blockquote
   * @private
   */
  private isInBlockquote(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let node = selection.anchorNode;
    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'blockquote') {
          return true;
        }
      }
      node = node.parentNode;
    }

    return false;
  }

  /**
   * Check if we should exit the blockquote (empty line or double Shift+Enter)
   * @returns True if should exit blockquote
   * @private
   */
  private shouldExitBlockquote(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    // Find the <blockquote> element
    let node = selection.anchorNode;
    let blockquoteElement: HTMLElement | null = null;

    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'blockquote') {
          blockquoteElement = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!blockquoteElement) {
      return false;
    }

    // Check if the blockquote has multiple <br> elements at the end
    // or if the last child is an empty element
    const lastChild = blockquoteElement.lastChild;

    // Count trailing <br> elements
    let brCount = 0;
    let currentNode = lastChild;

    while (currentNode) {
      if (currentNode.nodeType === Node.ELEMENT_NODE) {
        const element = currentNode as HTMLElement;
        if (element.tagName.toLowerCase() === 'br') {
          brCount++;
          currentNode = currentNode.previousSibling;
          continue;
        }
        // Check if it's an empty paragraph or div
        if (
          (element.tagName.toLowerCase() === 'p' || element.tagName.toLowerCase() === 'div') &&
          element.textContent?.trim() === ''
        ) {
          brCount++;
          currentNode = currentNode.previousSibling;
          continue;
        }
        break;
      } else if (currentNode.nodeType === Node.TEXT_NODE) {
        const text = currentNode.textContent || '';
        if (text.trim() === '') {
          // Empty text node, continue
          currentNode = currentNode.previousSibling;
          continue;
        }
        // Check for trailing newlines in text
        const trimmedText = text.trimEnd();
        const trailingNewlines = text.length - trimmedText.length;
        if (trailingNewlines > 0) {
          brCount += trailingNewlines;
        }
        break;
      } else {
        break;
      }
    }

    // Exit if we have 2 or more line breaks
    if (brCount >= 2) {
      return true;
    }

    // Also check if cursor is at a position with a newline before it
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const nodeText = textNode.textContent || '';
      const cursorPos = range.startOffset;

      // Check if there's a line break right before cursor
      if (cursorPos > 0 && nodeText[cursorPos - 1] === '\n') {
        return true;
      }
    }

    return false;
  }

  /**
   * Exit the blockquote and place cursor after it
   * @private
   */
  private exitBlockquote(): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    // Find the <blockquote> element
    let node = selection.anchorNode;
    let blockquoteElement: HTMLElement | null = null;

    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'blockquote') {
          blockquoteElement = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!blockquoteElement) {
      return;
    }

    // Create a line break after the blockquote for cursor placement
    const br = document.createElement('br');

    // Insert after the blockquote element
    if (blockquoteElement.nextSibling) {
      blockquoteElement.parentNode?.insertBefore(br, blockquoteElement.nextSibling);
    } else {
      blockquoteElement.parentNode?.appendChild(br);
    }

    // Place cursor at the br element (before it, not after)
    const newRange = document.createRange();
    newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Check if cursor is currently inside a code block (<pre> element)
   * @returns True if inside a code block
   * @private
   */
  private isInCodeBlock(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    let node = selection.anchorNode;
    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'pre') {
          return true;
        }
      }
      node = node.parentNode;
    }

    return false;
  }

  /**
   * Check if we should exit the code block (empty line or double Shift+Enter)
   * @returns True if should exit code block
   * @private
   */
  private shouldExitCodeBlock(): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    // Find the <pre> element
    let node = selection.anchorNode;
    let preElement: HTMLElement | null = null;

    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'pre') {
          preElement = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!preElement) {
      return false;
    }

    // Check if the code block ends with two consecutive line breaks
    const text = preElement.textContent || '';
    const trimmedText = text.trimEnd();

    // If the text ends with two or more newlines, we should exit
    const trailingNewlines = text.length - trimmedText.length;
    if (trailingNewlines >= 2) {
      return true;
    }

    // Also check if cursor is at a position with a newline before it
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const nodeText = textNode.textContent || '';
      const cursorPos = range.startOffset;

      // Check if there's a line break right before cursor
      if (cursorPos > 0 && nodeText[cursorPos - 1] === '\n') {
        return true;
      }
    }

    return false;
  }

  /**
   * Exit the code block and place cursor after it
   * @private
   */
  private exitCodeBlock(): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    // Find the <pre> element
    let node = selection.anchorNode;
    let preElement: HTMLElement | null = null;

    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'pre') {
          preElement = element;
          break;
        }
      }
      node = node.parentNode;
    }

    if (!preElement) {
      return;
    }

    // Create a line break after the code block for cursor placement
    const br = document.createElement('br');

    // Insert after the pre element
    if (preElement.nextSibling) {
      preElement.parentNode?.insertBefore(br, preElement.nextSibling);
    } else {
      preElement.parentNode?.appendChild(br);
    }

    // Place cursor at the br element (before it, not after)
    const newRange = document.createRange();
    newRange.setStart(br.parentNode!, Array.from(br.parentNode!.childNodes).indexOf(br));
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Check if we should exit the list (empty list item)
   * @returns True if should exit list
   * @private
   */
  private shouldExitList(): boolean {
    const listItem = this.getCurrentListItem();
    if (!listItem) {
      return false;
    }

    // Check if list item has only a <br> or is empty
    const isEmpty = listItem.textContent?.trim() === '';
    const hasOnlyBr = listItem.innerHTML.trim() === '<br>' || listItem.innerHTML.trim() === '';

    return isEmpty || hasOnlyBr;
  }

  /**
   * Get the current list item containing the cursor
   * @returns List item element or null
   * @private
   */
  private getCurrentListItem(): HTMLElement | null {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }

    let node = selection.anchorNode;
    while (node && node !== this.contentEditable) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'li') {
          return element;
        }
      }
      node = node.parentNode;
    }

    return null;
  }

  /**
   * Handle mention deletion (delete entire mention as a unit)
   * @param event - Keyboard event
   * @returns True if a mention was deleted
   * @private
   * @see Requirements 9.1, 9.2, 9.3, 9.4, 9.5
   */
  private handleMentionDeletion(event: KeyboardEvent): boolean {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);

    // Handle selection that includes mentions (Requirements 9.3, 9.4)
    if (!range.collapsed) {
      const mentionsInRange = this.getMentionsInRange(range);
      if (mentionsInRange.length > 0) {
        event.preventDefault();
        // Delete all mentions in the selection
        mentionsInRange.forEach(mention => {
          mention.parentNode?.removeChild(mention);
        });
        // Also delete the selected text content
        range.deleteContents();
        this.pushToHistory();
        this.emitUpdate();
        return true;
      }
      // No mentions in selection, let default behavior handle it
      return false;
    }

    // Handle collapsed selection (cursor position) - Requirements 9.1, 9.2
    // Also check if cursor is inside the trailing space text node after a mention.
    // When a mention is inserted, a NBSP text node is placed after it. The cursor
    // lands in that text node, so backspace must detect the adjacent mention and
    // delete it atomically (mention span + trailing space).
    let mentionNode: Node | null = null;
    let trailingTextNode: Node | null = null; // the NBSP node to also remove

    if (event.key === 'Backspace') {
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text;
        const offset = range.startOffset;

        // Case 1: cursor at offset 0 in a text node — previous sibling is the mention
        if (
          offset === 0 &&
          textNode.previousSibling &&
          this.isMentionNode(textNode.previousSibling)
        ) {
          mentionNode = textNode.previousSibling;
        }
        // Case 2: cursor inside a short text node (1-2 chars, typically the NBSP)
        // whose previous sibling is a mention — delete mention + this spacer node
        else if (
          offset <= 1 &&
          textNode.previousSibling &&
          this.isMentionNode(textNode.previousSibling)
        ) {
          mentionNode = textNode.previousSibling;
          trailingTextNode = textNode;
        }
        // Case 3: cursor at end of a short spacer node after a mention
        else if (
          textNode.textContent &&
          textNode.textContent.length <= 2 &&
          offset === textNode.textContent.length &&
          textNode.previousSibling &&
          this.isMentionNode(textNode.previousSibling)
        ) {
          mentionNode = textNode.previousSibling;
          trailingTextNode = textNode;
        }
      } else {
        // Container is an element node — check child at offset - 1
        const nodeBefore = range.startContainer.childNodes[range.startOffset - 1];
        if (nodeBefore && this.isMentionNode(nodeBefore)) {
          mentionNode = nodeBefore;
        }
      }
    } else if (event.key === 'Delete') {
      if (range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer as Text;
        const offset = range.startOffset;
        const len = textNode.textContent?.length ?? 0;

        // Case 1: cursor at end of text node — next sibling is the mention
        if (offset === len && textNode.nextSibling && this.isMentionNode(textNode.nextSibling)) {
          mentionNode = textNode.nextSibling;
        }
        // Case 2: next sibling is a mention (cursor anywhere in text node before it)
        else if (textNode.nextSibling && this.isMentionNode(textNode.nextSibling)) {
          // Only if cursor is at the very end of the text
          if (offset === len) {
            mentionNode = textNode.nextSibling;
          }
        }
      } else {
        const nodeAfter = range.startContainer.childNodes[range.startOffset];
        if (nodeAfter && this.isMentionNode(nodeAfter)) {
          mentionNode = nodeAfter;
        }
      }
    }

    // If we found a mention node, delete it as a unit
    if (mentionNode) {
      event.preventDefault();
      const parent = mentionNode.parentNode;

      // Also remove the trailing NBSP spacer node if identified
      if (trailingTextNode && trailingTextNode.parentNode) {
        trailingTextNode.parentNode.removeChild(trailingTextNode);
      }

      // For backspace, also clean up the NBSP text node immediately after the mention
      // (if we didn't already remove it above)
      if (event.key === 'Backspace' && !trailingTextNode) {
        const nextSibling = mentionNode.nextSibling;
        if (nextSibling && nextSibling.nodeType === Node.TEXT_NODE) {
          const text = nextSibling.textContent || '';
          // Remove if it's just a NBSP or single whitespace character (the spacer)
          if (text === '\u00A0' || text === ' ') {
            nextSibling.parentNode?.removeChild(nextSibling);
          }
        }
      }

      parent?.removeChild(mentionNode);
      this.pushToHistory();
      this.emitUpdate();
      return true;
    }

    return false;
  }

  /**
   * Cleanup pass that removes inline formatting tags from inside mention spans.
   * After applying bold/italic/underline/strikethrough, the browser may wrap
   * mention content in formatting tags. This method finds those and unwraps them
   * so mentions remain visually unaffected.
   * @private
   * @see Requirement 2.13 (Bug 5 fix)
   */
  private protectMentionsFromFormatting(): void {
    const mentions = this.contentEditable.querySelectorAll('span[data-uid]');
    const inlineTags = ['strong', 'em', 'u', 's', 'b', 'i', 'del', 'strike'];

    mentions.forEach(mention => {
      // Remove any inline formatting tags that ended up inside the mention
      const innerFormatTags = mention.querySelectorAll(inlineTags.join(', '));
      innerFormatTags.forEach(tag => {
        const parent = tag.parentNode;
        while (tag.firstChild) {
          parent?.insertBefore(tag.firstChild, tag);
        }
        parent?.removeChild(tag);
      });

      // If the mention itself got wrapped in a formatting tag, unwrap it
      let ancestor = mention.parentElement;
      while (ancestor && ancestor !== this.contentEditable) {
        const nextAncestor = ancestor.parentElement;
        if (inlineTags.includes(ancestor.tagName.toLowerCase())) {
          // Check if this formatting ancestor ONLY contains the mention
          // If so, unwrap entirely; otherwise leave it (it formats other text too)
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
    });
  }

  /**
   * Convert mention spans inside a container to plain text (@name).
   * Used when applying inline code or code block formatting so mentions
   * lose their special styling and become plain text references.
   * @param container - The DOM element to search within (e.g., <code> or <pre>)
   * @private
   * @see Requirement 2.14 (Bug 5 fix)
   */
  private convertMentionsToPlainText(container: Element): void {
    const mentions = container.querySelectorAll('[data-uid]');
    mentions.forEach(mention => {
      const textNode = document.createTextNode(mention.textContent || '');
      mention.parentNode?.replaceChild(textNode, mention);
    });
  }

  /**
   * Check if a node is a mention span
   * @param node - DOM node to check
   * @returns True if node is a mention span
   * @private
   */
  private isMentionNode(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const element = node as HTMLElement;
    return (
      element.tagName === 'SPAN' &&
      element.hasAttribute('data-uid') &&
      element.getAttribute('contenteditable') === 'false'
    );
  }

  /**
   * Find the mention ancestor of a node
   * Traverses up the DOM tree to find if the node is inside a mention span
   * @param node - DOM node to check
   * @returns The mention span element or null
   * @private
   * @see Requirements 8.1, 8.2
   */
  private findMentionAncestor(node: Node): HTMLElement | null {
    let currentNode: Node | null = node;

    // Traverse up the DOM tree
    while (currentNode && currentNode !== this.contentEditable) {
      if (this.isMentionNode(currentNode)) {
        return currentNode as HTMLElement;
      }
      currentNode = currentNode.parentNode;
    }

    return null;
  }

  /**
   * Move cursor to the nearest boundary of a mention node
   * If cursor is inside a mention, moves it to before or after the mention
   * @param mentionNode - The mention span element
   * @param range - The current selection range
   * @private
   * @see Requirements 8.2, 8.4
   */
  private moveCursorToMentionBoundary(mentionNode: HTMLElement, range: Range): void {
    const selection = this.selectionManager.getSelection();
    if (!selection) return;

    // Determine if cursor is closer to start or end of mention
    const mentionRect = mentionNode.getBoundingClientRect();
    const cursorOffset = range.startOffset;

    // Get the parent node of the mention
    const parentNode = mentionNode.parentNode;
    if (!parentNode) return;

    // Find the index of the mention node in its parent
    const mentionIndex = Array.from(parentNode.childNodes).indexOf(mentionNode);

    // Create a new range
    const newRange = document.createRange();

    // If cursor is in the first half of the mention, move before it
    // Otherwise, move after it
    const textContent = mentionNode.textContent || '';
    const midPoint = textContent.length / 2;

    if (cursorOffset <= midPoint) {
      // Move cursor before the mention
      newRange.setStart(parentNode, mentionIndex);
      newRange.collapse(true);
    } else {
      // Move cursor after the mention
      newRange.setStart(parentNode, mentionIndex + 1);
      newRange.collapse(true);
    }

    // Update selection
    selection.removeAllRanges();
    selection.addRange(newRange);
  }

  /**
   * Get all mention nodes that are fully or partially within a range
   * @param range - The selection range to check
   * @returns Array of mention HTML elements within the range
   * @private
   * @see Requirement 8.3
   */
  private getMentionsInRange(range: Range): HTMLElement[] {
    const mentions: HTMLElement[] = [];

    // Get all mention spans in the editor
    const allMentions = this.contentEditable.querySelectorAll(
      'span[data-uid][contenteditable="false"]'
    );

    allMentions.forEach(mentionElement => {
      const mention = mentionElement as HTMLElement;

      // Check if the mention intersects with the selection range
      if (this.doesRangeIntersectNode(range, mention)) {
        mentions.push(mention);
      }
    });

    return mentions;
  }

  /**
   * Check if a range intersects with a node
   * @param range - The selection range
   * @param node - The node to check
   * @returns True if the range intersects the node
   * @private
   */
  private doesRangeIntersectNode(range: Range, node: Node): boolean {
    try {
      // Create a range that encompasses the entire node
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);

      // Check if ranges intersect
      // Ranges intersect if:
      // - range starts before node ends AND
      // - range ends after node starts
      const rangeStartsBeforeNodeEnds =
        range.compareBoundaryPoints(Range.START_TO_END, nodeRange) < 0;
      const rangeEndsAfterNodeStarts =
        range.compareBoundaryPoints(Range.END_TO_START, nodeRange) > 0;

      return rangeStartsBeforeNodeEnds && rangeEndsAfterNodeStarts;
    } catch (error) {
      // If comparison fails, assume no intersection
      CometChatLogger.warn('RichTextEditor', 'Error checking range intersection:', error);
      return false;
    }
  }

  /**
   * Extend selection to include all mentions that are partially overlapped
   * @param range - The current selection range
   * @param mentions - Array of mention elements to include
   * @private
   * @see Requirement 8.3
   */
  private extendSelectionToIncludeMentions(range: Range, mentions: HTMLElement[]): void {
    if (mentions.length === 0) return;

    const selection = this.selectionManager.getSelection();
    if (!selection) return;

    // Find the earliest start point and latest end point
    let earliestNode: Node = range.startContainer;
    let earliestOffset: number = range.startOffset;
    let latestNode: Node = range.endContainer;
    let latestOffset: number = range.endOffset;

    mentions.forEach(mention => {
      const mentionParent = mention.parentNode;
      if (!mentionParent) return;

      const mentionIndex = Array.from(mentionParent.childNodes).indexOf(mention);

      // Check if mention starts before current selection start
      const mentionRange = document.createRange();
      mentionRange.selectNode(mention);

      if (mentionRange.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
        // Mention starts before selection, extend start to before mention
        earliestNode = mentionParent;
        earliestOffset = mentionIndex;
      }

      if (mentionRange.compareBoundaryPoints(Range.END_TO_END, range) > 0) {
        // Mention ends after selection, extend end to after mention
        latestNode = mentionParent;
        latestOffset = mentionIndex + 1;
      }
    });

    // Create new extended range
    try {
      const newRange = document.createRange();
      newRange.setStart(earliestNode, earliestOffset);
      newRange.setEnd(latestNode, latestOffset);

      // Update selection
      selection.removeAllRanges();
      selection.addRange(newRange);
    } catch (error) {
      CometChatLogger.warn('RichTextEditor', 'Error extending selection:', error);
      // Keep original selection if extension fails
    }
  }

  /**
   * Handle selection change
   * Detects when cursor is inside a mention node and moves it to the nearest boundary
   * Also extends selection to include entire mentions when partially overlapped
   * @private
   * @see Requirements 8.1, 8.2, 8.3, 8.4, 8.5
   */
  private handleSelectionChange(): void {
    // Only handle if this editor is focused
    if (document.activeElement !== this.contentEditable) {
      return;
    }

    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.updateFormatState();
      return;
    }

    const range = selection.getRangeAt(0);

    // Handle collapsed selection (cursor position)
    if (range.collapsed) {
      const node = range.startContainer;

      // If cursor is inside a mention node, move to nearest boundary
      const mentionNode = this.findMentionAncestor(node);
      if (mentionNode) {
        this.moveCursorToMentionBoundary(mentionNode, range);
      }
    } else {
      // Handle non-collapsed selection (text selection)
      // Check if selection partially overlaps any mentions
      const mentionsInRange = this.getMentionsInRange(range);

      if (mentionsInRange.length > 0) {
        // Extend selection to include all partially overlapped mentions
        this.extendSelectionToIncludeMentions(range, mentionsInRange);
      }
    }

    this.updateFormatState();
  }

  /**
   * Handle focus event
   * @private
   */
  private handleFocus(): void {
    this.element.classList.add('cometchat-rich-text-editor--focused');
    if (this.config.onFocus) {
      this.config.onFocus();
    }
  }

  /**
   * Handle blur event
   * @private
   */
  private handleBlur(): void {
    // Save the current selection range before blur clears it (Safari compatibility).
    // Safari clears the selection when a contenteditable element loses focus,
    // which prevents emoji insertion from working correctly.
    const selection = this.selectionManager.getSelection();
    if (selection && selection.rangeCount > 0) {
      this.lastSavedRange = selection.getRangeAt(0).cloneRange();
    }
    this.element.classList.remove('cometchat-rich-text-editor--focused');
    if (this.config.onBlur) {
      this.config.onBlur();
    }
  }

  /**
   * Convert markdown patterns in plain text to HTML.
   * Handles block-level (lists) and inline formatting.
   * @param text - Plain text potentially containing markdown
   * @returns HTML string with markdown converted
   * @private
   * @see Requirement 1.21
   */
  private markdownToHtml(text: string): string {
    const lines = text.split('\n');
    let html = '';
    let inUl = false;
    let inOl = false;
    let inBlockquote = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const ulMatch = line.match(/^- (.+)$/);
      const olMatch = line.match(/^(\d+)\. (.+)$/);
      const bqMatch = line.match(/^>\s?(.*)$/);

      // ── Blockquote ──
      if (bqMatch) {
        // Close any open list first
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inBlockquote) {
          html += '<blockquote class="cometchat-rich-text__blockquote">';
          inBlockquote = true;
        } else {
          html += '<br>';
        }
        html += this.convertInlineMarkdown(bqMatch[1]);
        continue;
      } else if (inBlockquote) {
        html += '</blockquote>';
        inBlockquote = false;
      }

      // ── Unordered list ──
      if (ulMatch) {
        if (!inUl) {
          if (inOl) {
            html += '</ol>';
            inOl = false;
          }
          html += '<ul>';
          inUl = true;
        }
        html += `<li>${this.convertInlineMarkdown(ulMatch[1])}</li>`;
        continue;
      } else if (inUl) {
        html += '</ul>';
        inUl = false;
      }

      // ── Ordered list ──
      if (olMatch) {
        if (!inOl) {
          if (inUl) {
            html += '</ul>';
            inUl = false;
          }
          html += '<ol>';
          inOl = true;
        }
        html += `<li>${this.convertInlineMarkdown(olMatch[2])}</li>`;
        continue;
      } else if (inOl) {
        html += '</ol>';
        inOl = false;
      }

      if (line.trim()) {
        html += this.convertInlineMarkdown(line);
        if (i < lines.length - 1) html += '<br>';
      } else if (i < lines.length - 1) {
        html += '<br>';
      }
    }

    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';
    if (inBlockquote) html += '</blockquote>';

    return html;
  }

  /**
   * Convert inline markdown patterns to HTML.
   * Processes bold, italic, underline, strikethrough, code, and links.
   * @param text - Text with potential inline markdown
   * @returns HTML string with inline markdown converted
   * @private
   */
  private convertInlineMarkdown(text: string): string {
    // Order matters: process longer/double patterns first
    // Bold: **text**
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    // Bold: *text* (single asterisk = bold per Req 2.23)
    text = text.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<strong>$1</strong>');
    // Underline: __text__
    text = text.replace(/__([^_]+)__/g, '<u>$1</u>');
    // Italic: _text_ (single underscore)
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    // Strikethrough: ~~text~~
    text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    // Inline code: `text`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links: [text](url)
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="cometchat-rich-text__link" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return text;
  }

  /**
   * Handle paste event
   * Preserves formatted text when pasting HTML, strips unsupported formatting
   * When enableFormatting is false, strips all formatting and keeps only plain text
   * @param event - Clipboard event
   * @private
   * @see Requirements 7.1, 7.2, 7.3, 7.5
   */
  private handlePaste(event: ClipboardEvent): void {
    // Get pasted data
    const clipboardData = event.clipboardData;
    if (!clipboardData) {
      return;
    }

    // Check if formatting is enabled
    const enableFormatting = this.config.enableFormatting !== false;

    // Try to get HTML first, fall back to plain text
    let pastedContent = clipboardData.getData('text/html');
    const isHtml = !!pastedContent;

    if (!pastedContent) {
      pastedContent = clipboardData.getData('text/plain');
    }

    if (!pastedContent) {
      return;
    }

    // Prevent default paste
    event.preventDefault();

    // If formatting is disabled, always use plain text only
    if (!enableFormatting) {
      const plainText = clipboardData.getData('text/plain');
      if (plainText) {
        // Insert plain text without any formatting
        const selection = this.selectionManager.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();

          // Insert as text node (no HTML parsing)
          const textNode = document.createTextNode(plainText);
          range.insertNode(textNode);

          // Move cursor to end of inserted text
          range.setStartAfter(textNode);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
        }

        this.pushToHistory();
        this.emitUpdate();
      }
      return;
    }

    // Check if pasted content is a plain URL and there's selected text
    // If so, convert the selected text into a link instead of replacing it
    const plainText = clipboardData.getData('text/plain').trim();
    if (plainText && this.linkManager.validateURL(plainText)) {
      const selection = this.selectionManager.getSelection();
      if (selection && selection.rangeCount > 0) {
        const selectedText = selection.toString();
        if (selectedText.length > 0) {
          // User has text selected and pasted a URL — wrap selected text as a link
          const normalizedUrl = this.linkManager.normalizeURL(plainText);
          const range = selection.getRangeAt(0);

          // Create link element wrapping the selected text
          const link = document.createElement('a');
          link.href = normalizedUrl;
          link.className = 'cometchat-rich-text__link';
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = selectedText;

          // Replace selection with the link
          range.deleteContents();
          range.insertNode(link);

          // Place cursor after the link
          const newRange = document.createRange();
          newRange.setStartAfter(link);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);

          this.pushToHistory();
          this.emitUpdate();
          return;
        }
      }
    }

    // Formatting is enabled - process content
    // When HTML is pasted, prefer the plain text fallback to strip arbitrary HTML formatting.
    // Convert any markdown patterns (links, bold, italic, etc.) in the plain text to HTML,
    // then auto-link bare URLs. This ensures:
    // - Markdown links [text](url) copied from text bubbles become clickable links
    // - Supported markdown rich text formatting still works
    // - Arbitrary HTML/code is stripped to plain text
    let processedContent: string;
    if (isHtml) {
      // Use plain text fallback to strip all HTML formatting
      const plainFallback = clipboardData.getData('text/plain');
      if (plainFallback) {
        // Convert markdown formatting (links, bold, etc.) to HTML, then auto-link bare URLs
        processedContent = this.linkManager.processAutoLink(this.markdownToHtml(plainFallback));
      } else {
        // No plain text available, sanitize the HTML and auto-link
        processedContent = this.linkManager.processAutoLink(
          this.contentEditableManager.sanitizeHTML(pastedContent)
        );
      }
    } else {
      // Plain text pasted - convert markdown formatting to HTML (Req 1.21)
      processedContent = this.markdownToHtml(pastedContent);
    }

    // Insert the processed content
    const selection = this.selectionManager.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();

      // Create a temporary div to parse the content
      const temp = document.createElement('div');
      temp.innerHTML = processedContent;

      // Insert the content
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      range.insertNode(fragment);

      // Move cursor to end of inserted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.pushToHistory();
    this.emitUpdate();
  }

  /**
   * Handle copy event
   * Preserves formatting in clipboard with both HTML and plain text formats
   * @param event - Clipboard event
   * @private
   * @see Requirement 7.1
   */
  private handleCopy(event: ClipboardEvent): void {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      return;
    }

    // Get the selected content
    const selectedHTML = this.selectionManager.getSelectedHTML();

    // Convert HTML to markdown for plain text (preserves link format as [text](url))
    const temp = document.createElement('div');
    temp.innerHTML = selectedHTML;
    const markdownText = this.htmlToMarkdown(temp);

    // Set both HTML and plain text formats in clipboard
    if (event.clipboardData) {
      event.preventDefault();
      event.clipboardData.setData('text/html', selectedHTML);
      event.clipboardData.setData('text/plain', markdownText);
    }
  }

  /**
   * Handle drop event
   * Moves text to new position while preserving formatting
   * @param event - Drag event
   * @private
   * @see Requirement 7.4
   */
  private handleDrop(event: DragEvent): void {
    event.preventDefault();

    const dataTransfer = event.dataTransfer;
    if (!dataTransfer) {
      return;
    }

    // Get dropped content (try HTML first, then plain text)
    let droppedContent = dataTransfer.getData('text/html');
    const isHtml = !!droppedContent;

    if (!droppedContent) {
      droppedContent = dataTransfer.getData('text/plain');
    }

    if (!droppedContent) {
      return;
    }

    // Get the drop position
    const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
    if (!range) {
      return;
    }

    // Insert the content at the drop position
    const selection = this.selectionManager.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);

      // Create a temporary div to parse the content
      const temp = document.createElement('div');
      temp.innerHTML = droppedContent;

      // Insert the content
      const fragment = document.createDocumentFragment();
      while (temp.firstChild) {
        fragment.appendChild(temp.firstChild);
      }
      range.insertNode(fragment);

      // Move cursor to end of inserted content
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.pushToHistory();
    this.emitUpdate();
  }

  /**
   * Handle click event
   * Detects clicks on links and triggers the onLinkClick callback
   * @param event - Mouse event
   * @private
   */
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Find the closest ancestor <a> element (handles nested formatting inside links)
    const linkElement = target.closest('a') as HTMLAnchorElement | null;

    if (linkElement && this.contentEditable.contains(linkElement) && this.config.onLinkClick) {
      // Prevent default link behavior
      event.preventDefault();

      // Clear pending mousedown fallback (we're handling it here)
      this._pendingLinkClick = null;

      // Get link URL and text
      const url = linkElement.href;
      const text = linkElement.textContent || '';

      // Get click coordinates
      const x = event.clientX;
      const y = event.clientY;

      // Trigger callback with coordinates
      this.config.onLinkClick(url, text, x, y);
    }
  }

  /**
   * Handle mousedown event on links.
   * Fires before focus, so it catches the first click on a link
   * even when the editor wasn't previously focused.
   * @param event - Mouse event
   * @private
   */
  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const linkElement = target.closest('a') as HTMLAnchorElement | null;

    if (linkElement && this.contentEditable.contains(linkElement) && this.config.onLinkClick) {
      // Store link info; the click handler will fire the callback.
      // But if the editor wasn't focused, click may not fire reliably,
      // so we schedule the callback on the next tick as a fallback.
      const url = linkElement.href;
      const text = linkElement.textContent || '';
      const x = event.clientX;
      const y = event.clientY;

      // Flag to prevent double-firing (click handler will clear this)
      this._pendingLinkClick = { url, text, x, y };

      // Fallback: if click handler doesn't fire (editor gaining focus), trigger after a short delay
      setTimeout(() => {
        if (this._pendingLinkClick) {
          event.preventDefault();
          this.config.onLinkClick!(
            this._pendingLinkClick.url,
            this._pendingLinkClick.text,
            this._pendingLinkClick.x,
            this._pendingLinkClick.y
          );
          this._pendingLinkClick = null;
        }
      }, 100);
    }
  }

  /**
   * Update the current format state
   * @private
   */
  private updateFormatState(): void {
    // Get current format state from FormatManager
    this.currentFormatState = this.formatManager.getCurrentFormats();

    // Emit the callback
    if (this.config.onSelectionUpdate) {
      this.config.onSelectionUpdate(this.currentFormatState);
    }
  }

  /**
   * Emit update callback
   * @private
   */
  private emitUpdate(): void {
    if (this.config.onUpdate) {
      const html = this.getHTML();
      const text = this.getText();
      this.config.onUpdate(html, text);
    }
  }

  // ==================== Public API ====================

  /**
   * Get the container element
   * @returns The container element
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Get the contenteditable element
   * @returns The contenteditable element
   */
  getContentEditable(): HTMLDivElement {
    return this.contentEditable;
  }

  /**
   * Check if the editor has been destroyed
   * @returns True if destroyed
   */
  isDestroyed(): boolean {
    return this.destroyed;
  }

  /**
   * Get HTML content
   * @returns HTML string
   */
  getHTML(): string {
    return this.contentEditableManager.getHTML();
  }

  /**
   * Get plain text content
   * @returns Plain text string
   */
  getText(): string {
    return this.contentEditableManager.getText();
  }

  /**
   * Set HTML content
   * @param html - HTML string
   */
  setHTML(html: string): void {
    this.contentEditableManager.setHTML(html);
  }

  /**
   * Clear content
   */
  clear(): void {
    this.justAppliedFormatting = false;
    this.contentEditableManager.clear();
  }

  /**
   * Check if editor is empty
   * @returns True if empty
   */
  isEmpty(): boolean {
    return this.contentEditableManager.isEmpty();
  }

  /**
   * Focus the editor
   * @param position - Where to place cursor
   */
  focus(position?: boolean | 'start' | 'end' | 'all' | number): void {
    this.contentEditable.focus();

    if (position === 'start') {
      this.selectionManager.setCursorPosition(0);
    } else if (position === 'end' || position === true) {
      this.selectionManager.setCursorPosition('end');
    } else if (position === 'all') {
      this.selectionManager.selectAll();
    } else if (typeof position === 'number') {
      this.selectionManager.setCursorPosition(position);
    }
  }

  /**
   * Blur the editor
   */
  blur(): void {
    this.contentEditable.blur();
  }

  /**
   * Set cursor position
   * @param position - Position ('start', 'end', or number)
   */
  setCursorPosition(position: 'start' | 'end' | number): void {
    this.selectionManager.setCursorPosition(position);
  }

  /**
   * Select all content
   */
  selectAll(): void {
    this.selectionManager.selectAll();
  }

  /**
   * Get current selection
   * @returns Selection object or null
   */
  getSelection(): Selection | null {
    return this.selectionManager.getSelection();
  }

  /**
   * Get selected text
   * @returns Selected text string
   */
  getSelectedText(): string {
    return this.selectionManager.getSelectedText();
  }

  /**
   * Save current selection state
   * @returns Selection state
   */
  saveSelection(): SelectionState {
    return this.selectionManager.saveSelection();
  }

  /**
   * Restore selection state
   * @param state - Selection state to restore
   */
  restoreSelection(state: SelectionState): void {
    this.selectionManager.restoreSelection(state);
  }

  /**
   * Get the current format state
   * @returns Current format state
   */
  getFormatState(): RichTextFormatState {
    return this.currentFormatState;
  }

  // ==================== Formatting Operations ====================

  /**
   * Apply bold formatting to selected text
   * @see Requirement 2.1
   */
  applyBold(): void {
    this.formatManager.applyBold();
    this.protectMentionsFromFormatting();
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.bold;
    this.announceToScreenReader(isActive ? 'Bold applied' : 'Bold removed');
  }

  /**
   * Apply italic formatting to selected text
   * @see Requirement 2.2
   */
  applyItalic(): void {
    this.formatManager.applyItalic();
    this.protectMentionsFromFormatting();
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.italic;
    this.announceToScreenReader(isActive ? 'Italic applied' : 'Italic removed');
  }

  /**
   * Apply underline formatting to selected text
   * @see Requirement 2.3
   */
  applyUnderline(): void {
    this.formatManager.applyUnderline();
    this.protectMentionsFromFormatting();
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.underline;
    this.announceToScreenReader(isActive ? 'Underline applied' : 'Underline removed');
  }

  /**
   * Apply strikethrough formatting to selected text
   * @see Requirement 2.4
   */
  applyStrikethrough(): void {
    this.formatManager.applyStrikethrough();
    this.protectMentionsFromFormatting();
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.strikethrough;
    this.announceToScreenReader(isActive ? 'Strikethrough applied' : 'Strikethrough removed');
  }

  /**
   * Apply inline code formatting to selected text
   * @see Requirement 2.5
   */
  applyInlineCode(): void {
    this.justAppliedFormatting = true;
    this.formatManager.applyInlineCode();
    // Convert mentions inside <code> elements to plain text (Req 2.14)
    const codeElements = this.contentEditable.querySelectorAll('code');
    codeElements.forEach(code => this.convertMentionsToPlainText(code));
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.code;
    this.announceToScreenReader(isActive ? 'Code formatting applied' : 'Code formatting removed');
  }

  /**
   * Apply code block formatting
   * @see Requirement 2.6
   */
  applyCodeBlock(): void {
    this.justAppliedFormatting = true;
    // Mutual exclusivity: remove active lists before applying code block (Req 2.16)
    if (this.currentFormatState.orderedList || this.currentFormatState.bulletList) {
      this.listManager.exitList();
      this.updateFormatState();
    }
    this.formatManager.applyCodeBlock();
    // Convert mentions inside <pre> elements to plain text (Req 2.14)
    const preElements = this.contentEditable.querySelectorAll('pre');
    preElements.forEach(pre => this.convertMentionsToPlainText(pre));
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.codeBlock;
    this.announceToScreenReader(isActive ? 'Code block applied' : 'Code block removed');
  }

  /**
   * Apply blockquote formatting
   * @see Requirement 2.7
   */
  applyBlockquote(): void {
    this.justAppliedFormatting = true;
    this.formatManager.applyBlockquote();
    this.updateFormatState();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.blockquote;
    this.announceToScreenReader(isActive ? 'Blockquote applied' : 'Blockquote removed');
  }

  /**
   * Apply ordered list formatting
   * @see Requirement 3.1
   */
  applyOrderedList(): void {
    this.justAppliedFormatting = true;
    // Mutual exclusivity: remove code block before applying list (Req 1.17)
    if (this.currentFormatState.codeBlock || this.contentEditable.querySelector('pre')) {
      this.formatManager.applyCodeBlock(); // toggles off the code block
      this.updateFormatState();
    }
    this.listManager.toggleOrderedList();
    this.updateFormatState();
    this.pushToHistory();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.orderedList;
    this.announceToScreenReader(isActive ? 'Ordered list applied' : 'Ordered list removed');
  }

  /**
   * Apply bullet list formatting
   * @see Requirement 3.2
   */
  applyBulletList(): void {
    this.justAppliedFormatting = true;
    // Mutual exclusivity: remove code block before applying list (Req 1.17)
    if (this.currentFormatState.codeBlock || this.contentEditable.querySelector('pre')) {
      this.formatManager.applyCodeBlock(); // toggles off the code block
      this.updateFormatState();
    }
    this.listManager.toggleBulletList();
    this.updateFormatState();
    this.pushToHistory();
    this.emitUpdate();

    // Announce to screen readers
    const isActive = this.currentFormatState.bulletList;
    this.announceToScreenReader(isActive ? 'Bullet list applied' : 'Bullet list removed');
  }

  // ==================== List Queries ====================

  /**
   * Check if the cursor is currently inside a list (ol or ul)
   * @returns True if inside a list
   * @see Requirement 2.17 (Bug 6 fix)
   */
  isInList(): boolean {
    return this.listManager.isInList();
  }

  // ==================== Link Operations ====================

  /**
   * Insert or update a link
   * @param url - URL to link to (null to remove link)
   * @param text - Optional text to display
   * @see Requirements 4.1, 4.2
   */
  setLink(url: string | null, text?: string): void {
    if (url === null) {
      this.linkManager.removeLink();
    } else if (this.linkManager.isLinkActive()) {
      this.linkManager.updateLink(url, text);
    } else {
      this.linkManager.insertLink(url, text);
    }
    this.updateFormatState();
    this.pushToHistory();
    this.emitUpdate();
  }

  /**
   * Check if a link is active at the cursor
   * @returns True if cursor is on a link
   */
  isLinkActive(): boolean {
    return this.linkManager.isLinkActive();
  }

  /**
   * Get the current link URL
   * @returns URL or null
   */
  getCurrentLink(): string | null {
    return this.linkManager.getCurrentLink();
  }

  /**
   * Get the current link text
   * @returns Link text or null
   */
  getCurrentLinkText(): string | null {
    return this.linkManager.getCurrentLinkText();
  }

  // ==================== History Operations ====================

  /**
   * Push current state to history
   * @private
   */
  private pushToHistory(): void {
    const entry: HistoryEntry = {
      html: this.getHTML(),
      cursorPosition: this.selectionManager.getCursorPosition(),
      timestamp: Date.now(),
    };
    this.historyManager.push(entry);
  }

  /**
   * Undo the last operation
   * @returns True if undo was successful
   * @see Requirement 6.1
   */
  undo(): boolean {
    const previous = this.historyManager.undo();
    if (previous) {
      this.setHTML(previous.html);
      this.selectionManager.setCursorPosition(previous.cursorPosition);
      this.updateFormatState();
      this.emitUpdate();
      this.announceToScreenReader('Undo');
      return true;
    }
    return false;
  }

  /**
   * Redo the last undone operation
   * @returns True if redo was successful
   * @see Requirement 6.2
   */
  redo(): boolean {
    const next = this.historyManager.redo();
    if (next) {
      this.setHTML(next.html);
      this.selectionManager.setCursorPosition(next.cursorPosition);
      this.updateFormatState();
      this.emitUpdate();
      this.announceToScreenReader('Redo');
      return true;
    }
    return false;
  }

  /**
   * Check if undo is available
   * @returns True if can undo
   * @see Requirement 6.1
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Check if redo is available
   * @returns True if can redo
   * @see Requirement 6.2
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }

  /**
   * Insert text at the current cursor position
   * @param text - Text to insert
   * @see Requirement 9.1
   */
  insertText(text: string): void {
    // Ensure the editor has focus before inserting.
    // Safari clears the selection when a contenteditable loses focus (e.g., when
    // clicking the emoji picker), so we must focus first and restore the saved range.
    if (!this.contentEditable.contains(document.activeElement)) {
      this.contentEditable.focus();
    }

    let selection = this.selectionManager.getSelection();
    let range: Range;

    if (selection && selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
    } else if (this.lastSavedRange) {
      // Restore the range saved on blur (Safari compatibility)
      range = this.lastSavedRange;
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else {
      // Fallback: place cursor at end of editor content
      range = document.createRange();
      range.selectNodeContents(this.contentEditable);
      range.collapse(false);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    // Delete any selected content first
    range.deleteContents();

    // Create text node and insert
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);

    // Move cursor after inserted text
    range.setStartAfter(textNode);
    range.collapse(true);

    // Re-acquire selection after DOM mutation (required for Safari)
    selection = this.selectionManager.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Clear the saved range since we've used it
    this.lastSavedRange = null;

    this.pushToHistory();
    this.emitUpdate();
  }

  /**
   * Delete a range of content from the editor
   * @param from - Start position (character offset)
   * @param to - End position (character offset)
   * @see Requirement 9.1
   */
  deleteRange(from: number, to: number): void {
    if (from < 0 || to < from) {
      CometChatLogger.warn('RichTextEditor', 'Invalid range for deleteRange:', from, to);
      return;
    }

    // Get text nodes at the specified positions
    const startNode = this.selectionManager['getTextNodeAtOffset'](from);
    const endNode = this.selectionManager['getTextNodeAtOffset'](to);

    if (!startNode || !endNode) {
      CometChatLogger.warn('RichTextEditor', 'Could not find nodes at specified positions');
      return;
    }

    // Create a range and delete the content
    const range = document.createRange();
    range.setStart(startNode.node, startNode.offset);
    range.setEnd(endNode.node, endNode.offset);
    range.deleteContents();

    // Update selection to the start of deleted range
    const selection = this.selectionManager.getSelection();
    if (selection) {
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    this.pushToHistory();
    this.emitUpdate();
  }

  // ==================== Mention Operations ====================

  /**
   * Initialize mentions formatter
   * @param formatter - Optional CometChatMentionsFormatter instance
   * @see Requirement 5.8
   */
  initializeMentionsFormatter(formatter?: CometChatMentionsFormatter): void {
    this.mentionsFormatter = formatter || new CometChatMentionsFormatter();
  }

  /**
   * Set custom text formatters for live pattern highlighting in the editor.
   * These formatters' regex patterns will be applied to text nodes on each input,
   * wrapping matches in styled spans. Mentions and built-in formatters are excluded.
   *
   * @param formatters - Array of custom text formatters
   */
  setCustomFormatters(formatters: CometChatTextFormatter[]): void {
    // Filter out mentions formatter and built-in formatters
    this.customFormatters = formatters.filter(
      f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'url-formatter' && f.id !== 'tiptap-formatter'
    );
  }

  /**
   * Schedule custom formatter application with a debounce.
   * The actual DOM manipulation is deferred so it never runs while the user
   * is actively typing, which prevents the contenteditable from losing focus.
   * @private
   */
  private scheduleCustomFormatters(): void {
    if (this.customFormatters.length === 0) return;

    if (this.customFormatterTimer !== null) {
      clearTimeout(this.customFormatterTimer);
    }

    this.customFormatterTimer = setTimeout(() => {
      this.customFormatterTimer = null;
      // Only apply if the editor still has focus — if the user clicked away
      // we don't need to manipulate the DOM.
      if (this.contentEditable.isConnected) {
        this.applyCustomFormatters();
      }
    }, 150);
  }

  /**
   * Apply custom text formatters to text nodes in the contenteditable.
   * First unwraps any existing custom format spans back to text nodes,
   * then re-scans and wraps new matches. Preserves cursor position.
   * @private
   */
  private applyCustomFormatters(): void {
    if (this.customFormatters.length === 0) return;

    // Quick check: do any formatters have matches in the current text?
    // If not, skip the expensive unwrap/normalize/rewrap cycle entirely.
    const fullText = this.contentEditable.textContent || '';
    const hasAnyMatch = this.customFormatters.some(f => {
      const regex = f.getRegex();
      if (!regex) return false;
      const fresh = new RegExp(regex.source, regex.flags);
      return fresh.test(fullText);
    });

    // Also check if there are existing custom format spans that need cleanup
    const existingSpans = this.contentEditable.querySelectorAll('span[data-custom-format]');

    if (!hasAnyMatch && existingSpans.length === 0) return;

    // Save cursor position using both a DOM marker and character offset.
    // The marker approach is preferred, but inside blockquotes the normalize()
    // call can displace the marker. The character offset serves as a fallback.
    const insideBlockquote = this.isInBlockquote();
    const charOffsetBackup = insideBlockquote ? this.getCharacterOffset() : -1;

    const selection = this.selectionManager.getSelection();
    const marker = document.createElement('span');
    marker.setAttribute('data-cursor-marker', 'true');
    marker.style.display = 'none';

    let hasMarker = false;
    if (selection && selection.rangeCount > 0) {
      try {
        const range = selection.getRangeAt(0).cloneRange();
        range.collapse(true);
        range.insertNode(marker);
        hasMarker = true;
      } catch {
        // If insertion fails, we'll fall back to placing cursor at end
      }
    }

    // Step 1: Unwrap all existing custom format spans back to text nodes
    existingSpans.forEach(span => {
      const parent = span.parentNode;
      if (!parent) return;
      const textNode = document.createTextNode(span.textContent || '');
      parent.replaceChild(textNode, span);
    });

    // Normalize to merge adjacent text nodes
    this.contentEditable.normalize();

    // Step 2: Collect all text nodes (skip nodes inside mentions and the cursor marker)
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      this.contentEditable,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node: Node) => {
          const parent = node.parentElement;
          if (parent && (
            parent.hasAttribute('data-uid') ||
            parent.hasAttribute('data-mention-type') ||
            parent.hasAttribute('data-cursor-marker')
          )) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node: Node | null;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    // Step 3: For each text node, find matches and wrap them
    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      if (!text) continue;

      const matches: { start: number; end: number; matchText: string; formatter: CometChatTextFormatter }[] = [];

      for (const formatter of this.customFormatters) {
        const regex = formatter.getRegex();
        if (!regex) continue;

        const freshRegex = new RegExp(regex.source, regex.flags);
        let match: RegExpExecArray | null;
        while ((match = freshRegex.exec(text)) !== null) {
          matches.push({
            start: match.index,
            end: match.index + match[0].length,
            matchText: match[0],
            formatter,
          });
        }
      }

      if (matches.length === 0) continue;

      matches.sort((a, b) => a.start - b.start);

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;

      for (const m of matches) {
        if (m.start > lastIndex) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex, m.start)));
        }

        const formattedHtml = m.formatter.format(m.matchText);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = formattedHtml;
        const formattedSpan = tempDiv.querySelector('span');

        const span = document.createElement('span');
        span.setAttribute('data-custom-format', m.formatter.id);
        if (formattedSpan) {
          if (formattedSpan.className) span.className = formattedSpan.className;
          if (formattedSpan.getAttribute('style')) span.setAttribute('style', formattedSpan.getAttribute('style')!);
          for (const attr of Array.from(formattedSpan.attributes)) {
            if (attr.name.startsWith('data-') && attr.name !== 'data-custom-format') {
              span.setAttribute(attr.name, attr.value);
            }
          }
        }
        span.textContent = m.matchText;

        fragment.appendChild(span);
        lastIndex = m.end;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      const parent = textNode.parentNode;
      if (parent) {
        parent.replaceChild(fragment, textNode);
      }
    }

    // Restore cursor position using the marker node
    if (hasMarker && marker.parentNode) {
      const range = document.createRange();
      range.setStartAfter(marker);
      range.collapse(true);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      marker.parentNode.removeChild(marker);

      // Inside blockquotes, verify the marker-based restore worked correctly.
      // If the cursor ended up at a different position, fall back to character offset.
      if (insideBlockquote && charOffsetBackup >= 0) {
        const restoredOffset = this.getCharacterOffset();
        if (restoredOffset !== charOffsetBackup) {
          this.restoreCharacterOffset(charOffsetBackup);
        }
      }
    } else {
      // Marker was lost during DOM manipulation — clean up if still attached
      if (marker.parentNode) {
        marker.parentNode.removeChild(marker);
      }
      // Fall back to character offset for blockquotes
      if (insideBlockquote && charOffsetBackup >= 0) {
        this.restoreCharacterOffset(charOffsetBackup);
      }
    }
  }

  /**
   * Get the character offset of the cursor from the start of the contenteditable.
   * @private
   */
  private getCharacterOffset(): number {
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(this.contentEditable);
    preRange.setEnd(range.startContainer, range.startOffset);
    return preRange.toString().length;
  }

  /**
   * Restore cursor to a character offset from the start of the contenteditable.
   * @private
   */
  private restoreCharacterOffset(targetOffset: number): void {
    const selection = this.selectionManager.getSelection();
    if (!selection) return;

    let currentOffset = 0;
    const walker = document.createTreeWalker(
      this.contentEditable,
      NodeFilter.SHOW_TEXT
    );

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const nodeLength = (textNode.textContent || '').length;
      if (currentOffset + nodeLength >= targetOffset) {
        const range = document.createRange();
        range.setStart(textNode, targetOffset - currentOffset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      currentOffset += nodeLength;
    }

    // If we couldn't find the exact position, place cursor at end
    const range = document.createRange();
    range.selectNodeContents(this.contentEditable);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Insert a mention at the current cursor position
   * @param id - The unique ID of the mentioned user
   * @param label - The display name of the mentioned user (without @)
   * @param charsToDelete - Number of characters to delete before inserting (e.g., "@jo" = 3)
   * @param isSelf - Whether the mention is for the logged-in user
   * @see Requirements 5.2, 5.4, 5.5
   */
  insertMention(id: string, label: string, charsToDelete: number, isSelf = false): void {
    // Validate ID - reject empty or whitespace-only IDs
    if (!id || id.trim() === '') {
      CometChatLogger.warn('RichTextEditor', 'Cannot insert mention with empty ID');
      return;
    }

    // Validate label - reject empty labels
    if (!label || label.trim() === '') {
      CometChatLogger.warn('RichTextEditor', 'Cannot insert mention with empty label');
      return;
    }

    // Check mention limit (max 10 unique mentions)
    const currentMentions = this.getUniqueMentionUids();
    if (currentMentions.size >= 10 && !currentMentions.has(id)) {
      CometChatLogger.warn('RichTextEditor', 'Cannot add more than 10 unique mentions');
      return;
    }

    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);

    // Delete characters before cursor (e.g., "@jo")
    if (charsToDelete > 0) {
      range.setStart(range.startContainer, Math.max(0, range.startOffset - charsToDelete));
      range.deleteContents();
    }

    // Determine mention type and CSS classes
    // Check if this is a channel mention (@all)
    const isChannelMention = id === 'all';
    let mentionType: string;
    let cssClass: string;

    if (isChannelMention) {
      mentionType = 'channel';
      cssClass = 'cometchat-mentions cometchat-mentions-you';
    } else if (isSelf) {
      mentionType = 'self';
      cssClass = 'cometchat-mentions cometchat-mentions-you';
    } else {
      mentionType = 'other';
      cssClass = 'cometchat-mentions cometchat-mentions-other';
    }

    // Create mention span element (atomic node)
    const mentionSpan = document.createElement('span');
    mentionSpan.className = cssClass;
    mentionSpan.setAttribute('data-uid', id);
    mentionSpan.setAttribute('data-mention-type', mentionType);
    mentionSpan.setAttribute('contenteditable', 'false'); // Make atomic
    mentionSpan.textContent = `@${label}`;

    // Insert mention span
    range.insertNode(mentionSpan);

    // Add a space after the mention
    const spaceNode = document.createTextNode('\u00A0'); // Non-breaking space
    range.setStartAfter(mentionSpan);
    range.insertNode(spaceNode);

    // Move cursor after the space
    range.setStartAfter(spaceNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);

    this.pushToHistory();
    this.emitUpdate();

    // Announce to screen readers
    this.announceToScreenReader(`Mentioned ${label}`);
  }

  /**
   * Get unique mention UIDs from the editor content
   * @returns Set of unique mention UIDs
   * @see Requirement 5.6
   */
  getUniqueMentionUids(): Set<string> {
    const uids = new Set<string>();
    const mentionSpans = this.contentEditable.querySelectorAll('span[data-uid]');

    mentionSpans.forEach(span => {
      const uid = span.getAttribute('data-uid');
      if (uid && uid !== 'all') {
        uids.add(uid);
      }
    });

    return uids;
  }

  /**
   * Convert editor content to CometChat mention format with markdown formatting
   * Converts mentions to <@uid:{uid}> format and HTML formatting to markdown syntax
   * @returns Text with mentions formatted as <@uid:{uid}> and markdown formatting
   * @see Requirements 5.2, 9.5
   */
  getTextWithMentionFormat(): string {
    const html = this.getHTML();
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Find all mention spans and replace with SDK format
    const mentionSpans = temp.querySelectorAll('span[data-uid]');
    mentionSpans.forEach(span => {
      const uid = span.getAttribute('data-uid');
      const mentionType = span.getAttribute('data-mention-type');

      if (uid === 'all' && mentionType === 'channel') {
        // Channel mention format: <@all:label>
        const label = span.textContent?.replace('@', '') || 'all';
        const textNode = document.createTextNode(`<@all:${label}>`);
        span.parentNode?.replaceChild(textNode, span);
      } else if (uid && uid.trim() !== '') {
        // User mention format: <@uid:{uid}>
        // Only serialize if UID is non-empty to prevent malformed mentions
        const textNode = document.createTextNode(`<@uid:${uid}>`);
        span.parentNode?.replaceChild(textNode, span);
      } else {
        // Empty or invalid UID - replace with just the text content (without SDK format)
        // This prevents sending malformed <@uid:> tags
        const textContent = span.textContent || '';
        const textNode = document.createTextNode(textContent);
        span.parentNode?.replaceChild(textNode, span);
      }
    });

    // Convert HTML formatting to markdown
    return this.htmlToMarkdown(temp);
  }

  /**
   * Convert HTML content to markdown format
   * Handles bold, italic, underline, strikethrough, code, blockquote, code blocks, and lists
   * @param element - HTML element to convert
   * @returns Markdown formatted text
   * @private
   */
  private htmlToMarkdown(element: HTMLElement): string {
    let markdown = '';

    const processNode = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent || '';
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const el = node as HTMLElement;
      const tagName = el.tagName.toLowerCase();
      let content = '';

      // Process child nodes
      for (const child of Array.from(el.childNodes)) {
        content += processNode(child);
      }

      // Apply markdown formatting based on tag
      switch (tagName) {
        case 'strong':
        case 'b':
          return `**${content}**`;

        case 'em':
        case 'i':
          return `*${content}*`;

        case 'u':
          return `__${content}__`;

        case 's':
        case 'strike':
        case 'del':
          return `~~${content}~~`;

        case 'code':
          // Check if parent is <pre> (code block)
          if (el.parentElement?.tagName.toLowerCase() === 'pre') {
            return content;
          }
          return `\`${content}\``;

        case 'pre':
          // Code block
          return `\`\`\`\n${content}\n\`\`\``;

        case 'blockquote':
          // Split by lines and add > prefix to each non-empty line
          const lines = content.split('\n').filter(line => line.trim());
          return lines.map(line => `> ${line}`).join('\n') + '\n';

        case 'ul':
          // Bullet list - process each li
          return content;

        case 'ol':
          // Ordered list - process each li
          return content;

        case 'li': {
          // Strip empty list items (Req 1.12)
          if (!content.replace(/\n/g, '').trim()) {
            return '';
          }
          // Calculate nesting depth by counting ancestor ol/ul elements
          let depth = 0;
          let listAncestor: Element | null = el.parentElement;
          while (listAncestor) {
            const ancestorTag = listAncestor.tagName.toLowerCase();
            if (ancestorTag === 'ol' || ancestorTag === 'ul') {
              depth++;
            }
            listAncestor = listAncestor.parentElement;
          }
          // depth >= 1 always (the immediate parent list counts as 1)
          // Indentation: 4 spaces per nesting level beyond the first
          const indent = '    '.repeat(Math.max(0, depth - 1));

          // Separate the li's own text content from nested list content
          // Process children: text/inline nodes go into textPart, nested ol/ul go into nestedPart
          let textPart = '';
          let nestedPart = '';
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType === Node.ELEMENT_NODE) {
              const childTag = (child as HTMLElement).tagName.toLowerCase();
              if (childTag === 'ol' || childTag === 'ul') {
                nestedPart += processNode(child);
                continue;
              }
            }
            textPart += processNode(child);
          }
          textPart = textPart.replace(/\n+$/, '').trim();

          // Check if parent is ul or ol
          const parent = el.parentElement;
          if (parent) {
            const parentTag = parent.tagName.toLowerCase();
            let line = '';
            if (parentTag === 'ul') {
              line = `${indent}- ${textPart}\n`;
            } else if (parentTag === 'ol') {
              // Count only non-empty siblings before this one for correct numbering
              const siblings = Array.from(parent.children);
              let index = 0;
              for (const sibling of siblings) {
                if (sibling === el) break;
                if (sibling.textContent?.trim()) {
                  index++;
                }
              }
              line = `${indent}${index + 1}. ${textPart}\n`;
            }
            return line + nestedPart;
          }
          return content;
        }

        case 'br':
          return '\n';

        case 'p':
        case 'div':
          // Add newline after paragraphs/divs if not empty
          return content ? `${content}\n` : '';

        case 'a':
          // Link format: [text](url)
          const href = el.getAttribute('href') || '';
          return `[${content}](${href})`;

        default:
          return content;
      }
    };

    // Process all child nodes
    for (const child of Array.from(element.childNodes)) {
      markdown += processNode(child);
    }

    // Clean up extra newlines and trailing whitespace
    markdown = markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+/, '')
      .replace(/\n+$/, '');

    return markdown;
  }

  /**
   * Set content with mentions from CometChat format
   * Parses <@uid:{uid}> format and creates mention spans
   * @param text - Text with mentions in CometChat format
   * @param mentionedUsers - Array of mentioned users for name lookup
   * @see Requirements 5.2, 15.5
   */
  setContentWithMentions(
    text: string,
    mentionedUsers: (CometChat.User | CometChat.GroupMember)[]
  ): void {
    if (!this.mentionsFormatter) {
      this.initializeMentionsFormatter();
    }

    // Convert markdown links [text](url) to <a> tags BEFORE escaping
    // Use placeholders to protect them from HTML escaping
    const linkPlaceholders: string[] = [];
    const processedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, linkUrl) => {
      const idx = linkPlaceholders.length;
      const linkHtml = `<a href="${linkUrl}" class="cometchat-rich-text__link" target="_blank" rel="noopener noreferrer">${linkText}</a>`;
      linkPlaceholders.push(linkHtml);
      return `\x00MDLINK${idx}\x00`;
    });

    // Escape user-supplied HTML to prevent XSS (e.g. <img onerror=...>)
    // Preserve SDK mention patterns (<@uid:...>, <@all:...>) so formatSdkMentions can process them
    const escapedText = this.escapeUserHtmlForEditor(processedText);

    // Convert inline markdown formatting to HTML for the editor BEFORE restoring link placeholders.
    // This converts **bold** → <strong>, _italic_ → <em>, etc.
    // Running before link restoration ensures link content (which may contain underscores)
    // is not incorrectly converted by the italic/underline regex.
    const formattedText = this.convertInlineMarkdown(escapedText);

    // Restore markdown link placeholders
    const finalText = formattedText.replace(/\x00MDLINK(\d+)\x00/g, (_, idx) => {
      return linkPlaceholders[parseInt(idx, 10)];
    });

    // Use the formatter to convert SDK mentions to HTML
    const formattedHtml = this.mentionsFormatter!.formatSdkMentions(finalText, mentionedUsers);
    this.setHTML(formattedHtml);
  }

  /**
   * Escape HTML entities in user text while preserving SDK mention patterns.
   * This prevents XSS when the text is later set as innerHTML.
   *
   * @param text - Raw text that may contain user-supplied HTML
   * @returns Text with HTML entities escaped, SDK mentions intact
   */
  private escapeUserHtmlForEditor(text: string): string {
    if (!text) {
      return text;
    }

    // Preserve SDK mention patterns by replacing with placeholders
    const sdkMentionRegex = /<@(uid|all):[^>]*>/g;
    const placeholders: string[] = [];
    let escaped = text.replace(sdkMentionRegex, match => {
      const idx = placeholders.length;
      placeholders.push(match);
      return `\x00SDKMENTION${idx}\x00`;
    });

    // Escape HTML entities
    escaped = escaped
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    // Restore SDK mention placeholders
    escaped = escaped.replace(/\x00SDKMENTION(\d+)\x00/g, (_, idx) => {
      return placeholders[parseInt(idx, 10)];
    });

    return escaped;
  }

  /**
   * Destroy the editor and clean up resources
   */
  destroy(): void {
    if (this.destroyed) return;

    // Cancel any pending custom formatter timer
    if (this.customFormatterTimer !== null) {
      clearTimeout(this.customFormatterTimer);
      this.customFormatterTimer = null;
    }

    // Remove all event listeners
    for (const { target, type, listener } of this.eventListeners) {
      target.removeEventListener(type, listener);
    }
    this.eventListeners = [];

    // Clear content
    this.contentEditable.innerHTML = '';

    // Clear saved selection range
    this.lastSavedRange = null;

    // Remove from DOM if we created the container
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.destroyed = true;
  }
}
