/**
 * RichTextEditorService manages rich text editor instances using native contenteditable.
 * @see Requirements 12.1-12.5
 */

import { Injectable, signal } from '@angular/core';
import { RichTextEditor } from './rich-text-editor.class';
import {
  RichTextEditorConfig,
  RichTextFormatState,
  RichTextMetadata,
} from './rich-text-editor.interfaces';
import { CometChat } from '@cometchat/chat-sdk-javascript';

@Injectable({
  providedIn: 'root',
})
export class RichTextEditorService {
  private formatStateSignal = signal<RichTextFormatState>(this.getDefaultFormatState());
  readonly formatState = this.formatStateSignal.asReadonly();

  /** Create a new rich text editor instance. @see Requirements 12.1-12.4 */
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

  /** Destroy an editor instance and clean up resources. */
  destroyEditor(editor: RichTextEditor): void {
    if (editor && !editor.isDestroyed()) editor.destroy();
  }

  /** Reset the format state signal to default. */
  resetFormatState(): void {
    this.formatStateSignal.set(this.getDefaultFormatState());
  }

  private getDefaultFormatState(): RichTextFormatState {
    return { bold: false, italic: false, underline: false, strikethrough: false, code: false, blockquote: false, codeBlock: false, orderedList: false, bulletList: false, link: false };
  }

  /** Get the current format state for an editor. */
  getFormatState(editor: RichTextEditor): RichTextFormatState {
    if (editor.isDestroyed()) return this.getDefaultFormatState();
    return editor.getFormatState();
  }

  /** Toggle bold formatting. @see Requirement 2.1 */
  toggleBold(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyBold(); }

  /** Toggle italic formatting. @see Requirement 2.2 */
  toggleItalic(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyItalic(); }

  /** Toggle underline formatting. @see Requirement 2.3 */
  toggleUnderline(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyUnderline(); }

  /** Toggle strikethrough formatting. @see Requirement 2.4 */
  toggleStrikethrough(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyStrikethrough(); }

  /** Toggle inline code formatting. @see Requirement 2.5 */
  toggleCode(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyInlineCode(); }

  /** Toggle code block formatting. @see Requirement 2.6 */
  toggleCodeBlock(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyCodeBlock(); }

  /** Toggle blockquote formatting. @see Requirement 2.7 */
  toggleBlockquote(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyBlockquote(); }

  /** Toggle ordered list formatting. @see Requirement 3.1 */
  toggleOrderedList(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyOrderedList(); }

  /** Toggle bullet list formatting. @see Requirement 3.2 */
  toggleBulletList(editor: RichTextEditor): void { if (editor.isDestroyed()) return; editor.applyBulletList(); }

  /** Set or remove a link. @see Requirements 4.1, 4.2 */
  setLink(editor: RichTextEditor, url: string | null, text?: string): void {
    if (editor.isDestroyed()) return;
    editor.setLink(url, text);
  }

  /** Undo the last action. @see Requirement 6.1 */
  undo(editor: RichTextEditor): boolean { return editor.isDestroyed() ? false : editor.undo(); }

  /** Redo the last undone action. @see Requirement 6.2 */
  redo(editor: RichTextEditor): boolean { return editor.isDestroyed() ? false : editor.redo(); }

  /** Check if undo is available. @see Requirement 6.1 */
  canUndo(editor: RichTextEditor): boolean { return editor.isDestroyed() ? false : editor.canUndo(); }

  /** Check if redo is available. @see Requirement 6.2 */
  canRedo(editor: RichTextEditor): boolean { return editor.isDestroyed() ? false : editor.canRedo(); }

  /** Get the HTML content from an editor. @see Requirements 9.1, 9.4 */
  getHTML(editor: RichTextEditor): string { return editor.isDestroyed() ? '' : editor.getHTML(); }

  /** Get the plain text content from an editor. @see Requirement 9.2 */
  getText(editor: RichTextEditor): string { return editor.isDestroyed() ? '' : editor.getText(); }

  /** Set the content of an editor. */
  setContent(editor: RichTextEditor, content: string, _emitUpdate = false): void { editor.setHTML(content); }

  /** Set the content with mentions properly formatted. @see Requirements 5.2, 15.5 */
  setContentWithMentions(editor: RichTextEditor, text: string, mentionedUsers: (CometChat.User | CometChat.GroupMember)[], _emitUpdate = false): void {
    if (editor.isDestroyed()) return;
    editor.setContentWithMentions(text, mentionedUsers);
  }

  /** Clear the editor content. */
  clearContent(editor: RichTextEditor): void { editor.clear(); }

  /** Insert text at the current cursor position. @see Requirement 9.1 */
  insertText(editor: RichTextEditor, text: string): void { if (editor.isDestroyed()) return; editor.insertText(text); }

  /** Delete a range of content from the editor. @see Requirement 9.1 */
  deleteRange(editor: RichTextEditor, from: number, to: number): void { if (editor.isDestroyed()) return; editor.deleteRange(from, to); }

  /** Check if the editor content is empty. */
  isEmpty(editor: RichTextEditor): boolean { return editor.isEmpty(); }

  /** Check if the content has any rich text formatting. */
  hasFormatting(editor: RichTextEditor): boolean {
    const html = editor.getHTML();
    const text = editor.getText();
    const plainHtml = `<p>${text}</p>`;
    return html !== plainHtml && html !== '' && html !== '<p></p>';
  }

  /** Check if the cursor is currently inside a list. @see Requirement 2.17 */
  isInList(editor: RichTextEditor): boolean { return editor.isDestroyed() ? false : editor.isInList(); }

  /** Insert a mention at the current cursor position. @see Requirements 5.2, 5.4, 5.5, 8.1, 8.2 */
  insertMention(editor: RichTextEditor, id: string, label: string, charsToDelete: number, isSelf = false): void {
    if (editor.isDestroyed()) return;
    editor.insertMention(id, label, charsToDelete, isSelf);
  }

  /** Convert editor content to CometChat mention format. @see Requirements 5.2, 9.5 */
  getTextWithMentionFormat(editor: RichTextEditor): string { return editor.isDestroyed() ? '' : editor.getTextWithMentionFormat(); }

  /** Get the set of unique mention UIDs. @see Requirement 5.6 */
  getUniqueMentionUids(editor: RichTextEditor): Set<string> { return editor.isDestroyed() ? new Set<string>() : editor.getUniqueMentionUids(); }

  /** Get rich text metadata for a message. @see Requirements 9.3, 9.5 */
  getRichTextMetadata(editor: RichTextEditor): RichTextMetadata {
    if (editor.isDestroyed()) return { html: '', plainText: '', hasFormatting: false };
    return { html: this.getHTML(editor), plainText: this.getText(editor), hasFormatting: this.hasFormatting(editor) };
  }

  /** Focus the editor. */
  focus(editor: RichTextEditor, position: 'start' | 'end' | 'all' | number = 'end'): void { editor.focus(position); }

  /** Blur the editor (remove focus). */
  blur(editor: RichTextEditor): void { editor.blur(); }
}
