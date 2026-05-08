import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';

export function announceNewMessageImpl(self: any, senderName: string, preview: string): void {
  const message = CometChatLocalize.getLocalizedString('accessibility_new_message')
    .replace('{sender}', senderName)
    .replace('{preview}', preview);
  self.liveAnnouncer.announce(message, 'polite');
}

export function announceMessageSentImpl(self: any): void {
  self.liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('accessibility_message_sent'),
    'polite'
  );
}

export function announceMessageFailedImpl(self: any): void {
  self.liveAnnouncer.announceError(
    CometChatLocalize.getLocalizedString('accessibility_message_failed')
  );
}

export function announceMessageDeletedImpl(self: any): void {
  self.liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('accessibility_message_deleted'),
    'polite'
  );
}

export function announceMessageEditedImpl(self: any): void {
  self.liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('accessibility_message_edited'),
    'polite'
  );
}

export function announceTypingImpl(self: any, name: string): void {
  if (self.typingAnnouncementTimeout) { clearTimeout(self.typingAnnouncementTimeout); }
  self.typingAnnouncementTimeout = setTimeout(() => {
    const message = CometChatLocalize.getLocalizedString('accessibility_user_typing').replace(
      '{name}',
      name
    );
    self.liveAnnouncer.announce(message, 'polite');
    self.typingAnnouncementTimeout = null;
  }, 1000);
}

export function announceLoadingMoreImpl(self: any): void {
  self.liveAnnouncer.announce(
    CometChatLocalize.getLocalizedString('accessibility_loading_older_messages'),
    'polite'
  );
}
