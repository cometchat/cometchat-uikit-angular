import {effect, SimpleChanges} from '@angular/core';
import {CometChatLocalize} from '../../resources/CometChatLocalize/cometchat-localize';
import {CometChatMessageComposerAction} from '../../modals';

export function setupConstructorEffectsImpl(self: any): void {
  effect(() => {
    const st = self.mentionSearchText();
    const io = self.isMentionSuggestionsOpen();
    if (self.skipNextMentionCheck) return;
    if (io && !self.disableMentions) {
      self.initializeMentionsRequestBuilder(st);
      self.messageComposerService.searchMentions(st, self.currentGroup() ?? undefined, self.mentionsUsersRequestBuilder, self.mentionsGroupMembersRequestBuilder, self.disableMentionAll, self.mentionAllLabel);
    }
  }, { allowSignalWrites: true });
  effect(() => {
    const index = self.focusedMentionIndex();
    if (self.isMentionSuggestionsOpen()) self.scrollMentionIntoView(index);
  }, { allowSignalWrites: true });
  effect(() => {
    const su = self.chatStateService.activeUser();
    const sg = self.chatStateService.activeGroup();
    const up = self.propsProvided();
    if (!up) {
      const pu = self.currentUser();
      const pg = self.currentGroup();
      const uc = su?.getUid() !== pu?.getUid();
      const gc = sg?.getGuid() !== pg?.getGuid();
      self.currentUser.set(su);
      self.currentGroup.set(sg);
      if (uc || gc) self.resetComposerState();
      self.cdr.markForCheck();
    }
  }, { allowSignalWrites: true });
  effect(() => {
    const lm = self.currentLayoutMode();
    if (lm) {
      const key = lm === 'multiline' ? 'message_composer_layout_multiline' : 'message_composer_layout_single_line';
      const ann = CometChatLocalize.getLocalizedString(key);
      setTimeout(() => { self.liveRegionPoliteText.set(ann); setTimeout(() => self.liveRegionPoliteText.set(''), 100); }, 0);
    }
  }, { allowSignalWrites: true });
  effect(() => {
    const s = self.mentionSuggestions();
    const o = self.isMentionSuggestionsOpen();
    const l = self.isFetchingMentions();
    if (o && !l && s.length > 0) self.announceMentionSuggestionsCount(s.length);
  }, { allowSignalWrites: true });
}

export function ngOnInitImpl(self: any): void {
  if (!self.mentionAllLabel) self.mentionAllLabel = CometChatLocalize.getLocalizedString('message_composer_mention_all');
  self.setupErrorCallback();
  self.initializeMobileViewDetection();
  self.initializeComposerText();
  self.initializeTextFormatters();
  if (self.user) { self.propsProvided.set(true); self.currentUser.set(self.user); self.currentGroup.set(null); }
  else if (self.group) { self.propsProvided.set(true); self.currentUser.set(null); self.currentGroup.set(self.group); }
  else { self.propsProvided.set(false); }
  self.subscribeToActivePopoverEvent();
  self.subscribeToReplyToMessageEvent();
  self.subscribeToMessageEditedEvent();
  self.subscribeToMessageDeletedEvent();
  self.subscribeToComposeMessageEvent();
  self.subscribeToSdkMessageDeletedEvent();
  self.subscribeToShowModalEvent();
  self.subscribeToHideModalEvent();
  self.subscribeToShowMentionsCountWarningEvent();
}

export function ngOnChangesImpl(self: any, changes: SimpleChanges): void {
  if (changes['text'] && !changes['text'].firstChange) {
    const nt = changes['text'].currentValue || '';
    self.composerText.set(nt);
    if (self.customRichTextEditor && self.enableRichText) self.richTextEditorService.setContent(self.customRichTextEditor, nt);
    self.textChange.emit(nt);
  }
  if (changes['messageToEdit']) { self.handleEditModeChange(changes['messageToEdit'].currentValue); }
  if (changes['messageToReply']) { self.handleReplyModeChange(changes['messageToReply'].currentValue); }
  if (changes['parentMessageId'] && !changes['parentMessageId'].firstChange && changes['parentMessageId'].currentValue && !changes['parentMessageId'].previousValue) {
    self.announceReplyModeActivated();
  }
  if (changes['initialComposerText'] && !changes['initialComposerText'].firstChange && changes['initialComposerText'].currentValue) {
    const nt = changes['initialComposerText'].currentValue;
    self.composerText.set(nt);
    if (self.customRichTextEditor && self.enableRichText) self.richTextEditorService.setContent(self.customRichTextEditor, nt);
    self.textChange.emit(nt);
  }
  if (changes['enableRichText'] && !changes['enableRichText'].firstChange) { self.cdr.markForCheck(); }
  if (changes['user'] || changes['group']) {
    const uc = changes['user'] && !changes['user'].firstChange && changes['user'].currentValue?.getUid() !== changes['user'].previousValue?.getUid();
    const gc = changes['group'] && !changes['group'].firstChange && changes['group'].currentValue?.getGuid() !== changes['group'].previousValue?.getGuid();
    if (changes['user']) { self.currentUser.set(changes['user'].currentValue || null); if (changes['user'].currentValue) self.currentGroup.set(null); }
    if (changes['group']) { self.currentGroup.set(changes['group'].currentValue || null); if (changes['group'].currentValue) self.currentUser.set(null); }
    if (uc || gc) self.resetComposerState();
  }
  if (changes['user'] || changes['group'] || changes['parentMessageId']) self.configureTextFormatters();
}

export function buildAttachmentMenuOptionsImpl(self: any): CometChatMessageComposerAction[] {
  const o: CometChatMessageComposerAction[] = [];
  if (!self.hideImageAttachmentOption) o.push(new CometChatMessageComposerAction({ id: 'image', title: CometChatLocalize.getLocalizedString('message_composer_attach_image'), iconURL: 'assets/photo.svg', onClick: () => self.handleAttachmentOptionClick('image') }));
  if (!self.hideVideoAttachmentOption) o.push(new CometChatMessageComposerAction({ id: 'video', title: CometChatLocalize.getLocalizedString('message_composer_attach_video'), iconURL: 'assets/videocam.svg', onClick: () => self.handleAttachmentOptionClick('video') }));
  if (!self.hideAudioAttachmentOption) o.push(new CometChatMessageComposerAction({ id: 'audio', title: CometChatLocalize.getLocalizedString('message_composer_attach_audio'), iconURL: 'assets/play_circle.svg', onClick: () => self.handleAttachmentOptionClick('audio') }));
  if (!self.hideFileAttachmentOption) o.push(new CometChatMessageComposerAction({ id: 'file', title: CometChatLocalize.getLocalizedString('message_composer_attach_file'), iconURL: 'assets/document_icon.svg', onClick: () => self.handleAttachmentOptionClick('file') }));
  if (!self.hidePollsOption && !self.parentMessageId) o.push(new CometChatMessageComposerAction({ id: 'polls', title: CometChatLocalize.getLocalizedString('message_composer_polls'), iconURL: 'assets/poll.svg', onClick: () => self.handleAttachmentOptionClick('polls') }));
  if (!self.hideCollaborativeDocumentOption && !self.parentMessageId) o.push(new CometChatMessageComposerAction({ id: 'collaborative-document', title: CometChatLocalize.getLocalizedString('messsage_composer_collaborative_document'), iconURL: 'assets/collabrative_document.svg', onClick: () => self.handleAttachmentOptionClick('collaborative-document') }));
  if (!self.hideCollaborativeWhiteboardOption && !self.parentMessageId) o.push(new CometChatMessageComposerAction({ id: 'collaborative-whiteboard', title: CometChatLocalize.getLocalizedString('messsage_composer_collaborative_whiteboard'), iconURL: 'assets/collaborative_whiteboard.svg', onClick: () => self.handleAttachmentOptionClick('collaborative-whiteboard') }));
  if ((self.attachmentOptions?.length ?? 0) > 0) o.push(...(self.attachmentOptions ?? []));
  return o;
}
