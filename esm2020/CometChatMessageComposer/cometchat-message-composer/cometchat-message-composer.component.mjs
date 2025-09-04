import "@cometchat/uikit-shared";
import "@cometchat/uikit-elements";
import { CometChatMentionsFormatter, CometChatSoundManager, CometChatUIKitUtility, MessageComposerStyle, StickersConstants, UserMemberWrapperConfiguration, UserMentionStyle, } from "@cometchat/uikit-shared";
import { MediaRecorderStyle, processSubtitleContent } from "@cometchat/uikit-elements";
import { ActivePopover, AuxiliaryButtonAlignment, CometChatMessageEvents, CometChatUIEvents, CometChatUIKitConstants, MessageStatus, Placement, PreviewMessageMode, States, UserMemberListType, fontHelper, localize, } from "@cometchat/uikit-resources";
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild, } from "@angular/core";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { CometChatException } from "../../Shared/Utils/ComeChatException";
import * as i0 from "@angular/core";
import * as i1 from "../../CometChatTheme.service";
import * as i2 from "../../CometChatUserMemberWrapper/cometchat-user-member-wrapper.component";
import * as i3 from "@angular/common";
/**
 *
 * CometChatMessageComposer is used to send message to user or group.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
export class CometChatMessageComposerComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.disableSoundForMessages = false;
        /**
      * @deprecated
      *
      * This property is deprecated as of version 4.3.19 due to newer property 'customSoundForMessages'. It will be removed in subsequent versions.
      */
        this.customSoundForMessage = "";
        this.customSoundForMessages = "";
        this.disableTypingEvents = false;
        this.text = "";
        this.placeholderText = localize("ENTER_YOUR_MESSAGE_HERE");
        this.attachmentIconURL = "assets/Plus.svg";
        this.auxiliaryButtonsAlignment = AuxiliaryButtonAlignment.right;
        this.parentMessageId = 0;
        this.hideLiveReaction = true;
        this.LiveReactionIconURL = "assets/heart-reaction.png";
        this.backButtonIconURL = "assets/backbutton.svg";
        this.InfoSimpleIcon = "assets/InfoSimpleIcon.svg";
        this.messageComposerStyle = {
            height: "100%",
            width: "100%",
            borderRadius: "12px",
            maxInputHeight: "100px",
        };
        this.onError = (error) => {
            console.log(error);
        };
        this.backdropStyle = {
            height: "100%",
            width: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            position: "fixed",
        };
        this.actionSheetStyle = {
            layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
            borderRadius: "inherit",
            background: "rgb(255,255,255)",
            border: "none",
            width: "100%",
            height: "100%",
            titleFont: "500 15px Inter, sans-serif",
            titleColor: "#141414",
            listItemBackground: "",
            ActionSheetSeparatorTint: "1px solid RGBA(20, 20, 20, 0.08)",
            listItemIconBackground: "",
            listItemIconTint: ""
        };
        this.aiActionSheetStyle = {
            layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
            borderRadius: "inherit",
            background: "rgb(255,255,255)",
            border: "none",
            width: "100%",
            height: "100%",
            titleFont: "500 15px Inter, sans-serif",
            titleColor: "#141414",
            listItemBackground: "transparent",
            ActionSheetSeparatorTint: "1px solid RGBA(20, 20, 20, 0.08)",
        };
        this.hideVoiceRecording = false;
        this.mediaRecorderStyle = {};
        this.aiOptionsStyle = {};
        this.aiIconURL = "assets/ai-bot.svg";
        this.voiceRecordingIconURL = "assets/mic.svg";
        this.voiceRecordingCloseIconURL = "assets/close2x.svg";
        this.voiceRecordingStartIconURL = "assets/mic.svg";
        this.voiceRecordingStopIconURL = "assets/stop.svg";
        this.voiceRecordingSubmitIconURL = "assets/Send.svg";
        this.hideLayoutMode = false;
        this.emojiIconURL = "assets/Stipop.svg";
        this.childEvent = new EventEmitter();
        this.userMemberWrapperConfiguration = new UserMemberWrapperConfiguration({});
        this.textFormatters = [];
        this.sendButtonIconURL = "assets/Send.svg";
        this.mentionsFormatterInstanceId = "composer_" + Date.now();
        this.composerActions = [];
        this.states = States;
        this.mentionsSearchTerm = "";
        this.showListForMentions = false;
        this.mentionsSearchCount = 1;
        this.lastEmptySearchTerm = "";
        this.smartReplyState = States.loading;
        this.showMentionsCountWarning = false;
        this.initialText = "";
        this.loadingStateText = localize("GENERATING_REPLIES");
        this.errorStateText = localize("SOMETHING_WRONG");
        this.emptyStateText = localize("NO_MESSAGES_FOUND");
        this.showCreatePolls = false;
        this.showStickerKeyboard = false;
        this.showActionSheetItem = false;
        this.showActionSheetItemAI = false;
        this.showSmartReply = false;
        this.showAiFeatures = false;
        this.repliesArray = [];
        this.aiBotList = [];
        this.currentAskAIBot = "";
        this.isAiMoreThanOne = false;
        this.showPreview = false;
        this.aiFeaturesCloseCallback = null;
        this.textFormatterList = this.textFormatters
            ? [...this.textFormatters]
            : [];
        this.mentionedUsers = [];
        this.enableStickerKeyboard = false;
        this.toggleMediaRecorded = false;
        this.showAiBotList = false;
        this.mentionsTypeSetByUser = false;
        this.stickerConfiguration = {};
        this.closeButtonIconURL = "assets/plus-rotated.svg";
        this.buttons = [];
        this.aiActionButtons = [];
        this.smartReplyStyle = {
            width: "100%",
            height: "fit-content",
            border: "none",
        };
        this.sendButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "rgba(20, 20, 20, 0.58)",
            background: "transparent",
        };
        this.liveReactionStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "red",
            background: "transparent",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
        };
        this.localize = localize;
        this.emojiButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "grey",
            background: "transparent",
        };
        this.stickerButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "grey",
            background: "transparent",
        };
        this.mediaRecorderButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "grey",
            background: "transparent",
        };
        this.emojiKeyboardStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            textFont: this.messageComposerStyle?.emojiKeyboardTextFont,
            textColor: this.messageComposerStyle?.emojiKeyboardTextColor,
            background: this.themeService.theme.palette.getBackground(),
            borderRadius: "12px",
            activeIconTint: this.themeService.theme.palette.getPrimary(),
            iconTint: this.themeService.theme.palette.getAccent600()
        };
        this.stickerKeyboardStyle = {};
        this.textInputStyle = {};
        this.previewStyle = {
            height: "100%",
            width: "100%",
        };
        this.createPollStyle = {};
        this.emojiPopover = {
            width: "315px",
            height: "320px",
            border: "none",
            background: "transparent",
            borderRadius: "8px",
            boxShadow: "0px 0px 8px rgba(20, 20, 20, 0.2)",
        };
        this.stickerPopover = {
            width: "300px",
            height: "320px",
            border: "none",
            background: "transparent",
            borderRadius: "8px",
            boxShadow: "0px 0px 8px rgba(20, 20, 20, 0.2)",
        };
        this.aiPopover = {
            width: "280px",
            height: "280px",
            border: "none",
            background: "transparent",
            borderRadius: "8px",
            boxShadow: "0px 0px 8px rgba(20, 20, 20, 0.2)",
        };
        this.mediaRecordedPopover = {
            width: "250px",
            height: "100px",
            borderRadius: "8px",
            boxShadow: "0px 0px 8px rgba(20, 20, 20, 0.2)",
        };
        this.popoverStyle = {
            width: "275px",
            height: "280px",
            border: "none",
            background: "transparent",
            borderRadius: "8px",
            boxShadow: "0px 0px 8px rgba(20, 20, 20, 0.2)",
        };
        this.emojiButtonIconURL = "assets/Stipop.svg";
        this.stickerButtonIconURL = "assets/Stickers.svg";
        this.messageText = "";
        this.attachmentButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: "grey",
            background: "transparent",
        };
        this.auxilaryPlacement = Placement.top;
        this.messageSending = false;
        this.editPreviewText = "";
        this.showSendButton = false;
        this.showEmojiKeyboard = false;
        this.isAiEnabled = false;
        this.smartReplies = [];
        this.mentionStyleLocal = new UserMentionStyle({});
        this.sendMessageOnEnter = (event) => {
            this.showMentionsCountWarning = false;
            this.showListForMentions = false;
            this.sendTextMessage(event.detail.value);
            this.clearComposer();
            this.showSendButton = false;
            this.disableSendButton();
        };
        this.messageInputChanged = (event) => {
            const text = event?.detail?.value?.trim();
            this.sendButtonStyle = {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                buttonIconTint: text
                    ? this.messageComposerStyle?.sendIconTint
                    : this.themeService.theme.palette.getAccent200(),
                background: "transparent",
            };
            if (!text) {
                this.showSendButton = false;
            }
            else {
                this.showSendButton = true;
            }
            if (this.onTextChange) {
                this.onTextChange(text);
            }
            this.messageText = text;
            if (text) {
                this.startTyping();
            }
            else {
                this.endTyping();
            }
        };
        this.appendEmoji = (event) => {
            if (this.text === event?.detail.id) {
                this.text = "" + "";
                this.ref.detectChanges();
            }
            this.text = event?.detail.id;
            this.ref.detectChanges();
        };
        this.openCreatePolls = () => {
            this.showCreatePolls = true;
            if (this.showActionSheetItem) {
                this.actionSheetRef.nativeElement.click();
                this.showActionSheetItem = !this.showActionSheetItem;
            }
            this.ref.detectChanges();
        };
        this.closeCreatePolls = () => {
            this.showCreatePolls = false;
            this.ref.detectChanges();
        };
        this.sendRecordedMedia = (event) => {
            let file = event?.detail?.file;
            if (file) {
                this.sendRecordedAudio(file);
            }
            this.closeMediaRecorder();
            this.ref.detectChanges();
        };
        this.sendRecordedAudio = (file) => {
            try {
                const uploadedFile = file;
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    const newFile = new File([reader.result], `audio-recording-${this.getFormattedDate()}.wav`, uploadedFile);
                    this.sendMediaMessage(newFile, CometChatUIKitConstants.MessageTypes.audio);
                }, false);
                reader.readAsArrayBuffer(uploadedFile);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
            return true;
        };
        /*
      * isPartOfCurrentChatForUIEvent: To check if the message belongs for this list and is not part of thread even for current list
      it only runs for UI event because it assumes logged in user is always sender
      * @param: message: CometChat.BaseMessage
      */
        this.isPartOfCurrentChatForUIEvent = (message) => {
            if (this.parentMessageId) {
                if (message.getParentMessageId() === this.parentMessageId) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                if (message.getParentMessageId()) {
                    return false;
                }
                if (this.user) {
                    if (message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.user &&
                        message?.getReceiverId() === this.user.getUid()) {
                        return true;
                    }
                }
                else if (this.group) {
                    if (message.getReceiverType() === CometChatUIKitConstants.MessageReceiverType.group &&
                        message?.getReceiverId() === this.group.getGuid()) {
                        return true;
                    }
                }
                return false;
            }
        };
        this.handleActions = (event) => {
            let action = event?.detail?.action;
            this.showAiFeatures = false;
            if (action.onClick) {
                action.onClick();
            }
            if (this.showActionSheetItem) {
                this.showActionSheetItem = false;
                this.actionSheetRef.nativeElement.click();
            }
        };
        this.inputChangeHandler = (event) => {
            const files = event.target.files;
            if (!files || files.length === 0)
                return;
            Array.from(files).forEach((file) => {
                const fileType = file.type;
                if (fileType.startsWith("image/")) {
                    this.onImageChange(event);
                }
                else if (fileType.startsWith("video/")) {
                    this.onVideoChange(event);
                }
                else if (fileType.startsWith("audio/")) {
                    this.onAudioChange(event);
                }
                else {
                    this.onFileChange(event);
                }
            });
            if (this.inputElementRef?.nativeElement && this.inputElementRef.nativeElement?.value) {
                this.inputElementRef.nativeElement.value = "";
            }
        };
        this.sendSticker = (event) => {
            this.stickerButtonRef?.nativeElement?.click();
            this.showStickerKeyboard = false;
            let sticker = event?.detail?.stickerURL;
            let stickerName = event?.detail?.stickerName;
            if (this.stickerConfiguration?.configuration?.ccStickerClicked) {
                this.stickerConfiguration?.configuration?.ccStickerClicked({
                    name: stickerName,
                    url: sticker,
                }, this.loggedInUser, this.user, this.group, this.parentMessageId, this.onError, this.customSoundForMessage || this.customSoundForMessages, this.disableSoundForMessages);
            }
        };
        this.openImagePicker = () => {
            this.inputElementRef.nativeElement.type = "file";
            this.inputElementRef.nativeElement.accept = "image/*";
            this.inputElementRef.nativeElement.click();
            this.closePopovers();
        };
        this.openFilePicker = () => {
            this.inputElementRef.nativeElement.type = "file";
            this.inputElementRef.nativeElement.accept = "file/*";
            this.inputElementRef.nativeElement.click();
            this.closePopovers();
        };
        this.openvideoPicker = () => {
            this.inputElementRef.nativeElement.type = "file";
            this.inputElementRef.nativeElement.accept = "video/*";
            this.inputElementRef.nativeElement.click();
            this.closePopovers();
        };
        this.openAudioPicker = () => {
            this.inputElementRef.nativeElement.type = "file";
            this.inputElementRef.nativeElement.accept = "audio/*";
            this.inputElementRef.nativeElement.click();
            this.closePopovers();
        };
        this.openActionSheet = (event) => {
            this.triggerActivePopoverEvent();
            if (event?.detail?.hasOwnProperty("isOpen")) {
                this.showActionSheetItem = false;
                this.ref.detectChanges();
                return;
            }
            this.showActionSheetItem = !this.showActionSheetItem;
            this.closeMediaRecorder();
            if (this.showEmojiKeyboard) {
                this.emojiButtonRef.nativeElement.click();
                this.showEmojiKeyboard = !this.showEmojiKeyboard;
            }
            if (this.showStickerKeyboard) {
                this.stickerButtonRef.nativeElement.click();
                this.showStickerKeyboard = !this.showStickerKeyboard;
                this.ref.detectChanges();
            }
            if (this.showAiFeatures) {
                this.aiButtonRef.nativeElement.click();
                this.showAiFeatures = !this.showAiFeatures;
                this.ref.detectChanges();
            }
            else {
                return;
            }
        };
        this.handleAiFeaturesClose = (callback) => {
            this.aiFeaturesCloseCallback = callback;
        };
        this.closeSmartReply = () => {
            this.showAiFeatures = false;
            this.ref.detectChanges();
            return;
        };
        this.openAiFeatures = (event) => {
            this.triggerActivePopoverEvent();
            if (this.aiFeaturesCloseCallback) {
                this.aiFeaturesCloseCallback();
            }
            if (event?.detail?.hasOwnProperty("isOpen")) {
                this.showAiFeatures = false;
                this.ref.detectChanges();
                return;
            }
            this.showAiFeatures = !this.showAiFeatures;
            this.closeMediaRecorder();
            if (this.showEmojiKeyboard) {
                this.emojiButtonRef.nativeElement.click();
                this.showEmojiKeyboard = !this.showEmojiKeyboard;
            }
            if (this.showStickerKeyboard) {
                this.stickerButtonRef.nativeElement.click();
                this.showStickerKeyboard = !this.showStickerKeyboard;
                this.ref.detectChanges();
            }
            if (this.showActionSheetItem) {
                this.actionSheetRef.nativeElement.click();
                this.showActionSheetItem = !this.showActionSheetItem;
                this.ref.detectChanges();
            }
            else {
                this.showActionSheetItemAI = true;
                return;
            }
        };
        this.openEmojiKeyboard = (event) => {
            this.triggerActivePopoverEvent();
            if (event?.detail?.hasOwnProperty("isOpen")) {
                this.showEmojiKeyboard = false;
                this.ref.detectChanges();
                return;
            }
            this.showEmojiKeyboard = !this.showEmojiKeyboard;
            this.closeMediaRecorder();
            if (this.showActionSheetItem) {
                this.actionSheetRef.nativeElement.click();
                this.showActionSheetItem = !this.showActionSheetItem;
                this.ref.detectChanges();
            }
            if (this.showStickerKeyboard) {
                this.stickerButtonRef.nativeElement.click();
                this.showStickerKeyboard = !this.showStickerKeyboard;
                this.ref.detectChanges();
            }
            if (this.showAiFeatures) {
                this.aiButtonRef.nativeElement.click();
                this.showAiFeatures = !this.showAiFeatures;
                this.ref.detectChanges();
            }
            else {
                return;
            }
        };
        this.openMediaRecorded = (event) => {
            this.triggerActivePopoverEvent();
            if (event?.detail?.hasOwnProperty("isOpen")) {
                this.toggleMediaRecorded = false;
                this.ref.detectChanges();
                return;
            }
            this.toggleMediaRecorded = !this.toggleMediaRecorded;
            this.ref.detectChanges();
            if (this.showActionSheetItem) {
                this.actionSheetRef.nativeElement.click();
                this.showActionSheetItem = !this.showActionSheetItem;
                this.ref.detectChanges();
            }
            if (this.showEmojiKeyboard) {
                this.emojiButtonRef.nativeElement.click();
                this.showEmojiKeyboard = !this.showEmojiKeyboard;
                this.ref.detectChanges();
            }
            if (this.showStickerKeyboard) {
                this.stickerButtonRef.nativeElement.click();
                this.showStickerKeyboard = !this.showStickerKeyboard;
                this.ref.detectChanges();
            }
            if (this.showAiFeatures) {
                this.aiButtonRef.nativeElement.click();
                this.showAiFeatures = !this.showAiFeatures;
                this.ref.detectChanges();
            }
            else {
                return;
            }
        };
        this.openStickerKeyboard = (event) => {
            this.triggerActivePopoverEvent();
            if (event?.detail?.hasOwnProperty("isOpen")) {
                this.showStickerKeyboard = false;
                this.ref.detectChanges();
                return;
            }
            this.showStickerKeyboard = !this.showStickerKeyboard;
            this.closeMediaRecorder();
            this.ref.detectChanges();
            if (this.showActionSheetItem) {
                this.actionSheetRef.nativeElement.click();
                this.showActionSheetItem = !this.showActionSheetItem;
                this.ref.detectChanges();
            }
            if (this.showEmojiKeyboard) {
                this.emojiButtonRef.nativeElement.click();
                this.showEmojiKeyboard = !this.showEmojiKeyboard;
                this.ref.detectChanges();
            }
            else {
                return;
            }
        };
        /**
         * Check for developer provided instance of MentionsTextFormatter
         * If not provided, add default
         * If provided, check if style is provided via configuration, then add style.
         */
        this.initializeMentionsFormatter = () => {
            if (!this.disableMentions) {
                this.mentionsTextFormatterInstance.setMentionsTextStyle(this.getMentionsStyle());
                let foundMentionsFormatter;
                if (this.textFormatters.length) {
                    for (let i = 0; i < this.textFormatterList.length; i++) {
                        if (this.textFormatterList[i] instanceof CometChatMentionsFormatter) {
                            foundMentionsFormatter = this.textFormatterList[i];
                            this.mentionsTextFormatterInstance = foundMentionsFormatter;
                            break;
                        }
                    }
                }
                if (foundMentionsFormatter) {
                    this.mentionsTextFormatterInstance = foundMentionsFormatter;
                }
                if (!this.mentionsTextFormatterInstance.getKeyUpCallBack() ||
                    this.mentionsTextFormatterInstance.getKeyDownCallBack()) {
                    this.mentionsTextFormatterInstance.setKeyUpCallBack(this.searchMentions);
                    this.mentionsTextFormatterInstance.setKeyDownCallBack(this.searchMentions);
                    this.mentionsTextFormatterInstance.setId(this.mentionsFormatterInstanceId);
                }
                if (!foundMentionsFormatter) {
                    this.textFormatterList.push(this.mentionsTextFormatterInstance);
                }
            }
        };
        this.getMentionsStyle = () => {
            return this.mentionStyleLocal;
        };
        this.getSmartReplies = () => {
            this.showSmartReply = true;
            this.repliesArray = [];
            this.showActionSheetItemAI = false;
            this.showAiBotList = false;
            this.smartReplyState = States.loading;
            this.ref.detectChanges();
            return new Promise((resolve, reject) => {
                let receiverId = this.user
                    ? this.user?.getUid()
                    : this.group?.getGuid();
                let receiverType = this.user
                    ? CometChatUIKitConstants.MessageReceiverType.user
                    : CometChatUIKitConstants.MessageReceiverType.group;
                CometChat.getSmartReplies(receiverId, receiverType)
                    .then((response) => {
                    let repliesArray = [];
                    Object.keys(response).forEach((reply) => {
                        if (response[reply] && response[reply] != "") {
                            this.repliesArray.push(response[reply]);
                            repliesArray.push(response[reply]);
                        }
                    });
                    resolve(repliesArray);
                    this.smartReplyState = States.loaded;
                    this.ref.detectChanges();
                })
                    .catch((err) => {
                    this.smartReplyState = States.error;
                    this.ref.detectChanges();
                    return reject(err);
                });
            });
        };
        this.showAiBotMessageListMethod = (action) => {
            this.aiBotList = action;
            this.showActionSheetItemAI = false;
            this.showAiBotList = true;
            this.aiActionButtons.length = 0;
            this.aiBotList.forEach((e, i) => {
                const newButton = {
                    id: e.id,
                    title: e.title,
                    onClick: async () => {
                        CometChatUIEvents.ccShowPanel.next({
                            child: { bot: e, showBotView: true },
                        });
                    },
                };
                this.aiActionButtons.push(newButton);
            });
            this.ref.detectChanges();
        };
        this.sendReply = (event) => {
            let reply = event?.detail?.reply;
            CometChatUIEvents.ccComposeMessage.next(reply);
            this.repliesArray = [];
            this.showActionSheetItemAI = false;
            this.showAiFeatures = false;
            this.aiButtonRef.nativeElement.click();
            this.ref.detectChanges();
        };
        this.backButtonStyle = () => {
            return {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                background: "transparent",
                buttonIconTint: this.themeService.theme.palette.getPrimary(),
            };
        };
        /**
         * Accepts search term from mentionsTextFormatter and opens the mentions select list
         *
         * @param {string} searchTerm
         * @returns {void}
         */
        this.searchMentions = (searchTerm) => {
            if (!(searchTerm && searchTerm.length)) {
                this.mentionsSearchTerm = "";
                this.showListForMentions = false;
                this.mentionsSearchCount = 1;
                this.ref.detectChanges();
                return;
            }
            if (!this.lastEmptySearchTerm ||
                !searchTerm
                    .split("@")[1]
                    .toLowerCase()
                    .startsWith(this.lastEmptySearchTerm.toLowerCase())) {
                this.mentionsSearchTerm =
                    searchTerm.split("@")[1] && searchTerm.split("@")[1].length
                        ? searchTerm.split("@")[1]
                        : "";
                this.showListForMentions = true;
                this.mentionsSearchCount++;
                this.lastEmptySearchTerm = undefined;
                this.ref.detectChanges();
            }
        };
        /**
         * Called when clicking a user from the mentions list.
         * Add the user to mentions text formatter instance and then call rerender to style the mention
         * within message input.
         *
         * @param {CometChat.User} user
         */
        this.defaultMentionsItemClickHandler = (user) => {
            let cometChatUsers = [user];
            this.mentionsTextFormatterInstance.setCometChatUserGroupMembers(cometChatUsers);
            this.mentionsTextFormatterInstance.setLoggedInUser(this.loggedInUser);
            this.mentionedUsers = [
                ...this.mentionsTextFormatterInstance.getCometChatUserGroupMembers(),
            ];
            this.mentionsTextFormatterInstance.reRender();
            this.showListForMentions = false;
            this.mentionsSearchTerm = "";
            this.ref.detectChanges();
        };
        /**
         * Close mentions list if search returns empty list
         */
        this.defaultOnEmptyForMentions = () => {
            this.lastEmptySearchTerm = this.mentionsSearchTerm;
            this.showListForMentions = false;
            this.mentionsSearchTerm = "";
            this.ref.detectChanges();
        };
        this.getMentionInfoIconStyle = () => {
            return {
                height: "fit-content",
                width: "fit-content",
                buttonTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
                buttonTextColor: this.themeService.theme.palette.getAccent600(),
                borderRadius: "8px",
                border: "none",
                buttonIconTint: this.themeService.theme.palette.getAccent600(),
                padding: "8px",
                iconHeight: "20px",
                iconWidth: "20px",
                iconBackground: "transparent",
                gap: "5px",
            };
        };
        this.handleClickOutside = (event) => {
            if (this.userMemberWrapperRef) {
                const userMemberWrapperRect = this.userMemberWrapperRef?.nativeElement?.getBoundingClientRect();
                const isOutsideClick = event?.clientX <= userMemberWrapperRect?.left ||
                    event?.clientX >= userMemberWrapperRect?.right ||
                    event?.clientY >= userMemberWrapperRect?.top ||
                    event?.clientY <= userMemberWrapperRect?.bottom;
                if (isOutsideClick) {
                    this.showListForMentions = false;
                    this.mentionsSearchTerm = "";
                    this.ref.detectChanges();
                }
            }
        };
    }
    disableSendButton() {
        this.sendButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: this.themeService.theme.palette.getAccent200(),
            background: "transparent",
        };
        this.ref.detectChanges();
    }
    sendReaction() {
        let receiverId = this.user
            ? this.user?.getUid()
            : this.group?.getGuid();
        let receiverType = this.user
            ? CometChatUIKitConstants.MessageReceiverType.user
            : CometChatUIKitConstants.MessageReceiverType.group;
        let data = {
            type: "live_reaction",
            reaction: "heart",
        };
        let transientMessage = new CometChat.TransientMessage(receiverId, receiverType, data);
        CometChat.sendTransientMessage(transientMessage);
        CometChatMessageEvents.ccLiveReaction.next("heart");
        return;
    }
    closeMediaRecorder(event) {
        if (this.toggleMediaRecorded) {
            this.mediaRecordedRef.nativeElement.click();
            this.toggleMediaRecorded = !this.toggleMediaRecorded;
            this.ref.detectChanges();
        }
    }
    getFormattedDate() {
        const currentDate = new Date();
        const year = currentDate.getFullYear().toString();
        const month = this.padZero(currentDate.getMonth() + 1);
        const day = this.padZero(currentDate.getDate());
        const hours = this.padZero(currentDate.getHours());
        const minutes = this.padZero(currentDate.getMinutes());
        const seconds = this.padZero(currentDate.getSeconds());
        return `${year}${month}${day}${hours}${minutes}${seconds}`;
    }
    padZero(num) {
        return num.toString().padStart(2, "0");
    }
    addAttachmentCallback() {
        this.composerActions?.forEach((element) => {
            switch (element.id) {
                case CometChatUIKitConstants.MessageTypes.audio:
                    if (!element.onClick) {
                        element.onClick = this.openAudioPicker;
                    }
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    if (!element.onClick) {
                        element.onClick = this.openvideoPicker;
                    }
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    if (!element.onClick) {
                        element.onClick = this.openFilePicker;
                    }
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    if (!element.onClick) {
                        element.onClick = this.openImagePicker;
                    }
                    break;
                case "extension_poll":
                    if (!element.onClick) {
                        element.onClick = this.openCreatePolls;
                    }
                    break;
            }
        });
    }
    closeComposerPopover() {
        if (this.showStickerKeyboard) {
            this.stickerButtonRef?.nativeElement?.click();
            this.showStickerKeyboard = false;
        }
        if (this.showAiFeatures) {
            this.aiButtonRef.nativeElement.click();
            this.showAiFeatures = false;
        }
        this.closeMediaRecorder();
        this.closePopovers();
        this.ref.detectChanges();
    }
    subscribeToEvents() {
        this.ccActivePopover = CometChatUIEvents.ccActivePopover.subscribe((data) => {
            if (data == ActivePopover.messageList) {
                this.closeComposerPopover();
            }
        });
        this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object) => {
            let parentId = object?.message?.getParentMessageId();
            if ((this.parentMessageId && parentId && parentId == this.parentMessageId) || (!this.parentMessageId && !parentId)) {
                if (object?.status == MessageStatus.inprogress) {
                    this.messageToBeEdited = object.message;
                    if (this.isPartOfCurrentChatForUIEvent(object?.message)) {
                        this.openEditPreview();
                    }
                }
                if ((object?.status === MessageStatus.success && object.message instanceof CometChat.TextMessage) || object?.status == MessageStatus.cancelled) {
                    this.closePreview();
                }
            }
        });
        this.ccComposeMessage = CometChatUIEvents.ccComposeMessage.subscribe((text) => {
            this.text = text;
            this.ref.detectChanges();
        });
        this.ccShowMentionsCountWarning =
            CometChatUIEvents.ccShowMentionsCountWarning.subscribe((data) => {
                if (data.id == this.mentionsFormatterInstanceId) {
                    if (data.showWarning) {
                        this.showMentionsCountWarning = true;
                        return;
                    }
                    this.showMentionsCountWarning = false;
                }
            });
    }
    openEditPreview() {
        let messageTextWithMentionTags = this.checkForMentions(this.messageToBeEdited);
        this.clearComposer();
        this.inputRef.nativeElement.text = "";
        this.text = processSubtitleContent(this.messageToBeEdited.getText());
        this.editPreviewText = messageTextWithMentionTags;
        this.showPreview = true;
        this.ref.detectChanges();
    }
    /**
     * Adds @ for every mention the message by matching uid
     *
     * @param {string} message
     * @returns  {void}
     */
    checkForMentions(message) {
        const regex = /<@uid:(.*?)>/g;
        let messageText = message.getText();
        let messageTextTmp = messageText;
        let match = regex.exec(messageText);
        let mentionedUsers = message.getMentionedUsers();
        let cometChatUsersGroupMembers = [];
        while (match !== null) {
            let user;
            for (let i = 0; i < mentionedUsers.length; i++) {
                if (match[1] == mentionedUsers[i].getUid()) {
                    user = mentionedUsers[i];
                }
            }
            if (user) {
                messageTextTmp = messageTextTmp.replace(match[0], "@" + user.getName());
                cometChatUsersGroupMembers.push(user);
            }
            match = regex.exec(messageText);
        }
        this.mentionsTextFormatterInstance.setCometChatUserGroupMembers(cometChatUsersGroupMembers);
        this.mentionsTextFormatterInstance.setLoggedInUser(this.loggedInUser);
        return messageTextTmp;
    }
    unsubscribeToEvents() {
        this.ccMessageEdit?.unsubscribe();
        this.ccShowMentionsCountWarning?.unsubscribe();
    }
    closeModals() {
        if (this.showActionSheetItem) {
            this.actionSheetRef?.nativeElement?.click();
            this.showActionSheetItem = false;
        }
        if (this.showEmojiKeyboard) {
            this.emojiButtonRef?.nativeElement?.click();
            this.showEmojiKeyboard = false;
        }
        if (this.showStickerKeyboard) {
            this.stickerButtonRef?.nativeElement?.click();
            this.showStickerKeyboard = false;
        }
        if (this.toggleMediaRecorded) {
            this.mediaRecordedRef?.nativeElement?.click();
            this.toggleMediaRecorded = false;
        }
        if (this.showAiFeatures) {
            this.aiButtonRef?.nativeElement?.click();
            this.showAiFeatures = false;
            this.showAiBotList = false;
        }
    }
    callConversationSummaryMethod() {
        this.showAiFeatures = false;
        this.aiButtonRef.nativeElement.click();
        CometChatUIEvents.ccShowPanel.next({
            child: { showConversationSummaryView: true },
        });
    }
    clearComposer() {
        this.text = "";
        this.messageText = "";
        this.inputRef?.nativeElement?.emptyInputField();
    }
    ngOnChanges(changes) {
        if (changes["user"] || changes["group"]) {
            this.userOrGroupChanged(changes);
            if (this.initialText !== this.text) {
                this.clearComposer();
            }
            this.text = this.initialText || "";
        }
        if (changes["text"]?.currentValue) {
            this.initialText = changes["text"].currentValue;
            this.text = this.initialText;
        }
    }
    userOrGroupChanged(changes) {
        if (this.showPreview) {
            this.closePreview();
        }
        if (!this.disableMentions) {
            this.showListForMentions = false;
            if (changes["group"] && this.group) {
                if (this.userMemberWrapperConfiguration?.userMemberListType == undefined) {
                    this.userMemberListType = UserMemberListType.groupmembers;
                }
                this.groupMembersRequestBuilder = this.userMemberWrapperConfiguration
                    .groupMemberRequestBuilder
                    ? this.userMemberWrapperConfiguration.groupMemberRequestBuilder
                    : new CometChat.GroupMembersRequestBuilder(this.group.getGuid()).setLimit(15);
            }
            if (changes["user"] && this.user) {
                if (this.userMemberWrapperConfiguration?.userMemberListType == undefined) {
                    this.userMemberListType = UserMemberListType.users;
                }
                this.usersRequestBuilder = this.userMemberWrapperConfiguration
                    .usersRequestBuilder
                    ? this.userMemberWrapperConfiguration.usersRequestBuilder
                    : new CometChat.UsersRequestBuilder().setLimit(15);
            }
        }
        this.showAiBotList = false;
        this.showSmartReply = false;
        this.closeModals();
        this.messageText = this.text;
        if (this.inputRef && this.inputRef.nativeElement) {
            setTimeout(() => {
                this.inputRef?.nativeElement?.emptyInputField();
                this.inputRef?.nativeElement?.pasteHtmlAtCaret(this.text);
            }, 0);
        }
        this.showSendButton = false;
        this.composerId = this.getComposerId();
        if (this.attachmentOptions) {
            this.composerActions = this.attachmentOptions(this.user || this.group, this.composerId);
            this.addAttachmentCallback();
        }
        else {
            this.composerActions =
                ChatConfigurator.getDataSource()?.getAttachmentOptions(this.themeService.theme, this.user, this.group, this.composerId);
            this.addAttachmentCallback();
        }
        for (let i = 0; i < this.textFormatterList.length; i++) {
            this.textFormatterList[i].setComposerConfig(this.user, this.group, this.composerId);
        }
    }
    ngOnDestroy() {
        this.unsubscribeToEvents();
        this.mentionsTextFormatterInstance.cleanup();
    }
    customSendMethod(message) {
        this.showSendButton = false;
        this.sendTextMessage(message);
        this.disableSendButton();
        this.ref.detectChanges();
    }
    /**
     * @param  {String=""} textMsg
     */
    sendTextMessage(textMsg = "") {
        this.endTyping();
        try {
            // Dont Send Blank text messages -- i.e --- messages that only contain spaces
            if (this.messageText?.trim()?.length == 0 &&
                textMsg?.trim()?.length == 0) {
                return false;
            }
            // wait for the previous message to be sent before sending the current message
            if (this.messageSending) {
                return false;
            }
            this.messageSending = true;
            // If its an Edit and Send Message Operation , use Edit Message Function
            if (this.messageToBeEdited) {
                this.editMessage();
                this.ref.detectChanges();
                return false;
            }
            let { receiverId, receiverType } = this.getReceiverDetails();
            let messageInput;
            if (textMsg !== null) {
                messageInput = textMsg.trim();
            }
            else {
                messageInput = this.messageText.trim();
            }
            let textMessage = new CometChat.TextMessage(receiverId, messageInput, receiverType);
            if (this.parentMessageId) {
                textMessage.setParentMessageId(this.parentMessageId);
            }
            if (this.mentionedUsers.length) {
                let userObjects = [];
                for (let i = 0; i < this.mentionedUsers.length; i++) {
                    userObjects.push(this.mentionedUsers[i] instanceof CometChat.GroupMember
                        ? this.mentionedUsers[i]
                        : this.mentionedUsers[i]);
                }
                textMessage.setMentionedUsers(userObjects);
                this.mentionedUsers = [];
            }
            textMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            textMessage.setMuid(CometChatUIKitUtility.ID());
            if (this.loggedInUser) {
                textMessage.setSender(this.loggedInUser);
            }
            this.showMentionsCountWarning = false;
            // play audio after action generation
            if (!this.disableSoundForMessages) {
                this.playAudio();
            }
            //clearing Message Input Box
            this.clearComposer();
            this.messageSending = false;
            for (let i = 0; i < this.textFormatterList.length; i++) {
                textMessage = this.textFormatterList[i].formatMessageForSending(textMessage);
            }
            // End Typing Indicator Function
            this.closePopovers();
            if (!this.onSendButtonClick) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: textMessage,
                    status: MessageStatus.inprogress,
                });
                CometChat.sendMessage(textMessage)
                    .then((message) => {
                    let messageObject = message;
                    CometChatMessageEvents.ccMessageSent.next({
                        message: messageObject,
                        status: MessageStatus.success,
                    });
                    // Change the send button to reaction button
                    setTimeout(() => {
                        this.showSendButton = false;
                        this.ref.detectChanges();
                    }, 500);
                    this.mentionsTextFormatterInstance.resetCometChatUserGroupMembers();
                })
                    .catch((error) => {
                    textMessage.setMetadata({
                        error: true,
                    });
                    CometChatMessageEvents.ccMessageSent.next({
                        message: textMessage,
                        status: MessageStatus.error,
                    });
                });
            }
            else {
                this.onSendButtonClick(textMessage, PreviewMessageMode.none);
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    onAiBackButtonClick() {
        this.showActionSheetItemAI = true;
        this.ref.detectChanges();
    }
    editMessage() {
        try {
            const messageToBeEdited = this.messageToBeEdited;
            let { receiverId, receiverType } = this.getReceiverDetails();
            let messageText = this.messageText.trim();
            let mentionedUsers = [];
            if (messageToBeEdited.getMentionedUsers()) {
                mentionedUsers = messageToBeEdited.getMentionedUsers();
                messageText =
                    this.mentionsTextFormatterInstance.getOriginalText(messageText);
                this.mentionsTextFormatterInstance.setCometChatUserGroupMembers(mentionedUsers);
                messageText =
                    this.mentionsTextFormatterInstance.getOriginalText(messageText);
            }
            let textMessage = new CometChat.TextMessage(receiverId, messageText, receiverType);
            if (mentionedUsers.length) {
                textMessage.setMentionedUsers(mentionedUsers);
            }
            textMessage.setId(messageToBeEdited.id);
            this.closePreview();
            this.endTyping();
            this.showMentionsCountWarning = false;
            for (let i = 0; i < this.textFormatterList.length; i++) {
                textMessage = this.textFormatterList[i].formatMessageForSending(textMessage);
            }
            if (!this.onSendButtonClick) {
                CometChat.editMessage(textMessage)
                    .then((message) => {
                    this.messageSending = false;
                    CometChatMessageEvents.ccMessageEdited.next({
                        message: message,
                        status: MessageStatus.success,
                    });
                    this.mentionsTextFormatterInstance.resetCometChatUserGroupMembers();
                })
                    .catch((error) => {
                    this.messageSending = false;
                    if (this.onError) {
                        this.onError(error);
                    }
                });
            }
            else {
                this.onSendButtonClick(textMessage, PreviewMessageMode.edit);
                this.mentionsTextFormatterInstance.resetCometChatUserGroupMembers();
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    getReceiverDetails() {
        let receiverId;
        let receiverType;
        let isBlocked = false;
        if (this.user && this.user.getUid()) {
            receiverId = this.user.getUid();
            receiverType = CometChatUIKitConstants.MessageReceiverType.user;
            isBlocked = this.user.getBlockedByMe() || this.user.getHasBlockedMe();
        }
        else if (this.group && this.group.getGuid()) {
            receiverId = this.group.getGuid();
            receiverType = CometChatUIKitConstants.MessageReceiverType.group;
        }
        return { receiverId: receiverId, receiverType: receiverType, isBlocked };
    }
    playAudio() {
        if (!this.disableSoundForMessages) {
            if (this.customSoundForMessage || this.customSoundForMessages) {
                CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage, this.customSoundForMessage || this.customSoundForMessages);
            }
            else {
                CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);
            }
        }
    }
    /**
     * @param  {} timer=null
     * @param  {string=""} metadata
     */
    startTyping(timer = null, metadata = "") {
        if (!this.disableTypingEvents) {
            try {
                let typingInterval = timer || 5000;
                let { receiverId, receiverType, isBlocked } = this.getReceiverDetails();
                if (isBlocked) {
                    return;
                }
                let typingMetadata = metadata || undefined;
                let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType, typingMetadata);
                CometChat.startTyping(typingNotification);
                this.storeTypingInterval = setTimeout(() => {
                    this.endTyping();
                }, typingInterval);
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        }
    }
    endTyping(metadata = null) {
        if (!this.disableTypingEvents) {
            try {
                let { receiverId, receiverType, isBlocked } = this.getReceiverDetails();
                if (isBlocked) {
                    return;
                }
                let typingMetadata = metadata || undefined;
                let typingNotification = new CometChat.TypingIndicator(receiverId, receiverType, typingMetadata);
                CometChat.endTyping(typingNotification);
                clearTimeout(this.storeTypingInterval);
                this.storeTypingInterval = null;
            }
            catch (error) {
                if (this.onError) {
                    this.onError(CometChatException(error));
                }
            }
        }
    }
    /**
     * @param  {File | CometChat.MediaMessage} messageInput
     * @param  {string} messageType
     */
    sendMediaMessage(messageInput, messageType) {
        try {
            if (this.messageSending) {
                return false;
            }
            this.messageSending = true;
            const { receiverId, receiverType } = this.getReceiverDetails();
            let mediaMessage = new CometChat.MediaMessage(receiverId, messageInput, messageType, receiverType);
            if (this.parentMessageId) {
                mediaMessage.setParentMessageId(this.parentMessageId);
            }
            mediaMessage.setType(messageType);
            mediaMessage.setMetadata({
                ["file"]: messageInput,
            });
            mediaMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
            mediaMessage.setMuid(CometChatUIKitUtility.ID());
            if (this.loggedInUser) {
                mediaMessage.setSender(this.loggedInUser);
            }
            if (!this.disableSoundForMessages) {
                this.playAudio();
            }
            this.messageSending = false;
            this.closePopovers();
            if (!this.onSendButtonClick) {
                CometChatMessageEvents.ccMessageSent.next({
                    message: mediaMessage,
                    status: MessageStatus.inprogress,
                });
                CometChat.sendMessage(mediaMessage)
                    .then((response) => {
                    this.messageSending = false;
                    response.setMuid(mediaMessage.getMuid());
                    CometChatMessageEvents.ccMessageSent.next({
                        message: response,
                        status: MessageStatus.success,
                    });
                })
                    .catch((error) => {
                    mediaMessage.setMetadata({
                        error: true,
                    });
                    CometChatMessageEvents.ccMessageSent.next({
                        message: mediaMessage,
                        status: MessageStatus.error,
                    });
                    this.messageSending = false;
                });
            }
            else {
                this.onSendButtonClick(mediaMessage, PreviewMessageMode.none);
            }
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    /**
     * @param  {any} event
     */
    onVideoChange(event) {
        try {
            if (!event.target.files[0]) {
                return false;
            }
            const uploadedFile = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
                this.sendMediaMessage(newFile, CometChatUIKitConstants.MessageTypes.video);
            }, false);
            reader.readAsArrayBuffer(uploadedFile);
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    /**
     * @param  {any} event
     */
    onAudioChange(event) {
        try {
            if (!event.target.files[0]) {
                return false;
            }
            const uploadedFile = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
                this.sendMediaMessage(newFile, CometChatUIKitConstants.MessageTypes.audio);
            }, false);
            reader.readAsArrayBuffer(uploadedFile);
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    /**
     * @param  {any} event
     */
    onImageChange(event) {
        try {
            if (!event.target.files[0]) {
                return false;
            }
            const uploadedFile = event.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
                this.sendMediaMessage(newFile, CometChatUIKitConstants.MessageTypes.image);
            }, false);
            reader.readAsArrayBuffer(uploadedFile);
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    /**
     * @param  {any} event
     */
    onFileChange(event) {
        try {
            if (!event.target.files["0"]) {
                return false;
            }
            const uploadedFile = event.target.files["0"];
            var reader = new FileReader();
            reader.addEventListener("load", () => {
                const newFile = new File([reader.result], uploadedFile.name, uploadedFile);
                this.sendMediaMessage(newFile, CometChatUIKitConstants.MessageTypes.file);
            }, false);
            reader.readAsArrayBuffer(uploadedFile);
        }
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
        return true;
    }
    handleOutsideClick() {
        this.showActionSheetItem = false;
        this.showStickerKeyboard = false;
        this.showAiFeatures = false;
        this.toggleMediaRecorded = false;
        this.showEmojiKeyboard = false;
        this.ref.detectChanges();
    }
    triggerActivePopoverEvent() {
        CometChatUIEvents.ccActivePopover.next(ActivePopover.composer);
    }
    closePopovers() {
        if (this.showEmojiKeyboard) {
            this.emojiButtonRef.nativeElement.click();
            this.showEmojiKeyboard = !this.showEmojiKeyboard;
        }
        if (this.showActionSheetItem) {
            this.actionSheetRef.nativeElement.click();
            this.showActionSheetItem = !this.showActionSheetItem;
        }
    }
    getComposerId() {
        const user = this.user;
        if (user !== undefined) {
            return {
                user: user?.getUid(),
                group: null,
                parentMessageId: this.parentMessageId,
            };
        }
        const group = this.group;
        if (group !== undefined) {
            return {
                user: null,
                group: group?.getGuid(),
                parentMessageId: this.parentMessageId,
            };
        }
        return { user: null, group: null, parentMessageId: this.parentMessageId };
    }
    ngOnInit() {
        this.setTheme();
        this.textFormatterList = this.textFormatters
            ? this.textFormatters
            : [];
        document.addEventListener("click", this.handleClickOutside);
        this.mentionsTextFormatterInstance =
            ChatConfigurator.getDataSource().getMentionsTextFormatter({
                theme: this.themeService.theme,
            });
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.initializeMentionsFormatter();
        this.actions = ChatConfigurator.getDataSource().getAIOptions(this.themeService.theme, this.getComposerId(), this.aiOptionsStyle);
        this.aiBotList = [];
        this.subscribeToEvents();
        this.enableStickerKeyboard = true;
        this.stickerConfiguration =
            ChatConfigurator.getDataSource()?.getAuxiliaryOptions(this.composerId, this.user, this.group);
        if (this.stickerConfiguration?.id == StickersConstants.sticker) {
            this.enableStickerKeyboard = true;
        }
        else {
            this.enableStickerKeyboard = false;
        }
        this.enableAiFeatures();
    }
    enableAiFeatures() {
        if (this.actions && this.actions.length > 0) {
            this.isAiEnabled = true;
            this.actions.forEach((action) => {
                if (action.id === "ai-smart-reply") {
                    const newButton = {
                        ...action,
                        title: action.title,
                        onClick: this.getSmartReplies,
                    };
                    this.buttons.push(newButton);
                    this.ref.detectChanges();
                }
                if (action.id === "ai-conversation-summary") {
                    const newButton = {
                        ...action,
                        title: action.title,
                        id: action.id,
                        onClick: async () => this.callConversationSummaryMethod(),
                    };
                    this.buttons.push(newButton);
                    this.ref.detectChanges();
                }
                if (action.id === "ai-bots") {
                    const newButton = {
                        ...action,
                        title: action.title,
                        id: action.id,
                        onClick: async () => this.showAiBotMessageListMethod(action.onClick()),
                    };
                    this.buttons.push(newButton);
                    this.ref.detectChanges();
                }
            });
        }
    }
    composerWrapperStyle() {
        return {
            height: this.messageComposerStyle?.height,
            width: this.messageComposerStyle?.width,
            background: this.messageComposerStyle?.background,
            border: this.messageComposerStyle?.border,
            borderRadius: this.messageComposerStyle?.borderRadius,
        };
    }
    isValidStyleValue(value) {
        return value != null && typeof value === 'string' && value.trim() !== '';
    }
    getThemeColors() {
        return {
            error: this.themeService.theme.palette.getError(),
            accent600: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            accent400: this.themeService.theme.palette.getAccent400()
        };
    }
    setTheme() {
        this.emojiPopover.boxShadow = `0px 0px 32px ${this.themeService.theme.palette.getAccent50()}`;
        this.stickerPopover.boxShadow = `0px 0px 32px ${this.themeService.theme.palette.getAccent50()}`;
        this.mediaRecordedPopover.boxShadow = `0px 0px 32px ${this.themeService.theme.palette.getAccent50()}`;
        this.aiPopover.background = this.themeService.theme.palette.getBackground();
        this.aiPopover.boxShadow = `0px 0px 32px ${this.themeService.theme.palette.getAccent50()}`;
        this.setComposerStyle();
        this.actionSheetStyle = {
            layoutModeIconTint: this.actionSheetStyle.layoutModeIconTint ||
                this.themeService.theme.palette.getAccent(),
            borderRadius: this.actionSheetStyle?.borderRadius || "inherit",
            background: this.actionSheetStyle.background || this.themeService.theme.palette.getBackground(),
            border: this.actionSheetStyle.border || "none",
            width: this.actionSheetStyle.width || "100%",
            height: this.actionSheetStyle.height || "100%",
            titleFont: this.actionSheetStyle.titleFont ||
                fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.actionSheetStyle.titleColor ||
                this.themeService.theme.palette.getAccent(),
            ActionSheetSeparatorTint: this.actionSheetStyle.ActionSheetSeparatorTint ||
                this.themeService.theme.palette.getAccent400(),
            listItemBackground: this.actionSheetStyle.listItemBackground || this.themeService.theme.palette.getBackground(),
            listItemIconTint: this.actionSheetStyle.listItemIconTint || this.themeService.theme.palette.getAccent700(),
            listItemIconBackground: this.actionSheetStyle.listItemIconBackground || 'transparent',
        };
        this.popoverStyle.background = this.actionSheetStyle.background || this.themeService.theme.palette.getBackground();
        this.aiActionSheetStyle = {
            layoutModeIconTint: this.aiActionSheetStyle.layoutModeIconTint ||
                this.themeService.theme.palette.getAccent(),
            borderRadius: "inherit",
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            width: "100%",
            height: "100%",
            titleFont: this.aiActionSheetStyle.titleFont ||
                fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.aiActionSheetStyle.titleColor ||
                this.themeService.theme.palette.getAccent(),
            ActionSheetSeparatorTint: this.aiActionSheetStyle.ActionSheetSeparatorTint ||
                `1px solid ${this.themeService.theme.palette.getAccent400()}`,
        };
        this.textInputStyle = {
            height: "100%",
            width: "100%",
            maxHeight: this.messageComposerStyle?.maxInputHeight || "100px",
            border: this.messageComposerStyle?.inputBorder,
            borderRadius: this.messageComposerStyle?.inputBorderRadius,
            background: this.messageComposerStyle?.inputBackground,
            textFont: this.messageComposerStyle?.textFont,
            textColor: this.messageComposerStyle?.textColor,
            dividerColor: this.messageComposerStyle?.dividerTint,
        };
        this.disableSendButton();
        this.previewStyle = {
            height: "100%",
            width: "100%",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            background: this.themeService.theme.palette.getBackground(),
            previewTitleFont: this.messageComposerStyle?.previewTitleFont ||
                fontHelper(this.themeService.theme.typography.subtitle1),
            previewTitleColor: this.messageComposerStyle?.previewTitleColor ||
                this.themeService.theme.palette.getAccent400(),
            previewSubtitleColor: this.messageComposerStyle?.previewSubtitleColor ||
                this.themeService.theme.palette.getAccent400(),
            previewSubtitleFont: this.messageComposerStyle?.previewSubtitleFont ||
                fontHelper(this.themeService.theme.typography.subtitle2),
            closeButtonIconTint: this.messageComposerStyle?.closePreviewTint ||
                this.themeService.theme.palette.getAccent600(),
            borderRadius: '12px'
        };
        let buttonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
        };
        const themeColors = this.getThemeColors();
        const width = this.isValidStyleValue(this.mediaRecorderStyle?.width) &&
            !this.mediaRecorderStyle?.width?.includes("%")
            ? this.mediaRecorderStyle.width
            : "250px";
        const height = this.isValidStyleValue(this.mediaRecorderStyle?.height) &&
            !this.mediaRecorderStyle?.height?.includes("%")
            ? this.mediaRecorderStyle.height
            : "100px";
        let defaultMediaRecorderStyle = new MediaRecorderStyle({
            startIconTint: this.isValidStyleValue(this.mediaRecorderStyle?.startIconTint)
                ? this.mediaRecorderStyle.startIconTint
                : themeColors.error,
            submitIconTint: this.isValidStyleValue(this.mediaRecorderStyle?.submitIconTint)
                ? this.mediaRecorderStyle.submitIconTint
                : themeColors.accent600,
            stopIconTint: this.isValidStyleValue(this.mediaRecorderStyle?.stopIconTint)
                ? this.mediaRecorderStyle.stopIconTint
                : themeColors.error,
            closeIconTint: this.isValidStyleValue(this.mediaRecorderStyle?.closeIconTint)
                ? this.mediaRecorderStyle.closeIconTint
                : themeColors.accent600,
            height: height,
            width: width,
            background: this.isValidStyleValue(this.mediaRecorderStyle?.background)
                ? this.mediaRecorderStyle.background
                : themeColors.background,
            timerTextFont: this.isValidStyleValue(this.mediaRecorderStyle?.timerTextFont)
                ? this.mediaRecorderStyle.timerTextFont
                : fontHelper(this.themeService.theme.typography.subtitle2),
            timerTextColor: this.isValidStyleValue(this.mediaRecorderStyle?.timerTextColor)
                ? this.mediaRecorderStyle.timerTextColor
                : themeColors.accent400,
        });
        this.mediaRecorderStyle = defaultMediaRecorderStyle;
        this.mediaRecordedPopover.width = width;
        this.mediaRecordedPopover.height = height;
        this.mediaRecordedPopover.background =
            this.themeService.theme.palette.getBackground();
        this.mediaRecorderStyle.border = `1px solid ${this.themeService.theme.palette.getAccent100()}`;
        this.emojiPopover.boxShadow = `0px 0px 8px ${this.themeService.theme.palette.getAccent50()}`;
        this.stickerPopover.boxShadow = `0px 0px 8px ${this.themeService.theme.palette.getAccent50()}`;
        this.mediaRecordedPopover.boxShadow = `0px 0px 8px ${this.themeService.theme.palette.getAccent50()}`;
        this.emojiButtonStyle = {
            buttonIconTint: this.messageComposerStyle?.emojiIconTint ||
                this.themeService.theme.palette.getAccent600(),
            ...buttonStyle,
        };
        this.stickerButtonStyle = {
            buttonIconTint: this.themeService.theme.palette.getAccent600(),
            ...buttonStyle,
        };
        this.mediaRecorderButtonStyle = {
            buttonIconTint: this.messageComposerStyle?.voiceRecordingIconTint ||
                this.themeService.theme.palette.getAccent600(),
            ...buttonStyle,
        };
        this.emojiKeyboardStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            textFont: this.messageComposerStyle?.emojiKeyboardTextFont,
            textColor: this.messageComposerStyle?.emojiKeyboardTextColor,
            background: this.themeService.theme.palette.getBackground(),
            borderRadius: "12px",
            activeIconTint: this.themeService.theme.palette.getPrimary(),
            iconTint: this.themeService.theme.palette.getAccent600()
        };
        this.stickerKeyboardStyle = {
            width: "100%",
            height: "100%",
            border: "none",
            emptyStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            emptyStateTextColor: this.themeService.theme.palette.getAccent600(),
            errorStateTextFont: fontHelper(this.themeService.theme.typography.title1),
            errorStateTextColor: this.themeService.theme.palette.getAccent600(),
            loadingIconTint: this.themeService.theme.palette.getAccent600(),
            background: this.themeService.theme.palette.getBackground(),
            borderRadius: "12px",
            categoryBackground: this.themeService.theme.palette.getBackground(),
        };
        this.attachmentButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            buttonIconTint: this.messageComposerStyle?.attachIcontint ||
                this.themeService.theme.palette.getAccent600(),
            background: "transparent",
        };
        this.createPollStyle = {
            placeholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            placeholderTextColor: this.themeService.theme.palette.getAccent600(),
            deleteIconTint: this.themeService.theme.palette.getAccent600(),
            titleFont: fontHelper(this.themeService.theme.typography.title1),
            titleColor: this.themeService.theme.palette.getAccent(),
            closeIconTint: this.themeService.theme.palette.getPrimary(),
            questionInputBackground: this.themeService.theme.palette.getAccent100(),
            optionInputBackground: this.themeService.theme.palette.getAccent100(),
            answerHelpTextFont: fontHelper(this.themeService.theme.typography.caption1),
            answerHelpTextColor: this.themeService.theme.palette.getAccent400(),
            addAnswerIconTint: this.themeService.theme.palette.getPrimary(),
            createPollButtonTextFont: fontHelper(this.themeService.theme.typography.text2),
            createPollButtonTextColor: this.themeService.theme.palette.getAccent("dark"),
            createPollButtonBackground: this.themeService.theme.palette.getPrimary(),
            addAnswerTextFont: fontHelper(this.themeService.theme.typography.text2),
            addAnswerTextColor: this.themeService.theme.palette.getPrimary(),
            errorTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            errorTextColor: this.themeService.theme.palette.getError(),
            optionPlaceholderTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            optionPlaceholderTextColor: this.themeService.theme.palette.getAccent600(),
            questionInputTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            questionInputTextColor: this.themeService.theme.palette.getAccent600(),
            optionInputTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            optionInputTextColor: this.themeService.theme.palette.getAccent600(),
            width: "360px",
            height: "620px",
            border: "",
            borderRadius: "8px",
            background: this.themeService.theme.palette.getAccent900(),
        };
    }
    setComposerStyle() {
        let defaultStyle = new MessageComposerStyle({
            background: this.themeService.theme.palette.getBackground(),
            border: `none`,
            height: "100%",
            width: "100%",
            borderRadius: "0",
            liveReactionIconTint: "red",
            attachIcontint: this.themeService.theme.palette.getAccent500(),
            sendIconTint: this.themeService.theme.palette.getPrimary(),
            emojiIconTint: this.themeService.theme.palette.getAccent500(),
            inputBackground: this.themeService.theme.palette.getAccent100(),
            inputBorder: "none",
            inputBorderRadius: "12px",
            dividerTint: this.themeService.theme.palette.getAccent200(),
            textFont: fontHelper(this.themeService.theme.typography.subtitle1),
            textColor: this.themeService.theme.palette.getAccent(),
            emojiKeyboardTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            emojiKeyboardTextColor: this.themeService.theme.palette.getAccent400(),
            previewTitleFont: fontHelper(this.themeService.theme.typography.subtitle1),
            previewTitleColor: this.themeService.theme.palette.getAccent(),
            previewSubtitleFont: fontHelper(this.themeService.theme.typography.subtitle2),
            previewSubtitleColor: this.themeService.theme.palette.getAccent600(),
            closePreviewTint: this.themeService.theme.palette.getAccent500(),
            maxInputHeight: "100px",
        });
        this.messageComposerStyle = {
            ...defaultStyle,
            ...this.messageComposerStyle,
        };
        if (!this.hideLiveReaction) {
            this.liveReactionStyle = {
                height: "24px",
                width: "24px",
                border: "none",
                borderRadius: "0",
                buttonIconTint: this.messageComposerStyle?.liveReactionIconTint,
                background: "transparent",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            };
        }
    }
    onPreviewClosed() {
        if (this.messageToBeEdited) {
            CometChatMessageEvents.ccMessageEdited.next({ message: this.messageToBeEdited, status: MessageStatus.cancelled });
        }
        this.closePreview();
    }
    closePreview() {
        this.showSendButton = false;
        this.showListForMentions = false;
        this.showMentionsCountWarning = false;
        this.showPreview = false;
        this.editPreviewText = "";
        this.messageToBeEdited = null;
        this.clearComposer();
        this.disableSendButton();
        this.ref.detectChanges();
    }
}
CometChatMessageComposerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageComposerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageComposerComponent, selector: "cometchat-message-composer", inputs: { user: "user", group: "group", disableSoundForMessages: "disableSoundForMessages", customSoundForMessage: "customSoundForMessage", customSoundForMessages: "customSoundForMessages", disableTypingEvents: "disableTypingEvents", text: "text", placeholderText: "placeholderText", headerView: "headerView", onTextChange: "onTextChange", attachmentIconURL: "attachmentIconURL", attachmentOptions: "attachmentOptions", secondaryButtonView: "secondaryButtonView", auxilaryButtonView: "auxilaryButtonView", auxiliaryButtonsAlignment: "auxiliaryButtonsAlignment", sendButtonView: "sendButtonView", parentMessageId: "parentMessageId", hideLiveReaction: "hideLiveReaction", LiveReactionIconURL: "LiveReactionIconURL", backButtonIconURL: "backButtonIconURL", mentionsWarningText: "mentionsWarningText", mentionsWarningStyle: "mentionsWarningStyle", messageComposerStyle: "messageComposerStyle", onSendButtonClick: "onSendButtonClick", onError: "onError", backdropStyle: "backdropStyle", actionSheetStyle: "actionSheetStyle", aiActionSheetStyle: "aiActionSheetStyle", hideVoiceRecording: "hideVoiceRecording", mediaRecorderStyle: "mediaRecorderStyle", aiOptionsStyle: "aiOptionsStyle", aiIconURL: "aiIconURL", voiceRecordingIconURL: "voiceRecordingIconURL", voiceRecordingCloseIconURL: "voiceRecordingCloseIconURL", voiceRecordingStartIconURL: "voiceRecordingStartIconURL", voiceRecordingStopIconURL: "voiceRecordingStopIconURL", voiceRecordingSubmitIconURL: "voiceRecordingSubmitIconURL", hideLayoutMode: "hideLayoutMode", emojiIconURL: "emojiIconURL", userMemberWrapperConfiguration: "userMemberWrapperConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters", sendButtonIconURL: "sendButtonIconURL" }, outputs: { childEvent: "childEvent" }, viewQueries: [{ propertyName: "inputElementRef", first: true, predicate: ["inputElement"], descendants: true }, { propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }, { propertyName: "emojiButtonRef", first: true, predicate: ["emojiButtonRef"], descendants: true }, { propertyName: "actionSheetRef", first: true, predicate: ["actionSheetRef"], descendants: true }, { propertyName: "stickerButtonRef", first: true, predicate: ["stickerButtonRef"], descendants: true }, { propertyName: "mediaRecordedRef", first: true, predicate: ["mediaRecordedRef"], descendants: true }, { propertyName: "aiButtonRef", first: true, predicate: ["aiButtonRef"], descendants: true }, { propertyName: "userMemberWrapperRef", first: true, predicate: ["userMemberWrapperRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"onPreviewClosed()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\"\n                [hideLayoutMode]=\"hideLayoutMode\"\n                >\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"localize('AI')\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"localize('AI')\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [closeOnOutsideClick]=\"false\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"], components: [{ type: i2.CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: ["userMemberListType", "onItemClick", "listItemView", "avatarStyle", "statusIndicatorStyle", "searchKeyword", "group", "subtitleView", "usersRequestBuilder", "disableUsersPresence", "userPresencePlacement", "hideSeperator", "loadingStateView", "onEmpty", "onError", "groupMemberRequestBuilder", "loadingIconUrl", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-composer", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"onPreviewClosed()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\"\n                [hideLayoutMode]=\"hideLayoutMode\"\n                >\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"localize('AI')\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"localize('AI')\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [closeOnOutsideClick]=\"false\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { inputElementRef: [{
                type: ViewChild,
                args: ["inputElement", { static: false }]
            }], inputRef: [{
                type: ViewChild,
                args: ["inputRef", { static: false }]
            }], emojiButtonRef: [{
                type: ViewChild,
                args: ["emojiButtonRef", { static: false }]
            }], actionSheetRef: [{
                type: ViewChild,
                args: ["actionSheetRef", { static: false }]
            }], stickerButtonRef: [{
                type: ViewChild,
                args: ["stickerButtonRef", { static: false }]
            }], mediaRecordedRef: [{
                type: ViewChild,
                args: ["mediaRecordedRef", { static: false }]
            }], aiButtonRef: [{
                type: ViewChild,
                args: ["aiButtonRef", { static: false }]
            }], userMemberWrapperRef: [{
                type: ViewChild,
                args: ["userMemberWrapperRef", { static: false }]
            }], user: [{
                type: Input
            }], group: [{
                type: Input
            }], disableSoundForMessages: [{
                type: Input
            }], customSoundForMessage: [{
                type: Input
            }], customSoundForMessages: [{
                type: Input
            }], disableTypingEvents: [{
                type: Input
            }], text: [{
                type: Input
            }], placeholderText: [{
                type: Input
            }], headerView: [{
                type: Input
            }], onTextChange: [{
                type: Input
            }], attachmentIconURL: [{
                type: Input
            }], attachmentOptions: [{
                type: Input
            }], secondaryButtonView: [{
                type: Input
            }], auxilaryButtonView: [{
                type: Input
            }], auxiliaryButtonsAlignment: [{
                type: Input
            }], sendButtonView: [{
                type: Input
            }], parentMessageId: [{
                type: Input
            }], hideLiveReaction: [{
                type: Input
            }], LiveReactionIconURL: [{
                type: Input
            }], backButtonIconURL: [{
                type: Input
            }], mentionsWarningText: [{
                type: Input
            }], mentionsWarningStyle: [{
                type: Input
            }], messageComposerStyle: [{
                type: Input
            }], onSendButtonClick: [{
                type: Input
            }], onError: [{
                type: Input
            }], backdropStyle: [{
                type: Input
            }], actionSheetStyle: [{
                type: Input
            }], aiActionSheetStyle: [{
                type: Input
            }], hideVoiceRecording: [{
                type: Input
            }], mediaRecorderStyle: [{
                type: Input
            }], aiOptionsStyle: [{
                type: Input
            }], aiIconURL: [{
                type: Input
            }], voiceRecordingIconURL: [{
                type: Input
            }], voiceRecordingCloseIconURL: [{
                type: Input
            }], voiceRecordingStartIconURL: [{
                type: Input
            }], voiceRecordingStopIconURL: [{
                type: Input
            }], voiceRecordingSubmitIconURL: [{
                type: Input
            }], hideLayoutMode: [{
                type: Input
            }], emojiIconURL: [{
                type: Input
            }], childEvent: [{
                type: Output
            }], userMemberWrapperConfiguration: [{
                type: Input
            }], disableMentions: [{
                type: Input
            }], textFormatters: [{
                type: Input
            }], sendButtonIconURL: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCwwQkFBMEIsRUFDMUIscUJBQXFCLEVBRXJCLHFCQUFxQixFQUdyQixvQkFBb0IsRUFHcEIsaUJBQWlCLEVBRWpCLDhCQUE4QixFQUM5QixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBSUwsa0JBQWtCLEVBR2xCLHNCQUFzQixFQUN2QixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFDTCxhQUFhLEVBQ2Isd0JBQXdCLEVBR3hCLHNCQUFzQixFQUN0QixpQkFBaUIsRUFDakIsdUJBQXVCLEVBSXZCLGFBQWEsRUFDYixTQUFTLEVBQ1Qsa0JBQWtCLEVBQ2xCLE1BQU0sRUFDTixrQkFBa0IsRUFDbEIsVUFBVSxFQUNWLFFBQVEsR0FDVCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUVULFlBQVksRUFDWixLQUFLLEVBR0wsTUFBTSxFQUdOLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFP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O3NCQUFsQyxLQUFLO2dCQUNHLDBCQUEwQjtzQkFBbEMsS0FBSztnQkFDRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBQ0csMkJBQTJCO3NCQUFuQyxLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDSSxVQUFVO3NCQUFuQixNQUFNO2dCQUNFLDhCQUE4QjtzQkFBdEMsS0FBSztnQkFFRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcblxuaW1wb3J0IHtcbiAgQUlPcHRpb25zU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgQ29tcG9zZXJJZCxcbiAgQ3JlYXRlUG9sbFN0eWxlLFxuICBNZXNzYWdlQ29tcG9zZXJTdHlsZSxcbiAgU21hcnRSZXBsaWVzU3R5bGUsXG4gIFN0aWNrZXJzQ29uZmlndXJhdGlvbixcbiAgU3RpY2tlcnNDb25zdGFudHMsXG4gIFN0aWNrZXJzU3R5bGUsXG4gIFVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbixcbiAgVXNlck1lbnRpb25TdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBBY3Rpb25TaGVldFN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBFbW9qaUtleWJvYXJkU3R5bGUsXG4gIE1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgUG9wb3ZlclN0eWxlLFxuICBQcmV2aWV3U3R5bGUsXG4gIHByb2Nlc3NTdWJ0aXRsZUNvbnRlbnRcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEFjdGl2ZVBvcG92ZXIsXG4gIEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCxcbiAgQ29tZXRDaGF0QWN0aW9uc1ZpZXcsXG4gIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbixcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0VUlFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBJTWVudGlvbnNDb3VudFdhcm5pbmcsXG4gIElNZXNzYWdlcyxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBQbGFjZW1lbnQsXG4gIFByZXZpZXdNZXNzYWdlTW9kZSxcbiAgU3RhdGVzLFxuICBVc2VyTWVtYmVyTGlzdFR5cGUsXG4gIGZvbnRIZWxwZXIsXG4gIGxvY2FsaXplLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgQ29tcG9uZW50LFxuICBFbGVtZW50UmVmLFxuICBFdmVudEVtaXR0ZXIsXG4gIElucHV0LFxuICBPbkNoYW5nZXMsXG4gIE9uSW5pdCxcbiAgT3V0cHV0LFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxufSBmcm9tIFwiQGFuZ3VsYXIvY29yZVwiO1xuXG5pbXBvcnQgeyBDaGF0Q29uZmlndXJhdG9yIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9GcmFtZXdvcmsvQ2hhdENvbmZpZ3VyYXRvclwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0IH0gZnJvbSBcIkBjb21ldGNoYXQvY2hhdC1zZGstamF2YXNjcmlwdFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5cbi8qKlxuICpcbiAqIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlciBpcyB1c2VkIHRvIHNlbmQgbWVzc2FnZSB0byB1c2VyIG9yIGdyb3VwLlxuICpcbiAqIEB2ZXJzaW9uIDEuMC4wXG4gKiBAYXV0aG9yIENvbWV0Q2hhdFRlYW1cbiAqIEBjb3B5cmlnaHQgwqkgMjAyMiBDb21ldENoYXQgSW5jLlxuICpcbiAqL1xuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiBcImNvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyXCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWxcIixcbiAgc3R5bGVVcmxzOiBbXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLmNvbXBvbmVudC5zY3NzXCJdLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQ29tcG9uZW50IGltcGxlbWVudHMgT25Jbml0LCBPbkNoYW5nZXMge1xuICBAVmlld0NoaWxkKFwiaW5wdXRFbGVtZW50XCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbnB1dEVsZW1lbnRSZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiaW5wdXRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGlucHV0UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImVtb2ppQnV0dG9uUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBlbW9qaUJ1dHRvblJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJhY3Rpb25TaGVldFJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYWN0aW9uU2hlZXRSZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwic3RpY2tlckJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgc3RpY2tlckJ1dHRvblJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJtZWRpYVJlY29yZGVkUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBtZWRpYVJlY29yZGVkUmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImFpQnV0dG9uUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBhaUJ1dHRvblJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJ1c2VyTWVtYmVyV3JhcHBlclJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgdXNlck1lbWJlcldyYXBwZXJSZWYhOiBFbGVtZW50UmVmO1xuXG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIGRpc2FibGVTb3VuZEZvck1lc3NhZ2VzOiBib29sZWFuID0gZmFsc2U7XG4gICAgLyoqXG4gICogQGRlcHJlY2F0ZWRcbiAgKlxuICAqIFRoaXMgcHJvcGVydHkgaXMgZGVwcmVjYXRlZCBhcyBvZiB2ZXJzaW9uIDQuMy4xOSBkdWUgdG8gbmV3ZXIgcHJvcGVydHkgJ2N1c3RvbVNvdW5kRm9yTWVzc2FnZXMnLiBJdCB3aWxsIGJlIHJlbW92ZWQgaW4gc3Vic2VxdWVudCB2ZXJzaW9ucy5cbiAgKi9cbiAgQElucHV0KCkgY3VzdG9tU291bmRGb3JNZXNzYWdlOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2VzOiBzdHJpbmcgPSBcIlwiO1xuICBASW5wdXQoKSBkaXNhYmxlVHlwaW5nRXZlbnRzOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIHRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIHBsYWNlaG9sZGVyVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJFTlRFUl9ZT1VSX01FU1NBR0VfSEVSRVwiKTtcblxuICBASW5wdXQoKSBoZWFkZXJWaWV3ITogVGVtcGxhdGVSZWY8YW55PjtcbiAgQElucHV0KCkgb25UZXh0Q2hhbmdlITogKHRleHQ6IHN0cmluZykgPT4gdm9pZDtcbiAgQElucHV0KCkgYXR0YWNobWVudEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1BsdXMuc3ZnXCI7XG4gIEBJbnB1dCgpIGF0dGFjaG1lbnRPcHRpb25zOlxuICAgIHwgKChcbiAgICAgIGl0ZW06IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwLFxuICAgICAgY29tcG9zZXJJZDogQ29tcG9zZXJJZFxuICAgICkgPT4gQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uW10pXG4gICAgfCB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIHNlY29uZGFyeUJ1dHRvblZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBhdXhpbGFyeUJ1dHRvblZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50OiBBdXhpbGlhcnlCdXR0b25BbGlnbm1lbnQgPVxuICAgIEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudC5yaWdodDtcbiAgQElucHV0KCkgc2VuZEJ1dHRvblZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBwYXJlbnRNZXNzYWdlSWQ6IG51bWJlciA9IDA7XG4gIEBJbnB1dCgpIGhpZGVMaXZlUmVhY3Rpb246IGJvb2xlYW4gPSB0cnVlO1xuICBASW5wdXQoKSBMaXZlUmVhY3Rpb25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9oZWFydC1yZWFjdGlvbi5wbmdcIjtcbiAgQElucHV0KCkgYmFja0J1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2JhY2tidXR0b24uc3ZnXCI7XG4gIEBJbnB1dCgpIG1lbnRpb25zV2FybmluZ1RleHQ/OiBzdHJpbmc7XG4gIEBJbnB1dCgpIG1lbnRpb25zV2FybmluZ1N0eWxlPzogYW55O1xuICBwdWJsaWMgSW5mb1NpbXBsZUljb24gPSBcImFzc2V0cy9JbmZvU2ltcGxlSWNvbi5zdmdcIjtcblxuICBASW5wdXQoKSBtZXNzYWdlQ29tcG9zZXJTdHlsZTogTWVzc2FnZUNvbXBvc2VyU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICBtYXhJbnB1dEhlaWdodDogXCIxMDBweFwiLFxuICB9O1xuICBASW5wdXQoKSBvblNlbmRCdXR0b25DbGljazpcbiAgICB8ICgobWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlLCBwcmV2aWV3TWVzc2FnZU1vZGU/OiBQcmV2aWV3TWVzc2FnZU1vZGUpID0+IHZvaWQpXG4gICAgfCB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGFjdGlvblNoZWV0U3R5bGU6IEFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgbGF5b3V0TW9kZUljb25UaW50OiBcInJnYmEoMjAsIDIwLCAyMCwgMC4wNClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDI1NSwyNTUsMjU1KVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgdGl0bGVGb250OiBcIjUwMCAxNXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGl0bGVDb2xvcjogXCIjMTQxNDE0XCIsXG4gICAgbGlzdEl0ZW1CYWNrZ3JvdW5kOiBcIlwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICAgIGxpc3RJdGVtSWNvbkJhY2tncm91bmQ6XCJcIixcbiAgICBsaXN0SXRlbUljb25UaW50OlwiXCJcbiAgfTtcblxuICBASW5wdXQoKSBhaUFjdGlvblNoZWV0U3R5bGU6IGFueSA9IHtcbiAgICBsYXlvdXRNb2RlSWNvblRpbnQ6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjA0KVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2IoMjU1LDI1NSwyNTUpXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB0aXRsZUZvbnQ6IFwiNTAwIDE1cHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICB0aXRsZUNvbG9yOiBcIiMxNDE0MTRcIixcbiAgICBsaXN0SXRlbUJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBBY3Rpb25TaGVldFNlcGFyYXRvclRpbnQ6IFwiMXB4IHNvbGlkIFJHQkEoMjAsIDIwLCAyMCwgMC4wOClcIixcbiAgfTtcblxuICBASW5wdXQoKSBoaWRlVm9pY2VSZWNvcmRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgbWVkaWFSZWNvcmRlclN0eWxlOiBNZWRpYVJlY29yZGVyU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYWlPcHRpb25zU3R5bGU6IEFJT3B0aW9uc1N0eWxlID0ge307XG4gIEBJbnB1dCgpIGFpSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYWktYm90LnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ0ljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21pYy5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdDbG9zZUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nU3RhcnRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9taWMuc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nU3RvcEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3N0b3Auc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nU3VibWl0SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU2VuZC5zdmdcIjtcbiAgQElucHV0KCkgaGlkZUxheW91dE1vZGU6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgZW1vamlJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TdGlwb3Auc3ZnXCI7XG4gIEBPdXRwdXQoKSBjaGlsZEV2ZW50OiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gIEBJbnB1dCgpIHVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbjogVXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uID0gbmV3IFVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbih7fSk7XG4gIHB1YmxpYyB1c2VyTWVtYmVyTGlzdFR5cGUhOiBVc2VyTWVtYmVyTGlzdFR5cGU7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9ucz86IGJvb2xlYW47XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBbXTtcbiAgQElucHV0KCkgc2VuZEJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NlbmQuc3ZnXCI7XG5cbiAgcHVibGljIGNvbXBvc2VySWQhOiBDb21wb3NlcklkO1xuICBtZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWQ6IHN0cmluZyA9IFwiY29tcG9zZXJfXCIgKyBEYXRlLm5vdygpO1xuICBwdWJsaWMgY29tcG9zZXJBY3Rpb25zOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSA9IFtdO1xuICBwdWJsaWMgc3RhdGVzOiB0eXBlb2YgU3RhdGVzID0gU3RhdGVzO1xuICBwdWJsaWMgbWVudGlvbnNTZWFyY2hUZXJtOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgc2hvd0xpc3RGb3JNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgbWVudGlvbnNTZWFyY2hDb3VudDogbnVtYmVyID0gMTtcbiAgcHVibGljIGxhc3RFbXB0eVNlYXJjaFRlcm0/OiBzdHJpbmcgPSBcIlwiO1xuXG4gIHB1YmxpYyBzbWFydFJlcGx5U3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc2hvd01lbnRpb25zQ291bnRXYXJuaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgcHVibGljIHVzZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmchOiBTdWJzY3JpcHRpb247XG4gIGluaXRpYWxUZXh0OnN0cmluZyA9IFwiXCI7XG4gIGxvYWRpbmdTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiR0VORVJBVElOR19SRVBMSUVTXCIpO1xuICBlcnJvclN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJTT01FVEhJTkdfV1JPTkdcIik7XG4gIGVtcHR5U3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIk5PX01FU1NBR0VTX0ZPVU5EXCIpO1xuICBzaG93Q3JlYXRlUG9sbHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd1N0aWNrZXJLZXlib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93QWN0aW9uU2hlZXRJdGVtOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dBY3Rpb25TaGVldEl0ZW1BSTogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93U21hcnRSZXBseTogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93QWlGZWF0dXJlczogYm9vbGVhbiA9IGZhbHNlO1xuICByZXBsaWVzQXJyYXk6IHN0cmluZ1tdID0gW107XG4gIGFpQm90TGlzdDogQ29tZXRDaGF0LlVzZXJbXSA9IFtdO1xuICBjdXJyZW50QXNrQUlCb3Q6IGFueSA9IFwiXCI7XG4gIGlzQWlNb3JlVGhhbk9uZTogYm9vbGVhbiA9IGZhbHNlO1xuXG4gIHNob3dQcmV2aWV3OiBib29sZWFuID0gZmFsc2U7XG4gIGFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcbiAgZWRpdFByZXZpZXdPYmplY3QhOiBDb21ldENoYXQuVGV4dE1lc3NhZ2U7XG4gIGNjTWVzc2FnZUVkaXQhOiBTdWJzY3JpcHRpb247XG4gIGNjQ29tcG9zZU1lc3NhZ2UhOiBTdWJzY3JpcHRpb247XG4gIHB1YmxpYyB0ZXh0Rm9ybWF0dGVyTGlzdDogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgPyBbLi4udGhpcy50ZXh0Rm9ybWF0dGVyc11cbiAgICA6IFtdO1xuICBwdWJsaWMgbWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgbWVudGlvbmVkVXNlcnM6IEFycmF5PENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyPiA9IFtdO1xuICBwdWJsaWMgZW5hYmxlU3RpY2tlcktleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyB0b2dnbGVNZWRpYVJlY29yZGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93QWlCb3RMaXN0OiBib29sZWFuID0gZmFsc2U7XG4gIG1lbnRpb25zVHlwZVNldEJ5VXNlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc3RpY2tlckNvbmZpZ3VyYXRpb246IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBjb25maWd1cmF0aW9uPzogU3RpY2tlcnNDb25maWd1cmF0aW9uO1xuICB9ID0ge307XG4gIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvcGx1cy1yb3RhdGVkLnN2Z1wiO1xuXG4gIGJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuICBhaUFjdGlvbkJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuXG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHNlbmRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBsaXZlUmVhY3Rpb25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZWRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgfTtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICBlbW9qaUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIHN0aWNrZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBtZWRpYVJlY29yZGVyQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcblxuICBlbW9qaUtleWJvYXJkU3R5bGU6IEVtb2ppS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dEZvbnQsXG4gICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dENvbG9yLFxuICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gIH07XG5cbiAgc3RpY2tlcktleWJvYXJkU3R5bGU6IFN0aWNrZXJzU3R5bGUgPSB7fTtcbiAgdGV4dElucHV0U3R5bGU6IGFueSA9IHt9O1xuICBwcmV2aWV3U3R5bGU6IFByZXZpZXdTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgY3JlYXRlUG9sbFN0eWxlOiBDcmVhdGVQb2xsU3R5bGUgPSB7fTtcbiAgc3RvcmVUeXBpbmdJbnRlcnZhbDogYW55O1xuICBlbW9qaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIzMTVweFwiLFxuICAgIGhlaWdodDogXCIzMjBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHN0aWNrZXJQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICBoZWlnaHQ6IFwiMzIwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBhaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyODBweFwiLFxuICAgIGhlaWdodDogXCIyODBweFwiLFxuXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgbWVkaWFSZWNvcmRlZFBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNTBweFwiLFxuICAgIGhlaWdodDogXCIxMDBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHBvcG92ZXJTdHlsZTogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI3NXB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4MHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgZW1vamlCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TdGlwb3Auc3ZnXCI7XG4gIHN0aWNrZXJCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TdGlja2Vycy5zdmdcIjtcblxuICBhY3Rpb25zITogKENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiB8IENvbWV0Q2hhdEFjdGlvbnNWaWV3KVtdO1xuICBtZXNzYWdlVGV4dDogc3RyaW5nID0gXCJcIjtcbiAgYXR0YWNobWVudEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIGF1eGlsYXJ5UGxhY2VtZW50OiBQbGFjZW1lbnQgPSBQbGFjZW1lbnQudG9wO1xuICBtZXNzYWdlU2VuZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBtZXNzYWdlVG9CZUVkaXRlZCE6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSB8IG51bGw7XG4gIHB1YmxpYyBlZGl0UHJldmlld1RleHQ6IHN0cmluZyB8IG51bGwgPSBcIlwiO1xuICBzaG93U2VuZEJ1dHRvbjogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93RW1vamlLZXlib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBpc0FpRW5hYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBzbWFydFJlcGxpZXM6IHN0cmluZ1tdID0gW107XG4gIGxvZ2dlZEluVXNlciE6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbDtcbiAgbWVudGlvblN0eWxlTG9jYWw6IFVzZXJNZW50aW9uU3R5bGUgPSBuZXcgVXNlck1lbnRpb25TdHlsZSh7fSk7XG4gIGNjQWN0aXZlUG9wb3ZlciE6U3Vic2NyaXB0aW9uO1xuXG5cbiAgc2VuZE1lc3NhZ2VPbkVudGVyID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMuc2VuZFRleHRNZXNzYWdlKGV2ZW50LmRldGFpbC52YWx1ZSk7XG4gICAgdGhpcy5jbGVhckNvbXBvc2VyKCk7XG4gICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKVxuICB9O1xuICBkaXNhYmxlU2VuZEJ1dHRvbigpIHtcbiAgICB0aGlzLnNlbmRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG1lc3NhZ2VJbnB1dENoYW5nZWQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBldmVudD8uZGV0YWlsPy52YWx1ZT8udHJpbSgpO1xuICAgIHRoaXMuc2VuZEJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRleHRcbiAgICAgICAgPyB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5zZW5kSWNvblRpbnRcbiAgICAgICAgOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgaWYgKCF0ZXh0KSB7XG4gICAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0aGlzLm9uVGV4dENoYW5nZSkge1xuICAgICAgdGhpcy5vblRleHRDaGFuZ2UodGV4dCk7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZVRleHQgPSB0ZXh0O1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICB0aGlzLnN0YXJ0VHlwaW5nKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgfVxuICB9O1xuICBhcHBlbmRFbW9qaSA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKHRoaXMudGV4dCA9PT0gZXZlbnQ/LmRldGFpbC5pZCkge1xuICAgICAgdGhpcy50ZXh0ID0gXCJcIiArIFwiXCI7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIHRoaXMudGV4dCA9IGV2ZW50Py5kZXRhaWwuaWQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzZW5kUmVhY3Rpb24oKSB7XG4gICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyB0aGlzLnVzZXI/LmdldFVpZCgpIVxuICAgICAgOiB0aGlzLmdyb3VwPy5nZXRHdWlkKCkhO1xuICAgIGxldCByZWNlaXZlclR5cGUgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICB0eXBlOiBcImxpdmVfcmVhY3Rpb25cIixcbiAgICAgIHJlYWN0aW9uOiBcImhlYXJ0XCIsXG4gICAgfTtcbiAgICBsZXQgdHJhbnNpZW50TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVHJhbnNpZW50TWVzc2FnZShcbiAgICAgIHJlY2VpdmVySWQsXG4gICAgICByZWNlaXZlclR5cGUsXG4gICAgICBkYXRhXG4gICAgKTtcbiAgICBDb21ldENoYXQuc2VuZFRyYW5zaWVudE1lc3NhZ2UodHJhbnNpZW50TWVzc2FnZSk7XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY0xpdmVSZWFjdGlvbi5uZXh0KFwiaGVhcnRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgb3BlbkNyZWF0ZVBvbGxzID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NyZWF0ZVBvbGxzID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgY2xvc2VDcmVhdGVQb2xscyA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDcmVhdGVQb2xscyA9IGZhbHNlO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzZW5kUmVjb3JkZWRNZWRpYSA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IGZpbGUgPSBldmVudD8uZGV0YWlsPy5maWxlO1xuICAgIGlmIChmaWxlKSB7XG4gICAgICB0aGlzLnNlbmRSZWNvcmRlZEF1ZGlvKGZpbGUpO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgY2xvc2VNZWRpYVJlY29yZGVyKGV2ZW50PzogYW55KSB7XG4gICAgaWYgKHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCkge1xuICAgICAgdGhpcy5tZWRpYVJlY29yZGVkUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9ICF0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIGdldEZvcm1hdHRlZERhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBjb25zdCB5ZWFyID0gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xuICAgIGNvbnN0IG1vbnRoID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldE1vbnRoKCkgKyAxKTtcbiAgICBjb25zdCBkYXkgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0RGF0ZSgpKTtcbiAgICBjb25zdCBob3VycyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRIb3VycygpKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldE1pbnV0ZXMoKSk7XG4gICAgY29uc3Qgc2Vjb25kcyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRTZWNvbmRzKCkpO1xuXG4gICAgcmV0dXJuIGAke3llYXJ9JHttb250aH0ke2RheX0ke2hvdXJzfSR7bWludXRlc30ke3NlY29uZHN9YDtcbiAgfVxuXG4gIHBhZFplcm8obnVtOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBudW0udG9TdHJpbmcoKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIH1cblxuICBzZW5kUmVjb3JkZWRBdWRpbyA9IChmaWxlOiBCbG9iKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGZpbGU7XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICBgYXVkaW8tcmVjb3JkaW5nLSR7dGhpcy5nZXRGb3JtYXR0ZWREYXRlKCl9LndhdmAsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgYWRkQXR0YWNobWVudENhbGxiYWNrKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9zZXJBY3Rpb25zPy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24pID0+IHtcbiAgICAgIHN3aXRjaCAoZWxlbWVudC5pZCkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbzpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkF1ZGlvUGlja2VyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW86XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW52aWRlb1BpY2tlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5GaWxlUGlja2VyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5JbWFnZVBpY2tlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJleHRlbnNpb25fcG9sbFwiOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuQ3JlYXRlUG9sbHM7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGNsb3NlQ29tcG9zZXJQb3BvdmVyKCl7XG4gICAgaWYodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKXtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZih0aGlzLnNob3dBaUZlYXR1cmVzKXtcbiAgICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKVxuXG4gIH1cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0FjdGl2ZVBvcG92ZXIgPSBDb21ldENoYXRVSUV2ZW50cy5jY0FjdGl2ZVBvcG92ZXIuc3Vic2NyaWJlKChkYXRhOkFjdGl2ZVBvcG92ZXIpPT57XG4gICAgICBpZihkYXRhID09IEFjdGl2ZVBvcG92ZXIubWVzc2FnZUxpc3Qpe1xuICAgICAgICB0aGlzLmNsb3NlQ29tcG9zZXJQb3BvdmVyKCk7XG4gICAgICB9XG4gICAgfSlcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgbGV0IHBhcmVudElkID0gb2JqZWN0Py5tZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgICBpZiAoKHRoaXMucGFyZW50TWVzc2FnZUlkICYmIHBhcmVudElkICYmIHBhcmVudElkID09IHRoaXMucGFyZW50TWVzc2FnZUlkKSB8fCAoIXRoaXMucGFyZW50TWVzc2FnZUlkICYmICFwYXJlbnRJZCkpIHtcbiAgICAgICAgICBpZiAob2JqZWN0Py5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gb2JqZWN0Lm1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQob2JqZWN0Py5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5vcGVuRWRpdFByZXZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoKG9iamVjdD8uc3RhdHVzID09PSBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MgJiYgb2JqZWN0Lm1lc3NhZ2UgaW5zdGFuY2VvZiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHx8IG9iamVjdD8uc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuY2FuY2VsbGVkKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlUHJldmlldygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NvbXBvc2VNZXNzYWdlID0gQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5zdWJzY3JpYmUoXG4gICAgICAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPVxuICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcuc3Vic2NyaWJlKFxuICAgICAgICAoZGF0YTogSU1lbnRpb25zQ291bnRXYXJuaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKGRhdGEuaWQgPT0gdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWQpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnNob3dXYXJuaW5nKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gIH1cbiAgb3BlbkVkaXRQcmV2aWV3KCkge1xuICAgIGxldCBtZXNzYWdlVGV4dFdpdGhNZW50aW9uVGFncyA9IHRoaXMuY2hlY2tGb3JNZW50aW9ucyhcbiAgICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhXG4gICAgKTtcbiAgICB0aGlzLmNsZWFyQ29tcG9zZXIoKVxuICAgIHRoaXMuaW5wdXRSZWYubmF0aXZlRWxlbWVudC50ZXh0ID0gXCJcIjtcbiAgICB0aGlzLnRleHQgPSBwcm9jZXNzU3VidGl0bGVDb250ZW50KHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhLmdldFRleHQoKSk7XG4gICAgdGhpcy5lZGl0UHJldmlld1RleHQgPSBtZXNzYWdlVGV4dFdpdGhNZW50aW9uVGFncztcbiAgICB0aGlzLnNob3dQcmV2aWV3ID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICAvKlxuKiBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudDogVG8gY2hlY2sgaWYgdGhlIG1lc3NhZ2UgYmVsb25ncyBmb3IgdGhpcyBsaXN0IGFuZCBpcyBub3QgcGFydCBvZiB0aHJlYWQgZXZlbiBmb3IgY3VycmVudCBsaXN0XG5pdCBvbmx5IHJ1bnMgZm9yIFVJIGV2ZW50IGJlY2F1c2UgaXQgYXNzdW1lcyBsb2dnZWQgaW4gdXNlciBpcyBhbHdheXMgc2VuZGVyXG4qIEBwYXJhbTogbWVzc2FnZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlXG4qL1xuICBpc1BhcnRPZkN1cnJlbnRDaGF0Rm9yVUlFdmVudCA9XG4gICAgKG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpID09PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UGFyZW50TWVzc2FnZUlkKCkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy51c2VyKSB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlciAmJlxuICAgICAgICAgICAgbWVzc2FnZT8uZ2V0UmVjZWl2ZXJJZCgpID09PSB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwKSB7XG4gICAgICAgICAgaWYgKG1lc3NhZ2UuZ2V0UmVjZWl2ZXJUeXBlKCkgPT09IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXAgJiZcbiAgICAgICAgICAgIG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgQCBmb3IgZXZlcnkgbWVudGlvbiB0aGUgbWVzc2FnZSBieSBtYXRjaGluZyB1aWRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHJldHVybnMgIHt2b2lkfVxuICAgKi9cbiAgY2hlY2tGb3JNZW50aW9ucyhtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWdleCA9IC88QHVpZDooLio/KT4vZztcbiAgICBsZXQgbWVzc2FnZVRleHQgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dDtcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzR3JvdXBNZW1iZXJzID0gW107XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2VUZXh0VG1wLnJlcGxhY2UobWF0Y2hbMF0sIFwiQFwiICsgdXNlci5nZXROYW1lKCkpO1xuICAgICAgICBjb21ldENoYXRVc2Vyc0dyb3VwTWVtYmVycy5wdXNoKHVzZXIpO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKFxuICAgICAgY29tZXRDaGF0VXNlcnNHcm91cE1lbWJlcnNcbiAgICApO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0TG9nZ2VkSW5Vc2VyKHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0VG1wO1xuICB9XG5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1Nob3dNZW50aW9uc0NvdW50V2FybmluZz8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBjbG9zZU1vZGFscygpIHtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWY/Lm5hdGl2ZUVsZW1lbnQ/LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCkge1xuICAgICAgdGhpcy5tZWRpYVJlY29yZGVkUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG5cbiAgY2FsbENvbnZlcnNhdGlvblN1bW1hcnlNZXRob2QoKSB7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuXG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwubmV4dCh7XG4gICAgICBjaGlsZDogeyBzaG93Q29udmVyc2F0aW9uU3VtbWFyeVZpZXc6IHRydWUgfSxcbiAgICB9KTtcbiAgfVxuICBjbGVhckNvbXBvc2VyKCl7XG4gICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gXCJcIjtcbiAgICB0aGlzLmlucHV0UmVmPy5uYXRpdmVFbGVtZW50Py5lbXB0eUlucHV0RmllbGQoKTtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgdGhpcy51c2VyT3JHcm91cENoYW5nZWQoY2hhbmdlcyk7XG4gICAgICBpZiAodGhpcy5pbml0aWFsVGV4dCAhPT0gdGhpcy50ZXh0KSB7XG4gICAgICAgIHRoaXMuY2xlYXJDb21wb3NlcigpO1xuICAgICAgfVxuICAgICAgdGhpcy50ZXh0ID0gdGhpcy5pbml0aWFsVGV4dCB8fCBcIlwiO1xuICAgIH1cbiAgICBpZiAoY2hhbmdlc1tcInRleHRcIl0/LmN1cnJlbnRWYWx1ZSkge1xuICAgICAgdGhpcy5pbml0aWFsVGV4dCA9IGNoYW5nZXNbXCJ0ZXh0XCJdLmN1cnJlbnRWYWx1ZTtcbiAgICAgIHRoaXMudGV4dCA9IHRoaXMuaW5pdGlhbFRleHQ7XG4gICAgfVxuICB9XG4gIFxuICB1c2VyT3JHcm91cENoYW5nZWQoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmICh0aGlzLnNob3dQcmV2aWV3KSB7XG4gICAgICB0aGlzLmNsb3NlUHJldmlldygpXG4gICAgfVxuICAgIGlmICghdGhpcy5kaXNhYmxlTWVudGlvbnMpIHtcbiAgICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgICAgaWYgKGNoYW5nZXNbXCJncm91cFwiXSAmJiB0aGlzLmdyb3VwKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbj8udXNlck1lbWJlckxpc3RUeXBlID09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJMaXN0VHlwZSA9IFVzZXJNZW1iZXJMaXN0VHlwZS5ncm91cG1lbWJlcnM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uXG4gICAgICAgICAgLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXIoXG4gICAgICAgICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgICAgICAgICkuc2V0TGltaXQoMTUpO1xuICAgICAgfVxuICAgICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdICYmIHRoaXMudXNlcikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24/LnVzZXJNZW1iZXJMaXN0VHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyTGlzdFR5cGUgPSBVc2VyTWVtYmVyTGlzdFR5cGUudXNlcnM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy51c2Vyc1JlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAudXNlcnNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24udXNlcnNSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyKCkuc2V0TGltaXQoMTUpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNob3dBaUJvdExpc3QgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gZmFsc2U7XG4gICAgdGhpcy5jbG9zZU1vZGFscygpO1xuICAgIHRoaXMubWVzc2FnZVRleHQgPSB0aGlzLnRleHQ7XG4gICAgaWYgKHRoaXMuaW5wdXRSZWYgJiYgdGhpcy5pbnB1dFJlZi5uYXRpdmVFbGVtZW50KSB7XG4gICAgICBzZXRUaW1lb3V0KCgpPT57XG4gICAgICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgICAgICB0aGlzLmlucHV0UmVmPy5uYXRpdmVFbGVtZW50Py5wYXN0ZUh0bWxBdENhcmV0KHRoaXMudGV4dCk7XG4gICAgICB9LDApXG4gICAgfVxuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLmNvbXBvc2VySWQgPSB0aGlzLmdldENvbXBvc2VySWQoKTtcbiAgICBpZiAodGhpcy5hdHRhY2htZW50T3B0aW9ucykge1xuICAgICAgdGhpcy5jb21wb3NlckFjdGlvbnMgPSB0aGlzLmF0dGFjaG1lbnRPcHRpb25zKFxuICAgICAgICB0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5jb21wb3NlcklkXG4gICAgICApO1xuICAgICAgdGhpcy5hZGRBdHRhY2htZW50Q2FsbGJhY2soKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5jb21wb3NlckFjdGlvbnMgPVxuICAgICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKT8uZ2V0QXR0YWNobWVudE9wdGlvbnMoXG4gICAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICAgICAgdGhpcy51c2VyLFxuICAgICAgICAgIHRoaXMuZ3JvdXAsXG4gICAgICAgICAgdGhpcy5jb21wb3NlcklkXG4gICAgICAgICk7XG4gICAgICB0aGlzLmFkZEF0dGFjaG1lbnRDYWxsYmFjaygpO1xuICAgIH1cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3RbaV0uc2V0Q29tcG9zZXJDb25maWcodGhpcy51c2VyLCB0aGlzLmdyb3VwLCB0aGlzLmNvbXBvc2VySWQpO1xuICAgIH1cbiAgfVxuXG4gIG5nT25EZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMudW5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuY2xlYW51cCgpO1xuICB9XG5cbiAgY3VzdG9tU2VuZE1ldGhvZChtZXNzYWdlOiBTdHJpbmcpIHtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5zZW5kVGV4dE1lc3NhZ2UobWVzc2FnZSk7XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7U3RyaW5nPVwiXCJ9IHRleHRNc2dcbiAgICovXG4gIHNlbmRUZXh0TWVzc2FnZSh0ZXh0TXNnOiBTdHJpbmcgPSBcIlwiKTogYm9vbGVhbiB7XG4gICAgdGhpcy5lbmRUeXBpbmcoKTtcbiAgICB0cnkge1xuICAgICAgLy8gRG9udCBTZW5kIEJsYW5rIHRleHQgbWVzc2FnZXMgLS0gaS5lIC0tLSBtZXNzYWdlcyB0aGF0IG9ubHkgY29udGFpbiBzcGFjZXNcbiAgICAgIGlmIChcbiAgICAgICAgdGhpcy5tZXNzYWdlVGV4dD8udHJpbSgpPy5sZW5ndGggPT0gMCAmJlxuICAgICAgICB0ZXh0TXNnPy50cmltKCk/Lmxlbmd0aCA9PSAwXG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgLy8gd2FpdCBmb3IgdGhlIHByZXZpb3VzIG1lc3NhZ2UgdG8gYmUgc2VudCBiZWZvcmUgc2VuZGluZyB0aGUgY3VycmVudCBtZXNzYWdlXG4gICAgICBpZiAodGhpcy5tZXNzYWdlU2VuZGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gdHJ1ZTtcbiAgICAgIC8vIElmIGl0cyBhbiBFZGl0IGFuZCBTZW5kIE1lc3NhZ2UgT3BlcmF0aW9uICwgdXNlIEVkaXQgTWVzc2FnZSBGdW5jdGlvblxuICAgICAgaWYgKHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQpIHtcbiAgICAgICAgdGhpcy5lZGl0TWVzc2FnZSgpO1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgIGxldCBtZXNzYWdlSW5wdXQ7XG4gICAgICBpZiAodGV4dE1zZyAhPT0gbnVsbCkge1xuICAgICAgICBtZXNzYWdlSW5wdXQgPSB0ZXh0TXNnLnRyaW0oKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG1lc3NhZ2VJbnB1dCA9IHRoaXMubWVzc2FnZVRleHQudHJpbSgpO1xuICAgICAgfVxuICAgICAgbGV0IHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRleHRNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBtZXNzYWdlSW5wdXQsXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRQYXJlbnRNZXNzYWdlSWQodGhpcy5wYXJlbnRNZXNzYWdlSWQpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5tZW50aW9uZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgbGV0IHVzZXJPYmplY3RzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5tZW50aW9uZWRVc2Vycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHVzZXJPYmplY3RzLnB1c2goXG4gICAgICAgICAgICB0aGlzLm1lbnRpb25lZFVzZXJzW2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyXG4gICAgICAgICAgICAgID8gKHRoaXMubWVudGlvbmVkVXNlcnNbaV0gYXMgQ29tZXRDaGF0LlVzZXIpXG4gICAgICAgICAgICAgIDogdGhpcy5tZW50aW9uZWRVc2Vyc1tpXVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0TWVudGlvbmVkVXNlcnModXNlck9iamVjdHMpO1xuICAgICAgICB0aGlzLm1lbnRpb25lZFVzZXJzID0gW107XG4gICAgICB9XG5cbiAgICAgIHRleHRNZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICAgIHRleHRNZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIHRleHRNZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlcilcbiAgICAgIH1cbiAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG5cbiAgICAgIC8vIHBsYXkgYXVkaW8gYWZ0ZXIgYWN0aW9uIGdlbmVyYXRpb25cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgfVxuICAgICAgLy9jbGVhcmluZyBNZXNzYWdlIElucHV0IEJveFxuICAgICAgdGhpcy5jbGVhckNvbXBvc2VyKClcbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXh0TWVzc2FnZSA9ICh0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldLmZvcm1hdE1lc3NhZ2VGb3JTZW5kaW5nKHRleHRNZXNzYWdlKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgLy8gRW5kIFR5cGluZyBJbmRpY2F0b3IgRnVuY3Rpb25cbiAgICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgICAgaWYgKCF0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKSB7XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICBtZXNzYWdlOiB0ZXh0TWVzc2FnZSxcbiAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZSh0ZXh0TWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgc2VuZCBidXR0b24gdG8gcmVhY3Rpb24gYnV0dG9uXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHRleHRNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogdGV4dE1lc3NhZ2UsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vblNlbmRCdXR0b25DbGljayh0ZXh0TWVzc2FnZSwgUHJldmlld01lc3NhZ2VNb2RlLm5vbmUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG9uQWlCYWNrQnV0dG9uQ2xpY2soKSB7XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIGVkaXRNZXNzYWdlKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlVG9CZUVkaXRlZDogYW55ID0gdGhpcy5tZXNzYWdlVG9CZUVkaXRlZDtcbiAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgIGxldCBtZXNzYWdlVGV4dCA9IHRoaXMubWVzc2FnZVRleHQudHJpbSgpO1xuICAgICAgbGV0IG1lbnRpb25lZFVzZXJzID0gW107XG4gICAgICBpZiAobWVzc2FnZVRvQmVFZGl0ZWQuZ2V0TWVudGlvbmVkVXNlcnMoKSkge1xuICAgICAgICBtZW50aW9uZWRVc2VycyA9IG1lc3NhZ2VUb0JlRWRpdGVkLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgICAgIG1lc3NhZ2VUZXh0ID1cbiAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldE9yaWdpbmFsVGV4dChtZXNzYWdlVGV4dCk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgICAgICBtZW50aW9uZWRVc2Vyc1xuICAgICAgICApO1xuICAgICAgICBtZXNzYWdlVGV4dCA9XG4gICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRPcmlnaW5hbFRleHQobWVzc2FnZVRleHQpO1xuICAgICAgfVxuICAgICAgbGV0IHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRleHRNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBtZXNzYWdlVGV4dCxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZW50aW9uZWRVc2VycyhtZW50aW9uZWRVc2Vycyk7XG4gICAgICB9XG4gICAgICB0ZXh0TWVzc2FnZS5zZXRJZChtZXNzYWdlVG9CZUVkaXRlZC5pZCk7XG4gICAgICB0aGlzLmNsb3NlUHJldmlldygpO1xuICAgICAgdGhpcy5lbmRUeXBpbmcoKTtcbiAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dE1lc3NhZ2UgPSAodGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5mb3JtYXRNZXNzYWdlRm9yU2VuZGluZyh0ZXh0TWVzc2FnZSkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5vblNlbmRCdXR0b25DbGljaykge1xuICAgICAgICBDb21ldENoYXQuZWRpdE1lc3NhZ2UodGV4dE1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKHRleHRNZXNzYWdlLCBQcmV2aWV3TWVzc2FnZU1vZGUuZWRpdClcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0UmVjZWl2ZXJEZXRhaWxzKCkge1xuICAgIGxldCByZWNlaXZlcklkITogc3RyaW5nO1xuICAgIGxldCByZWNlaXZlclR5cGUhOiBzdHJpbmc7XG4gICAgbGV0IGlzQmxvY2tlZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICByZWNlaXZlcklkID0gdGhpcy51c2VyLmdldFVpZCgpO1xuICAgICAgcmVjZWl2ZXJUeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgaXNCbG9ja2VkID0gdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgfHwgdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgcmVjZWl2ZXJJZCA9IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgICAgcmVjZWl2ZXJUeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICB9XG4gICAgcmV0dXJuIHsgcmVjZWl2ZXJJZDogcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlOiByZWNlaXZlclR5cGUsIGlzQmxvY2tlZCB9O1xuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UgfHwgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShcbiAgICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nTWVzc2FnZSxcbiAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UgfHwgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIucGxheShDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQub3V0Z29pbmdNZXNzYWdlKTtcbiAgICB9XG4gIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7fSB0aW1lcj1udWxsXG4gICAqIEBwYXJhbSAge3N0cmluZz1cIlwifSBtZXRhZGF0YVxuICAgKi9cbiAgc3RhcnRUeXBpbmcodGltZXIgPSBudWxsLCBtZXRhZGF0YTogc3RyaW5nID0gXCJcIik6IHZvaWQge1xuICAgIGlmICghdGhpcy5kaXNhYmxlVHlwaW5nRXZlbnRzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgdHlwaW5nSW50ZXJ2YWwgPSB0aW1lciB8fCA1MDAwO1xuICAgICAgICBsZXQgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUsIGlzQmxvY2tlZCB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgICAgaWYgKGlzQmxvY2tlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdHlwaW5nTWV0YWRhdGEgPSBtZXRhZGF0YSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB0eXBpbmdOb3RpZmljYXRpb24gPSBuZXcgQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcihcbiAgICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICAgIHJlY2VpdmVyVHlwZSxcbiAgICAgICAgICB0eXBpbmdNZXRhZGF0YVxuICAgICAgICApO1xuICAgICAgICBDb21ldENoYXQuc3RhcnRUeXBpbmcodHlwaW5nTm90aWZpY2F0aW9uKTtcbiAgICAgICAgdGhpcy5zdG9yZVR5cGluZ0ludGVydmFsID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgdGhpcy5lbmRUeXBpbmcoKTtcbiAgICAgICAgfSwgdHlwaW5nSW50ZXJ2YWwpO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlQWN0aW9ucyA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IGFjdGlvbjogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uID0gZXZlbnQ/LmRldGFpbD8uYWN0aW9uO1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICBpZiAoYWN0aW9uLm9uQ2xpY2spIHtcbiAgICAgIGFjdGlvbi5vbkNsaWNrKCk7XG4gICAgfVxuICAgIGlmKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSl7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSBmYWxzZTtcbiAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKClcbiAgICB9XG4gIH07XG4gIGVuZFR5cGluZyhtZXRhZGF0YSA9IG51bGwpIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZ0V2ZW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBpc0Jsb2NrZWQgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHR5cGluZ01ldGFkYXRhID0gbWV0YWRhdGEgfHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdHlwaW5nTm90aWZpY2F0aW9uID0gbmV3IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IoXG4gICAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgICByZWNlaXZlclR5cGUsXG4gICAgICAgICAgdHlwaW5nTWV0YWRhdGFcbiAgICAgICAgKTtcbiAgICAgICAgQ29tZXRDaGF0LmVuZFR5cGluZyh0eXBpbmdOb3RpZmljYXRpb24pO1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zdG9yZVR5cGluZ0ludGVydmFsKTtcbiAgICAgICAgdGhpcy5zdG9yZVR5cGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7RmlsZSB8IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2V9IG1lc3NhZ2VJbnB1dFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG1lc3NhZ2VUeXBlXG4gICAqL1xuICBzZW5kTWVkaWFNZXNzYWdlKG1lc3NhZ2VJbnB1dDogRmlsZSwgbWVzc2FnZVR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlU2VuZGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lZGlhTWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSA9IG5ldyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBtZXNzYWdlSW5wdXQsXG4gICAgICAgIG1lc3NhZ2VUeXBlLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG5cbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBtZWRpYU1lc3NhZ2Uuc2V0UGFyZW50TWVzc2FnZUlkKHRoaXMucGFyZW50TWVzc2FnZUlkKTtcbiAgICAgIH1cbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRUeXBlKG1lc3NhZ2VUeXBlKTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRNZXRhZGF0YSh7XG4gICAgICAgIFtcImZpbGVcIl06IG1lc3NhZ2VJbnB1dCxcbiAgICAgIH0pO1xuICAgICAgbWVkaWFNZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICBtZWRpYU1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgICAgaWYgKCF0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKSB7XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICBtZXNzYWdlOiBtZWRpYU1lc3NhZ2UsXG4gICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICAgIH0pO1xuICAgICAgICBDb21ldENoYXQuc2VuZE1lc3NhZ2UobWVkaWFNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXNwb25zZS5zZXRNdWlkKG1lZGlhTWVzc2FnZS5nZXRNdWlkKCkpO1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIG1lZGlhTWVzc2FnZS5zZXRNZXRhZGF0YSh7XG4gICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IG1lZGlhTWVzc2FnZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKG1lZGlhTWVzc2FnZSwgUHJldmlld01lc3NhZ2VNb2RlLm5vbmUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpbnB1dENoYW5nZUhhbmRsZXIgPSAoZXZlbnQ6IGFueSk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGZpbGVzOiBGaWxlTGlzdCA9IGV2ZW50LnRhcmdldC5maWxlcztcbiAgICBpZiAoIWZpbGVzIHx8IGZpbGVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuICAgIEFycmF5LmZyb20oZmlsZXMpLmZvckVhY2goKGZpbGU6IEZpbGUpID0+IHtcbiAgICAgIGNvbnN0IGZpbGVUeXBlID0gZmlsZS50eXBlO1xuICAgICAgaWYgKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJpbWFnZS9cIikpIHtcbiAgICAgICAgdGhpcy5vbkltYWdlQ2hhbmdlKGV2ZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcInZpZGVvL1wiKSkge1xuICAgICAgICB0aGlzLm9uVmlkZW9DaGFuZ2UoZXZlbnQpO1xuICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiYXVkaW8vXCIpKSB7XG4gICAgICAgIHRoaXMub25BdWRpb0NoYW5nZShldmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uRmlsZUNoYW5nZShldmVudCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgICBpZiAodGhpcy5pbnB1dEVsZW1lbnRSZWY/Lm5hdGl2ZUVsZW1lbnQgJiYgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudD8udmFsdWUpIHtcbiAgICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudmFsdWUgPSBcIlwiO1xuICAgIH1cbiAgfTtcbiAgXG4gIHNlbmRTdGlja2VyID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWY/Lm5hdGl2ZUVsZW1lbnQ/LmNsaWNrKCk7XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgbGV0IHN0aWNrZXIgPSBldmVudD8uZGV0YWlsPy5zdGlja2VyVVJMO1xuICAgIGxldCBzdGlja2VyTmFtZTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8uc3RpY2tlck5hbWU7XG4gICAgaWYgKHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24/LmNvbmZpZ3VyYXRpb24/LmNjU3RpY2tlckNsaWNrZWQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24/LmNvbmZpZ3VyYXRpb24/LmNjU3RpY2tlckNsaWNrZWQoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBzdGlja2VyTmFtZSxcbiAgICAgICAgICB1cmw6IHN0aWNrZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAgdGhpcy51c2VyLFxuICAgICAgICB0aGlzLmdyb3VwLFxuICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgICAgdGhpcy5vbkVycm9yLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZSB8fCB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZXMsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25WaWRlb0NoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzWzBdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uQXVkaW9DaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1swXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbMF07XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbkltYWdlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25GaWxlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbXCIwXCJdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1tcIjBcIl07XG4gICAgICB2YXIgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZVxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIG9wZW5JbWFnZVBpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwiaW1hZ2UvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbkZpbGVQaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImZpbGUvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbnZpZGVvUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJ2aWRlby8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBvcGVuQXVkaW9QaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImF1ZGlvLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIGhhbmRsZU91dHNpZGVDbGljaygpIHtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSBmYWxzZTtcbiAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvcGVuQWN0aW9uU2hlZXQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMudHJpZ2dlckFjdGl2ZVBvcG92ZXJFdmVudCgpO1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG5cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgaGFuZGxlQWlGZWF0dXJlc0Nsb3NlID0gKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgdGhpcy5haUZlYXR1cmVzQ2xvc2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9O1xuXG4gIGNsb3NlU21hcnRSZXBseSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybjtcbiAgfTtcbiAgb3BlbkFpRmVhdHVyZXMgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMudHJpZ2dlckFjdGl2ZVBvcG92ZXJFdmVudCgpO1xuICAgIGlmICh0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlbkVtb2ppS2V5Ym9hcmQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMudHJpZ2dlckFjdGl2ZVBvcG92ZXJFdmVudCgpO1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIHRyaWdnZXJBY3RpdmVQb3BvdmVyRXZlbnQoKXtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY0FjdGl2ZVBvcG92ZXIubmV4dChBY3RpdmVQb3BvdmVyLmNvbXBvc2VyKVxuICB9XG4gIG9wZW5NZWRpYVJlY29yZGVkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICB0aGlzLnRyaWdnZXJBY3RpdmVQb3BvdmVyRXZlbnQoKTtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSAhdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlblN0aWNrZXJLZXlib2FyZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy50cmlnZ2VyQWN0aXZlUG9wb3ZlckV2ZW50KCk7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgY2xvc2VQb3BvdmVycygpIHtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICB9XG4gIH1cbiAgZ2V0Q29tcG9zZXJJZCgpOiBDb21wb3NlcklkIHtcbiAgICBjb25zdCB1c2VyID0gdGhpcy51c2VyO1xuICAgIGlmICh1c2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVzZXI6IHVzZXI/LmdldFVpZCgpLFxuICAgICAgICBncm91cDogbnVsbCxcbiAgICAgICAgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGdyb3VwID0gdGhpcy5ncm91cDtcbiAgICBpZiAoZ3JvdXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXNlcjogbnVsbCxcbiAgICAgICAgZ3JvdXA6IGdyb3VwPy5nZXRHdWlkKCksXG4gICAgICAgIHBhcmVudE1lc3NhZ2VJZDogdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB1c2VyOiBudWxsLCBncm91cDogbnVsbCwgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCB9O1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWUoKTtcbiAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0ID0gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgPyB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICA6IFtdO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrT3V0c2lkZSk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9XG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICB9KTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIoKTtcblxuICAgIHRoaXMuYWN0aW9ucyA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFJT3B0aW9ucyhcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgdGhpcy5nZXRDb21wb3NlcklkKCkgYXMgdW5rbm93biBhcyBNYXA8c3RyaW5nLCBhbnk+LFxuICAgICAgdGhpcy5haU9wdGlvbnNTdHlsZVxuICAgICk7XG4gICAgdGhpcy5haUJvdExpc3QgPSBbXTtcblxuXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuZW5hYmxlU3RpY2tlcktleWJvYXJkID0gdHJ1ZTtcbiAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uID1cbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdXhpbGlhcnlPcHRpb25zKFxuICAgICAgICB0aGlzLmNvbXBvc2VySWQsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cFxuICAgICAgKTtcbiAgICBpZiAodGhpcy5zdGlja2VyQ29uZmlndXJhdGlvbj8uaWQgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VyS2V5Ym9hcmQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZUFpRmVhdHVyZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgZGV2ZWxvcGVyIHByb3ZpZGVkIGluc3RhbmNlIG9mIE1lbnRpb25zVGV4dEZvcm1hdHRlclxuICAgKiBJZiBub3QgcHJvdmlkZWQsIGFkZCBkZWZhdWx0XG4gICAqIElmIHByb3ZpZGVkLCBjaGVjayBpZiBzdHlsZSBpcyBwcm92aWRlZCB2aWEgY29uZmlndXJhdGlvbiwgdGhlbiBhZGQgc3R5bGUuXG4gICAqL1xuICBpbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRNZW50aW9uc1RleHRTdHlsZShcbiAgICAgICAgdGhpcy5nZXRNZW50aW9uc1N0eWxlKClcbiAgICAgICk7XG4gICAgICBsZXQgZm91bmRNZW50aW9uc0Zvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMudGV4dEZvcm1hdHRlcnMhLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIgPSB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W1xuICAgICAgICAgICAgICBpXG4gICAgICAgICAgICBdIGFzIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgIXRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5VXBDYWxsQmFjaygpIHx8XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5RG93bkNhbGxCYWNrKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleVVwQ2FsbEJhY2soXG4gICAgICAgICAgdGhpcy5zZWFyY2hNZW50aW9uc1xuICAgICAgICApO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleURvd25DYWxsQmFjayhcbiAgICAgICAgICB0aGlzLnNlYXJjaE1lbnRpb25zXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0SWQoXG4gICAgICAgICAgdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWRcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3QucHVzaCh0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZ2V0TWVudGlvbnNTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5tZW50aW9uU3R5bGVMb2NhbDtcbiAgfTtcblxuICBnZXRTbWFydFJlcGxpZXMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IHRydWU7XG4gICAgdGhpcy5yZXBsaWVzQXJyYXkgPSBbXTtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zbWFydFJlcGx5U3RhdGUgPSBTdGF0ZXMubG9hZGluZztcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICAgOiB0aGlzLmdyb3VwPy5nZXRHdWlkKCk7XG4gICAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgQ29tZXRDaGF0LmdldFNtYXJ0UmVwbGllcyhyZWNlaXZlcklkLCByZWNlaXZlclR5cGUpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IHJlcGxpZXNBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZXNwb25zZSkuZm9yRWFjaCgocmVwbHkpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVtyZXBseV0gJiYgcmVzcG9uc2VbcmVwbHldICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgICByZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUocmVwbGllc0FycmF5KTtcblxuICAgICAgICAgIHRoaXMuc21hcnRSZXBseVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICB0aGlzLnNtYXJ0UmVwbHlTdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBlbmFibGVBaUZlYXR1cmVzKCkge1xuICAgIGlmICh0aGlzLmFjdGlvbnMgJiYgdGhpcy5hY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuaXNBaUVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLmFjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktc21hcnQtcmVwbHlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgb25DbGljazogdGhpcy5nZXRTbWFydFJlcGxpZXMsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktY29udmVyc2F0aW9uLXN1bW1hcnlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgaWQ6IGFjdGlvbi5pZCxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHRoaXMuY2FsbENvbnZlcnNhdGlvblN1bW1hcnlNZXRob2QoKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktYm90c1wiKSB7XG4gICAgICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICAgICAgLi4uYWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi50aXRsZSEsXG4gICAgICAgICAgICBpZDogYWN0aW9uLmlkLFxuICAgICAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT5cbiAgICAgICAgICAgICAgdGhpcy5zaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCgoYWN0aW9uIGFzIGFueSkub25DbGljaygpKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCA9IChhY3Rpb246IGFueSkgPT4ge1xuICAgIHRoaXMuYWlCb3RMaXN0ID0gYWN0aW9uO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gdHJ1ZTtcblxuICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLmxlbmd0aCA9IDA7XG5cbiAgICB0aGlzLmFpQm90TGlzdC5mb3JFYWNoKChlOiBhbnksIGk6IGFueSkgPT4ge1xuICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICBpZDogZS5pZCxcbiAgICAgICAgdGl0bGU6IGUudGl0bGUsXG4gICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dQYW5lbC5uZXh0KHtcbiAgICAgICAgICAgIGNoaWxkOiB7IGJvdDogZSwgc2hvd0JvdFZpZXc6IHRydWUgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnJlcGxpZXNBcnJheSA9IFtdO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGNvbXBvc2VyV3JhcHBlclN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGlzVmFsaWRTdHlsZVZhbHVlKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdmFsdWUgIT0gbnVsbCAmJiB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnICYmIHZhbHVlLnRyaW0oKSAhPT0gJyc7XG4gIH1cblxuICBwcml2YXRlIGdldFRoZW1lQ29sb3JzKCkge1xuICAgIHJldHVybiB7XG4gICAgICBlcnJvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgYWNjZW50NjAwOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBhY2NlbnQ0MDA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKClcbiAgICB9O1xuICB9XG4gIFxuICBzZXRUaGVtZSgpIHtcbiAgICB0aGlzLmVtb2ppUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zdGlja2VyUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5haVBvcG92ZXIuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpO1xuICAgIHRoaXMuYWlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDMycHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLnNldENvbXBvc2VyU3R5bGUoKTtcbiAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgICBsYXlvdXRNb2RlSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5sYXlvdXRNb2RlSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5hY3Rpb25TaGVldFN0eWxlPy5ib3JkZXJSYWRpdXMgfHwgXCJpbmhlcml0XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLmFjdGlvblNoZWV0U3R5bGUuYmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjp0aGlzLmFjdGlvblNoZWV0U3R5bGUuYm9yZGVyIHx8ICBcIm5vbmVcIixcbiAgICAgIHdpZHRoOnRoaXMuYWN0aW9uU2hlZXRTdHlsZS53aWR0aCB8fCBcIjEwMCVcIixcbiAgICAgIGhlaWdodDp0aGlzLmFjdGlvblNoZWV0U3R5bGUuaGVpZ2h0IHx8IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUudGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLkFjdGlvblNoZWV0U2VwYXJhdG9yVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgbGlzdEl0ZW1CYWNrZ3JvdW5kOiB0aGlzLmFjdGlvblNoZWV0U3R5bGUubGlzdEl0ZW1CYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLCBcbiAgICAgIGxpc3RJdGVtSWNvblRpbnQ6IHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5saXN0SXRlbUljb25UaW50IHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NzAwKCksIFxuICAgICAgbGlzdEl0ZW1JY29uQmFja2dyb3VuZDogdGhpcy5hY3Rpb25TaGVldFN0eWxlLmxpc3RJdGVtSWNvbkJhY2tncm91bmQgfHwgJ3RyYW5zcGFyZW50JyxcbiAgICAgICAgXG4gICAgfTtcbiAgICB0aGlzLnBvcG92ZXJTdHlsZS5iYWNrZ3JvdW5kID0gdGhpcy5hY3Rpb25TaGVldFN0eWxlLmJhY2tncm91bmQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgICBsYXlvdXRNb2RlSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLmxheW91dE1vZGVJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcImluaGVyaXRcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLnRpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDpcbiAgICAgICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUuQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50IHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgfTtcblxuICAgIHRoaXMudGV4dElucHV0U3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgbWF4SGVpZ2h0OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5tYXhJbnB1dEhlaWdodCB8fCBcIjEwMHB4XCIsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmlucHV0Qm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5pbnB1dEJvcmRlclJhZGl1cyxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmlucHV0QmFja2dyb3VuZCxcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy50ZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8udGV4dENvbG9yLFxuICAgICAgZGl2aWRlckNvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5kaXZpZGVyVGludCxcbiAgICB9O1xuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKVxuICAgIHRoaXMucHJldmlld1N0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCl9YCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgcHJldmlld1RpdGxlRm9udDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1RpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIHByZXZpZXdUaXRsZUNvbG9yOlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3VGl0bGVDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJldmlld1N1YnRpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdTdWJ0aXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3U3VidGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgY2xvc2VCdXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uY2xvc2VQcmV2aWV3VGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiAnMTJweCdcbiAgICB9O1xuICAgIGxldCBidXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIGNvbnN0IHRoZW1lQ29sb3JzID0gdGhpcy5nZXRUaGVtZUNvbG9ycygpO1xuICAgIGNvbnN0IHdpZHRoID0gdGhpcy5pc1ZhbGlkU3R5bGVWYWx1ZSh0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZT8ud2lkdGgpICYmXG4gICAgICAhdGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LndpZHRoPy5pbmNsdWRlcyhcIiVcIilcbiAgICAgID8gdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUud2lkdGhcbiAgICAgIDogXCIyNTBweFwiO1xuICAgIGNvbnN0IGhlaWdodCA9IHRoaXMuaXNWYWxpZFN0eWxlVmFsdWUodGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LmhlaWdodCkgJiZcbiAgICAgICF0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZT8uaGVpZ2h0Py5pbmNsdWRlcyhcIiVcIilcbiAgICAgID8gdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuaGVpZ2h0XG4gICAgICA6IFwiMTAwcHhcIjtcbiAgICBsZXQgZGVmYXVsdE1lZGlhUmVjb3JkZXJTdHlsZSA9IG5ldyBNZWRpYVJlY29yZGVyU3R5bGUoe1xuICAgICAgc3RhcnRJY29uVGludDogdGhpcy5pc1ZhbGlkU3R5bGVWYWx1ZSh0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZT8uc3RhcnRJY29uVGludClcbiAgICAgICAgPyB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZS5zdGFydEljb25UaW50XG4gICAgICAgIDogdGhlbWVDb2xvcnMuZXJyb3IsXG4gICAgICBzdWJtaXRJY29uVGludDogdGhpcy5pc1ZhbGlkU3R5bGVWYWx1ZSh0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZT8uc3VibWl0SWNvblRpbnQpXG4gICAgICAgID8gdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuc3VibWl0SWNvblRpbnRcbiAgICAgICAgOiB0aGVtZUNvbG9ycy5hY2NlbnQ2MDAsXG4gICAgICBzdG9wSWNvblRpbnQ6IHRoaXMuaXNWYWxpZFN0eWxlVmFsdWUodGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LnN0b3BJY29uVGludClcbiAgICAgICAgPyB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZS5zdG9wSWNvblRpbnRcbiAgICAgICAgOiB0aGVtZUNvbG9ycy5lcnJvcixcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMuaXNWYWxpZFN0eWxlVmFsdWUodGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LmNsb3NlSWNvblRpbnQpXG4gICAgICAgID8gdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuY2xvc2VJY29uVGludFxuICAgICAgICA6IHRoZW1lQ29sb3JzLmFjY2VudDYwMCxcbiAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgd2lkdGg6IHdpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5pc1ZhbGlkU3R5bGVWYWx1ZSh0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZT8uYmFja2dyb3VuZClcbiAgICAgICAgPyB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZS5iYWNrZ3JvdW5kXG4gICAgICAgIDogdGhlbWVDb2xvcnMuYmFja2dyb3VuZCxcbiAgICAgIHRpbWVyVGV4dEZvbnQ6IHRoaXMuaXNWYWxpZFN0eWxlVmFsdWUodGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LnRpbWVyVGV4dEZvbnQpXG4gICAgICAgID8gdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUudGltZXJUZXh0Rm9udFxuICAgICAgICA6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgdGltZXJUZXh0Q29sb3I6IHRoaXMuaXNWYWxpZFN0eWxlVmFsdWUodGhpcy5tZWRpYVJlY29yZGVyU3R5bGU/LnRpbWVyVGV4dENvbG9yKVxuICAgICAgICA/IHRoaXMubWVkaWFSZWNvcmRlclN0eWxlLnRpbWVyVGV4dENvbG9yXG4gICAgICAgIDogdGhlbWVDb2xvcnMuYWNjZW50NDAwLFxuICAgIH0pO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlclN0eWxlID0gZGVmYXVsdE1lZGlhUmVjb3JkZXJTdHlsZTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLndpZHRoID0gd2lkdGg7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5oZWlnaHQgPSBoZWlnaHQ7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5iYWNrZ3JvdW5kID1cbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlclN0eWxlLmJvcmRlciA9IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpfWA7XG4gICAgdGhpcy5lbW9qaVBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggOHB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zdGlja2VyUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCA4cHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDhweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuZW1vamlCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuc3RpY2tlckJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMubWVkaWFSZWNvcmRlckJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnZvaWNlUmVjb3JkaW5nSWNvblRpbnQgfHxcbiAgICAgIFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIC4uLmJ1dHRvblN0eWxlLFxuICAgIH07XG4gICAgdGhpcy5lbW9qaUtleWJvYXJkU3R5bGUgPSB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmVtb2ppS2V5Ym9hcmRUZXh0Q29sb3IsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBhY3RpdmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKVxuICAgIH07XG5cbiAgICB0aGlzLnN0aWNrZXJLZXlib2FyZFN0eWxlID0ge1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBlbXB0eVN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZW1wdHlTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlcnJvclN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgbG9hZGluZ0ljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgY2F0ZWdvcnlCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9O1xuICAgIHRoaXMuYXR0YWNobWVudEJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmF0dGFjaEljb250aW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICB0aGlzLmNyZWF0ZVBvbGxTdHlsZSA9IHtcbiAgICAgIHBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgcGxhY2Vob2xkZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBkZWxldGVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHRpdGxlRm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICB0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgY2xvc2VJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBxdWVzdGlvbklucHV0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIG9wdGlvbklucHV0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGFuc3dlckhlbHBUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5jYXB0aW9uMVxuICAgICAgKSxcbiAgICAgIGFuc3dlckhlbHBUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBhZGRBbnN3ZXJJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBjcmVhdGVQb2xsQnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDJcbiAgICAgICksXG4gICAgICBjcmVhdGVQb2xsQnV0dG9uVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudChcImRhcmtcIiksXG4gICAgICBjcmVhdGVQb2xsQnV0dG9uQmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBhZGRBbnN3ZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyKSxcbiAgICAgIGFkZEFuc3dlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlcnJvclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxKSxcbiAgICAgIGVycm9yVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBvcHRpb25QbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIG9wdGlvblBsYWNlaG9sZGVyVGV4dENvbG9yOlxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcXVlc3Rpb25JbnB1dFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHF1ZXN0aW9uSW5wdXRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBvcHRpb25JbnB1dFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIG9wdGlvbklucHV0VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgd2lkdGg6IFwiMzYwcHhcIixcbiAgICAgIGhlaWdodDogXCI2MjBweFwiLFxuICAgICAgYm9yZGVyOiBcIlwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICB9O1xuICB9XG4gIHNldENvbXBvc2VyU3R5bGUoKSB7XG4gICAgbGV0IGRlZmF1bHRTdHlsZTogTWVzc2FnZUNvbXBvc2VyU3R5bGUgPSBuZXcgTWVzc2FnZUNvbXBvc2VyU3R5bGUoe1xuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IGBub25lYCxcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgbGl2ZVJlYWN0aW9uSWNvblRpbnQ6IFwicmVkXCIsXG4gICAgICBhdHRhY2hJY29udGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHNlbmRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlbW9qaUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgaW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgaW5wdXRCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgaW5wdXRCb3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgZGl2aWRlclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG5cbiAgICAgIGVtb2ppS2V5Ym9hcmRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBlbW9qaUtleWJvYXJkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJldmlld1RpdGxlRm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwcmV2aWV3VGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgcHJldmlld1N1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBjbG9zZVByZXZpZXdUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgbWF4SW5wdXRIZWlnaHQ6IFwiMTAwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZSxcbiAgICB9O1xuICAgIGlmICghdGhpcy5oaWRlTGl2ZVJlYWN0aW9uKSB7XG4gICAgICB0aGlzLmxpdmVSZWFjdGlvblN0eWxlID0ge1xuICAgICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5saXZlUmVhY3Rpb25JY29uVGludCxcbiAgICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICAgICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gICAgICB9XG4gICAgfVxuICB9XG4gIG9uUHJldmlld0Nsb3NlZCgpIHtcbiAgICBpZiAodGhpcy5tZXNzYWdlVG9CZUVkaXRlZCkge1xuICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQubmV4dCh7IG1lc3NhZ2U6IHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQsIHN0YXR1czogTWVzc2FnZVN0YXR1cy5jYW5jZWxsZWQgfSlcbiAgICB9XG4gICAgdGhpcy5jbG9zZVByZXZpZXcoKTtcbiAgfVxuICBjbG9zZVByZXZpZXcoKSB7XG4gICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zaG93UHJldmlldyA9IGZhbHNlO1xuICAgIHRoaXMuZWRpdFByZXZpZXdUZXh0ID0gXCJcIjtcbiAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyQ29tcG9zZXIoKVxuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcblxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBY2NlcHRzIHNlYXJjaCB0ZXJtIGZyb20gbWVudGlvbnNUZXh0Rm9ybWF0dGVyIGFuZCBvcGVucyB0aGUgbWVudGlvbnMgc2VsZWN0IGxpc3RcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm1cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBzZWFyY2hNZW50aW9ucyA9IChzZWFyY2hUZXJtOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIShzZWFyY2hUZXJtICYmIHNlYXJjaFRlcm0ubGVuZ3RoKSkge1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoQ291bnQgPSAxO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICF0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gfHxcbiAgICAgICFzZWFyY2hUZXJtXG4gICAgICAgIC5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnN0YXJ0c1dpdGgodGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCkpXG4gICAgKSB7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9XG4gICAgICAgIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdICYmIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdLmxlbmd0aFxuICAgICAgICAgID8gc2VhcmNoVGVybS5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgICA6IFwiXCI7XG4gICAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSB0cnVlO1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaENvdW50Kys7XG4gICAgICB0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBjbGlja2luZyBhIHVzZXIgZnJvbSB0aGUgbWVudGlvbnMgbGlzdC5cbiAgICogQWRkIHRoZSB1c2VyIHRvIG1lbnRpb25zIHRleHQgZm9ybWF0dGVyIGluc3RhbmNlIGFuZCB0aGVuIGNhbGwgcmVyZW5kZXIgdG8gc3R5bGUgdGhlIG1lbnRpb25cbiAgICogd2l0aGluIG1lc3NhZ2UgaW5wdXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXIgPSAoXG4gICAgdXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgKSA9PiB7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzID0gW3VzZXJdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXG4gICAgICAuLi50aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKSxcbiAgICBdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVSZW5kZXIoKTtcbiAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9IFwiXCI7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZSBtZW50aW9ucyBsaXN0IGlmIHNlYXJjaCByZXR1cm5zIGVtcHR5IGxpc3RcbiAgICovXG4gIGRlZmF1bHRPbkVtcHR5Rm9yTWVudGlvbnMgPSAoKSA9PiB7XG4gICAgdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtID0gdGhpcy5tZW50aW9uc1NlYXJjaFRlcm07XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBnZXRNZW50aW9uSW5mb0ljb25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIGljb25IZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBnYXA6IFwiNXB4XCIsXG4gICAgfTtcbiAgfTtcblxuICBoYW5kbGVDbGlja091dHNpZGUgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmKSB7XG4gICAgICBjb25zdCB1c2VyTWVtYmVyV3JhcHBlclJlY3QgPVxuICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmPy5uYXRpdmVFbGVtZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IGlzT3V0c2lkZUNsaWNrID1cbiAgICAgICAgZXZlbnQ/LmNsaWVudFggPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5sZWZ0IHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRYID49IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8ucmlnaHQgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPj0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py50b3AgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5ib3R0b207XG4gICAgICBpZiAoaXNPdXRzaWRlQ2xpY2spIHtcbiAgICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdXR0b25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAgb25DbGljazogKCkgPT4gUHJvbWlzZTx1bmtub3duPjtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX193cmFwcGVyXCIgW25nU3R5bGVdPVwiY29tcG9zZXJXcmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9uc1wiICpuZ0lmPVwic2hvd0xpc3RGb3JNZW50aW9uc1wiXG4gICAgI3VzZXJNZW1iZXJXcmFwcGVyUmVmPlxuICAgIDxjb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlciBbdXNlck1lbWJlckxpc3RUeXBlXT1cInVzZXJNZW1iZXJMaXN0VHlwZVwiXG4gICAgICBbb25JdGVtQ2xpY2tdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLm9uSXRlbUNsaWNrIHx8IGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXJcIlxuICAgICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgICBbc2VhcmNoS2V5d29yZF09XCJtZW50aW9uc1NlYXJjaFRlcm1cIlxuICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICBbbGlzdEl0ZW1WaWV3XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICBbdXNlclByZXNlbmNlUGxhY2VtZW50XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2VyUHJlc2VuY2VQbGFjZW1lbnRcIlxuICAgICAgW2hpZGVTZXBlcmF0b3JdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgW29uRW1wdHldPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiXG4gICAgICBbbG9hZGluZ0ljb25VcmxdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFtncm91cF09XCJncm91cFwiIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgIFtkaXNhYmxlTG9hZGluZ1N0YXRlXT1cInRydWVcIlxuICAgICAgW29uRXJyb3JdPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiPjwvY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwic2hvd01lbnRpb25zQ291bnRXYXJuaW5nXCJcbiAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9ucy1saW1pdC1leGNlZWRlZFwiPlxuICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvblxuICAgICAgICBbdGV4dF09XCJtZW50aW9uc1dhcm5pbmdUZXh0IHx8IGxvY2FsaXplKCdNRU5USU9OU19MSU1JVF9XQVJOSU5HX01FU1NBR0UnKVwiXG4gICAgICAgIFtpY29uVVJMXT1cIkluZm9TaW1wbGVJY29uXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldE1lbnRpb25JbmZvSWNvblN0eWxlKClcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCJcbiAgICAqbmdJZj1cImhlYWRlclZpZXc7IGVsc2UgbWVzc2FnZVByZXZpZXdcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbWVzc2FnZVByZXZpZXc+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCIgKm5nSWY9XCJzaG93UHJldmlld1wiPlxuICAgICAgPGNvbWV0Y2hhdC1wcmV2aWV3IFtwcmV2aWV3U3R5bGVdPVwicHJldmlld1N0eWxlXCJcbiAgICAgICAgW3ByZXZpZXdTdWJ0aXRsZV09XCJlZGl0UHJldmlld1RleHRcIlxuICAgICAgICAoY2MtcHJldmlldy1jbG9zZS1jbGlja2VkKT1cIm9uUHJldmlld0Nsb3NlZCgpXCI+IDwvY29tZXRjaGF0LXByZXZpZXc+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19pbnB1dFwiPlxuXG4gICAgPGNvbWV0Y2hhdC10ZXh0LWlucHV0IChjYy10ZXh0LWlucHV0LWVudGVyZWQpPVwic2VuZE1lc3NhZ2VPbkVudGVyKCRldmVudClcIlxuICAgICAgI2lucHV0UmVmIFt0ZXh0XT1cInRleHRcIlxuICAgICAgKGNjLXRleHQtaW5wdXQtY2hhbmdlZCk9XCJtZXNzYWdlSW5wdXRDaGFuZ2VkKCRldmVudClcIlxuICAgICAgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgW3BsYWNlaG9sZGVyVGV4dF09XCJwbGFjZWhvbGRlclRleHRcIlxuICAgICAgW2F1eGlsaWFyeUJ1dHRvbkFsaWdubWVudF09XCJhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJ0ZXh0Rm9ybWF0dGVyc1wiPlxuXG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInNlY29uZGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlY29uZGFyeUJ1dHRvblZpZXc7ZWxzZSBzZWNvbmRhcnlCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlY29uZGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2Vjb25kYXJ5QnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdHRhY2hidXR0b25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlclxuICAgICAgICAgICAgICAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgICBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUREX1RPX0NIQVQnKVwiIFthY3Rpb25zXT1cImNvbXBvc2VyQWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWN0aW9uU2hlZXRTdHlsZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICBbaGlkZUxheW91dE1vZGVdPVwiaGlkZUxheW91dE1vZGVcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtYWN0aW9uLXNoZWV0PlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAjYWN0aW9uU2hlZXRSZWYgc2xvdD1cImNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlbkFjdGlvblNoZWV0KCRldmVudClcIlxuICAgICAgICAgICAgICAgIFtpY29uVVJMXT1cIiFzaG93QWN0aW9uU2hlZXRJdGVtIHx8IChzaG93RW1vamlLZXlib2FyZCAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbSkgID8gYXR0YWNobWVudEljb25VUkwgIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYXR0YWNobWVudEJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fYXV4aWxpYXJ5XCIgZGF0YS1zbG90PVwiYXV4aWxhcnlWaWV3XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19jdXN0b20tYXV4aWxpYXJ5LXZpZXdcIlxuICAgICAgICAgICpuZ0lmPVwiYXV4aWxhcnlCdXR0b25WaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJhdXhpbGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS0gQUkgQ2FyZHMgLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zdGlja2Vya2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiIWF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlciAoY2MtcG9wb3Zlci1jbGljayk9XCJvcGVuU3RpY2tlcktleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgW3BvcG92ZXJTdHlsZV09XCJhaVBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cInNtYXJ0UmVwbHlTdGF0ZVwiXG4gICAgICAgICAgICAgICpuZ0lmPVwic2hvd1NtYXJ0UmVwbHkgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW1BSSAmJiAhc2hvd0FpQm90TGlzdFwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCIgW2xvYWRpbmdTdGF0ZVRleHRdPVwibG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICAgICAgICA8ZGl2IHNsb3Q9XCJsb2FkZWRWaWV3XCIgY2xhc3M9XCJzbWFydC1yZXBsaWVzLXdyYXBwZXJcIj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2JhY2stYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCJyZXBsaWVzQXJyYXkgJiYgcmVwbGllc0FycmF5Lmxlbmd0aCA+IDAgXCJcbiAgICAgICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQWlCYWNrQnV0dG9uQ2xpY2soKVwiXG4gICAgICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3NtYXJ0cmVwbHktaGVhZGVyLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e3sgbG9jYWxpemUoXCJTVUdHRVNUX0FfUkVQTFlcIikgfX08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgIDxzbWFydC1yZXBsaWVzXG4gICAgICAgICAgICAgICAgICAgICpuZ0lmPVwicmVwbGllc0FycmF5ICYmIHJlcGxpZXNBcnJheS5sZW5ndGggPiAwIFwiXG4gICAgICAgICAgICAgICAgICAgIFtzbWFydFJlcGx5U3R5bGVdPVwic21hcnRSZXBseVN0eWxlXCIgW3JlcGxpZXNdPVwicmVwbGllc0FycmF5XCJcbiAgICAgICAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCInJ1wiIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRSZXBseSgkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cblxuXG5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzaG93QWlCb3RMaXN0ICAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbUFJXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2FpYm90bGlzdFwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiIGFpQm90TGlzdCAmJiBhaUJvdExpc3QubGVuZ3RoPiAxIFwiXG4gICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib25BaUJhY2tCdXR0b25DbGljaygpXCJcbiAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiPlxuICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8cD57eyBsb2NhbGl6ZShcIkNPTUVUQ0hBVF9BU0tfQUlfQk9UXCIpIH19PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXRcbiAgICAgICAgICAgICAgICAqbmdJZj1cInNob3dBaUJvdExpc3QgICYmICFzaG93QWN0aW9uU2hlZXRJdGVtQUlcIiBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYWlBY3Rpb25CdXR0b25zXCIgW3RpdGxlXT1cImxvY2FsaXplKCdBSScpXCJcbiAgICAgICAgICAgICAgICBbYWN0aW9uU2hlZXRTdHlsZV09XCJhaUFjdGlvblNoZWV0U3R5bGVcIiBbaGlkZUxheW91dE1vZGVdPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFjdGlvbi1zaGVldCAqbmdJZj1cInNob3dBY3Rpb25TaGVldEl0ZW1BSVwiIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYnV0dG9uc1wiIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUknKVwiXG4gICAgICAgICAgICAgIFthY3Rpb25TaGVldFN0eWxlXT1cImFpQWN0aW9uU2hlZXRTdHlsZVwiIFtoaWRlTGF5b3V0TW9kZV09XCJ0cnVlXCJcbiAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1hY3Rpb24tc2hlZXQ+XG5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiaXNBaUVuYWJsZWRcIiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdBSScpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgI2FpQnV0dG9uUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuQWlGZWF0dXJlcygkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiIXNob3dBaUZlYXR1cmVzID8gYWlJY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInN0aWNrZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc3RpY2tlcmtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cImVuYWJsZVN0aWNrZXJLZXlib2FyZCAmJiAhYXV4aWxhcnlCdXR0b25WaWV3XCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wb3BvdmVyIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJoYW5kbGVPdXRzaWRlQ2xpY2soKVwiXG4gICAgICAgICAgICBbcG9wb3ZlclN0eWxlXT1cInN0aWNrZXJQb3BvdmVyXCIgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuICAgICAgICAgICAgPHN0aWNrZXJzLWtleWJvYXJkIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW3N0aWNrZXJTdHlsZV09XCJzdGlja2VyS2V5Ym9hcmRTdHlsZVwiXG4gICAgICAgICAgICAgIChjYy1zdGlja2VyLWNsaWNrZWQpPVwic2VuZFN0aWNrZXIoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9zdGlja2Vycy1rZXlib2FyZD5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ1NUSUNLRVInKVwiIHNsb3Q9XCJjaGlsZHJlblwiXG4gICAgICAgICAgICAgICNzdGlja2VyQnV0dG9uUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuU3RpY2tlcktleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXNob3dTdGlja2VyS2V5Ym9hcmQgPyBzdGlja2VyQnV0dG9uSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJzdGlja2VyQnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19lbW9qaWtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cIiFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIiBbcG9wb3ZlclN0eWxlXT1cImVtb2ppUG9wb3ZlclwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZCBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYXBwZW5kRW1vamkoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAjZW1vamlCdXR0b25SZWYgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnRU1PSkknKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuRW1vamlLZXlib2FyZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICFzaG93RW1vamlLZXlib2FyZCAgfHwgKCFzaG93RW1vamlLZXlib2FyZCAmJiBzaG93QWN0aW9uU2hlZXRJdGVtKSA/IGVtb2ppSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJlbW9qaUJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbWVkaWFyZWNvcmRlclwiXG4gICAgICAgICAgKm5nSWY9XCIhaGlkZVZvaWNlUmVjb3JkaW5nXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wb3BvdmVyIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJoYW5kbGVPdXRzaWRlQ2xpY2soKVwiXG4gICAgICAgICAgICBbcG9wb3ZlclN0eWxlXT1cIm1lZGlhUmVjb3JkZWRQb3BvdmVyXCJcbiAgICAgICAgICAgIFtjbG9zZU9uT3V0c2lkZUNsaWNrXT1cImZhbHNlXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIj5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZWRpYS1yZWNvcmRlciAqbmdJZj1cInRvZ2dsZU1lZGlhUmVjb3JkZWRcIlxuICAgICAgICAgICAgICBbYXV0b1JlY29yZGluZ109XCJ0cnVlXCIgc3RhcnRJY29uVGV4dD1cIlwiIHN0b3BJY29uVGV4dD1cIlwiXG4gICAgICAgICAgICAgIHN1Ym1pdEJ1dHRvbkljb25UZXh0PVwiXCJcbiAgICAgICAgICAgICAgW3N1Ym1pdEJ1dHRvbkljb25VUkxdPVwidm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMXCJcbiAgICAgICAgICAgICAgW3N0YXJ0SWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0YXJ0SWNvblVSTFwiXG4gICAgICAgICAgICAgIFtzdG9wSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0b3BJY29uVVJMXCJcbiAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTFwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1zdWJtaXR0ZWQpPVwic2VuZFJlY29yZGVkTWVkaWEoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1jbG9zZWQpPVwiY2xvc2VNZWRpYVJlY29yZGVyKCRldmVudClcIlxuICAgICAgICAgICAgICBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFttZWRpYVBsYXllclN0eWxlXT1cIm1lZGlhUmVjb3JkZXJTdHlsZVwiPjwvY29tZXRjaGF0LW1lZGlhLXJlY29yZGVyPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdWT0lDRV9SRUNPUkRJTkcnKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiICNtZWRpYVJlY29yZGVkUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuTWVkaWFSZWNvcmRlZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICF0b2dnbGVNZWRpYVJlY29yZGVkID8gdm9pY2VSZWNvcmRpbmdJY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cIm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInByaW1hcnlWaWV3XCI+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJzZW5kQnV0dG9uVmlldztlbHNlIHNlbmRCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlbmRCdXR0b25WaWV3O2NvbnRleHQ6eyBpdGVtOiB1c2VyID8/IGdyb3VwLCBjb21wb3NlcklkOmNvbXBvc2VySWQgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNzZW5kQnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zZW5kYnV0dG9uXCJcbiAgICAgICAgICAgICpuZ0lmPVwic2hvd1NlbmRCdXR0b24gfHwgaGlkZUxpdmVSZWFjdGlvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwic2VuZEJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwic2VuZEJ1dHRvblN0eWxlXCJcbiAgICAgICAgICAgICAgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU0VORF9NRVNTQUdFJylcIlxuICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIXNob3dTZW5kQnV0dG9uXCJcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImN1c3RvbVNlbmRNZXRob2QobWVzc2FnZVRleHQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2xpdmVyZWFjdGlvblwiXG4gICAgICAgICAgICAqbmdJZj1cIiFoaWRlTGl2ZVJlYWN0aW9uICYmICFzaG93U2VuZEJ1dHRvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiTGl2ZVJlYWN0aW9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ0xJVkVfUkVBQ1RJT04nKVwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJsaXZlUmVhY3Rpb25TdHlsZVwiXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzZW5kUmVhY3Rpb24oKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvY29tZXRjaGF0LXRleHQtaW5wdXQ+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxpbnB1dCBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX21lZGlhaW5wdXRcIiAjaW5wdXRFbGVtZW50XG4gIChjaGFuZ2UpPVwiaW5wdXRDaGFuZ2VIYW5kbGVyKCRldmVudClcIiAvPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dDcmVhdGVQb2xsc1wiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNyZWF0ZS1wb2xsIFt1c2VyXT1cInVzZXJcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlQ3JlYXRlUG9sbHMoKVwiXG4gICAgW2NyZWF0ZVBvbGxTdHlsZV09XCJjcmVhdGVQb2xsU3R5bGVcIj48L2NyZWF0ZS1wb2xsPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4iXX0=