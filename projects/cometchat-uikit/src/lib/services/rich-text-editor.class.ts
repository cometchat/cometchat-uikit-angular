

import {RichTextEditorConfig, RichTextFormatState, SelectionState, HistoryEntry,} from './rich-text-editor.interfaces';
import {ContentEditableManager} from './content-editable-manager.class';
import {SelectionManager} from './selection-manager.class';
import {FormatManager} from './format-manager.class';
import {HistoryManager} from './history-manager.class';
import {ListManager} from './list-manager.class';
import {LinkManager} from './link-manager.class';
import {CometChatMentionsFormatter} from '../formatters/cometchat-mentions-formatter';
import {CometChatTextFormatter} from '../formatters/cometchat-text-formatter';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatLogger} from '../utils/CometChatLogger';
import {markdownToHtml as markdownToHtmlUtil, htmlToMarkdown as htmlToMarkdownUtil} from './rich-text-editor.markdown-utils';
import {isMentionNode as isMentionNodeUtil, findMentionAncestor as findMentionAncestorUtil, moveCursorToMentionBoundary as moveCursorToMentionBoundaryUtil, getMentionsInRange as getMentionsInRangeUtil, doesRangeIntersectNode as doesRangeIntersectNodeUtil, extendSelectionToIncludeMentions as extendSelectionToIncludeMentionsUtil} from './rich-text-editor.mention-utils';
import {handleKeyDownImpl} from './rich-text-editor.keydown-handler';
import {handlePasteImpl, handleCopyImpl, handleDropImpl} from './rich-text-editor.paste-handler';
import {scheduleCustomFormattersImpl, applyCustomFormattersImpl} from './rich-text-editor.custom-formatters';
import {applyBoldImpl, applyItalicImpl, applyUnderlineImpl, applyStrikethroughImpl, applyInlineCodeImpl, applyCodeBlockImpl, applyBlockquoteImpl, applyOrderedListImpl, applyBulletListImpl, setLinkImpl, isLinkActiveImpl, getCurrentLinkImpl, getCurrentLinkTextImpl, isInListImpl} from './rich-text-editor.format-ops';
import {setCursorPositionImpl, selectAllImpl, getSelectionImpl, getSelectedTextImpl, saveSelectionImpl, restoreSelectionImpl, getFormatStateImpl, insertTextImpl, deleteRangeImpl, getCharacterOffsetImpl, restoreCharacterOffsetImpl} from './rich-text-editor.selection-ops';
import {insertMentionImpl, getUniqueMentionUidsImpl, getTextWithMentionFormatImpl, setContentWithMentionsImpl, escapeUserHtmlForEditorImpl} from './rich-text-editor.mention-ops-class';
import {handleInputImpl, handleBeforeInputImpl, cleanupZeroWidthSpacesImpl, scrollCursorIntoViewImpl} from './rich-text-editor.input-handler';
import {detectAndConvertMarkdownImpl, applyMarkdownFormatImpl, detectAndConvertAutoListImpl} from './rich-text-editor.markdown-detector';
import {isInBlockquoteImpl, shouldExitBlockquoteImpl, exitBlockquoteImpl, isInCodeBlockImpl, shouldExitCodeBlockImpl, exitCodeBlockImpl, shouldExitListImpl, getCurrentListItemImpl} from './rich-text-editor.block-exit';
import {handleMentionDeletionImpl, protectMentionsFromFormattingImpl, convertMentionsToPlainTextImpl} from './rich-text-editor.mention-deletion';

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

  private justAppliedFormatting = false; private customFormatterTimer: ReturnType<typeof setTimeout> | null = null;

  private contentEditableManager: ContentEditableManager; private selectionManager: SelectionManager; private formatManager: FormatManager;
  private historyManager: HistoryManager; private listManager: ListManager; private linkManager: LinkManager; private mentionsFormatter: CometChatMentionsFormatter | null = null;
  private customFormatters: CometChatTextFormatter[] = []; private ariaLiveRegion: HTMLDivElement | null = null;
  private _pendingLinkClick: { url: string; text: string; x: number; y: number } | null = null; private lastSavedRange: Range | null = null;

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

  constructor(config: RichTextEditorConfig, element?: HTMLElement) {
    this.config = config;
    if (element) { this.element = element; } else {
      this.element = document.createElement('div');
      this.element.className = 'cometchat-rich-text-editor';
    }
    this.contentEditable = document.createElement('div');
    this.contentEditable.className = 'cometchat-rich-text-editor__content';
    this.contentEditable.contentEditable = 'true';
    this.contentEditable.setAttribute('role', 'textbox');
    this.contentEditable.setAttribute('aria-multiline', 'true');
    this.contentEditable.setAttribute('aria-label', config.ariaLabel || 'Rich text editor');
    this.contentEditable.setAttribute('data-placeholder', config.placeholder || '');
    this.contentEditableManager = new ContentEditableManager(this.contentEditable);
    this.contentEditableManager.initialize({
      editable: config.editable,
    });
    this.selectionManager = new SelectionManager(this.contentEditable); this.formatManager = new FormatManager(this.contentEditable);
    this.historyManager = new HistoryManager(); this.listManager = new ListManager(this.contentEditable, this.selectionManager); this.linkManager = new LinkManager(this.contentEditable, this.selectionManager);
    this.element.appendChild(this.contentEditable); this.createAriaLiveRegion();
    if (config.content) { this.setHTML(config.content); }
    this.attachEventListeners();
    if (config.autofocus) {
      setTimeout(() => {
        this.focus(config.autofocus);
      }, 0);
    }
  }
  private createAriaLiveRegion(): void {
    this.ariaLiveRegion = document.createElement('div');
    this.ariaLiveRegion.className = 'cometchat-rich-text-editor__aria-live';
    this.ariaLiveRegion.setAttribute('role', 'status');
    this.ariaLiveRegion.setAttribute('aria-live', 'polite');
    this.ariaLiveRegion.setAttribute('aria-atomic', 'true');
    this.ariaLiveRegion.style.position = 'absolute';
    this.ariaLiveRegion.style.left = '-10000px';
    this.ariaLiveRegion.style.width = '1px';
    this.ariaLiveRegion.style.height = '1px';
    this.ariaLiveRegion.style.overflow = 'hidden';
    this.element.appendChild(this.ariaLiveRegion);
  }
  private announceToScreenReader(message: string): void {
    if (!this.ariaLiveRegion) return;
    this.ariaLiveRegion.textContent = '';
    setTimeout(() => {
      if (this.ariaLiveRegion) { this.ariaLiveRegion.textContent = message; }
    }, 100);
  }
  private attachEventListeners(): void {
    const inputListener = () => this.handleInput();
    this.addEventListener(this.contentEditable, 'input', inputListener);
    const beforeInputListener = (e: Event) => this.handleBeforeInput(e as InputEvent);
    this.addEventListener(this.contentEditable, 'beforeinput', beforeInputListener);
    const keydownListener = (e: Event) => this.handleKeyDown(e as KeyboardEvent);
    this.addEventListener(this.contentEditable, 'keydown', keydownListener);
    const selectionListener = () => this.handleSelectionChange();
    this.addEventListener(document, 'selectionchange', selectionListener);
    const focusListener = () => this.handleFocus();
    this.addEventListener(this.contentEditable, 'focus', focusListener);
    const blurListener = () => this.handleBlur();
    this.addEventListener(this.contentEditable, 'blur', blurListener);
    const pasteListener = (e: Event) => this.handlePaste(e as ClipboardEvent);
    this.addEventListener(this.contentEditable, 'paste', pasteListener);
    const copyListener = (e: Event) => this.handleCopy(e as ClipboardEvent);
    this.addEventListener(this.contentEditable, 'copy', copyListener);
    const dropListener = (e: Event) => this.handleDrop(e as DragEvent);
    this.addEventListener(this.contentEditable, 'drop', dropListener);
    const clickListener = (e: Event) => this.handleClick(e as MouseEvent);
    this.addEventListener(this.contentEditable, 'click', clickListener);
    const mousedownListener = (e: Event) => this.handleMouseDown(e as MouseEvent);
    this.addEventListener(this.contentEditable, 'mousedown', mousedownListener);
  }
  private addEventListener(target: EventTarget, type: string, listener: EventListener): void {
    target.addEventListener(type, listener);
    this.eventListeners.push({ target, type, listener });
  }
  private handleBeforeInput(event: InputEvent): void { handleBeforeInputImpl(this as any, event); }
  private handleInput(): void { handleInputImpl(this as any); }
  private cleanupZeroWidthSpaces(): void { cleanupZeroWidthSpacesImpl(this as any); }
  private scrollCursorIntoView(): void { scrollCursorIntoViewImpl(this as any); }
  private detectAndConvertMarkdown(): boolean { return detectAndConvertMarkdownImpl(this as any); }
  private applyMarkdownFormat(textNode: Node, range: Range, match: RegExpMatchArray, format: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code', markerLength: number): void { applyMarkdownFormatImpl(this as any, textNode, range, match, format, markerLength); }
  private detectAndConvertAutoList(): boolean { return detectAndConvertAutoListImpl(this as any); }
  private handleKeyDown(event: KeyboardEvent): void { handleKeyDownImpl(this as any, event); }
  private isInBlockquote(): boolean { return isInBlockquoteImpl(this as any); }
  private shouldExitBlockquote(): boolean { return shouldExitBlockquoteImpl(this as any); }
  private exitBlockquote(): void { exitBlockquoteImpl(this as any); }
  private isInCodeBlock(): boolean { return isInCodeBlockImpl(this as any); }
  private shouldExitCodeBlock(): boolean { return shouldExitCodeBlockImpl(this as any); }
  private exitCodeBlock(): void { exitCodeBlockImpl(this as any); }
  private shouldExitList(): boolean { return shouldExitListImpl(this as any); }
  private getCurrentListItem(): HTMLElement | null { return getCurrentListItemImpl(this as any); }
  private handleMentionDeletion(event: KeyboardEvent): boolean { return handleMentionDeletionImpl(this as any, event); }
  private protectMentionsFromFormatting(): void { protectMentionsFromFormattingImpl(this as any); }
  private convertMentionsToPlainText(container: Element): void { convertMentionsToPlainTextImpl(this as any, container); }
  private isMentionNode(node: Node): boolean { return isMentionNodeUtil(node); }
  private findMentionAncestor(node: Node): HTMLElement | null { return findMentionAncestorUtil(node); }
  private moveCursorToMentionBoundary(mentionNode: HTMLElement, range: Range): void { moveCursorToMentionBoundaryUtil(mentionNode, range); }
  private getMentionsInRange(range: Range): HTMLElement[] { return getMentionsInRangeUtil(range, this.contentEditable); }
  private doesRangeIntersectNode(range: Range, node: Node): boolean { return doesRangeIntersectNodeUtil(range, node); }
  private extendSelectionToIncludeMentions(range: Range, mentions: HTMLElement[]): void { extendSelectionToIncludeMentionsUtil(range, mentions); }
  private handleSelectionChange(): void {
    if (document.activeElement !== this.contentEditable) { return; }
    const selection = this.selectionManager.getSelection();
    if (!selection || selection.rangeCount === 0) { this.updateFormatState(); return; }
    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      const node = range.startContainer;
      const mentionNode = this.findMentionAncestor(node);
      if (mentionNode) { this.moveCursorToMentionBoundary(mentionNode, range); }
    } else {
      const mentionsInRange = this.getMentionsInRange(range);
      if (mentionsInRange.length > 0) { this.extendSelectionToIncludeMentions(range, mentionsInRange); }
    }
    this.updateFormatState();
  }
  private handleFocus(): void {
    this.element.classList.add('cometchat-rich-text-editor--focused');
    if (this.config.onFocus) { this.config.onFocus(); }
  }
  private handleBlur(): void {
    const selection = this.selectionManager.getSelection();
    if (selection && selection.rangeCount > 0) { this.lastSavedRange = selection.getRangeAt(0).cloneRange(); }
    this.element.classList.remove('cometchat-rich-text-editor--focused');
    if (this.config.onBlur) { this.config.onBlur(); }
  }
  private markdownToHtml(text: string): string { return markdownToHtmlUtil(text); }
  private convertInlineMarkdown(text: string): string {
    text = text.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/(?<!\*)\*([^\*]+)\*(?!\*)/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<u>$1</u>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>');
    text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    text = text.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="cometchat-rich-text__link" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return text;
  }
  private handlePaste(event: ClipboardEvent): void { handlePasteImpl(this as any, event); }
  private handleCopy(event: ClipboardEvent): void { handleCopyImpl(this as any, event); }
  private handleDrop(event: DragEvent): void { handleDropImpl(this as any, event); }
  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const linkElement = target.closest('a') as HTMLAnchorElement | null;
    if (linkElement && this.contentEditable.contains(linkElement) && this.config.onLinkClick) {
      event.preventDefault();
      this._pendingLinkClick = null;
      const url = linkElement.href;
      const text = linkElement.textContent || '';
      const x = event.clientX;
      const y = event.clientY;
      this.config.onLinkClick(url, text, x, y);
    }
  }
  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const linkElement = target.closest('a') as HTMLAnchorElement | null;
    if (linkElement && this.contentEditable.contains(linkElement) && this.config.onLinkClick) {
      const url = linkElement.href;
      const text = linkElement.textContent || '';
      const x = event.clientX;
      const y = event.clientY;
      this._pendingLinkClick = { url, text, x, y };
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
  private updateFormatState(): void {
    this.currentFormatState = this.formatManager.getCurrentFormats();
    if (this.config.onSelectionUpdate) { this.config.onSelectionUpdate(this.currentFormatState); }
  }
  private emitUpdate(): void {
    if (this.config.onUpdate) { const html = this.getHTML(); const text = this.getText(); this.config.onUpdate(html, text); }
  }
  getElement(): HTMLElement { return this.element; }
  getContentEditable(): HTMLDivElement { return this.contentEditable; }
  isDestroyed(): boolean { return this.destroyed; }
  getHTML(): string { return this.contentEditableManager.getHTML(); }
  getText(): string { return this.contentEditableManager.getText(); }
  setHTML(html: string): void { this.contentEditableManager.setHTML(html); }
  clear(): void { this.justAppliedFormatting = false; this.contentEditableManager.clear(); }
  isEmpty(): boolean { return this.contentEditableManager.isEmpty(); }
  focus(position?: boolean | 'start' | 'end' | 'all' | number): void {
    this.contentEditable.focus();
    if (position === 'start') { this.selectionManager.setCursorPosition(0); } else if (position === 'end' || position === true) { this.selectionManager.setCursorPosition('end'); } else if (position === 'all') { this.selectionManager.selectAll(); } else if (typeof position === 'number') { this.selectionManager.setCursorPosition(position); }
  }
  blur(): void { this.contentEditable.blur(); }
  setCursorPosition(position: 'start' | 'end' | number): void { setCursorPositionImpl(this as any, position); }
  selectAll(): void { selectAllImpl(this as any); }
  getSelection(): Selection | null { return getSelectionImpl(this as any); }
  getSelectedText(): string { return getSelectedTextImpl(this as any); }
  saveSelection(): any { return saveSelectionImpl(this as any); }
  restoreSelection(state: any): void { restoreSelectionImpl(this as any, state); }
  getFormatState(): any { return getFormatStateImpl(this as any); }
  applyBold(): void { applyBoldImpl(this as any); }
  applyItalic(): void { applyItalicImpl(this as any); }
  applyUnderline(): void { applyUnderlineImpl(this as any); }
  applyStrikethrough(): void { applyStrikethroughImpl(this as any); }
  applyInlineCode(): void { applyInlineCodeImpl(this as any); }
  applyCodeBlock(): void { applyCodeBlockImpl(this as any); }
  applyBlockquote(): void { applyBlockquoteImpl(this as any); }
  applyOrderedList(): void { applyOrderedListImpl(this as any); }
  applyBulletList(): void { applyBulletListImpl(this as any); }
  isInList(): boolean { return isInListImpl(this as any); }
  setLink(url: string | null, text?: string): void { setLinkImpl(this as any, url, text); }
  isLinkActive(): boolean { return isLinkActiveImpl(this as any); }
  getCurrentLink(): string | null { return getCurrentLinkImpl(this as any); }
  getCurrentLinkText(): string | null { return getCurrentLinkTextImpl(this as any); }
  private pushToHistory(): void {
    const entry: HistoryEntry = {
      html: this.getHTML(),
      cursorPosition: this.selectionManager.getCursorPosition(),
      timestamp: Date.now(),
    };
    this.historyManager.push(entry);
  }
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
  canUndo(): boolean { return this.historyManager.canUndo(); }
  canRedo(): boolean { return this.historyManager.canRedo(); }
  insertText(text: string): void { insertTextImpl(this as any, text); }
  deleteRange(from: number, to: number): void { deleteRangeImpl(this as any, from, to); }
  private getCharacterOffset(): number { return getCharacterOffsetImpl(this as any); }
  private restoreCharacterOffset(targetOffset: number): void { restoreCharacterOffsetImpl(this as any, targetOffset); }
  insertMention(id: string, label: string, charsToDelete: number, isSelf = false): void { insertMentionImpl(this as any, id, label, charsToDelete, isSelf); }
  getUniqueMentionUids(): Set<string> { return getUniqueMentionUidsImpl(this as any); }
  getTextWithMentionFormat(): string { return getTextWithMentionFormatImpl(this as any); }
  setContentWithMentions(text: string, mentionedUsers: (CometChat.User | CometChat.GroupMember)[]): void { setContentWithMentionsImpl(this as any, text, mentionedUsers); }
  private escapeUserHtmlForEditor(text: string): string { return escapeUserHtmlForEditorImpl(this as any, text); }
  initializeMentionsFormatter(formatter?: CometChatMentionsFormatter): void { this.mentionsFormatter = formatter || new CometChatMentionsFormatter(); }
  setCustomFormatters(formatters: CometChatTextFormatter[]): void {
    this.customFormatters = formatters.filter(
      f => !(f instanceof CometChatMentionsFormatter) && f.id !== 'url-formatter' && f.id !== 'tiptap-formatter'
    );
  }
  private scheduleCustomFormatters(): void {
    if (this.customFormatters.length === 0) return;
    if (this.customFormatterTimer !== null) { clearTimeout(this.customFormatterTimer); }
    this.customFormatterTimer = setTimeout(() => {
      this.customFormatterTimer = null;
      if (this.contentEditable.isConnected) { this.applyCustomFormatters(); }
    }, 150);
  }
  private applyCustomFormatters(): void { applyCustomFormattersImpl(this as any); }
  private htmlToMarkdown(element: HTMLElement): string { return htmlToMarkdownUtil(element); }
  destroy(): void {
    if (this.destroyed) return;
    if (this.customFormatterTimer !== null) { clearTimeout(this.customFormatterTimer); this.customFormatterTimer = null; }
    for (const { target, type, listener } of this.eventListeners) {
      target.removeEventListener(type, listener);
    }
    this.eventListeners = [];
    this.contentEditable.innerHTML = '';
    this.lastSavedRange = null;
    if (this.element.parentNode) { this.element.parentNode.removeChild(this.element); }
    this.destroyed = true;
  }
}
