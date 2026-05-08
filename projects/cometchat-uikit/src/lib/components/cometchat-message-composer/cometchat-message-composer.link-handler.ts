/**
 * Link dialog/popover handler functions for CometChatMessageComposer.
 * Extracted to reduce component file size.
 */

import { CometChatLocalize } from '../../resources/CometChatLocalize/cometchat-localize';
import { type LinkData } from '../base-elements/cometchat-link-dialog/cometchat-link-dialog.component';

export interface LinkHandlerContext {
  customRichTextEditor: any;
  richTextEditorService: any;
  savedLinkSelection: any;
  isLinkDialogOpen: any;
  isLinkPopoverOpen: any;
  linkPopoverUrl: any;
  linkPopoverText: any;
  linkPopoverX: any;
  linkPopoverY: any;
  linkDialogMode: any;
  linkDialogInitialText: any;
  linkDialogInitialUrl: any;
  linkDialogX: any;
  enableRichText: boolean;
  hostElementRef: any;
  updateFormatStateFromEditor: () => void;
  announceFormatStateChange: (name: string, enabled: boolean) => void;
  richTextFormatState: () => any;
}

export function handleLinkDialogSaveImpl(ctx: LinkHandlerContext, linkData: LinkData): void {
  if (ctx.customRichTextEditor) {
    if (ctx.savedLinkSelection) {
      ctx.customRichTextEditor.restoreSelection(ctx.savedLinkSelection);
      ctx.savedLinkSelection = null;
    }
    ctx.richTextEditorService.setLink(ctx.customRichTextEditor, linkData.url, linkData.text);
    ctx.updateFormatStateFromEditor();
    const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
    const isActive = ctx.richTextFormatState().link;
    ctx.announceFormatStateChange(formatName, isActive);
    ctx.customRichTextEditor.focus();
  }
  ctx.isLinkDialogOpen.set(false);
}

export function handleLinkDialogRemoveImpl(ctx: LinkHandlerContext): void {
  if (ctx.customRichTextEditor) {
    if (ctx.savedLinkSelection) {
      ctx.customRichTextEditor.restoreSelection(ctx.savedLinkSelection);
      ctx.savedLinkSelection = null;
    }
    ctx.richTextEditorService.setLink(ctx.customRichTextEditor, null);
    ctx.updateFormatStateFromEditor();
    const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
    ctx.announceFormatStateChange(formatName, false);
    ctx.customRichTextEditor.focus();
  }
  ctx.isLinkDialogOpen.set(false);
}

export function handleLinkDialogCancelImpl(ctx: LinkHandlerContext): void {
  ctx.isLinkDialogOpen.set(false);
  ctx.savedLinkSelection = null;
  if (ctx.customRichTextEditor) { ctx.customRichTextEditor.focus(); }
}

export function handleLinkClickImpl(ctx: LinkHandlerContext, url: string, text: string, x: number, y: number): void {
  if (ctx.enableRichText) {
    if (ctx.customRichTextEditor) { ctx.savedLinkSelection = ctx.customRichTextEditor.saveSelection(); }
    ctx.linkPopoverUrl.set(url);
    ctx.linkPopoverText.set(text);
    ctx.linkPopoverX.set(x);
    ctx.linkPopoverY.set(y);
    ctx.isLinkPopoverOpen.set(true);
  }
}

export function handleLinkPopoverEditImpl(ctx: LinkHandlerContext, data: { url: string; text: string }): void {
  const x = ctx.linkPopoverX();
  ctx.isLinkPopoverOpen.set(false);
  const left = computeLinkDialogLeftImpl(ctx, x);
  ctx.linkDialogMode.set('edit');
  ctx.linkDialogInitialText.set(data.text);
  ctx.linkDialogInitialUrl.set(data.url);
  ctx.linkDialogX.set(left);
  ctx.isLinkDialogOpen.set(true);
}

export function handleLinkPopoverRemoveImpl(ctx: LinkHandlerContext): void {
  ctx.isLinkPopoverOpen.set(false);
  if (ctx.customRichTextEditor) {
    if (ctx.savedLinkSelection) {
      ctx.customRichTextEditor.focus();
      ctx.customRichTextEditor.restoreSelection(ctx.savedLinkSelection);
      ctx.savedLinkSelection = null;
    }
    ctx.richTextEditorService.setLink(ctx.customRichTextEditor, null);
    ctx.updateFormatStateFromEditor();
    const formatName = CometChatLocalize.getLocalizedString('message_composer_link');
    ctx.announceFormatStateChange(formatName, false);
    ctx.customRichTextEditor.focus();
  }
}

export function handleLinkPopoverCloseImpl(ctx: LinkHandlerContext): void {
  ctx.isLinkPopoverOpen.set(false);
  ctx.savedLinkSelection = null;
  if (ctx.customRichTextEditor) { ctx.customRichTextEditor.focus(); }
}

export function computeLinkDialogLeftImpl(ctx: LinkHandlerContext, viewportX: number): number {
  const hostEl = ctx.hostElementRef.nativeElement as HTMLElement;
  const composerDiv = hostEl.querySelector('.cometchat-message-composer') as HTMLElement;
  const parent = composerDiv || hostEl;
  const parentRect = parent.getBoundingClientRect();
  let left = viewportX - parentRect.left;
  const dialogWidth = 400;
  if (left + dialogWidth > parentRect.width) { left = parentRect.width - dialogWidth; }
  if (left < 0) { left = 0; }
  return left;
}
