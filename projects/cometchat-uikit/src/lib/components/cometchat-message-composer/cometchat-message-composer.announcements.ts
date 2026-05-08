import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';

export function announcePoliteImpl(ctx: any, message: string): void {
  ctx.liveRegionPoliteText.set('');
  setTimeout(() => {
    ctx.liveRegionPoliteText.set(message);
  }, 50);
}

export function announceAssertiveImpl(ctx: any, message: string): void {
  ctx.liveRegionAssertiveText.set('');
  setTimeout(() => {
    ctx.liveRegionAssertiveText.set(message);
  }, 50);
}

export function announceReplyModeActivatedImpl(ctx: any): void {
  announcePoliteImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_reply_mode_activated'));
}

export function announceEditModeActivatedImpl(ctx: any): void {
  announcePoliteImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_edit_mode_activated'));
}

export function announceRecordingStartedImpl(ctx: any): void {
  announceAssertiveImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_recording_started'));
}

export function announceRecordingStoppedImpl(ctx: any): void {
  announceAssertiveImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_recording_stopped'));
}

export function announceMessageSentImpl(ctx: any): void {
  announcePoliteImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_message_sent'));
}

export function announceAttachmentAddedImpl(ctx: any, fileName: string): void {
  announcePoliteImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_attachment_added') + ': ' + fileName);
}

export function announceAttachmentRemovedImpl(ctx: any, fileName: string): void {
  announcePoliteImpl(ctx, CometChatLocalize.getLocalizedString('message_composer_attachment_removed') + ': ' + fileName);
}

export function announceFocusedMentionImpl(ctx: any, name: string, position: number, total: number): void {
  const template = CometChatLocalize.getLocalizedString('message_composer_mention_focused');
  const message = template
    .replace('{name}', name)
    .replace('{position}', position.toString())
    .replace('{total}', total.toString());
  announcePoliteImpl(ctx, message);
}

export function announceMentionSuggestionsCountImpl(ctx: any, count: number): void {
  const template = CometChatLocalize.getLocalizedString('accessibility_mentions_suggestions');
  const message = template.replace('{count}', count.toString());
  ctx.liveAnnouncerService.announce(message, 'polite');
}

export function announceMentionInsertedImpl(ctx: any, name: string): void {
  const template = CometChatLocalize.getLocalizedString('accessibility_mentioned_user');
  const message = template.replace('{name}', name);
  ctx.liveAnnouncerService.announce(message, 'polite');
}

export function announceFormatStateChangeImpl(ctx: any, formatName: string, enabled: boolean): void {
  const templateKey = enabled ? 'message_composer_format_enabled' : 'message_composer_format_disabled';
  const template = CometChatLocalize.getLocalizedString(templateKey);
  const message = template.replace('{format}', formatName);
  announcePoliteImpl(ctx, message);
}
