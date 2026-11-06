/**
 * Property-Based Tests for Input Null Safety
 *
 * Categories: Property-Based Input Null Safety Invariants
 * Validates: Requirements 3.3
 *
 * Property 7: Input Null Safety
 * For any component with @Input() properties, setting any input to null or
 * undefined and triggering detectChanges() does not throw an error.
 *
 * Covers all standalone components under src/lib/components/ including
 * components added since the initial file creation.
 *
 * Uses real CometChat SDK — NO vi.mock() for @cometchat/chat-sdk-javascript.
 *
 * @module input-null-safety.property
 */
vi.mock('@cometchat/calls-sdk-javascript', () => ({
  default: {},
  CometChatCalls: {
    init: vi.fn().mockResolvedValue(true),
    endSession: vi.fn().mockResolvedValue(true),
    leaveSession: vi.fn().mockResolvedValue(true),
    generateToken: vi.fn().mockResolvedValue('mock-token'),
    startSession: vi.fn().mockResolvedValue(true),
  },
}));

import { vi, describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ensureSdkReady, sdkCleanup } from './test-setup';
import { CometChat } from '@cometchat/chat-sdk-javascript';
import { MessageComposerService } from './services/message-composer.service';

// ---- Original 8 components ----
import { CometChatDeleteBubbleComponent } from './components/cometchat-delete-bubble/cometchat-delete-bubble.component';
import { CometChatActionBubbleComponent } from './components/cometchat-action-bubble/cometchat-action-bubble.component';
import { CometChatDateComponent } from './components/base-elements/cometchat-date/cometchat-date.component';
import { CometChatListItemComponent } from './components/base-elements/cometchat-list-item/cometchat-list-item.component';
import { CometChatCheckboxComponent } from './components/base-elements/cometchat-checkbox/cometchat-checkbox.component';
import { CometChatToastComponent } from './components/base-elements/cometchat-toast/cometchat-toast.component';
// ---- Extended coverage: components added since initial file creation ----
import { CometChatAudioBubbleComponent } from './components/cometchat-audio-bubble/cometchat-audio-bubble.component';
import { CometChatCallBubbleComponent } from './components/cometchat-call-bubble/cometchat-call-bubble.component';
import { CometChatCollaborativeDocumentBubbleComponent } from './components/cometchat-collaborative-document-bubble/cometchat-collaborative-document-bubble.component';
import { CometChatCollaborativeWhiteboardBubbleComponent } from './components/cometchat-collaborative-whiteboard-bubble/cometchat-collaborative-whiteboard-bubble.component';
import { CometChatConfirmDialogComponent } from './components/base-elements/cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatContextMenuComponent } from './components/base-elements/cometchat-context-menu/cometchat-context-menu.component';
import { CometChatConversationItemComponent } from './components/cometchat-conversation-item/cometchat-conversation-item.component';
import { CometChatDropDownComponent } from './components/base-elements/cometchat-dropdown/cometchat-dropdown.component';
import { CometChatEmojiKeyboardComponent } from './components/base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component';
import { CometChatFileBubbleComponent } from './components/cometchat-file-bubble/cometchat-file-bubble.component';
import { CometChatFullScreenViewerComponent } from './components/base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component';
import { CometChatGroupItemComponent } from './components/cometchat-group-item/cometchat-group-item.component';
import { CometChatGroupMemberItemComponent } from './components/cometchat-group-member-item/cometchat-group-member-item.component';
import { CometChatImageBubbleComponent } from './components/cometchat-image-bubble/cometchat-image-bubble.component';
import { CometChatLinkDialogComponent } from './components/base-elements/cometchat-link-dialog/cometchat-link-dialog.component';
import { CometChatLinkPopoverComponent } from './components/base-elements/cometchat-link-popover/cometchat-link-popover.component';
import { CometChatMediaRecorderComponent } from './components/base-elements/cometchat-media-recorder/cometchat-media-recorder.component';
import { CometChatMessagePreviewComponent } from './components/base-elements/cometchat-message-preview/cometchat-message-preview.component';
import { CometChatPollBubbleComponent } from './components/cometchat-poll-bubble/cometchat-poll-bubble.component';
import { CometChatPopoverComponent } from './components/base-elements/cometchat-popover/cometchat-popover.component';
import { CometChatRadioButtonComponent } from './components/base-elements/cometchat-radio-button/cometchat-radio-button.component';
import { CometChatSearchBarComponent } from './components/base-elements/cometchat-search-bar/cometchat-search-bar.component';
import { CometChatStickerBubbleComponent } from './components/cometchat-sticker-bubble/cometchat-sticker-bubble.component';
import { CometChatStickersKeyboardComponent } from './components/cometchat-stickers-keyboard/cometchat-stickers-keyboard.component';
import { CometChatTextBubbleComponent } from './components/cometchat-text-bubble/cometchat-text-bubble.component';
import { CometChatTypingIndicatorComponent } from './components/base-elements/cometchat-typing-indicator/cometchat-typing-indicator.component';
import { CometChatUserItemComponent } from './components/cometchat-user-item/cometchat-user-item.component';
import { CometChatVideoBubbleComponent } from './components/cometchat-video-bubble/cometchat-video-bubble.component';
import { CometChatChangeScopeComponent } from './components/base-elements/cometchat-change-scope/cometchat-change-scope.component';
import { CometChatFlagMessageDialogComponent } from './components/base-elements/cometchat-flag-message-dialog/cometchat-flag-message-dialog.component';

// ---- Extended coverage: Phase 3 additions (composite & advanced components) ----
import { CometChatCallButtonsComponent } from './components/cometchat-call-buttons/cometchat-call-buttons.component';
import { CometChatCallLogsComponent } from './components/cometchat-call-logs/cometchat-call-logs.component';
import { CometChatConversationStarterComponent } from './components/base-elements/cometchat-conversation-starter/cometchat-conversation-starter.component';
import { CometChatConversationSummaryComponent } from './components/base-elements/cometchat-conversation-summary/cometchat-conversation-summary.component';
import { CometChatConversationsComponent } from './components/cometchat-conversations/cometchat-conversations.component';
import { CometChatCreatePollComponent } from './components/cometchat-create-poll/cometchat-create-poll.component';
import { CometChatErrorBoundaryComponent } from './components/base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import { CometChatGroupMembersComponent } from './components/cometchat-group-members/cometchat-group-members.component';
import { CometChatGroupsComponent } from './components/cometchat-groups/cometchat-groups.component';
import { CometChatIncomingCallComponent } from './components/cometchat-incoming-call/cometchat-incoming-call.component';
import { CometChatMessageBubbleComponent } from './components/cometchat-message-bubble/cometchat-message-bubble.component';
import { CometChatMessageComposerComponent } from './components/cometchat-message-composer/cometchat-message-composer.component';
import { CometChatMessageHeaderComponent } from './components/cometchat-message-header/cometchat-message-header.component';
import { CometChatMessageInformationComponent } from './components/cometchat-message-information/cometchat-message-information.component';
import { CometChatMessageListComponent } from './components/cometchat-message-list/cometchat-message-list.component';
import { CometChatOngoingCallComponent } from './components/cometchat-ongoing-call/cometchat-ongoing-call.component';
import { CometChatOutgoingCallComponent } from './components/cometchat-outgoing-call/cometchat-outgoing-call.component';
import { CometChatPaginatedListComponent } from './components/cometchat-paginated-list/cometchat-paginated-list.component';
import { CometChatReactionInfoComponent } from './components/cometchat-reaction-info/cometchat-reaction-info.component';
import { CometChatReactionListComponent } from './components/cometchat-reaction-list/cometchat-reaction-list.component';
import { CometChatReactionsComponent } from './components/cometchat-reactions/cometchat-reactions.component';
import { CometChatSmartRepliesComponent } from './components/base-elements/cometchat-smart-replies/cometchat-smart-replies.component';
import { CometChatThreadHeaderComponent } from './components/cometchat-thread-header/cometchat-thread-header.component';
import { CometChatThreadViewComponent } from './components/base-elements/cometchat-thread-view/cometchat-thread-view.component';
import { CometChatUsersComponent } from './components/cometchat-users/cometchat-users.component';
import { CometChatActionSheetComponent } from './components/base-elements/cometchat-action-sheet';
import { CometChatAvatarComponent } from './components/base-elements/cometchat-avatar';
import { CometChatButtonComponent } from './components';

// ==================== Types ====================

/**
 * Descriptor for a component and its @Input() property names.
 * Used to parameterize the null-safety property test across components.
 */
interface ComponentInputDescriptor {
  name: string;
  component: any;
  inputs: string[];
  /**
   * Required inputs the component cannot render without (e.g. `message`,
   * `conversation`). Applied before the first detectChanges() so the
   * baseline render succeeds and the null/undefined mutation is what's tested.
   */
  requiredInputs?: () => Record<string, unknown>;
}

function makeTextMessage(): CometChat.TextMessage {
  const msg = new CometChat.TextMessage('receiver-1', 'hello', CometChat.RECEIVER_TYPE.USER);
  msg.setId(101);
  msg.setSentAt(1700000000);
  const sender = new CometChat.User('sender-1');
  sender.setName('Sender One');
  msg.setSender(sender);
  return msg;
}

function makeConversation(): CometChat.Conversation {
  const user = new CometChat.User('user-1');
  user.setName('User One');
  const conv = new (CometChat.Conversation as any)('conv-1', 'user', makeTextMessage(), user) as CometChat.Conversation;
  conv.setConversationWith(user);
  conv.setUnreadMessageCount(0);
  return conv;
}

// ==================== Component Descriptors ====================

const COMPONENT_DESCRIPTORS: ComponentInputDescriptor[] = [
  // ---- Original 8 ----
  {
    name: 'CometChatAvatarComponent',
    component: CometChatAvatarComponent,
    inputs: ['image', 'name'],
  },
  {
    name: 'CometChatButtonComponent',
    component: CometChatButtonComponent,
    inputs: ['text', 'hoverText', 'iconURL', 'disabled', 'isLoading', 'ariaLabel', 'iconOnly'],
  },
  {
    name: 'CometChatDeleteBubbleComponent',
    component: CometChatDeleteBubbleComponent,
    inputs: ['isSentByMe', 'text'],
  },
  {
    name: 'CometChatActionBubbleComponent',
    component: CometChatActionBubbleComponent,
    inputs: ['messageText', 'iconUrl', 'iconErrorColor'],
  },
  {
    name: 'CometChatDateComponent',
    component: CometChatDateComponent,
    inputs: ['timestamp', 'calendarObject'],
  },
  {
    name: 'CometChatListItemComponent',
    component: CometChatListItemComponent,
    inputs: [
      'id', 'avatarURL', 'avatarName', 'title', 'subtitle',
      'stopEventPropagation', 'ariaLabel', 'disableTabIndex', 'isFocused', 'menuShortcutKey',
    ],
  },
  {
    name: 'CometChatCheckboxComponent',
    component: CometChatCheckboxComponent,
    inputs: ['checked', 'labelText', 'disabled', 'indeterminate', 'ariaLabel'],
  },
  {
    name: 'CometChatToastComponent',
    component: CometChatToastComponent,
    inputs: ['text', 'type', 'duration', 'showCloseButton', 'dismissOnEscape'],
  },
  // ---- Extended coverage ----
  {
    name: 'CometChatActionSheetComponent',
    component: CometChatActionSheetComponent,
    inputs: ['actions'],
  },
  {
    name: 'CometChatAudioBubbleComponent',
    component: CometChatAudioBubbleComponent,
    inputs: ['alignment'],
  },
  {
    name: 'CometChatCallBubbleComponent',
    component: CometChatCallBubbleComponent,
    inputs: ['message', 'alignment', 'iconUrl', 'title', 'subtitle', 'buttonText', 'disableInteraction'],
  },
  {
    name: 'CometChatCollaborativeDocumentBubbleComponent',
    component: CometChatCollaborativeDocumentBubbleComponent,
    inputs: ['alignment', 'disableInteraction'],
  },
  {
    name: 'CometChatCollaborativeWhiteboardBubbleComponent',
    component: CometChatCollaborativeWhiteboardBubbleComponent,
    inputs: ['alignment', 'disableInteraction'],
  },
  {
    name: 'CometChatConfirmDialogComponent',
    component: CometChatConfirmDialogComponent,
    inputs: ['title', 'messageText', 'cancelButtonText', 'confirmButtonText'],
  },
  {
    name: 'CometChatContextMenuComponent',
    component: CometChatContextMenuComponent,
    inputs: [
      'data', 'topMenuSize', 'moreIconHoverText', 'placement',
      'closeOnOutsideClick', 'disableBackgroundInteraction',
      'useParentContainer', 'useParentHeight', 'forceStaticPlacement',
    ],
  },
  {
    name: 'CometChatConversationItemComponent',
    component: CometChatConversationItemComponent,
    requiredInputs: () => ({ conversation: makeConversation() }),
    inputs: [
      'isActive', 'isSelected', 'isFocused', 'tabIndex',
      'typingIndicator', 'loggedInUser', 'dateFormat',
      'slots', 'contextMenuOptions',
      'leadingView', 'titleView', 'subtitleView', 'trailingView',
    ],
  },
  {
    name: 'CometChatDropDownComponent',
    component: CometChatDropDownComponent,
    inputs: ['options', 'selectedOption', 'placeholder', 'ariaLabel'],
  },
  {
    name: 'CometChatEmojiKeyboardComponent',
    component: CometChatEmojiKeyboardComponent,
    inputs: ['emojiData', 'ariaLabel', 'autoFocus', 'trapFocus'],
  },
  {
    name: 'CometChatFileBubbleComponent',
    component: CometChatFileBubbleComponent,
    inputs: ['alignment'],
  },
  {
    name: 'CometChatFullScreenViewerComponent',
    component: CometChatFullScreenViewerComponent,
    inputs: [
      'url', 'mediaType', 'fileName', 'fileSize', 'placeholderImage',
      'message', 'imageSentAtDateTimeFormat', 'attachments', 'startIndex',
      'isOpen', 'explicitSenderName', 'explicitSenderAvatarUrl',
      'prevIconUrl', 'nextIconUrl', 'downloadIconUrl',
      'enablePictureInPicture', 'pipIconUrl', 'pipExitIconUrl',
    ],
  },
  {
    name: 'CometChatGroupItemComponent',
    component: CometChatGroupItemComponent,
    inputs: [
      'isActive', 'isSelected', 'isFocused', 'tabIndex',
      'contextMenuOptions', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
    ],
  },
  {
    name: 'CometChatGroupMemberItemComponent',
    component: CometChatGroupMemberItemComponent,
    inputs: [
      'isActive', 'isSelected', 'isFocused', 'tabIndex',
      'contextMenuOptions', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
    ],
  },
  {
    name: 'CometChatImageBubbleComponent',
    component: CometChatImageBubbleComponent,
    inputs: ['alignment'],
  },
  {
    name: 'CometChatLinkDialogComponent',
    component: CometChatLinkDialogComponent,
    inputs: ['mode', 'initialText', 'initialUrl', 'selectedText'],
  },
  {
    name: 'CometChatLinkPopoverComponent',
    component: CometChatLinkPopoverComponent,
    inputs: ['url', 'text', 'x', 'y'],
  },
  {
    name: 'CometChatMediaRecorderComponent',
    component: CometChatMediaRecorderComponent,
    inputs: ['autoRecording'],
  },
  {
    name: 'CometChatMessagePreviewComponent',
    component: CometChatMessagePreviewComponent,
    inputs: [
      'previewTitle', 'previewSubtitle', 'hideCloseButton',
      'message', 'isMessageModerated', 'ariaLabel', 'mode',
    ],
  },
  {
    name: 'CometChatPollBubbleComponent',
    component: CometChatPollBubbleComponent,
    inputs: ['alignment', 'loggedInUser', 'disableInteraction'],
  },
  {
    name: 'CometChatPopoverComponent',
    component: CometChatPopoverComponent,
    inputs: [
      'placement', 'closeOnOutsideClick', 'showOnHover', 'debounceOnHover',
      'content', 'disableBackgroundInteraction', 'useParentContainer',
      'useParentHeight', 'showTooltip', 'trapFocus',
      'ariaLabel', 'ariaLabelledBy', 'ariaDescribedBy', 'contentStyle',
    ],
  },
  {
    name: 'CometChatRadioButtonComponent',
    component: CometChatRadioButtonComponent,
    inputs: ['checked', 'name', 'labelText', 'disabled', 'id', 'value', 'ariaLabel'],
  },
  {
    name: 'CometChatSearchBarComponent',
    component: CometChatSearchBarComponent,
    inputs: ['searchText', 'placeholderText', 'debounceDelay', 'ariaLabel'],
  },
  {
    name: 'CometChatStickerBubbleComponent',
    component: CometChatStickerBubbleComponent,
    inputs: ['message', 'alignment'],
  },
  {
    name: 'CometChatStickersKeyboardComponent',
    component: CometChatStickersKeyboardComponent,
    inputs: ['errorStateText', 'emptyStateText', 'autoFocus', 'trapFocus'],
  },
  {
    name: 'CometChatTextBubbleComponent',
    component: CometChatTextBubbleComponent,
    inputs: ['alignment', 'textFormatters', 'translatedTextOverride'],
  },
  {
    name: 'CometChatTypingIndicatorComponent',
    component: CometChatTypingIndicatorComponent,
    inputs: ['typingUsers', 'isGroupChat'],
  },
  {
    name: 'CometChatUserItemComponent',
    component: CometChatUserItemComponent,
    inputs: [
      'isActive', 'isSelected', 'isFocused', 'tabIndex',
      'contextMenuOptions', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
    ],
  },
  {
    name: 'CometChatVideoBubbleComponent',
    component: CometChatVideoBubbleComponent,
    inputs: ['alignment'],
  },
  {
    name: 'CometChatChangeScopeComponent',
    component: CometChatChangeScopeComponent,
    inputs: ['title', 'buttonText', 'options', 'defaultSelection'],
  },
  {
    name: 'CometChatFlagMessageDialogComponent',
    component: CometChatFlagMessageDialogComponent,
    inputs: ['message', 'hideRemarkField'],
  },
  // ---- Phase 3 additions: composite & advanced components ----
  {
    name: 'CometChatCallButtonsComponent',
    component: CometChatCallButtonsComponent,
    inputs: [
      'user', 'group', 'hideVoiceCallButton', 'hideVideoCallButton',
      'onVoiceCallClick', 'onVideoCallClick', 'onError',
      'outgoingCallDisableSoundForCalls', 'outgoingCallCustomSoundForCalls',
      'voiceCallButtonView', 'videoCallButtonView',
    ],
  },
  {
    name: 'CometChatCallLogsComponent',
    component: CometChatCallLogsComponent,
    inputs: [
      'activeCall', 'callLogRequestBuilder', 'callInitiatedDateTimeFormat',
      'onError', 'menuView', 'itemView', 'leadingView', 'titleView',
      'subtitleView', 'trailingView', 'loadingView', 'emptyView', 'errorView',
      'showScrollbar',
    ],
  },
  {
    name: 'CometChatConversationStarterComponent',
    component: CometChatConversationStarterComponent,
    inputs: ['user', 'group'],
  },
  {
    name: 'CometChatConversationSummaryComponent',
    component: CometChatConversationSummaryComponent,
    inputs: ['getConversationSummary', 'closeCallback'],
  },
  {
    name: 'CometChatConversationsComponent',
    component: CometChatConversationsComponent,
    inputs: [
      'conversationsRequestBuilder', 'activeConversation', 'textFormatters',
      'selectionMode', 'lastMessageDateTimeFormat', 'options',
      'disableSoundForMessages', 'customSoundForMessages', 'slots',
      'headerView', 'menuView', 'loadingView', 'emptyView', 'errorView',
      'searchView', 'itemView', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
      'hideReceipts', 'hideError', 'hideDeleteConversation', 'hideUserStatus',
      'hideGroupType', 'disableDefaultContextMenu', 'showScrollbar', 'showSearchBar',
    ],
  },
  {
    name: 'CometChatCreatePollComponent',
    component: CometChatCreatePollComponent,
    inputs: [
      'title', 'user', 'group', 'replyToMessage', 'defaultAnswers',
      'questionPlaceholderText', 'answerPlaceholderText', 'answerHelpText',
      'addAnswerText', 'createPollButtonText',
    ],
  },
  {
    name: 'CometChatErrorBoundaryComponent',
    component: CometChatErrorBoundaryComponent,
    inputs: ['fallbackView', 'componentName'],
  },
  {
    name: 'CometChatGroupMembersComponent',
    component: CometChatGroupMembersComponent,
    inputs: [
      'group', 'selectionMode', 'groupMemberRequestBuilder', 'searchRequestBuilder',
      'searchKeyword', 'options',
      'headerView', 'menuView', 'loadingView', 'errorView', 'emptyView',
      'itemView', 'subtitleView', 'trailingView', 'leadingView', 'titleView',
      'hideSearch', 'hideError', 'hideUserStatus',
      'hideKickMemberOption', 'hideBanMemberOption', 'hideScopeChangeOption',
      'disableLoadingState', 'showScrollbar', 'disableDefaultContextMenu',
    ],
  },
  {
    name: 'CometChatGroupsComponent',
    component: CometChatGroupsComponent,
    inputs: [
      'groupsRequestBuilder', 'searchRequestBuilder', 'activeGroup',
      'selectionMode', 'options',
      'headerView', 'menuView', 'loadingView', 'emptyView', 'errorView',
      'itemView', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
      'hideSearch', 'hideError', 'hideGroupType', 'showScrollbar', 'disableDefaultContextMenu',
    ],
  },
  {
    name: 'CometChatIncomingCallComponent',
    component: CometChatIncomingCallComponent,
    inputs: [
      'call', 'disableSoundForCalls', 'customSoundForCalls',
      'onAccept', 'onDecline', 'onError',
      'itemView', 'titleView', 'subtitleView', 'leadingView', 'trailingView',
      'acceptButtonView', 'declineButtonView',
    ],
  },
  {
    name: 'CometChatMessageBubbleComponent',
    component: CometChatMessageBubbleComponent,
    requiredInputs: () => ({ message: makeTextMessage() }),
    inputs: [
      'alignment', 'group', 'options', 'quickOptionsCount',
      'leadingView', 'headerView', 'replyView', 'contentView',
      'bottomView', 'footerView', 'statusInfoView', 'threadView', 'bubbleView',
      'hideAvatar', 'hideSenderName', 'hideTimestamp', 'showError',
      'hideReceipts',
      'textFormatters', 'dateFormat', 'isSelected',
      'ariaPosinset', 'ariaSetsize', 'translatedText',
      'reactionsRequestBuilder', 'disableInteraction',
    ],
  },
  {
    name: 'CometChatMessageComposerComponent',
    component: CometChatMessageComposerComponent,
    inputs: [
      'user', 'group', 'parentMessageId',
      'placeholderText', 'initialComposerText', 'text', 'maxHeight',
      'enterKeyBehavior', 'attachmentOptions', 'maxAttachments',
      'allowedFileTypes', 'maxFileSize', 'showAttachmentPreview', 'enableDragDrop',
      'hideAttachmentButton', 'hideImageAttachmentOption', 'hideVideoAttachmentOption',
      'hideAudioAttachmentOption', 'hideFileAttachmentOption', 'hidePollsOption',
      'hideCollaborativeDocumentOption', 'hideCollaborativeWhiteboardOption',
      'hideEmojiKeyboardButton', 'hideVoiceRecordingButton', 'hideStickersButton',
      'hideLiveReaction', 'hideSendButton',
      'disableMentions', 'disableMentionAll', 'mentionAllLabel',
      'mentionsUsersRequestBuilder', 'mentionsGroupMembersRequestBuilder',
      'enableRichText', 'hideRichTextToolbar', 'showBubbleMenuOnSelection', 'layout',
      'disableAutoFocusOnMobile', 'disableTypingEvents',
      'disableSoundForMessage', 'customSoundForMessage',
      'liveReactionIcon', 'messageToEdit', 'messageToReply', 'textFormatters',
      'headerView', 'footerView', 'sendButtonView', 'auxiliaryButtonView',
      'secondaryButtonView', 'attachmentIconView', 'hideError',
    ],
  },
  {
    name: 'CometChatMessageHeaderComponent',
    component: CometChatMessageHeaderComponent,
    inputs: [
      'user', 'group',
      'showBackButton', 'hideUserStatus',
      'hideVoiceCallButton', 'hideVideoCallButton',
      'showSearchOption', 'showConversationSummaryButton',
      'summaryGenerationMessageCount', 'enableAutoSummaryGeneration',
      'lastActiveAtDateTimeFormat',
      'headerView', 'itemView', 'leadingView', 'titleView',
      'subtitleView', 'trailingView', 'backButtonView', 'auxiliaryButtonView',
    ],
  },
  {
    name: 'CometChatMessageInformationComponent',
    component: CometChatMessageInformationComponent,
    requiredInputs: () => ({ message: makeTextMessage() }),
    inputs: ['message', 'dateTimeFormat', 'textFormatters'],
  },
  {
    name: 'CometChatMessageListComponent',
    component: CometChatMessageListComponent,
    inputs: [
      'user', 'group', 'parentMessageId',
      'messagesRequestBuilder', 'reactionsRequestBuilder', 'templates',
      'textFormatters', 'messageAlignment', 'quickOptionsCount',
      'scrollToBottomOnNewMessages', 'disableSoundForMessages', 'customSoundForMessages',
      'goToMessageId', 'showScrollbar',
      'hideReceipts', 'hideDateSeparator', 'hideStickyDate', 'hideAvatar',
      'hideGroupActionMessages', 'hideError', 'hideReplyInThreadOption',
       'hideTranslateMessageOption', 'hideEditMessageOption',
      'hideDeleteMessageOption', 'hideReactionOption', 'hideMessagePrivatelyOption',
      'hideCopyMessageOption', 'hideMessageInfoOption',
      'additionalOptions', 'optionsOverride',
      'emptyView', 'errorView', 'loadingView', 'headerView', 'footerView',
      'separatorDateTimeFormat', 'stickyDateTimeFormat',
      'messageSentAtDateTimeFormat', 'messageInfoDateTimeFormat',
      'showConversationStarters', 'showSmartReplies',
      'smartRepliesKeywords', 'smartRepliesDelayDuration',
    ],
  },
  {
    name: 'CometChatOngoingCallComponent',
    component: CometChatOngoingCallComponent,
    inputs: ['sessionID', 'callSettingsBuilder', 'callWorkflow', 'onError', 'callScreenView'],
  },
  {
    name: 'CometChatOutgoingCallComponent',
    component: CometChatOutgoingCallComponent,
    inputs: [
      'call', 'disableSoundForCalls', 'customSoundForCalls', 'onError',
      'titleView', 'subtitleView', 'avatarView', 'cancelButtonView',
    ],
  },
  {
    name: 'CometChatPaginatedListComponent',
    component: CometChatPaginatedListComponent,
    inputs: [
      'items', 'trackByFn', 'isLoading', 'hasMore', 'error',
      'showScrollbar', 'loadingThreshold', 'ariaLabel',
      'enableKeyboardNavigation', 'isMultiSelect',
      'emptyStateAriaLabel', 'errorStateAriaLabel', 'hideError', 'isItemSelected',
      'itemTemplate', 'loadingTemplate', 'emptyTemplate', 'errorTemplate', 'loadingMoreTemplate',
    ],
  },
  {
    name: 'CometChatReactionInfoComponent',
    component: CometChatReactionInfoComponent,
    inputs: ['message', 'reaction'],
  },
  {
    name: 'CometChatReactionListComponent',
    component: CometChatReactionListComponent,
    inputs: ['message', 'reactionsRequestBuilder'],
  },
  {
    name: 'CometChatReactionsComponent',
    component: CometChatReactionsComponent,
    inputs: ['alignment', 'reactionsRequestBuilder', 'hoverDebounceTime'],
  },
  {
    name: 'CometChatSmartRepliesComponent',
    component: CometChatSmartRepliesComponent,
    inputs: ['message', 'user', 'group', 'keywords', 'delayDuration'],
  },
  {
    name: 'CometChatThreadHeaderComponent',
    component: CometChatThreadHeaderComponent,
    inputs: ['parentMessage', 'replyCount'],
  },
  {
    name: 'CometChatThreadViewComponent',
    component: CometChatThreadViewComponent,
    inputs: ['mode', 'replyCount', 'unreadReplyCount', 'parentMessage', 'announceOnOpen'],
  },
  {
    name: 'CometChatUsersComponent',
    component: CometChatUsersComponent,
    inputs: [
      'usersRequestBuilder', 'searchRequestBuilder', 'searchKeyword',
      'sectionHeaderKey', 'activeUser', 'selectionMode', 'options',
      'headerView', 'menuView', 'loadingView', 'emptyView', 'errorView',
      'itemView', 'leadingView', 'titleView', 'subtitleView', 'trailingView',
      'hideSearch', 'showSectionHeader', 'hideError', 'disableLoadingState',
      'hideUserStatus', 'showScrollbar', 'showSelectedUsersPreview', 'disableDefaultContextMenu',
    ],
  },
];

// ==================== Arbitraries ====================

/** Arbitrary that produces null or undefined. */
const arbNullish = fc.oneof(fc.constant(null), fc.constant(undefined));

/** Pick any component descriptor. */
const arbComponent = fc.constantFrom(...COMPONENT_DESCRIPTORS);

/**
 * For a given descriptor, pick a random input name from its inputs array.
 * Returns a tuple of [descriptor, inputName].
 */
const arbComponentAndInput = arbComponent.chain(descriptor =>
  fc.constantFrom(...descriptor.inputs).map(inputName => ({
    descriptor,
    inputName,
  }))
);

/**
 * For a given descriptor, generate a random subset of its inputs (1 to all).
 * Returns a tuple of [descriptor, inputNames[]].
 */
const arbComponentAndMultipleInputs = arbComponent.chain(descriptor =>
  fc.shuffledSubarray(descriptor.inputs, { minLength: 1 }).map(inputNames => ({
    descriptor,
    inputNames,
  }))
);

// ==================== Tests ====================

describe('Property 7: Input Null Safety', () => {
  beforeAll(async () => {
    await ensureSdkReady();
  }, 30000);

  afterAll(async () => {
    await sdkCleanup();
  }, 30000);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: COMPONENT_DESCRIPTORS.map(d => d.component),
    });
    // CreatePoll injects MessageComposerService, which is normally provided by the composer host
    TestBed.overrideComponent(CometChatCreatePollComponent, {
      add: { providers: [MessageComposerService] },
    });
  });

  /** Creates the fixture and applies the descriptor's required inputs (no detectChanges yet). */
  function createFixture(descriptor: ComponentInputDescriptor): ComponentFixture<any> {
    const fixture = TestBed.createComponent(descriptor.component);
    const required = descriptor.requiredInputs?.() ?? {};
    for (const [key, value] of Object.entries(required)) {
      fixture.componentRef.setInput(key, value);
    }
    return fixture;
  }

  function describeError(e: unknown): string {
    return e instanceof Error ? e.message.split('\n')[0].slice(0, 160) : String(e);
  }

  it('every component renders with its required inputs (baseline for the null-safety properties)', () => {
    const failures: string[] = [];
    for (const descriptor of COMPONENT_DESCRIPTORS) {
      let fixture: ComponentFixture<any> | null = null;
      try {
        fixture = createFixture(descriptor);
        fixture.detectChanges();
        expect(fixture.componentInstance).toBeInstanceOf(descriptor.component);
      } catch (e) {
        failures.push(`${descriptor.name}: ${describeError(e)}`);
      } finally {
        fixture?.destroy();
      }
    }
    expect(failures).toEqual([]);
  });

  // ---------- Core property: single input set to null ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any single @Input(), setting it to null
   * and calling detectChanges() does not throw.
   */
  /**
   * Renders the component, applies `assignments` through setInput (so OnPush
   * components re-render and ngOnChanges fires, exactly as with a parent
   * template binding), renders again, and returns the error message if any.
   */
  function renderWith(descriptor: ComponentInputDescriptor, assignments: Array<[string, unknown]>): string | null {
    let fixture: ComponentFixture<any> | null = null;
    try {
      fixture = createFixture(descriptor);
      fixture.detectChanges();
      for (const [inputName, value] of assignments) {
        fixture.componentRef.setInput(inputName, value);
      }
      fixture.detectChanges();
      return null;
    } catch (e) {
      return describeError(e);
    } finally {
      fixture?.destroy();
    }
  }

  it('setting any single @Input() to null and calling detectChanges() does not throw', () => {
    // Exhaustive over every component/input pair so the result is deterministic
    const violations: string[] = [];
    for (const descriptor of COMPONENT_DESCRIPTORS) {
      for (const inputName of descriptor.inputs) {
        const err = renderWith(descriptor, [[inputName, null]]);
        if (err) violations.push(`${descriptor.name}.${inputName}: ${err}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ---------- Core property: single input set to undefined ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any single @Input(), setting it to undefined
   * and calling detectChanges() does not throw.
   */
  it('setting any single @Input() to undefined and calling detectChanges() does not throw', () => {
    const violations: string[] = [];
    for (const descriptor of COMPONENT_DESCRIPTORS) {
      for (const inputName of descriptor.inputs) {
        const err = renderWith(descriptor, [[inputName, undefined]]);
        if (err) violations.push(`${descriptor.name}.${inputName}: ${err}`);
      }
    }
    expect(violations).toEqual([]);
  });

  // ---------- Multiple inputs set to null simultaneously ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any subset of its @Input() properties,
   * setting all of them to null simultaneously and calling detectChanges()
   * does not throw.
   */
  it('setting multiple @Input() properties to null simultaneously does not throw', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(arbComponentAndMultipleInputs, ({ descriptor, inputNames }) => {
        let fixture: ComponentFixture<any> | null = null;
        try {
          fixture = createFixture(descriptor);
          fixture.detectChanges();
          for (const inputName of inputNames) {
            fixture.componentRef.setInput(inputName, null);
          }
          fixture.detectChanges();
        } catch (e) {
          violations.push(`${descriptor.name}.[${inputNames.join(',')}]: ${describeError(e)}`);
        } finally {
          fixture?.destroy();
        }
      }),
      { numRuns: 120 }
    );
    expect(violations).toEqual([]);
  });

  // ---------- Multiple inputs set to undefined simultaneously ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any subset of its @Input() properties,
   * setting all of them to undefined simultaneously and calling detectChanges()
   * does not throw.
   */
  it('setting multiple @Input() properties to undefined simultaneously does not throw', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(arbComponentAndMultipleInputs, ({ descriptor, inputNames }) => {
        let fixture: ComponentFixture<any> | null = null;
        try {
          fixture = createFixture(descriptor);
          fixture.detectChanges();
          for (const inputName of inputNames) {
            fixture.componentRef.setInput(inputName, undefined);
          }
          fixture.detectChanges();
        } catch (e) {
          violations.push(`${descriptor.name}.[${inputNames.join(',')}]: ${describeError(e)}`);
        } finally {
          fixture?.destroy();
        }
      }),
      { numRuns: 120 }
    );
    expect(violations).toEqual([]);
  });

  // ---------- Random mix of null/undefined across inputs ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any subset of its @Input() properties,
   * setting each to a randomly chosen null or undefined value
   * and calling detectChanges() does not throw.
   */
  it('setting inputs to a random mix of null/undefined does not throw', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(
        arbComponentAndMultipleInputs,
        fc.array(arbNullish, { minLength: 1, maxLength: 20 }),
        ({ descriptor, inputNames }, nullishValues) => {
          let fixture: ComponentFixture<any> | null = null;
          try {
            fixture = createFixture(descriptor);
            fixture.detectChanges();
            inputNames.forEach((inputName, i) => {
              const value = nullishValues[i % nullishValues.length];
              fixture!.componentRef.setInput(inputName, value);
            });
            fixture.detectChanges();
          } catch (e) {
            violations.push(`${descriptor.name}.[${inputNames.join(',')}]: ${describeError(e)}`);
          } finally {
            fixture?.destroy();
          }
        }
      ),
      { numRuns: 120 }
    );
    expect(violations).toEqual([]);
  });

  // ---------- ALL inputs set to null at once per component ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For each component, setting ALL @Input() properties to null
   * simultaneously and calling detectChanges() does not throw.
   */
  it('setting ALL inputs to null at once for any component does not throw', () => {
    const violations: string[] = [];
    for (const descriptor of COMPONENT_DESCRIPTORS) {
      const err = renderWith(descriptor, descriptor.inputs.map(name => [name, null] as [string, unknown]));
      if (err) violations.push(`${descriptor.name}: ${err}`);
    }
    expect(violations).toEqual([]);
  });

  // ---------- Transition: valid value → null → detectChanges ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any @Input(), setting a valid value first,
   * then setting to null, and calling detectChanges() does not throw.
   * This tests the transition path (ngOnChanges with previous valid value).
   */
  /** Representative non-null values per input name, used by the transition properties. */
  const validValues: Record<string, any> = {
      // Avatar
      image: 'https://example.com/avatar.png',
      name: 'Test User',
      // Button
      text: 'Hello World',
      hoverText: 'Hover me',
      iconURL: 'https://example.com/icon.svg',
      disabled: true,
      isLoading: true,
      ariaLabel: 'Test label',
      iconOnly: true,
      // DeleteBubble
      isSentByMe: true,
      // ActionBubble
      messageText: 'Action message',
      iconUrl: 'https://example.com/icon.svg',
      iconErrorColor: true,
      // Date
      timestamp: 1700000000,
      calendarObject: { relativeTime: true },
      // ListItem
      id: 'test-id',
      avatarURL: 'https://example.com/avatar.png',
      avatarName: 'Test',
      title: 'Test Title',
      subtitle: 'Test Subtitle',
      stopEventPropagation: true,
      disableTabIndex: true,
      isFocused: true,
      menuShortcutKey: 'M',
      // Checkbox
      checked: true,
      labelText: 'Check me',
      indeterminate: true,
      // Toast
      type: 'info',
      duration: 5000,
      showCloseButton: true,
      dismissOnEscape: true,
      // ActionSheet
      actions: [],
      // Bubbles
      alignment: 'left',
      disableInteraction: false,
      // CallBubble
      buttonText: 'Join',
      // ConfirmDialog
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Confirm',
      // ContextMenu
      data: [],
      topMenuSize: 2,
      moreIconHoverText: 'More',
      placement: 'left',
      closeOnOutsideClick: false,
      disableBackgroundInteraction: false,
      useParentContainer: false,
      useParentHeight: false,
      forceStaticPlacement: false,
      // ConversationItem
      isActive: false,
      isSelected: false,
      tabIndex: 0,
      typingIndicator: null,
      loggedInUser: null,
      dateFormat: undefined,
      slots: undefined,
      contextMenuOptions: [],
      leadingView: undefined,
      titleView: undefined,
      subtitleView: undefined,
      trailingView: undefined,
      // Dropdown
      options: ['Option 1', 'Option 2'],
      selectedOption: 'Option 1',
      placeholder: 'Select...',
      // EmojiKeyboard
      emojiData: [],
      autoFocus: true,
      trapFocus: true,
      // FullscreenViewer
      url: 'https://example.com/image.png',
      mediaType: 'image',
      fileName: 'image.png',
      fileSize: 1024,
      placeholderImage: 'https://example.com/placeholder.png',
      message: undefined,
      imageSentAtDateTimeFormat: undefined,
      attachments: [],
      startIndex: 0,
      isOpen: false,
      explicitSenderName: 'User',
      explicitSenderAvatarUrl: 'https://example.com/avatar.png',
      prevIconUrl: 'assets/arrow_back.svg',
      nextIconUrl: 'assets/arrow_forward.svg',
      downloadIconUrl: 'assets/download.svg',
      enablePictureInPicture: true,
      pipIconUrl: 'assets/zoom_out_map.svg',
      pipExitIconUrl: 'assets/zoom_in_map.svg',
      // LinkDialog
      mode: 'add',
      initialText: 'Link text',
      initialUrl: 'https://example.com',
      selectedText: 'selected',
      // LinkPopover
      x: 100,
      y: 200,
      // MediaRecorder
      autoRecording: false,
      // MessagePreview
      previewTitle: null,
      previewSubtitle: null,
      hideCloseButton: false,
      isMessageModerated: false,
      // PollBubble
      // (loggedInUser already defined above)
      // Popover
      showOnHover: false,
      debounceOnHover: 500,
      content: undefined,
      showTooltip: false,
      ariaLabelledBy: 'label-id',
      ariaDescribedBy: 'desc-id',
      contentStyle: {},
      // RadioButton
      // (name already defined above)
      value: 'option1',
      // SearchBar
      searchText: 'hello',
      placeholderText: 'Search...',
      debounceDelay: 300,
      // Stickers
      errorStateText: 'Error',
      emptyStateText: 'No stickers',
      // TextBubble
      textFormatters: [],
      translatedTextOverride: 'Translated',
      // TypingIndicator
      typingUsers: [],
      isGroupChat: false,
      // ChangeScope
      defaultSelection: 'admin',
      // FlagMessageDialog
      hideRemarkField: false,
      // ---- Phase 3 additions: valid values for new component inputs ----
      // CallButtons
      hideVoiceCallButton: true,
      hideVideoCallButton: true,
      onVoiceCallClick: null,
      onVideoCallClick: null,
      onError: null,
      outgoingCallDisableSoundForCalls: false,
      outgoingCallCustomSoundForCalls: '',
      voiceCallButtonView: null,
      videoCallButtonView: null,
      // CallLogs
      activeCall: null,
      callLogRequestBuilder: null,
      callInitiatedDateTimeFormat: null,
      menuView: null,
      itemView: null,
      loadingView: null,
      emptyView: null,
      errorView: null,
      showScrollbar: false,
      // ConversationStarter (user, group already covered)
      // ConversationSummary
      getConversationSummary: undefined,
      closeCallback: undefined,
      // Conversations
      conversationsRequestBuilder: undefined,
      activeConversation: undefined,
      selectionMode: 'none',
      lastMessageDateTimeFormat: undefined,
      disableSoundForMessages: false,
      customSoundForMessages: '',
      searchView: undefined,
      hideReceipts: false,
      hideError: false,
      hideDeleteConversation: false,
      hideUserStatus: false,
      hideGroupType: false,
      disableDefaultContextMenu: true,
      showSearchBar: false,
      // CreatePoll
      replyToMessage: undefined,
      defaultAnswers: 2,
      questionPlaceholderText: undefined,
      answerPlaceholderText: undefined,
      answerHelpText: undefined,
      addAnswerText: undefined,
      createPollButtonText: undefined,
      // ErrorBoundary
      fallbackView: undefined,
      componentName: 'Test',
      // GroupMembers
      group: null,
      groupMemberRequestBuilder: undefined,
      searchRequestBuilder: undefined,
      searchKeyword: '',
      hideSearch: false,
      hideKickMemberOption: false,
      hideBanMemberOption: false,
      hideScopeChangeOption: false,
      disableLoadingState: false,
      // Groups
      groupsRequestBuilder: undefined,
      activeGroup: undefined,
      // IncomingCall
      call: null,
      disableSoundForCalls: false,
      customSoundForCalls: '',
      onAccept: null,
      onDecline: null,
      acceptButtonView: null,
      declineButtonView: null,
      // MessageBubble
      quickOptionsCount: 2,
      headerView: null,
      replyView: null,
      contentView: null,
      bottomView: null,
      footerView: null,
      statusInfoView: null,
      threadView: null,
      bubbleView: null,
      hideAvatar: false,
      hideSenderName: false,
      hideTimestamp: false,
      showError: false,
      ariaPosinset: 1,
      ariaSetsize: 10,
      translatedText: undefined,
      reactionsRequestBuilder: undefined,
      // MessageComposer
      parentMessageId: undefined,
      // (placeholderText already defined above)
      initialComposerText: '',
      maxHeight: 200,
      enterKeyBehavior: 'sendMessage',
      attachmentOptions: undefined,
      maxAttachments: 10,
      allowedFileTypes: undefined,
      maxFileSize: undefined,
      showAttachmentPreview: true,
      enableDragDrop: true,
      hideAttachmentButton: false,
      hideImageAttachmentOption: false,
      hideVideoAttachmentOption: false,
      hideAudioAttachmentOption: false,
      hideFileAttachmentOption: false,
      hidePollsOption: false,
      hideCollaborativeDocumentOption: false,
      hideCollaborativeWhiteboardOption: false,
      hideEmojiKeyboardButton: false,
      hideVoiceRecordingButton: false,
      hideStickersButton: false,
      hideLiveReaction: false,
      hideSendButton: false,
      disableMentions: false,
      disableMentionAll: false,
      mentionAllLabel: '',
      mentionsUsersRequestBuilder: undefined,
      mentionsGroupMembersRequestBuilder: undefined,
      enableRichText: true,
      hideRichTextToolbar: false,
      showBubbleMenuOnSelection: false,
      layout: 'single-line',
      disableAutoFocusOnMobile: true,
      disableTypingEvents: false,
      disableSoundForMessage: false,
      customSoundForMessage: '',
      liveReactionIcon: undefined,
      messageToEdit: undefined,
      messageToReply: undefined,
      sendButtonView: undefined,
      auxiliaryButtonView: undefined,
      secondaryButtonView: undefined,
      attachmentIconView: undefined,
      // MessageHeader
      showBackButton: false,
      showSearchOption: false,
      showConversationSummaryButton: false,
      summaryGenerationMessageCount: 1000,
      enableAutoSummaryGeneration: false,
      lastActiveAtDateTimeFormat: undefined,
      backButtonView: undefined,
      // MessageInformation
      dateTimeFormat: undefined,
      // MessageList
      messagesRequestBuilder: undefined,
      templates: undefined,
      messageAlignment: 'standard',
      scrollToBottomOnNewMessages: false,
      goToMessageId: undefined,
      hideDateSeparator: false,
      hideStickyDate: false,
      hideGroupActionMessages: false,
      hideReplyInThreadOption: false,
      hideTranslateMessageOption: false,
      hideEditMessageOption: false,
      hideDeleteMessageOption: false,
      hideReactionOption: false,
      hideMessagePrivatelyOption: false,
      hideCopyMessageOption: false,
      hideMessageInfoOption: false,
      hideFlagMessageOption: false,
      hideFlagRemarkField: false,
      additionalOptions: [],
      optionsOverride: undefined,
      separatorDateTimeFormat: undefined,
      stickyDateTimeFormat: undefined,
      messageSentAtDateTimeFormat: undefined,
      messageInfoDateTimeFormat: undefined,
      showConversationStarters: false,
      showSmartReplies: false,
      smartRepliesKeywords: [],
      smartRepliesDelayDuration: 10000,
      // OngoingCall
      sessionID: '',
      callSettingsBuilder: null,
      callWorkflow: 'defaultCalling',
      callScreenView: null,
      // OutgoingCall
      avatarView: null,
      cancelButtonView: null,
      // PaginatedList
      items: [],
      trackByFn: undefined,
      hasMore: true,
      error: null,
      loadingThreshold: 100,
      enableKeyboardNavigation: true,
      isMultiSelect: false,
      emptyStateAriaLabel: '',
      errorStateAriaLabel: '',
      isItemSelected: undefined,
      itemTemplate: undefined,
      loadingTemplate: undefined,
      emptyTemplate: undefined,
      errorTemplate: undefined,
      loadingMoreTemplate: undefined,
      // ReactionInfo
      reaction: '👍',
      // ReactionList (message already covered)
      // Reactions
      hoverDebounceTime: 500,
      // SmartReplies
      keywords: [],
      delayDuration: 10000,
      // ThreadHeader
      parentMessage: undefined,
      replyCount: 0,
      // ThreadView
      unreadReplyCount: 0,
      announceOnOpen: true,
      // Users
      usersRequestBuilder: undefined,
      sectionHeaderKey: 'getName',
      activeUser: undefined,
      showSectionHeader: true,
      showSelectedUsersPreview: false,
    };

  /** Sets the input to its valid value (when one is known) and renders; returns whether a value was set. */
  function applyValidValue(fixture: ComponentFixture<any>, inputName: string): boolean {
    const validValue = validValues[inputName];
    if (validValue === undefined || validValue === null) return false;
    fixture.componentRef.setInput(inputName, validValue);
    return true;
  }

  it('validValues covers inputs with real (non-nullish) values for the transition properties', () => {
    const covered = COMPONENT_DESCRIPTORS.flatMap(d => d.inputs).filter(
      name => validValues[name] !== undefined && validValues[name] !== null,
    );
    // Guard against the transition properties silently degenerating into plain null tests
    expect(covered.length).toBeGreaterThan(100);
  });

  it('transitioning from valid value to null does not throw', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(arbComponentAndInput, ({ descriptor, inputName }) => {
        let fixture: ComponentFixture<any> | null = null;
        try {
          fixture = createFixture(descriptor);
          applyValidValue(fixture, inputName);
          fixture.detectChanges();
          fixture.componentRef.setInput(inputName, null);
          fixture.detectChanges();
        } catch (e) {
          violations.push(`${descriptor.name}.${inputName}: ${describeError(e)}`);
        } finally {
          fixture?.destroy();
        }
      }),
      { numRuns: 120 }
    );
    expect(violations).toEqual([]);
  });

  // ---------- Transition: valid value → undefined → detectChanges ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any @Input(), setting a valid value first,
   * then setting to undefined, and calling detectChanges() does not throw.
   */
  it('transitioning from valid value to undefined does not throw', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(arbComponentAndInput, ({ descriptor, inputName }) => {
        let fixture: ComponentFixture<any> | null = null;
        try {
          fixture = createFixture(descriptor);
          applyValidValue(fixture, inputName);
          fixture.detectChanges();
          fixture.componentRef.setInput(inputName, undefined);
          fixture.detectChanges();
        } catch (e) {
          violations.push(`${descriptor.name}.${inputName}: ${describeError(e)}`);
        } finally {
          fixture?.destroy();
        }
      }),
      { numRuns: 120 }
    );
    expect(violations).toEqual([]);
  });

  // ---------- Repeated null assignment is idempotent ----------

  /**
   * **Validates: Requirements 3.3**
   *
   * For any component and any @Input(), setting it to null multiple times
   * and calling detectChanges() each time does not throw.
   */
  it('repeated null assignment and detectChanges is idempotent', () => {
    const violations: string[] = [];
    fc.assert(
      fc.property(
        arbComponentAndInput,
        fc.integer({ min: 2, max: 5 }),
        ({ descriptor, inputName }, repeatCount) => {
          let fixture: ComponentFixture<any> | null = null;
          try {
            fixture = createFixture(descriptor);
            fixture.detectChanges();
            for (let i = 0; i < repeatCount; i++) {
              fixture.componentRef.setInput(inputName, null);
              fixture.detectChanges();
            }
          } catch (e) {
            violations.push(`${descriptor.name}.${inputName}: ${describeError(e)}`);
          } finally {
            fixture?.destroy();
          }
        }
      ),
      { numRuns: 100 }
    );
    expect(violations).toEqual([]);
  });
});
