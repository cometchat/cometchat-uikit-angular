
import {Component, Input, Output, EventEmitter, TemplateRef, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy, OnChanges, SimpleChanges, signal, computed, inject, ViewChild, ElementRef, AfterViewInit, HostListener, ViewChildren, QueryList, booleanAttribute, DestroyRef,} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {CometChat} from '@cometchat/chat-sdk-javascript';
import {CometChatUIEvents, IModal, IMentionsCountWarning} from '../../events/CometChatUIEvents';
import {CometChatMessageEvents} from '../../events/CometChatMessageEvents';
import {CometChatActionSheetComponent} from '../base-elements/cometchat-action-sheet/cometchat-action-sheet.component';
import {CometChatEmojiKeyboardComponent} from '../base-elements/cometchat-emoji-keyboard/cometchat-emoji-keyboard.component';
import {CometChatMediaRecorderComponent} from '../base-elements/cometchat-media-recorder/cometchat-media-recorder.component';
import {CometChatAvatarComponent} from '../base-elements/cometchat-avatar/cometchat-avatar.component';
import {CometChatStickersKeyboardComponent, StickerClickEvent,} from '../cometchat-stickers-keyboard/cometchat-stickers-keyboard.component';
import {CometChatFullScreenViewerComponent} from '../base-elements/cometchat-fullscreen-viewer/cometchat-fullscreen-viewer.component';
import {CometChatPopoverComponent} from '../base-elements/cometchat-popover/cometchat-popover.component';
import {CometChatMessagePreviewComponent} from '../base-elements/cometchat-message-preview/cometchat-message-preview.component';
import {CometChatCreatePollComponent} from '../cometchat-create-poll/cometchat-create-poll.component';
import {CometChatButtonComponent} from '../base-elements/cometchat-button/cometchat-button.component';
import {CometChatLinkDialogComponent, type LinkData,} from '../base-elements/cometchat-link-dialog/cometchat-link-dialog.component';
import {CometChatLinkPopoverComponent} from '../base-elements/cometchat-link-popover/cometchat-link-popover.component';
import {CometChatErrorBoundaryComponent} from '../base-elements/cometchat-error-boundary/cometchat-error-boundary.component';
import {MessageComposerService, MentionSuggestion} from '../../services/message-composer.service';
import {RichTextFormatState, RichTextMetadata, SelectionState,} from '../../services/rich-text-editor.interfaces';
import {RichTextEditorService} from '../../services/rich-text-editor.service';
import {RichTextEditor} from '../../services/rich-text-editor.class';
import {ChatStateService} from '../../services/chat-state.service';
import {FormatterConfigService} from '../../services/formatter-config.service';
import {HtmlSanitizerService} from '../../services/html-sanitizer.service';
import {LiveAnnouncerService} from '../../services/live-announcer.service';
import {COMETCHAT_GLOBAL_CONFIG, GlobalConfig} from '../../services/global-config.service';
import {TranslatePipe} from '../../resources/CometChatLocalize/translate.pipe';
import {CometChatSoundManager} from '../../resources/CometChatSoundManager/CometChatSoundManager';
import {CometChatUIKit} from '../../cometchat-uikit';
import {CometChatLogger} from '../../utils/CometChatLogger';
import {EnterKeyBehavior, Placement} from '../../Enums/Enums';
import {CometChatMentionsFormatter} from '../../formatters/cometchat-mentions-formatter';
import {CometChatTextFormatter} from '../../formatters/cometchat-text-formatter';
import {CometChatMessageComposerAction, CometChatActionsView} from '../../modals';
import {CometChatUIKitUtility} from '../../CometChatUIKitUtility';
import {getFileType as getFileTypeUtil, getFileTypeLabel as getFileTypeLabelUtil, getPluralFileType as getPluralFileTypeUtil} from './cometchat-message-composer.file-utils';
import {detectMentionTrigger} from './cometchat-message-composer.mention-utils';
import {handleRecordingCompleteImpl, handleRecordingCancelImpl, handleRecordingErrorImpl, startInlineRecordingImpl} from './cometchat-message-composer.voice-utils';
import {handleSendNewMessageImpl, handleEditMessageImpl, buildMessageMetadataImpl, extractMentionedUsersImpl, applyTextFormattersImpl} from './cometchat-message-composer.send-utils';
import {handleDragEnterImpl, handleDragLeaveImpl, handleDragOverImpl, handleDropImpl, handlePasteImpl, handleFileInputChangeImpl, processFilesImpl, sendFilesDirectlyImpl} from './cometchat-message-composer.drag-utils';
import {initializeRichTextEditorImpl, clearComposerImpl} from './cometchat-message-composer.editor-utils';
import {checkForMentionTriggerImpl, fetchMoreMentionsImpl, handleMentionsScrollImpl, selectMentionSuggestionImpl, scrollMentionIntoViewImpl, closeMentionSuggestionsImpl, updateMentionsCountImpl, initializeMentionsRequestBuilderImpl, checkIfSelfMentionImpl} from './cometchat-message-composer.mentions-handler';
import {handleLinkDialogSaveImpl, handleLinkDialogRemoveImpl, handleLinkDialogCancelImpl, handleLinkClickImpl, handleLinkPopoverEditImpl, handleLinkPopoverRemoveImpl, handleLinkPopoverCloseImpl, computeLinkDialogLeftImpl} from './cometchat-message-composer.link-handler';
import {handleKeydownImpl, handleKeyupImpl, handleFormattingShortcutsImpl, handleGlobalEscapeKeyImpl, handleRichTextKeydownImpl} from './cometchat-message-composer.keyboard-handler';
import {handleTypingStartImpl, startTypingImpl, endTypingIndicatorImpl} from './cometchat-message-composer.typing-handler';
import {handleToolbarBoldImpl, handleToolbarItalicImpl, handleToolbarUnderlineImpl, handleToolbarStrikethroughImpl, handleToolbarInlineCodeImpl, handleToolbarLinkImpl, handleToolbarOrderedListImpl, handleToolbarBulletListImpl, handleToolbarCodeBlockImpl, handleToolbarBlockquoteImpl, handleSelectionUpdateImpl, updateBubbleMenuPositionImpl, calculateAndSetPositionImpl, getTextOffsetFromNodeImpl, updateFormatStateFromEditorImpl} from './cometchat-message-composer.toolbar-handler';
import {subscribeToActivePopoverEventImpl, subscribeToReplyToMessageEventImpl, subscribeToMessageEditedEventImpl, subscribeToMessageDeletedEventImpl, subscribeToComposeMessageEventImpl, subscribeToSdkMessageDeletedEventImpl, subscribeToShowModalEventImpl, subscribeToHideModalEventImpl, subscribeToShowMentionsCountWarningEventImpl} from './cometchat-message-composer.subscriptions';
import {enterEditModeImpl, populateEditorWithFormattedTextImpl, cancelEditImpl, exitEditModeWithoutEventImpl, formatReplyPreviewTextImpl, formatEditPreviewTextImpl, convertMarkdownToHtmlImpl} from './cometchat-message-composer.edit-mode';
import {announcePoliteImpl, announceAssertiveImpl, announceReplyModeActivatedImpl, announceEditModeActivatedImpl, announceRecordingStartedImpl, announceRecordingStoppedImpl, announceMessageSentImpl, announceAttachmentAddedImpl, announceAttachmentRemovedImpl, announceFocusedMentionImpl, announceMentionSuggestionsCountImpl, announceMentionInsertedImpl, announceFormatStateChangeImpl} from './cometchat-message-composer.announcements';
import {syncLegacyPopoverSignalsImpl, toggleEmojiKeyboardImpl, toggleAttachmentMenuImpl, toggleVoiceRecordingImpl, toggleStickersKeyboardImpl, toggleAIImpl, sendStickerMessageImpl} from './cometchat-message-composer.popover-utils';
import {handleAttachmentOptionClickImpl, handleAttachmentClickImpl, handleFullscreenViewerCloseImpl, handleFullscreenViewerPreviousImpl, handleFullscreenViewerNextImpl, getCurrentFullscreenAttachmentImpl, handleRemoveAttachmentImpl, handleAttachmentButtonClickImpl} from './cometchat-message-composer.attachment-handlers';
import {focusTextInputImpl, focusAttachmentButtonImpl, focusEmojiButtonImpl, focusStickersButtonImpl, focusVoiceButtonImpl, insertTextAtCursorImpl} from './cometchat-message-composer.focus-utils';
import {getReplyPreviewTitleImpl, getReplyPreviewSubtitleImpl, getEditPreviewTitleImpl, getEditPreviewSubtitleImpl, enterReplyModeImpl, exitReplyModeImpl, onReplyPreviewCloseImpl, onEditPreviewCloseImpl, openPollModalImpl, closePollModalImpl, onPollCreatedImpl, resetComposerStateImpl} from './cometchat-message-composer.reply-edit-utils';
import {createCollaborativeDocumentImpl, createCollaborativeWhiteboardImpl} from './cometchat-message-composer.collab-utils';
import {handleEmojiSelectImpl, handleEmojiKeyboardCloseImpl, handleActionSheetItemClickImpl, handleActionSheetCloseImpl, handleStickerSelectImpl, handleStickersKeyboardCloseImpl, handleVoiceRecordingClickImpl, toggleFixedToolbarImpl, closeAllPopupsImpl, emitErrorImpl, handleSendImpl, focusRichTextEditorImpl, getFileSizeErrorMessageImpl} from './cometchat-message-composer.event-handlers';
import {initializeTextFormattersImpl, configureTextFormattersImpl, forwardKeyEventToFormattersImpl, updateFormatterCaretPositionImpl, playOutgoingMessageSoundImpl, getMediaMessageTypeImpl, handleRichTextUpdateImpl, onEmojiPopoverOpenedImpl, onEmojiPopoverClosedImpl, onAttachmentPopoverOpenedImpl, onAttachmentPopoverClosedImpl, onVoiceRecorderPopoverOpenedImpl, onVoiceRecorderPopoverClosedImpl, onStickersPopoverOpenedImpl, onStickersPopoverClosedImpl} from './cometchat-message-composer.formatter-utils';
import {setupConstructorEffectsImpl, ngOnInitImpl as composerNgOnInitImpl, ngOnChangesImpl as composerNgOnChangesImpl, buildAttachmentMenuOptionsImpl} from './cometchat-message-composer.lifecycle-utils';

export const MENTIONS_LIMIT = 10;

export interface AttachmentFile {
  id: string;
  file: File;

  type: 'image' | 'video' | 'audio' | 'file';

  name: string;

  size: number;

  thumbnailUrl?: string;

  uploadProgress: number;

  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  errorMessage?: string;
}

export interface FileSizeError {
  count: number;
  fileType: string;

  limitMB: number;

  timestamp: number;
}
@Component({
  selector: 'cometchat-message-composer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CometChatActionSheetComponent,
    CometChatEmojiKeyboardComponent,
    CometChatMediaRecorderComponent,
    CometChatAvatarComponent,
    CometChatStickersKeyboardComponent,
    CometChatFullScreenViewerComponent,
    CometChatPopoverComponent,
    CometChatMessagePreviewComponent,
    CometChatCreatePollComponent,
    CometChatButtonComponent,
    CometChatLinkDialogComponent,
    CometChatLinkPopoverComponent,
    CometChatErrorBoundaryComponent,
    TranslatePipe,
  ],
  templateUrl: './cometchat-message-composer.component.html',
  styleUrls: ['./cometchat-message-composer.component.css', '../../services/rich-text-editor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CometChatMessageComposerComponent
  implements OnInit, OnDestroy, OnChanges, AfterViewInit
{
  private messageComposerService = inject(MessageComposerService);
  private richTextEditorService = inject(RichTextEditorService);
  private chatStateService = inject(ChatStateService);
  private formatterConfigService = inject(FormatterConfigService);
  private htmlSanitizerService = inject(HtmlSanitizerService);
  private liveAnnouncerService = inject(LiveAnnouncerService);
  private cdr = inject(ChangeDetectorRef);
  private hostElementRef = inject(ElementRef);
  private globalConfig: Partial<GlobalConfig> | null = inject(COMETCHAT_GLOBAL_CONFIG, { optional: true });
  private textFormattersExplicitlySet = signal(false); private disableSoundForMessageExplicitlySet = signal(false); private customSoundForMessageExplicitlySet = signal(false);
  private _textFormatters = signal<CometChatTextFormatter[]>([]); private _disableSoundForMessage = signal(false); private _customSoundForMessage = signal('');
  effectiveTextFormatters = computed(() => { if (this.textFormattersExplicitlySet()) return this._textFormatters(); return this.globalConfig?.textFormatters ?? []; });
  effectiveDisableSoundForMessage = computed(() => { if (this.disableSoundForMessageExplicitlySet()) return this._disableSoundForMessage(); return this.globalConfig?.disableSoundForMessages ?? false; });
  effectiveCustomSoundForMessage = computed(() => { if (this.customSoundForMessageExplicitlySet()) return this._customSoundForMessage(); return this.globalConfig?.customSoundForMessages ?? ''; });
  customRichTextEditor: RichTextEditor | null = null;
  @ViewChild('richTextEditorContainer') richTextEditorContainerRef?: ElementRef<HTMLDivElement>;
  richTextFormatState = signal<RichTextFormatState>({ bold: false, italic: false, underline: false, strikethrough: false, code: false, blockquote: false, codeBlock: false, orderedList: false, bulletList: false, link: false });
  isInlineFormattingDisabled = computed(() => this.richTextFormatState().codeBlock);
  @Input() user?: CometChat.User; @Input() group?: CometChat.Group; @Input() parentMessageId?: number; @Input() placeholderText = 'message_composer_placeholder'; @Input() initialComposerText = ''; @Input() text = '';
  @Input() maxHeight = 200; @Input() enterKeyBehavior: EnterKeyBehavior = EnterKeyBehavior.SendMessage; @Input() attachmentOptions?: CometChatMessageComposerAction[]; @Input() maxAttachments = 10;
  @Input() allowedFileTypes?: string[]; @Input() maxFileSize?: number; @Input() showAttachmentPreview = true; @Input() enableDragDrop = true; @Input() hideAttachmentButton = false;
  @Input() hideImageAttachmentOption = false; @Input() hideVideoAttachmentOption = false; @Input() hideAudioAttachmentOption = false; @Input() hideFileAttachmentOption = false; @Input() hidePollsOption = false;
  @Input() hideCollaborativeDocumentOption = false; @Input() hideCollaborativeWhiteboardOption = false; @Input() hideEmojiKeyboardButton = false; @Input() hideVoiceRecordingButton = false; @Input() hideStickersButton = false;
  @Input() hideLiveReaction = false; @Input() hideSendButton = false; @Input() disableMentions = false; @Input() disableMentionAll = false; @Input() mentionAllLabel = '';
  @Input() mentionsUsersRequestBuilder?: CometChat.UsersRequestBuilder; @Input() mentionsGroupMembersRequestBuilder?: CometChat.GroupMembersRequestBuilder;
  @Input() enableRichText = true; @Input() hideRichTextToolbar = true; @Input() showBubbleMenuOnSelection = false; @Input() layout: 'single-line' | 'multiline' = 'single-line'; @Input() disableAutoFocusOnMobile = true; @Input() disableTypingEvents = false;
  @Input()
  set disableSoundForMessage(value: boolean) { this._disableSoundForMessage.set(value); this.disableSoundForMessageExplicitlySet.set(true); }
  get disableSoundForMessage(): boolean { return this._disableSoundForMessage(); }
  @Input()
  set customSoundForMessage(value: string) { this._customSoundForMessage.set(value); this.customSoundForMessageExplicitlySet.set(true); }
  get customSoundForMessage(): string { return this._customSoundForMessage(); }
  @Input() messageToEdit?: CometChat.BaseMessage; @Input() messageToReply?: CometChat.BaseMessage;
  @Input()
  set textFormatters(value: CometChatTextFormatter[]) { this._textFormatters.set(value); this.textFormattersExplicitlySet.set(true); }
  get textFormatters(): CometChatTextFormatter[] { return this._textFormatters(); }
  @Input() headerView?: TemplateRef<unknown>; @Input() footerView?: TemplateRef<unknown>; @Input() sendButtonView?: TemplateRef<unknown>;
  @Input() auxiliaryButtonView?: TemplateRef<unknown>; @Input() secondaryButtonView?: TemplateRef<unknown>; @Input() attachmentIconView?: TemplateRef<unknown>;
  @Input() voiceRecordingIconView?: TemplateRef<unknown>; @Input() emojiIconView?: TemplateRef<unknown>; @Input() errorView?: TemplateRef<any>;
  @Input() listItemTemplate: TemplateRef<any> | null = null; @Input() emptyStateTemplate: TemplateRef<any> | null = null; @Input() errorStateTemplate: TemplateRef<any> | null = null; @Input() loadingStateTemplate: TemplateRef<any> | null = null;
  @Input({ transform: booleanAttribute }) hideError = false;
  @Output() textChange = new EventEmitter<string>(); @Output() sendButtonClick = new EventEmitter<CometChat.BaseMessage>(); @Output() error = new EventEmitter<CometChat.CometChatException>();
  @Output() closePreview = new EventEmitter<void>(); @Output() attachmentAdded = new EventEmitter<File>(); @Output() attachmentRemoved = new EventEmitter<File>(); @Output() mentionSelected = new EventEmitter<CometChat.User | CometChat.GroupMember>();
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLTextAreaElement>; @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('attachmentButton', { read: ElementRef }) attachmentButtonRef?: ElementRef; @ViewChild('emojiButton', { read: ElementRef }) emojiButtonRef?: ElementRef;
  @ViewChild('stickersButton', { read: ElementRef }) stickersButtonRef?: ElementRef; @ViewChild('voiceButton', { read: ElementRef }) voiceButtonRef?: ElementRef; @ViewChild('sendButton', { read: ElementRef }) sendButtonRef?: ElementRef;
  @ViewChild(CometChatMediaRecorderComponent) mediaRecorderRef?: CometChatMediaRecorderComponent; @ViewChild('bubbleMenuElement', { read: ElementRef }) bubbleMenuElementRef?: ElementRef; @ViewChildren(CometChatPopoverComponent) popoverInstances!: QueryList<CometChatPopoverComponent>;
  readonly attachmentIconUrl = 'assets/add_circle.svg'; readonly attachmentIconUrlActive = 'assets/add_circle_fill.svg'; readonly emojiIconUrl = 'assets/mood.svg'; readonly emojiIconUrlActive = 'assets/mood_fill.svg';
  readonly stickerIconUrl = 'assets/sticker.svg'; readonly stickerIconUrlActive = 'assets/sticker_fill.svg'; readonly voiceIconUrl = 'assets/mic.svg'; readonly sendIconUrl = 'assets/send_fill.svg'; readonly toolbarToggleIconUrl = 'assets/toolbar-toggle.svg';
  protected currentUser = signal<CometChat.User | null>(null); protected currentGroup = signal<CometChat.Group | null>(null); composerError = signal<Error | null>(null); private propsProvided = signal<boolean>(false);
  Placement = Placement; contentToDisplay = signal<'attachments' | 'emojiKeyboard' | 'voiceRecording' | 'stickers' | 'ai' | 'none'>('none');
  composerText = signal<string>(''); attachments = signal<AttachmentFile[]>([]); isEmojiKeyboardOpen = signal<boolean>(false); isStickersKeyboardOpen = signal<boolean>(false);
  isFixedToolbarShown = signal<boolean>(false); isFixedToolbarManuallyToggled = signal<boolean>(false); isFullscreenViewerOpen = signal<boolean>(false); fullscreenViewerIndex = signal<number>(0);
  isAttachmentMenuOpen = signal<boolean>(false); isMentionSuggestionsOpen = signal<boolean>(false); isRecording = signal<boolean>(false); isPollModalOpen = signal<boolean>(false);
  isLinkDialogOpen = signal<boolean>(false); isLinkPopoverOpen = signal<boolean>(false); linkPopoverUrl = signal<string>(''); linkPopoverText = signal<string>(''); linkPopoverX = signal<number>(0); linkPopoverY = signal<number>(0);
  linkDialogMode = signal<'add' | 'edit'>('add'); linkDialogInitialText = signal<string>(''); linkDialogInitialUrl = signal<string>(''); linkDialogX = signal<number>(0); linkDialogY = signal<number>(0);
  private savedLinkSelection: SelectionState | null = null; isExtensionLoading = signal<boolean>(false); recordingDuration = signal<number>(0); isDraggingOver = signal<boolean>(false);
  protected bubbleMenuPosition = signal<{ top: number; left: number } | null>(null); private bubbleMenuDebounceTimer: ReturnType<typeof setTimeout> | null = null; private isMouseDown = false;
  protected isBubbleMenuVisible = signal<boolean>(false); protected isMobileView = signal<boolean>(false); protected textSelection = signal<{ from: number; to: number } | null>(null);
  private dragCounter = 0; private boundResizeHandler: (() => void) | null = null; mentionSearchText = signal<string>('');
  cursorPosition = signal<number>(0); focusedMentionIndex = signal<number>(0); mentionSuggestions = computed(() => this.messageComposerService.mentionSuggestions()); isFetchingMentions = computed(() => this.messageComposerService.isFetchingMentions());
  mentionsRequestBuilder: CometChat.UsersRequestBuilder | CometChat.GroupMembersRequestBuilder | null = null; isFetchingMoreMentions = computed(() => this.messageComposerService.isFetchingMoreMentions()); hasMoreMentions = computed(() => this.messageComposerService.hasMoreMentions());
  textFormatterArray = signal<CometChatTextFormatter[]>([]); mentionsFormatter = signal<CometChatMentionsFormatter | null>(null); liveRegionPoliteText = signal<string>(''); liveRegionAssertiveText = signal<string>('');
  fileSizeError = signal<FileSizeError | null>(null); uniqueMentionCount = signal<number>(0); showMentionsCountWarning = signal<boolean>(false);
  private plainTextMentionUids = new Set<string>(); private mentionedUsersMap = new Map<string, CometChat.User>(); private skipNextMentionCheck = false;
  messageToReplySignal = signal<CometChat.BaseMessage | null>(null); textMessageToEdit = signal<CometChat.TextMessage | null>(null); isEditMode = signal<boolean>(false);
  canSend = computed(() => this.composerText().trim().length > 0 || this.attachments().length > 0 || this.isRecording()); showVoiceButton = computed(() => !this.composerText().trim().length);
  isInReplyMode = computed(() => !!this.parentMessageId); isInQuotedReplyMode = computed(() => !!this.messageToReplySignal()); isInEditMode = computed(() => !!this.messageToEdit || !!this.textMessageToEdit());
  hasAttachments = computed(() => this.attachments().length > 0); attachmentCount = computed(() => this.attachments().length); canAddMoreAttachments = computed(() => this.attachments().length < this.maxAttachments);
  protected shouldShowToolbar = computed(() => { if (!this.enableRichText) return false; if (this.isMobileView() && this.showBubbleMenuOnSelection && this.isFixedToolbarShown()) return true; return !this.hideRichTextToolbar; });
  protected currentLayoutMode = computed(() => this.layout); protected isMultilineLayout = computed(() => this.layout === 'multiline');
  attachmentMenuOptions = computed(() => buildAttachmentMenuOptionsImpl(this as any));
  private readonly destroyRef = inject(DestroyRef); private typingTimeout?: ReturnType<typeof setTimeout>; private originalTextBeforeEdit = ''; private _enteringEditMode = false;

  constructor() {
    setupConstructorEffectsImpl(this as any);
  }
  ngOnInit(): void { try { composerNgOnInitImpl(this as any); } catch (error) { this.handleLifecycleError(error, 'ngOnInit'); } }
  ngAfterViewInit(): void { try { this.initializeRichTextEditor(); } catch (error) { this.handleLifecycleError(error, 'ngAfterViewInit'); } }
  ngOnChanges(changes: SimpleChanges): void { try { composerNgOnChangesImpl(this as any, changes); } catch (error) { CometChatLogger.error('CometChatMessageComposer', 'Error in ngOnChanges:', error); } }
  ngOnDestroy(): void { try { if (this.boundResizeHandler) { window.removeEventListener('resize', this.boundResizeHandler); this.boundResizeHandler = null; } if (this.typingTimeout) { clearTimeout(this.typingTimeout); this.typingTimeout = undefined; } this.endTypingIndicator(); this.destroyRichTextEditor(); this.messageComposerService.cleanup(); } catch (error) { CometChatLogger.error('CometChatMessageComposer', 'Error during cleanup:', error); } }
  private handleLifecycleError(error: unknown, hook: string): void { const err = error instanceof Error ? error : new Error(String(error)); CometChatLogger.error('CometChatMessageComposer', `Error in ${hook}:`, err); this.composerError.set(err); this.error.emit(err as CometChat.CometChatException); }
  handleRetryClick(): void {
    this.composerError.set(null);
    try {
      this.setupErrorCallback();
      this.initializeMobileViewDetection();
      this.initializeComposerText();
      this.initializeTextFormatters();
    } catch (error) {
      this.handleLifecycleError(error, 'handleRetryClick');
    }
  }
  private setupErrorCallback(): void {
    this.messageComposerService.setErrorCallback((error: CometChat.CometChatException) => {
      this.error.emit(error);
    });
  }
  private initializeComposerText(): void {
    if (this.text) { this.composerText.set(this.text); this.textChange.emit(this.text); } else if (this.initialComposerText) {
      this.composerText.set(this.initialComposerText);
      this.textChange.emit(this.initialComposerText);
    }
  }
  private initializeMobileViewDetection(): void {
    this.updateMobileViewState();
    this.boundResizeHandler = () => this.updateMobileViewState();
    window.addEventListener('resize', this.boundResizeHandler);
  }
  private updateMobileViewState(): void {
    const isMobile = window.innerWidth < 480;
    this.isMobileView.set(isMobile);
  }
  private initializeTextFormatters(): void { initializeTextFormattersImpl(this as any); }
  private getComposerId(): { user: string | null; group: string | null; parentMessageId: number | null; } {
    return { user: this.currentUser()?.getUid() || null, group: this.currentGroup()?.getGuid() || null, parentMessageId: this.parentMessageId || null };
  }
  private configureTextFormatters(): void { configureTextFormattersImpl(this as any); }
  private forwardKeyEventToFormatters(event: KeyboardEvent, eventType: 'keydown' | 'keyup'): void { forwardKeyEventToFormattersImpl(this as any, event, eventType); }
  private updateFormatterCaretPosition(): void { updateFormatterCaretPositionImpl(this as any); }
  private subscribeToActivePopoverEvent(): void { subscribeToActivePopoverEventImpl(this as any); }
  private subscribeToReplyToMessageEvent(): void { subscribeToReplyToMessageEventImpl(this as any); }
  private subscribeToMessageEditedEvent(): void { subscribeToMessageEditedEventImpl(this as any); }
  private subscribeToMessageDeletedEvent(): void { subscribeToMessageDeletedEventImpl(this as any); }
  private subscribeToComposeMessageEvent(): void { subscribeToComposeMessageEventImpl(this as any); }
  private subscribeToSdkMessageDeletedEvent(): void { subscribeToSdkMessageDeletedEventImpl(this as any); }
  private subscribeToShowModalEvent(): void { subscribeToShowModalEventImpl(this as any); }
  private subscribeToHideModalEvent(): void { subscribeToHideModalEventImpl(this as any); }
  private subscribeToShowMentionsCountWarningEvent(): void { subscribeToShowMentionsCountWarningEventImpl(this as any); }
  private insertTextFromExternalSource(text: string): void {
    const currentText = this.composerText();
    const newText = currentText ? `${currentText} ${text}` : text;
    this.composerText.set(newText);
    if (this.customRichTextEditor && this.enableRichText) { this.richTextEditorService.setContent(this.customRichTextEditor, newText); }
  }
  private syncLegacyPopoverSignals(): void { syncLegacyPopoverSignalsImpl(this as any); }
  toggleEmojiKeyboard(): void { toggleEmojiKeyboardImpl(this as any); }
  toggleAttachmentMenu(): void { toggleAttachmentMenuImpl(this as any); }
  toggleVoiceRecording(): void { toggleVoiceRecordingImpl(this as any); }
  toggleStickersKeyboard(): void { toggleStickersKeyboardImpl(this as any); }
  toggleAI(): void { toggleAIImpl(this as any); }
  private handleEditModeChange(messageToEdit?: CometChat.BaseMessage): void {
    if (messageToEdit) { this.enterEditMode(messageToEdit as CometChat.TextMessage); } else if (this.originalTextBeforeEdit !== undefined) {
      // (the event was already emitted by the source that cleared the input)
      this.exitEditModeWithoutEvent();
    }
  }
  private handleReplyModeChange(messageToReply?: CometChat.BaseMessage): void {
    if (messageToReply) { this.enterReplyMode(messageToReply); } else {
      this.exitReplyMode();
    }
  }
  private resetComposerState(): void { resetComposerStateImpl(this as any); }
  private clearComposer(): void { clearComposerImpl(this as any); }
  enterReplyMode(message: CometChat.BaseMessage): void { enterReplyModeImpl(this as any, message); }
  exitReplyMode(): void { exitReplyModeImpl(this as any); }
  openPollModal(): void { openPollModalImpl(this as any); }
  closePollModal(): void { closePollModalImpl(this as any); }
  onPollCreated(): void { onPollCreatedImpl(this as any); }
  handleLinkDialogSave(linkData: LinkData): void { handleLinkDialogSaveImpl(this as any, linkData); }
  handleLinkDialogRemove(): void { handleLinkDialogRemoveImpl(this as any); }
  handleLinkDialogCancel(): void { handleLinkDialogCancelImpl(this as any); }
  private computeLinkDialogLeft(viewportX: number): number { return computeLinkDialogLeftImpl(this as any, viewportX); }
  private handleLinkClick(url: string, text: string, x: number, y: number): void { handleLinkClickImpl(this as any, url, text, x, y); }
  handleLinkPopoverEdit(data: { url: string; text: string }): void { handleLinkPopoverEditImpl(this as any, data); }
  handleLinkPopoverRemove(): void { handleLinkPopoverRemoveImpl(this as any); }
  handleLinkPopoverClose(): void { handleLinkPopoverCloseImpl(this as any); }
  async createCollaborativeDocument(): Promise<void> { return createCollaborativeDocumentImpl(this as any); }
  async createCollaborativeWhiteboard(): Promise<void> { return createCollaborativeWhiteboardImpl(this as any); }
  getReplyPreviewTitle(): string { return getReplyPreviewTitleImpl(this as any); }
  getReplyPreviewSubtitle(): string { return getReplyPreviewSubtitleImpl(this as any); }
  private formatReplyPreviewText(message: CometChat.TextMessage): string { return formatReplyPreviewTextImpl(this as any, message); }
  onReplyPreviewClose(): void { onReplyPreviewCloseImpl(this as any); }
  enterEditMode(message: CometChat.TextMessage): void { enterEditModeImpl(this as any, message); }
  private populateEditorWithFormattedText(message: CometChat.TextMessage): void { populateEditorWithFormattedTextImpl(this as any, message); }
  cancelEdit(): void { cancelEditImpl(this as any); }
  getCurrentEditMessage(): CometChat.BaseMessage | null {
    return this.messageToEdit || this.textMessageToEdit();
  }
  getEditPreviewTitle(): string { return getEditPreviewTitleImpl(); }
  getEditPreviewSubtitle(): string { return getEditPreviewSubtitleImpl(this as any); }
  private formatEditPreviewText(message: CometChat.TextMessage): string { return formatEditPreviewTextImpl(this as any, message); }
  private convertMarkdownToHtml(text: string): string { return convertMarkdownToHtmlImpl(text); }
  onEditPreviewClose(): void { onEditPreviewCloseImpl(this as any); }
  private exitEditModeWithoutEvent(): void { exitEditModeWithoutEventImpl(this as any); }
  private exitEditMode(): void { this.exitEditModeWithoutEvent(); }
  private initializeRichTextEditor(): void { initializeRichTextEditorImpl(this as any); }
  private handleRichTextKeydown(event: KeyboardEvent): void { handleRichTextKeydownImpl(this as any, event); }
  private destroyRichTextEditor(): void {
    if (this.customRichTextEditor) {
      this.richTextEditorService.destroyEditor(this.customRichTextEditor);
      this.customRichTextEditor = null;
      this.richTextEditorService.resetFormatState();
    }
  }
  private handleRichTextUpdate(html: string, text: string): void { handleRichTextUpdateImpl(this as any, html, text); }
  getRichTextMetadata(): RichTextMetadata | undefined {
    if (!this.enableRichText) { return undefined; }
    if (this.customRichTextEditor) { return this.richTextEditorService.getRichTextMetadata(this.customRichTextEditor); }
    return undefined;
  }
  insertTextIntoRichTextEditor(text: string): void {
    if (this.customRichTextEditor) { this.richTextEditorService.insertText(this.customRichTextEditor, text); }
  }
  clearRichTextEditorContent(): void {
    if (this.customRichTextEditor) { this.richTextEditorService.clearContent(this.customRichTextEditor); }
  }
  focusRichTextEditor(): void { focusRichTextEditorImpl(this as any); }
  handleTextInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    const newText = target.value;
    this.composerText.set(newText);
    this.textChange.emit(newText);
    this.cursorPosition.set(target.selectionStart || 0);
    if (!this.disableTypingEvents) { this.handleTypingStart(); }
    if (!this.disableMentions) { this.checkForMentionTrigger(newText, target.selectionStart || 0); }
    this.updateFormatterCaretPosition();
  }
  handleKeydown(event: KeyboardEvent): void { handleKeydownImpl(this as any, event); }
  handleKeyup(event: KeyboardEvent): void { handleKeyupImpl(this as any, event); }
  async handleSend(): Promise<void> { return handleSendImpl(this as any); }
  private async handleEditMessage(newText: string, messageToEdit: CometChat.BaseMessage): Promise<void> { return handleEditMessageImpl(this as any, newText, messageToEdit); }
  private async handleSendNewMessage(receiver: CometChat.User | CometChat.Group, text: string, attachments: AttachmentFile[]): Promise<void> { return handleSendNewMessageImpl(this as any, receiver, text, attachments); }
  private buildMessageMetadata(): Record<string, unknown> | undefined { return buildMessageMetadataImpl(this as any); }
  private extractMentionedUsers(): CometChat.User[] { return extractMentionedUsersImpl(this as any); }
  private applyTextFormatters<T extends CometChat.TextMessage>(message: T): T { return applyTextFormattersImpl(this as any, message); }
  private getMediaMessageType(fileType: 'image' | 'video' | 'audio' | 'file'): string { return getMediaMessageTypeImpl(fileType); }
  private playOutgoingMessageSound(): void { playOutgoingMessageSoundImpl(this as any); }
  private resetMentionsFormatter(): void {
    const formatter = this.mentionsFormatter();
    if (formatter) { formatter.reset(); }
  }
  handleAttachmentButtonClick(): void { handleAttachmentButtonClickImpl(this as any); }
  handleAttachmentOptionClick(optionId: string): void { handleAttachmentOptionClickImpl(this as any, optionId); }
  handleActionSheetItemClick(action: CometChatMessageComposerAction | CometChatActionsView): void { handleActionSheetItemClickImpl(this as any, action); }
  handleActionSheetClose(): void { handleActionSheetCloseImpl(this as any); }
  handleEmojiButtonClick(): void { this.toggleEmojiKeyboard(); }
  handleEmojiSelect(emoji: string): void { handleEmojiSelectImpl(this as any, emoji); }
  handleEmojiKeyboardClose(): void { handleEmojiKeyboardCloseImpl(this as any); }
  private closeAllPopoverInstances(): void {
    this.popoverInstances?.forEach(popover => {
      if (popover.isOpen) { popover.closePopover(); }
    });
  }
  onEmojiPopoverOpened(): void { onEmojiPopoverOpenedImpl(this as any); }
  onEmojiPopoverClosed(): void { onEmojiPopoverClosedImpl(this as any); }
  onAttachmentPopoverOpened(): void { onAttachmentPopoverOpenedImpl(this as any); }
  onAttachmentPopoverClosed(): void { onAttachmentPopoverClosedImpl(this as any); }
  onVoiceRecorderPopoverOpened(): void { onVoiceRecorderPopoverOpenedImpl(this as any); }
  onVoiceRecorderPopoverClosed(): void { onVoiceRecorderPopoverClosedImpl(this as any); }
  onStickersPopoverOpened(): void { onStickersPopoverOpenedImpl(this as any); }
  onStickersPopoverClosed(): void { onStickersPopoverClosedImpl(this as any); }
  async handleStickerSelect(event: StickerClickEvent): Promise<void> { return handleStickerSelectImpl(this as any, event); }
  handleStickersKeyboardClose(): void { handleStickersKeyboardCloseImpl(this as any); }
  private async sendStickerMessage(
    receiver: CometChat.User | CometChat.Group,
    stickerUrl: string,
    stickerName: string
  ): Promise<void> { return sendStickerMessageImpl(this as any, receiver, stickerUrl, stickerName); }
  handleAttachmentClick(attachment: AttachmentFile, index: number): void { handleAttachmentClickImpl(this as any, attachment, index); }
  handleFullscreenViewerClose(): void { handleFullscreenViewerCloseImpl(this as any); }
  handleFullscreenViewerPrevious(): void { handleFullscreenViewerPreviousImpl(this as any); }
  handleFullscreenViewerNext(): void { handleFullscreenViewerNextImpl(this as any); }
  getCurrentFullscreenAttachment(): AttachmentFile | undefined { return getCurrentFullscreenAttachmentImpl(this as any); }
  insertTextAtCursor(textToInsert: string): number { return insertTextAtCursorImpl(this as any, textToInsert); }
  private focusTextInput(): void { focusTextInputImpl(this as any); }
  private focusAttachmentButton(): void { focusAttachmentButtonImpl(this as any); }
  private focusEmojiButton(): void { focusEmojiButtonImpl(this as any); }
  private focusStickersButton(): void { focusStickersButtonImpl(this as any); }
  private focusVoiceButton(): void { focusVoiceButtonImpl(this as any); }
  handleVoiceRecordingClick(): void { handleVoiceRecordingClickImpl(this as any); }
  startInlineRecording(): void { startInlineRecordingImpl(this as any); }
  toggleFixedToolbar(): void { toggleFixedToolbarImpl(this as any); }
  async handleRecordingComplete(audioBlob: Blob): Promise<void> { return handleRecordingCompleteImpl(this as any, audioBlob); }
  handleRecordingCancel(): void { handleRecordingCancelImpl(this as any); }
  handleRecordingError(error: Error): void { handleRecordingErrorImpl(this as any, error); }
  handleClosePreview(): void {
    if (this.isInEditMode() && this.messageToEdit) { this.cancelEdit(); } else if (this.isInQuotedReplyMode()) {
      this.onReplyPreviewClose();
    } else {
      this.closePreview.emit();
    }
  }
  closeAllPopups(): void { closeAllPopupsImpl(this as any); }
  private isAnyPopupOpen(): boolean {
    return (
      this.isEmojiKeyboardOpen() ||
      this.isStickersKeyboardOpen() ||
      this.isAttachmentMenuOpen() ||
      this.isMentionSuggestionsOpen() ||
      this.isRecording() ||
      this.isFullscreenViewerOpen()
    );
  }
  private handleFormattingShortcuts(event: KeyboardEvent): boolean { return handleFormattingShortcutsImpl(this as any, event); }
  private closeBubbleMenu(): void {
    if (this.customRichTextEditor) { this.customRichTextEditor.getContentEditable().focus(); }
    this.isBubbleMenuVisible.set(false);
    this.textSelection.set(null);
    this.cdr.markForCheck();
  }
  @HostListener('keydown.escape', ['$event'])
  handleGlobalEscapeKey(event: Event): void { handleGlobalEscapeKeyImpl(this as any, event); }
  private readonly TYPING_TIMEOUT_MS = 500;
  private handleTypingStart(): void { handleTypingStartImpl(this as any); }
  private startTyping(): void { startTypingImpl(this as any); }
  private endTypingIndicator(): void { endTypingIndicatorImpl(this as any); }
  private getReceiver(): CometChat.User | CometChat.Group | undefined {
    return this.currentUser() ?? this.currentGroup() ?? undefined;
  }
  private checkForMentionTrigger(text: string, cursorPos: number): void { checkForMentionTriggerImpl(this as any, text, cursorPos); }
  private scrollMentionIntoView(index: number): void { scrollMentionIntoViewImpl(this as any, index); }
  private closeMentionSuggestions(): void { closeMentionSuggestionsImpl(this as any); }
  private updateMentionsCount(): void { updateMentionsCountImpl(this as any); }
  private initializeMentionsRequestBuilder(searchText: string): void { initializeMentionsRequestBuilderImpl(this as any, searchText); }
  async fetchMoreMentions(): Promise<void> { return fetchMoreMentionsImpl(this as any); }
  handleMentionsScroll(event: Event): void { handleMentionsScrollImpl(this as any, event); }
  private async checkIfSelfMention(userId: string): Promise<boolean> { return checkIfSelfMentionImpl(this as any, userId); }
  async selectMentionSuggestion(suggestion: MentionSuggestion): Promise<void> { return selectMentionSuggestionImpl(this as any, suggestion); }
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMentionSuggestionsOpen()) { return; }
    const target = event.target as HTMLElement;
    const mentionPanel = target.closest('.cometchat-message-composer__mention-suggestions');
    const richTextEditor = target.closest('.cometchat-message-composer__rich-text-editor');
    if (!mentionPanel && !richTextEditor) { this.closeMentionSuggestions(); }
  }
  private emitError(error: unknown): void { emitErrorImpl(this as any, error); }
  private announcePolite(message: string): void { announcePoliteImpl(this as any, message); }
  private announceAssertive(message: string): void { announceAssertiveImpl(this as any, message); }
  private announceReplyModeActivated(): void { announceReplyModeActivatedImpl(this as any); }
  private announceEditModeActivated(): void { announceEditModeActivatedImpl(this as any); }
  private announceRecordingStarted(): void { announceRecordingStartedImpl(this as any); }
  private announceRecordingStopped(): void { announceRecordingStoppedImpl(this as any); }
  private announceMessageSent(): void { announceMessageSentImpl(this as any); }
  private announceAttachmentAdded(fileName: string): void { announceAttachmentAddedImpl(this as any, fileName); }
  private announceAttachmentRemoved(fileName: string): void { announceAttachmentRemovedImpl(this as any, fileName); }
  private announceFocusedMention(name: string, position: number, total: number): void { announceFocusedMentionImpl(this as any, name, position, total); }
  private announceMentionSuggestionsCount(count: number): void { announceMentionSuggestionsCountImpl(this as any, count); }
  private announceMentionInserted(name: string): void { announceMentionInsertedImpl(this as any, name); }
  private announceFormatStateChange(formatName: string, enabled: boolean): void { announceFormatStateChangeImpl(this as any, formatName, enabled); }
  handleDragEnter(event: DragEvent): void { handleDragEnterImpl(this as any, event); }
  handleDragLeave(event: DragEvent): void { handleDragLeaveImpl(this as any, event); }
  handleDragOver(event: DragEvent): void { handleDragOverImpl(this as any, event); }
  handleDrop(event: DragEvent): void { handleDropImpl(this as any, event); }
  handlePaste(event: ClipboardEvent): void { handlePasteImpl(this as any, event); }
  handleFileInputChange(event: Event): void { handleFileInputChangeImpl(this as any, event); }
  private processFiles(files: File[]): void { processFilesImpl(this as any, files); }
  private async sendFilesDirectly(files: File[]): Promise<void> { return sendFilesDirectlyImpl(this as any, files); }
  handleRemoveAttachment(attachment: AttachmentFile): void { handleRemoveAttachmentImpl(this as any, attachment); }
  private getFileType(file: File): 'image' | 'video' | 'audio' | 'file' { return getFileTypeUtil(file); }
  private getFileTypeLabel(mimeType: string): string { return getFileTypeLabelUtil(mimeType); }
  dismissFileSizeError(): void { this.fileSizeError.set(null); }
  getFileSizeErrorMessage(): string { return getFileSizeErrorMessageImpl(this as any); }
  private getPluralFileType(fileType: string): string { return getPluralFileTypeUtil(fileType); }
  handleInputFocus(): void {
  }
  handleInputBlur(): void {
    // The composerText signal maintains the current content
  }
  get templateContext(): { user?: CometChat.User; group?: CometChat.Group } { return { user: this.currentUser() || undefined, group: this.currentGroup() || undefined }; }
  handleToolbarBold(): void { handleToolbarBoldImpl(this as any); }
  handleToolbarItalic(): void { handleToolbarItalicImpl(this as any); }
  handleToolbarUnderline(): void { handleToolbarUnderlineImpl(this as any); }
  handleToolbarStrikethrough(): void { handleToolbarStrikethroughImpl(this as any); }
  handleToolbarInlineCode(): void { handleToolbarInlineCodeImpl(this as any); }
  handleToolbarLink(): void { handleToolbarLinkImpl(this as any); }
  handleToolbarOrderedList(): void { handleToolbarOrderedListImpl(this as any); }
  handleToolbarBulletList(): void { handleToolbarBulletListImpl(this as any); }
  handleToolbarCodeBlock(): void { handleToolbarCodeBlockImpl(this as any); }
  handleToolbarBlockquote(): void { handleToolbarBlockquoteImpl(this as any); }
  private handleSelectionUpdate(formatState: RichTextFormatState): void { handleSelectionUpdateImpl(this as any, formatState); }
  private updateBubbleMenuPosition(range: Range): void { updateBubbleMenuPositionImpl(this as any, range); }
  private calculateAndSetPosition(rect: DOMRect, editorRect: DOMRect, composerRect: DOMRect, bubbleMenuWidth: number): void { calculateAndSetPositionImpl(this as any, rect, editorRect, composerRect, bubbleMenuWidth); }
  private getTextOffsetFromNode(root: HTMLElement, node: Node, offset: number): number { return getTextOffsetFromNodeImpl(root, node, offset); }
  private updateFormatStateFromEditor(): void { updateFormatStateFromEditorImpl(this as any); }
}
