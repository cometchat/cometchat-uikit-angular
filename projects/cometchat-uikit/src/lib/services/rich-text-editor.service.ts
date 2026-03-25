/**
 * Rich Text Editor Service
 *
 * Angular service for managing rich text editor instances using native contenteditable.
 * Provides the same API for backward compatibility.
 *
 * @module services/rich-text-editor
 * @see Requirements 12.1, 12.2, 12.3, 12.4, 12.5
 */

import { Injectable, signal } from '@angular/core';
import { RichTextEditor } from './rich-text-editor.class';
import {
  RichTextEditorConfig,
  RichTextFormatState,
  RichTextMetadata,
} from './rich-text-editor.interfaces';
import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * RichTextEditorService manages rich text editor instances.
 * It provides methods for creating, configuring, and controlling editors.
 * This service provides rich text editing capabilities.
 *
 * @example
 * ```typescript
 * // In a component
 * private editorService = inject(RichTextEditorService);
 *
 * ngOnInit() {
 *   const editor = this.editorService.createEditor({
 *     placeholder: 'Type your message...',
 *     onUpdate: (html, text) => this.handleContentChange(html, text)
 *   });
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class RichTextEditorService {
  // ==================== State Signals ====================

  /**
   * Signal tracking the current format state of the active editor
   */
  private formatStateSignal = signal<RichTextFormatState>(this.getDefaultFormatState());

  /**
   * Public read-only signal for format state
   */
  readonly formatState = this.formatStateSignal.asReadonly();

  // ==================== Editor Creation ====================

  /**
   * Create a new rich text editor instance with the specified configuration.
   *
   * The editor is configured with:
   * - Proper paste handling for formatted text (HTML and plain text)
   * - Content preservation on focus loss (content is maintained in editor state)
   * - Full unicode and special character support
   *
   * @param config - Configuration options for the editor
   * @param element - Optional DOM element to mount the editor to
   * @returns The created RichTextEditor instance
   * @see Requirements 12.1, 12.2, 12.3, 12.4
   */
  createEditor(config: RichTextEditorConfig = {}, element?: HTMLElement): RichTextEditor {
    // Wrap callbacks to update format state signal
    const wrappedConfig: RichTextEditorConfig = {
      ...config,
      onSelectionUpdate: (formatState: RichTextFormatState) => {
        this.formatStateSignal.set(formatState);
        if (config.onSelectionUpdate) {
          config.onSelectionUpdate(formatState);
        }
      },
    };

    const editor = new RichTextEditor(wrappedConfig, element);
    return editor;
  }

  /**
   * Destroy an editor instance and clean up resources
   * @param editor - The RichTextEditor instance to destroy
   */
  destroyEditor(editor: RichTextEditor): void {
    if (editor && !editor.isDestroyed()) {
      editor.destroy();
    }
  }

  /**
   * Reset the format state signal to default
   */
  resetFormatState(): void {
    this.formatStateSignal.set(this.getDefaultFormatState());
  }

  // ==================== Format State ====================

  /**
   * Get the default format state (all formatting off)
   * @returns Default RichTextFormatState
   * @private
   */
  private getDefaultFormatState(): RichTextFormatState {
    return {
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
  }

  /**
   * Get the current format state for an editor
   * @param editor - The RichTextEditor instance
   * @returns Current RichTextFormatState
   */
  getFormatState(editor: RichTextEditor): RichTextFormatState {
    if (editor.isDestroyed()) {
      return this.getDefaultFormatState();
    }
    return editor.getFormatState();
  }

  // ==================== Formatting Commands ====================

  /**
   * Toggle bold formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.1
   */
  toggleBold(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyBold();
  }

  /**
   * Toggle italic formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.2
   */
  toggleItalic(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyItalic();
  }

  /**
   * Toggle underline formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.3
   */
  toggleUnderline(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyUnderline();
  }

  /**
   * Toggle strikethrough formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.4
   */
  toggleStrikethrough(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyStrikethrough();
  }

  /**
   * Toggle inline code formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.5
   */
  toggleCode(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyInlineCode();
  }

  /**
   * Toggle code block formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.6
   */
  toggleCodeBlock(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyCodeBlock();
  }

  /**
   * Toggle blockquote formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 2.7
   */
  toggleBlockquote(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyBlockquote();
  }

  /**
   * Toggle ordered list formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 3.1
   */
  toggleOrderedList(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyOrderedList();
  }

  /**
   * Toggle bullet list formatting
   * @param editor - The RichTextEditor instance
   * @see Requirement 3.2
   */
  toggleBulletList(editor: RichTextEditor): void {
    if (editor.isDestroyed()) return;
    editor.applyBulletList();
  }

  /**
   * Set or remove a link
   * @param editor - The RichTextEditor instance
   * @param url - The URL to link to, or null to remove link
   * @param text - Optional text to display
   * @see Requirements 4.1, 4.2
   */
  setLink(editor: RichTextEditor, url: string | null, text?: string): void {
    if (editor.isDestroyed()) return;
    editor.setLink(url, text);
  }

  // ==================== History Commands (Undo/Redo) ====================

  /**
   * Undo the last action in the editor
   * @param editor - The RichTextEditor instance
   * @returns True if undo was successful, false if nothing to undo
   * @see Requirement 6.1
   */
  undo(editor: RichTextEditor): boolean {
    if (editor.isDestroyed()) return false;
    return editor.undo();
  }

  /**
   * Redo the last undone action in the editor
   * @param editor - The RichTextEditor instance
   * @returns True if redo was successful, false if nothing to redo
   * @see Requirement 6.2
   */
  redo(editor: RichTextEditor): boolean {
    if (editor.isDestroyed()) return false;
    return editor.redo();
  }

  /**
   * Check if undo is available
   * @param editor - The RichTextEditor instance
   * @returns True if there are actions to undo
   * @see Requirement 6.1
   */
  canUndo(editor: RichTextEditor): boolean {
    if (editor.isDestroyed()) return false;
    return editor.canUndo();
  }

  /**
   * Check if redo is available
   * @param editor - The RichTextEditor instance
   * @returns True if there are actions to redo
   * @see Requirement 6.2
   */
  canRedo(editor: RichTextEditor): boolean {
    if (editor.isDestroyed()) return false;
    return editor.canRedo();
  }

  // ==================== Content Methods ====================

  /**
   * Get the HTML content from an editor with sanitization
   * @param editor - The RichTextEditor instance
   * @returns Sanitized HTML string
   * @see Requirements 9.1, 9.4
   */
  getHTML(editor: RichTextEditor): string {
    if (editor.isDestroyed()) return '';
    return editor.getHTML();
  }

  /**
   * Get the plain text content from an editor without formatting
   * Removes all HTML tags while preserving text structure
   * @param editor - The RichTextEditor instance
   * @returns Plain text string
   * @see Requirement 9.2
   */
  getText(editor: RichTextEditor): string {
    if (editor.isDestroyed()) return '';
    return editor.getText();
  }

  /**
   * Set the content of an editor
   * @param editor - The RichTextEditor instance
   * @param content - HTML content to set
   * @param emitUpdate - Whether to emit update event (default: false)
   */
  setContent(editor: RichTextEditor, content: string, emitUpdate = false): void {
    editor.setHTML(content);
    // Note: emitUpdate parameter is for API compatibility but not used yet
  }

  /**
   * Set the content of an editor with mentions properly formatted.
   * Converts mention placeholders in format <@uid:name> to mention nodes.
   *
   * @param editor - The RichTextEditor instance
   * @param text - The text content with mention placeholders
   * @param mentionedUsers - Array of mentioned users from the message
   * @param emitUpdate - Whether to emit update event (default: false)
   * @see Requirements 5.2, 15.5
   */
  setContentWithMentions(
    editor: RichTextEditor,
    text: string,
    mentionedUsers: (CometChat.User | CometChat.GroupMember)[],
    emitUpdate = false
  ): void {
    if (editor.isDestroyed()) return;
    editor.setContentWithMentions(text, mentionedUsers);
    // Note: emitUpdate parameter is for API compatibility but not used yet
  }

  /**
   * Clear the editor content
   * @param editor - The RichTextEditor instance
   */
  clearContent(editor: RichTextEditor): void {
    editor.clear();
  }

  /**
   * Insert text at the current cursor position
   * @param editor - The RichTextEditor instance
   * @param text - Text to insert
   * @see Requirement 9.1
   */
  insertText(editor: RichTextEditor, text: string): void {
    if (editor.isDestroyed()) return;
    editor.insertText(text);
  }

  /**
   * Delete a range of content from the editor
   * @param editor - The RichTextEditor instance
   * @param from - Start position (character offset)
   * @param to - End position (character offset)
   * @see Requirement 9.1
   */
  deleteRange(editor: RichTextEditor, from: number, to: number): void {
    if (editor.isDestroyed()) return;
    editor.deleteRange(from, to);
  }

  /**
   * Check if the editor content is empty
   * @param editor - The RichTextEditor instance
   * @returns True if editor is empty
   */
  isEmpty(editor: RichTextEditor): boolean {
    return editor.isEmpty();
  }

  /**
   * Check if the content has any rich text formatting
   * Note: This method is no longer used for determining richText metadata
   * as we've moved to a Markdown-based approach. Kept for potential future use.
   * @param editor - The RichTextEditor instance
   * @returns True if content has formatting beyond plain text
   */
  hasFormatting(editor: RichTextEditor): boolean {
    const html = editor.getHTML();
    const text = editor.getText();

    // If HTML is just plain text or empty, no formatting
    const plainHtml = `<p>${text}</p>`;
    return html !== plainHtml && html !== '' && html !== '<p></p>';
  }

  /**
   * Check if the cursor is currently inside a list (ol or ul)
   * @param editor - The RichTextEditor instance
   * @returns True if inside a list
   * @see Requirement 2.17 (Bug 6 fix)
   */
  isInList(editor: RichTextEditor): boolean {
    if (editor.isDestroyed()) return false;
    return editor.isInList();
  }

  // ==================== Mention Methods ====================

  /**
   * Insert a mention at the current cursor position
   * Creates an atomic (non-editable) mention node with contenteditable="false"
   * @param editor - The RichTextEditor instance
   * @param id - The unique ID of the mentioned user
   * @param label - The display name of the mentioned user (without @)
   * @param charsToDelete - Number of characters to delete before inserting
   * @param isSelf - Whether the mention is for the logged-in user
   * @see Requirements 5.2, 5.4, 5.5, 8.1, 8.2
   */
  insertMention(
    editor: RichTextEditor,
    id: string,
    label: string,
    charsToDelete: number,
    isSelf = false
  ): void {
    if (editor.isDestroyed()) return;
    editor.insertMention(id, label, charsToDelete, isSelf);
  }

  /**
   * Convert editor content to CometChat mention format
   * Converts mentions to <@uid:{uid}> format for SDK compatibility
   * @param editor - The RichTextEditor instance
   * @returns Text with mentions formatted as <@uid:{uid}>
   * @see Requirements 5.2, 9.5
   */
  getTextWithMentionFormat(editor: RichTextEditor): string {
    if (editor.isDestroyed()) return '';
    return editor.getTextWithMentionFormat();
  }

  /**
   * Get the set of unique mention UIDs from the editor content
   * @param editor - The RichTextEditor instance
   * @returns Set of unique mention UIDs
   * @see Requirement 5.6
   */
  getUniqueMentionUids(editor: RichTextEditor): Set<string> {
    if (editor.isDestroyed()) return new Set<string>();
    return editor.getUniqueMentionUids();
  }

  // ==================== Metadata Methods ====================

  /**
   * Get rich text metadata for a message
   * Includes HTML content, plain text, hasFormatting flag, and mention data
   * @param editor - The RichTextEditor instance
   * @returns RichTextMetadata object
   * @see Requirements 9.3, 9.5
   */
  getRichTextMetadata(editor: RichTextEditor): RichTextMetadata {
    if (editor.isDestroyed()) {
      return {
        html: '',
        plainText: '',
        hasFormatting: false,
      };
    }

    return {
      html: this.getHTML(editor),
      plainText: this.getText(editor),
      hasFormatting: this.hasFormatting(editor),
    };
  }

  // ==================== Focus Methods ====================

  /**
   * Focus the editor
   * @param editor - The RichTextEditor instance
   * @param position - Where to place cursor ('start', 'end', 'all', or position number)
   */
  focus(editor: RichTextEditor, position: 'start' | 'end' | 'all' | number = 'end'): void {
    editor.focus(position);
  }

  /**
   * Blur the editor (remove focus)
   * @param editor - The RichTextEditor instance
   */
  blur(editor: RichTextEditor): void {
    editor.blur();
  }
}
