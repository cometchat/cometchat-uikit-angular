import "@cometchat/uikit-shared";
import "@cometchat/uikit-elements";
import { CometChatMentionsFormatter, CometChatSoundManager, CometChatUIKitUtility, MessageComposerStyle, StickersConstants, UserMemberWrapperConfiguration, UserMentionStyle, } from "@cometchat/uikit-shared";
import { MediaRecorderStyle, } from "@cometchat/uikit-elements";
import { AuxiliaryButtonAlignment, CometChatMessageEvents, CometChatUIEvents, CometChatUIKitConstants, MessageStatus, Placement, PreviewMessageMode, States, UserMemberListType, fontHelper, localize, } from "@cometchat/uikit-resources";
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
    subscribeToEvents() {
        this.ccMessageEdit = CometChatMessageEvents.ccMessageEdited.subscribe((object) => {
            let parentId = object?.message?.getParentMessageId();
            if ((this.parentMessageId && parentId && parentId == this.parentMessageId) || (!this.parentMessageId && !parentId)) {
                if (object?.status == MessageStatus.inprogress) {
                    this.messageToBeEdited = object.message;
                    if (this.isPartOfCurrentChatForUIEvent(object?.message)) {
                        this.openEditPreview();
                    }
                }
                if (object?.status === MessageStatus.success && object.message instanceof CometChat.TextMessage) {
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
        this.text = this.messageToBeEdited.getText();
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
        let defaultMediaRecorderStyle = new MediaRecorderStyle({
            startIconTint: this.themeService.theme.palette.getError(),
            submitIconTint: this.themeService.theme.palette.getAccent600(),
            stopIconTint: this.themeService.theme.palette.getError(),
            closeIconTint: this.themeService.theme.palette.getAccent600(),
            height: "100%",
            width: "100%",
            background: this.themeService.theme.palette.getBackground(),
            timerTextFont: fontHelper(this.themeService.theme.typography.subtitle2),
            timerTextColor: this.themeService.theme.palette.getAccent400(),
        });
        this.mediaRecordedPopover.background =
            this.themeService.theme.palette.getBackground();
        this.mediaRecorderStyle.border = `1px solid ${this.themeService.theme.palette.getAccent100()}`;
        this.mediaRecorderStyle = {
            ...defaultMediaRecorderStyle,
            ...this.mediaRecorderStyle,
        };
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
CometChatMessageComposerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageComposerComponent, selector: "cometchat-message-composer", inputs: { user: "user", group: "group", disableSoundForMessages: "disableSoundForMessages", customSoundForMessage: "customSoundForMessage", customSoundForMessages: "customSoundForMessages", disableTypingEvents: "disableTypingEvents", text: "text", placeholderText: "placeholderText", headerView: "headerView", onTextChange: "onTextChange", attachmentIconURL: "attachmentIconURL", attachmentOptions: "attachmentOptions", secondaryButtonView: "secondaryButtonView", auxilaryButtonView: "auxilaryButtonView", auxiliaryButtonsAlignment: "auxiliaryButtonsAlignment", sendButtonView: "sendButtonView", parentMessageId: "parentMessageId", hideLiveReaction: "hideLiveReaction", LiveReactionIconURL: "LiveReactionIconURL", backButtonIconURL: "backButtonIconURL", mentionsWarningText: "mentionsWarningText", mentionsWarningStyle: "mentionsWarningStyle", messageComposerStyle: "messageComposerStyle", onSendButtonClick: "onSendButtonClick", onError: "onError", backdropStyle: "backdropStyle", actionSheetStyle: "actionSheetStyle", aiActionSheetStyle: "aiActionSheetStyle", hideVoiceRecording: "hideVoiceRecording", mediaRecorderStyle: "mediaRecorderStyle", aiOptionsStyle: "aiOptionsStyle", aiIconURL: "aiIconURL", voiceRecordingIconURL: "voiceRecordingIconURL", voiceRecordingCloseIconURL: "voiceRecordingCloseIconURL", voiceRecordingStartIconURL: "voiceRecordingStartIconURL", voiceRecordingStopIconURL: "voiceRecordingStopIconURL", voiceRecordingSubmitIconURL: "voiceRecordingSubmitIconURL", hideLayoutMode: "hideLayoutMode", emojiIconURL: "emojiIconURL", userMemberWrapperConfiguration: "userMemberWrapperConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters", sendButtonIconURL: "sendButtonIconURL" }, outputs: { childEvent: "childEvent" }, viewQueries: [{ propertyName: "inputElementRef", first: true, predicate: ["inputElement"], descendants: true }, { propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }, { propertyName: "emojiButtonRef", first: true, predicate: ["emojiButtonRef"], descendants: true }, { propertyName: "actionSheetRef", first: true, predicate: ["actionSheetRef"], descendants: true }, { propertyName: "stickerButtonRef", first: true, predicate: ["stickerButtonRef"], descendants: true }, { propertyName: "mediaRecordedRef", first: true, predicate: ["mediaRecordedRef"], descendants: true }, { propertyName: "aiButtonRef", first: true, predicate: ["aiButtonRef"], descendants: true }, { propertyName: "userMemberWrapperRef", first: true, predicate: ["userMemberWrapperRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\"\n                [hideLayoutMode]=\"hideLayoutMode\"\n                >\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"localize('AI')\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"localize('AI')\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"], components: [{ type: i2.CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: ["userMemberListType", "onItemClick", "listItemView", "avatarStyle", "statusIndicatorStyle", "searchKeyword", "group", "subtitleView", "usersRequestBuilder", "disableUsersPresence", "userPresencePlacement", "hideSeperator", "loadingStateView", "onEmpty", "onError", "groupMemberRequestBuilder", "loadingIconUrl", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-composer", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\"\n                [hideLayoutMode]=\"hideLayoutMode\"\n                >\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"localize('AI')\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"localize('AI')\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCwwQkFBMEIsRUFDMUIscUJBQXFCLEVBRXJCLHFCQUFxQixFQUdyQixvQkFBb0IsRUFHcEIsaUJBQWlCLEVBRWpCLDhCQUE4QixFQUM5QixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBSUwsa0JBQWtCLEdBR25CLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUNMLHdCQUF3QixFQUd4QixzQkFBc0IsRUFDdEIsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUl2QixhQUFhLEVBQ2IsU0FBUyxFQUNULGtCQUFrQixFQUNsQixNQUFNLEVBQ04sa0JBQWtCLEVBQ2xCLFVBQVUsRUFDVixRQUFRLEdBQ1QsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxZQUFZLEVBQ1osS0FBSyxFQUdMLE1BQU0sRUFHTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0s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O2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0cscUJBQXFCO3NCQUE3QixLQUFLO2dCQUNHLDBCQUEwQjtzQkFBbEMsS0FBSztnQkFDRywwQkFBMEI7c0JBQWxDLEtBQUs7Z0JBQ0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUNHLDJCQUEyQjtzQkFBbkMsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFlBQVk7c0JBQXBCLEtBQUs7Z0JBQ0ksVUFBVTtzQkFBbkIsTUFBTTtnQkFDRSw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBRUcsZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5cbmltcG9ydCB7XG4gIEFJT3B0aW9uc1N0eWxlLFxuICBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcixcbiAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBDb21ldENoYXRVSUtpdFV0aWxpdHksXG4gIENvbXBvc2VySWQsXG4gIENyZWF0ZVBvbGxTdHlsZSxcbiAgTWVzc2FnZUNvbXBvc2VyU3R5bGUsXG4gIFNtYXJ0UmVwbGllc1N0eWxlLFxuICBTdGlja2Vyc0NvbmZpZ3VyYXRpb24sXG4gIFN0aWNrZXJzQ29uc3RhbnRzLFxuICBTdGlja2Vyc1N0eWxlLFxuICBVc2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24sXG4gIFVzZXJNZW50aW9uU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHtcbiAgQWN0aW9uU2hlZXRTdHlsZSxcbiAgQmFja2Ryb3BTdHlsZSxcbiAgRW1vamlLZXlib2FyZFN0eWxlLFxuICBNZWRpYVJlY29yZGVyU3R5bGUsXG4gIFBvcG92ZXJTdHlsZSxcbiAgUHJldmlld1N0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LFxuICBDb21ldENoYXRBY3Rpb25zVmlldyxcbiAgQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uLFxuICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLFxuICBDb21ldENoYXRVSUV2ZW50cyxcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIElNZW50aW9uc0NvdW50V2FybmluZyxcbiAgSU1lc3NhZ2VzLFxuICBNZW50aW9uc1RhcmdldEVsZW1lbnQsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIFBsYWNlbWVudCxcbiAgUHJldmlld01lc3NhZ2VNb2RlLFxuICBTdGF0ZXMsXG4gIFVzZXJNZW1iZXJMaXN0VHlwZSxcbiAgZm9udEhlbHBlcixcbiAgbG9jYWxpemUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXJlc291cmNlc1wiO1xuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENoYW5nZURldGVjdG9yUmVmLFxuICBDb21wb25lbnQsXG4gIEVsZW1lbnRSZWYsXG4gIEV2ZW50RW1pdHRlcixcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBPdXRwdXQsXG4gIFNpbXBsZUNoYW5nZXMsXG4gIFRlbXBsYXRlUmVmLFxuICBWaWV3Q2hpbGQsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5cbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQgeyBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiLi4vLi4vU2hhcmVkL1V0aWxzL0NvbWVDaGF0RXhjZXB0aW9uXCI7XG5pbXBvcnQgeyBDb21ldENoYXRUaGVtZVNlcnZpY2UgfSBmcm9tIFwiLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgU3Vic2NyaXB0aW9uIH0gZnJvbSBcInJ4anNcIjtcblxuLyoqXG4gKlxuICogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyIGlzIHVzZWQgdG8gc2VuZCBtZXNzYWdlIHRvIHVzZXIgb3IgZ3JvdXAuXG4gKlxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgQ29tZXRDaGF0VGVhbVxuICogQGNvcHlyaWdodCDCqSAyMDIyIENvbWV0Q2hhdCBJbmMuXG4gKlxuICovXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6IFwiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXJcIixcbiAgdGVtcGxhdGVVcmw6IFwiLi9jb21ldGNoYXQtbWVzc2FnZS1jb21wb3Nlci5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnNjc3NcIl0sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQsIE9uQ2hhbmdlcyB7XG4gIEBWaWV3Q2hpbGQoXCJpbnB1dEVsZW1lbnRcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGlucHV0RWxlbWVudFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJpbnB1dFJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW5wdXRSZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiZW1vamlCdXR0b25SZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGVtb2ppQnV0dG9uUmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImFjdGlvblNoZWV0UmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBhY3Rpb25TaGVldFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJzdGlja2VyQnV0dG9uUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICBzdGlja2VyQnV0dG9uUmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcIm1lZGlhUmVjb3JkZWRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIG1lZGlhUmVjb3JkZWRSZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYWlCdXR0b25SZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGFpQnV0dG9uUmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInVzZXJNZW1iZXJXcmFwcGVyUmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KVxuICB1c2VyTWVtYmVyV3JhcHBlclJlZiE6IEVsZW1lbnRSZWY7XG5cbiAgQElucHV0KCkgdXNlciE6IENvbWV0Q2hhdC5Vc2VyO1xuICBASW5wdXQoKSBncm91cCE6IENvbWV0Q2hhdC5Hcm91cDtcbiAgQElucHV0KCkgZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICAvKipcbiAgKiBAZGVwcmVjYXRlZFxuICAqXG4gICogVGhpcyBwcm9wZXJ0eSBpcyBkZXByZWNhdGVkIGFzIG9mIHZlcnNpb24gNC4zLjE5IGR1ZSB0byBuZXdlciBwcm9wZXJ0eSAnY3VzdG9tU291bmRGb3JNZXNzYWdlcycuIEl0IHdpbGwgYmUgcmVtb3ZlZCBpbiBzdWJzZXF1ZW50IHZlcnNpb25zLlxuICAqL1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2U6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGN1c3RvbVNvdW5kRm9yTWVzc2FnZXM6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmdFdmVudHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcGxhY2Vob2xkZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkVOVEVSX1lPVVJfTUVTU0FHRV9IRVJFXCIpO1xuXG4gIEBJbnB1dCgpIGhlYWRlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblRleHRDaGFuZ2UhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBASW5wdXQoKSBhdHRhY2htZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvUGx1cy5zdmdcIjtcbiAgQElucHV0KCkgYXR0YWNobWVudE9wdGlvbnM6XG4gICAgfCAoKFxuICAgICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAsXG4gICAgICBjb21wb3NlcklkOiBDb21wb3NlcklkXG4gICAgKSA9PiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSlcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgc2Vjb25kYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsaWFyeUJ1dHRvbnNBbGlnbm1lbnQ6IEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCA9XG4gICAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LnJpZ2h0O1xuICBASW5wdXQoKSBzZW5kQnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgQElucHV0KCkgaGlkZUxpdmVSZWFjdGlvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIExpdmVSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2hlYXJ0LXJlYWN0aW9uLnBuZ1wiO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nVGV4dD86IHN0cmluZztcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nU3R5bGU/OiBhbnk7XG4gIHB1YmxpYyBJbmZvU2ltcGxlSWNvbiA9IFwiYXNzZXRzL0luZm9TaW1wbGVJY29uLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIG1lc3NhZ2VDb21wb3NlclN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uU2VuZEJ1dHRvbkNsaWNrOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIHByZXZpZXdNZXNzYWdlTW9kZT86IFByZXZpZXdNZXNzYWdlTW9kZSkgPT4gdm9pZClcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG5cbiAgQElucHV0KCkgYWN0aW9uU2hlZXRTdHlsZTogQWN0aW9uU2hlZXRTdHlsZSA9IHtcbiAgICBsYXlvdXRNb2RlSWNvblRpbnQ6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjA0KVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2IoMjU1LDI1NSwyNTUpXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB0aXRsZUZvbnQ6IFwiNTAwIDE1cHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICB0aXRsZUNvbG9yOiBcIiMxNDE0MTRcIixcbiAgICBsaXN0SXRlbUJhY2tncm91bmQ6IFwiXCIsXG4gICAgQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50OiBcIjFweCBzb2xpZCBSR0JBKDIwLCAyMCwgMjAsIDAuMDgpXCIsXG4gICAgbGlzdEl0ZW1JY29uQmFja2dyb3VuZDpcIlwiLFxuICAgIGxpc3RJdGVtSWNvblRpbnQ6XCJcIlxuICB9O1xuXG4gIEBJbnB1dCgpIGFpQWN0aW9uU2hlZXRTdHlsZTogYW55ID0ge1xuICAgIGxheW91dE1vZGVJY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuMDQpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImluaGVyaXRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYigyNTUsMjU1LDI1NSlcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHRpdGxlRm9udDogXCI1MDAgMTVweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiIzE0MTQxNFwiLFxuICAgIGxpc3RJdGVtQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGhpZGVWb2ljZVJlY29yZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBtZWRpYVJlY29yZGVyU3R5bGU6IE1lZGlhUmVjb3JkZXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBhaU9wdGlvbnNTdHlsZTogQUlPcHRpb25zU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYWlJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9haS1ib3Quc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvbWljLnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdGFydEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21pYy5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdG9wSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc3RvcC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TZW5kLnN2Z1wiO1xuICBASW5wdXQoKSBoaWRlTGF5b3V0TW9kZTogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBlbW9qaUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1N0aXBvcC5zdmdcIjtcbiAgQE91dHB1dCgpIGNoaWxkRXZlbnQ6IEV2ZW50RW1pdHRlcjx2b2lkPiA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcbiAgQElucHV0KCkgdXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uOiBVc2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24gPSBuZXcgVXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uKHt9KTtcbiAgcHVibGljIHVzZXJNZW1iZXJMaXN0VHlwZSE6IFVzZXJNZW1iZXJMaXN0VHlwZTtcbiAgQElucHV0KCkgZGlzYWJsZU1lbnRpb25zPzogYm9vbGVhbjtcbiAgQElucHV0KCkgdGV4dEZvcm1hdHRlcnM/OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IFtdO1xuICBASW5wdXQoKSBzZW5kQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU2VuZC5zdmdcIjtcblxuICBwdWJsaWMgY29tcG9zZXJJZCE6IENvbXBvc2VySWQ7XG4gIG1lbnRpb25zRm9ybWF0dGVySW5zdGFuY2VJZDogc3RyaW5nID0gXCJjb21wb3Nlcl9cIiArIERhdGUubm93KCk7XG4gIHB1YmxpYyBjb21wb3NlckFjdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbltdID0gW107XG4gIHB1YmxpYyBzdGF0ZXM6IHR5cGVvZiBTdGF0ZXMgPSBTdGF0ZXM7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaFRlcm06IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBzaG93TGlzdEZvck1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaENvdW50OiBudW1iZXIgPSAxO1xuICBwdWJsaWMgbGFzdEVtcHR5U2VhcmNoVGVybT86IHN0cmluZyA9IFwiXCI7XG5cbiAgcHVibGljIHNtYXJ0UmVwbHlTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBzaG93TWVudGlvbnNDb3VudFdhcm5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBjY1Nob3dNZW50aW9uc0NvdW50V2FybmluZyE6IFN1YnNjcmlwdGlvbjtcbiAgaW5pdGlhbFRleHQ6c3RyaW5nID0gXCJcIjtcbiAgbG9hZGluZ1N0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJHRU5FUkFUSU5HX1JFUExJRVNcIik7XG4gIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHNob3dDcmVhdGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93U3RpY2tlcktleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dBY3Rpb25TaGVldEl0ZW06IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FjdGlvblNoZWV0SXRlbUFJOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dTbWFydFJlcGx5OiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dBaUZlYXR1cmVzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlcGxpZXNBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgYWlCb3RMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIGN1cnJlbnRBc2tBSUJvdDogYW55ID0gXCJcIjtcbiAgaXNBaU1vcmVUaGFuT25lOiBib29sZWFuID0gZmFsc2U7XG5cbiAgc2hvd1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgYWlGZWF0dXJlc0Nsb3NlQ2FsbGJhY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICBlZGl0UHJldmlld09iamVjdCE6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZTtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDb21wb3NlTWVzc2FnZSE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIHRleHRGb3JtYXR0ZXJMaXN0OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICA/IFsuLi50aGlzLnRleHRGb3JtYXR0ZXJzXVxuICAgIDogW107XG4gIHB1YmxpYyBtZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICBtZW50aW9uZWRVc2VyczogQXJyYXk8Q29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXI+ID0gW107XG4gIHB1YmxpYyBlbmFibGVTdGlja2VyS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHRvZ2dsZU1lZGlhUmVjb3JkZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHNob3dBaUJvdExpc3Q6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVudGlvbnNUeXBlU2V0QnlVc2VyOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzdGlja2VyQ29uZmlndXJhdGlvbjoge1xuICAgIGlkPzogc3RyaW5nO1xuICAgIGNvbmZpZ3VyYXRpb24/OiBTdGlja2Vyc0NvbmZpZ3VyYXRpb247XG4gIH0gPSB7fTtcbiAgY2xvc2VCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9wbHVzLXJvdGF0ZWQuc3ZnXCI7XG5cbiAgYnV0dG9uczogQnV0dG9uc1tdID0gW107XG4gIGFpQWN0aW9uQnV0dG9uczogQnV0dG9uc1tdID0gW107XG5cbiAgc21hcnRSZXBseVN0eWxlOiBTbWFydFJlcGxpZXNTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgfTtcbiAgc2VuZEJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcInJnYmEoMjAsIDIwLCAyMCwgMC41OClcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIGxpdmVSZWFjdGlvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcInJlZFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBkaXNwbGF5OiBcImZsZXhcIixcbiAgICBqdXN0aWZ5Q29udGVudDogXCJjZW50ZXJcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICB9O1xuICBsb2NhbGl6ZTogdHlwZW9mIGxvY2FsaXplID0gbG9jYWxpemU7XG4gIGVtb2ppQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgc3RpY2tlckJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIG1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuXG4gIGVtb2ppS2V5Ym9hcmRTdHlsZTogRW1vamlLZXlib2FyZFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmVtb2ppS2V5Ym9hcmRUZXh0Rm9udCxcbiAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmVtb2ppS2V5Ym9hcmRUZXh0Q29sb3IsXG4gICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICBhY3RpdmVJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgfTtcblxuICBzdGlja2VyS2V5Ym9hcmRTdHlsZTogU3RpY2tlcnNTdHlsZSA9IHt9O1xuICB0ZXh0SW5wdXRTdHlsZTogYW55ID0ge307XG4gIHByZXZpZXdTdHlsZTogUHJldmlld1N0eWxlID0ge1xuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICB9O1xuICBjcmVhdGVQb2xsU3R5bGU6IENyZWF0ZVBvbGxTdHlsZSA9IHt9O1xuICBzdG9yZVR5cGluZ0ludGVydmFsOiBhbnk7XG4gIGVtb2ppUG9wb3ZlcjogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjMxNXB4XCIsXG4gICAgaGVpZ2h0OiBcIjMyMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgc3RpY2tlclBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIzMDBweFwiLFxuICAgIGhlaWdodDogXCIzMjBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIGFpUG9wb3ZlcjogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI4MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4MHB4XCIsXG5cbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBtZWRpYVJlY29yZGVkUG9wb3ZlcjogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI1MHB4XCIsXG4gICAgaGVpZ2h0OiBcIjEwMHB4XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgcG9wb3ZlclN0eWxlOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjc1cHhcIixcbiAgICBoZWlnaHQ6IFwiMjgwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBlbW9qaUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1N0aXBvcC5zdmdcIjtcbiAgc3RpY2tlckJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1N0aWNrZXJzLnN2Z1wiO1xuXG4gIGFjdGlvbnMhOiAoQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uIHwgQ29tZXRDaGF0QWN0aW9uc1ZpZXcpW107XG4gIG1lc3NhZ2VUZXh0OiBzdHJpbmcgPSBcIlwiO1xuICBhdHRhY2htZW50QnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgYXV4aWxhcnlQbGFjZW1lbnQ6IFBsYWNlbWVudCA9IFBsYWNlbWVudC50b3A7XG4gIG1lc3NhZ2VTZW5kaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIG1lc3NhZ2VUb0JlRWRpdGVkITogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgbnVsbDtcbiAgcHVibGljIGVkaXRQcmV2aWV3VGV4dDogc3RyaW5nIHwgbnVsbCA9IFwiXCI7XG4gIHNob3dTZW5kQnV0dG9uOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dFbW9qaUtleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzQWlFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHNtYXJ0UmVwbGllczogc3RyaW5nW10gPSBbXTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBtZW50aW9uU3R5bGVMb2NhbDogVXNlck1lbnRpb25TdHlsZSA9IG5ldyBVc2VyTWVudGlvblN0eWxlKHt9KTtcblxuICBzZW5kTWVzc2FnZU9uRW50ZXIgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5zZW5kVGV4dE1lc3NhZ2UoZXZlbnQuZGV0YWlsLnZhbHVlKTtcbiAgICB0aGlzLmNsZWFyQ29tcG9zZXIoKTtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpXG4gIH07XG4gIGRpc2FibGVTZW5kQnV0dG9uKCkge1xuICAgIHRoaXMuc2VuZEJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgbWVzc2FnZUlucHV0Q2hhbmdlZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IGV2ZW50Py5kZXRhaWw/LnZhbHVlPy50cmltKCk7XG4gICAgdGhpcy5zZW5kQnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGV4dFxuICAgICAgICA/IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnNlbmRJY29uVGludFxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICBpZiAoIXRleHQpIHtcbiAgICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHRoaXMub25UZXh0Q2hhbmdlKSB7XG4gICAgICB0aGlzLm9uVGV4dENoYW5nZSh0ZXh0KTtcbiAgICB9XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IHRleHQ7XG4gICAgaWYgKHRleHQpIHtcbiAgICAgIHRoaXMuc3RhcnRUeXBpbmcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbmRUeXBpbmcoKTtcbiAgICB9XG4gIH07XG4gIGFwcGVuZEVtb2ppID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy50ZXh0ID09PSBldmVudD8uZGV0YWlsLmlkKSB7XG4gICAgICB0aGlzLnRleHQgPSBcIlwiICsgXCJcIjtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgdGhpcy50ZXh0ID0gZXZlbnQ/LmRldGFpbC5pZDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNlbmRSZWFjdGlvbigpIHtcbiAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICA/IHRoaXMudXNlcj8uZ2V0VWlkKCkhXG4gICAgICA6IHRoaXMuZ3JvdXA/LmdldEd1aWQoKSE7XG4gICAgbGV0IHJlY2VpdmVyVHlwZSA9IHRoaXMudXNlclxuICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICBsZXQgZGF0YSA9IHtcbiAgICAgIHR5cGU6IFwibGl2ZV9yZWFjdGlvblwiLFxuICAgICAgcmVhY3Rpb246IFwiaGVhcnRcIixcbiAgICB9O1xuICAgIGxldCB0cmFuc2llbnRNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UcmFuc2llbnRNZXNzYWdlKFxuICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgIHJlY2VpdmVyVHlwZSxcbiAgICAgIGRhdGFcbiAgICApO1xuICAgIENvbWV0Q2hhdC5zZW5kVHJhbnNpZW50TWVzc2FnZSh0cmFuc2llbnRNZXNzYWdlKTtcbiAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTGl2ZVJlYWN0aW9uLm5leHQoXCJoZWFydFwiKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBvcGVuQ3JlYXRlUG9sbHMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q3JlYXRlUG9sbHMgPSB0cnVlO1xuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICB9XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBjbG9zZUNyZWF0ZVBvbGxzID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NyZWF0ZVBvbGxzID0gZmFsc2U7XG5cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIHNlbmRSZWNvcmRlZE1lZGlhID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgZmlsZSA9IGV2ZW50Py5kZXRhaWw/LmZpbGU7XG4gICAgaWYgKGZpbGUpIHtcbiAgICAgIHRoaXMuc2VuZFJlY29yZGVkQXVkaW8oZmlsZSk7XG4gICAgfVxuICAgIHRoaXMuY2xvc2VNZWRpYVJlY29yZGVyKCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBjbG9zZU1lZGlhUmVjb3JkZXIoZXZlbnQ/OiBhbnkpIHtcbiAgICBpZiAodGhpcy50b2dnbGVNZWRpYVJlY29yZGVkKSB7XG4gICAgICB0aGlzLm1lZGlhUmVjb3JkZWRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gIXRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gIH1cbiAgZ2V0Rm9ybWF0dGVkRGF0ZSgpOiBzdHJpbmcge1xuICAgIGNvbnN0IGN1cnJlbnREYXRlID0gbmV3IERhdGUoKTtcblxuICAgIGNvbnN0IHllYXIgPSBjdXJyZW50RGF0ZS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XG4gICAgY29uc3QgbW9udGggPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0TW9udGgoKSArIDEpO1xuICAgIGNvbnN0IGRheSA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXREYXRlKCkpO1xuICAgIGNvbnN0IGhvdXJzID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldEhvdXJzKCkpO1xuICAgIGNvbnN0IG1pbnV0ZXMgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0TWludXRlcygpKTtcbiAgICBjb25zdCBzZWNvbmRzID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldFNlY29uZHMoKSk7XG5cbiAgICByZXR1cm4gYCR7eWVhcn0ke21vbnRofSR7ZGF5fSR7aG91cnN9JHttaW51dGVzfSR7c2Vjb25kc31gO1xuICB9XG5cbiAgcGFkWmVybyhudW06IG51bWJlcik6IHN0cmluZyB7XG4gICAgcmV0dXJuIG51bS50b1N0cmluZygpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgfVxuXG4gIHNlbmRSZWNvcmRlZEF1ZGlvID0gKGZpbGU6IEJsb2IpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZmlsZTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIGBhdWRpby1yZWNvcmRpbmctJHt0aGlzLmdldEZvcm1hdHRlZERhdGUoKX0ud2F2YCxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuICBhZGRBdHRhY2htZW50Q2FsbGJhY2soKTogdm9pZCB7XG4gICAgdGhpcy5jb21wb3NlckFjdGlvbnM/LmZvckVhY2goKGVsZW1lbnQ6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbikgPT4ge1xuICAgICAgc3dpdGNoIChlbGVtZW50LmlkKSB7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvOlxuICAgICAgICAgIGlmICghZWxlbWVudC5vbkNsaWNrKSB7XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuQXVkaW9QaWNrZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlbzpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbnZpZGVvUGlja2VyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkZpbGVQaWNrZXI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZTpcbiAgICAgICAgICBpZiAoIWVsZW1lbnQub25DbGljaykge1xuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkltYWdlUGlja2VyO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcImV4dGVuc2lvbl9wb2xsXCI6XG4gICAgICAgICAgaWYgKCFlbGVtZW50Lm9uQ2xpY2spIHtcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5DcmVhdGVQb2xscztcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQgPSBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5zdWJzY3JpYmUoXG4gICAgICAob2JqZWN0OiBJTWVzc2FnZXMpID0+IHtcbiAgICAgICAgbGV0IHBhcmVudElkID0gb2JqZWN0Py5tZXNzYWdlPy5nZXRQYXJlbnRNZXNzYWdlSWQoKVxuICAgICAgICBpZiAoKHRoaXMucGFyZW50TWVzc2FnZUlkICYmIHBhcmVudElkICYmIHBhcmVudElkID09IHRoaXMucGFyZW50TWVzc2FnZUlkKSB8fCAoIXRoaXMucGFyZW50TWVzc2FnZUlkICYmICFwYXJlbnRJZCkpIHtcbiAgICAgICAgICBpZiAob2JqZWN0Py5zdGF0dXMgPT0gTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzKSB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gb2JqZWN0Lm1lc3NhZ2UgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlO1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQob2JqZWN0Py5tZXNzYWdlKSkge1xuICAgICAgICAgICAgdGhpcy5vcGVuRWRpdFByZXZpZXcoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYob2JqZWN0Py5zdGF0dXMgPT09IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyAmJiBvYmplY3QubWVzc2FnZSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZVByZXZpZXcoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NDb21wb3NlTWVzc2FnZSA9IENvbWV0Q2hhdFVJRXZlbnRzLmNjQ29tcG9zZU1lc3NhZ2Uuc3Vic2NyaWJlKFxuICAgICAgKHRleHQ6IHN0cmluZykgPT4ge1xuICAgICAgICB0aGlzLnRleHQgPSB0ZXh0O1xuICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjU2hvd01lbnRpb25zQ291bnRXYXJuaW5nID1cbiAgICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd01lbnRpb25zQ291bnRXYXJuaW5nLnN1YnNjcmliZShcbiAgICAgICAgKGRhdGE6IElNZW50aW9uc0NvdW50V2FybmluZykgPT4ge1xuICAgICAgICAgIGlmIChkYXRhLmlkID09IHRoaXMubWVudGlvbnNGb3JtYXR0ZXJJbnN0YW5jZUlkKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5zaG93V2FybmluZykge1xuICAgICAgICAgICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IHRydWU7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICApO1xuICB9XG4gIG9wZW5FZGl0UHJldmlldygpIHtcbiAgICBsZXQgbWVzc2FnZVRleHRXaXRoTWVudGlvblRhZ3MgPSB0aGlzLmNoZWNrRm9yTWVudGlvbnMoXG4gICAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkIVxuICAgICk7XG4gICAgdGhpcy5jbGVhckNvbXBvc2VyKClcbiAgICB0aGlzLmlucHV0UmVmLm5hdGl2ZUVsZW1lbnQudGV4dCA9IFwiXCI7XG4gICAgdGhpcy50ZXh0ID0gdGhpcy5tZXNzYWdlVG9CZUVkaXRlZCEuZ2V0VGV4dCgpO1xuICAgIHRoaXMuZWRpdFByZXZpZXdUZXh0ID0gbWVzc2FnZVRleHRXaXRoTWVudGlvblRhZ3M7XG4gICAgdGhpcy5zaG93UHJldmlldyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLypcbiogaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQ6IFRvIGNoZWNrIGlmIHRoZSBtZXNzYWdlIGJlbG9uZ3MgZm9yIHRoaXMgbGlzdCBhbmQgaXMgbm90IHBhcnQgb2YgdGhyZWFkIGV2ZW4gZm9yIGN1cnJlbnQgbGlzdFxuaXQgb25seSBydW5zIGZvciBVSSBldmVudCBiZWNhdXNlIGl0IGFzc3VtZXMgbG9nZ2VkIGluIHVzZXIgaXMgYWx3YXlzIHNlbmRlclxuKiBAcGFyYW06IG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVxuKi9cbiAgaXNQYXJ0T2ZDdXJyZW50Q2hhdEZvclVJRXZlbnQgPVxuICAgIChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBpZiAobWVzc2FnZS5nZXRQYXJlbnRNZXNzYWdlSWQoKSA9PT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtZXNzYWdlLmdldFBhcmVudE1lc3NhZ2VJZCgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMudXNlcikge1xuICAgICAgICAgIGlmIChtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXIgJiZcbiAgICAgICAgICAgIG1lc3NhZ2U/LmdldFJlY2VpdmVySWQoKSA9PT0gdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCkge1xuICAgICAgICAgIGlmIChtZXNzYWdlLmdldFJlY2VpdmVyVHlwZSgpID09PSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwICYmXG4gICAgICAgICAgICBtZXNzYWdlPy5nZXRSZWNlaXZlcklkKCkgPT09IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIEAgZm9yIGV2ZXJ5IG1lbnRpb24gdGhlIG1lc3NhZ2UgYnkgbWF0Y2hpbmcgdWlkXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zICB7dm9pZH1cbiAgICovXG4gIGNoZWNrRm9yTWVudGlvbnMobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgY29uc3QgcmVnZXggPSAvPEB1aWQ6KC4qPyk+L2c7XG4gICAgbGV0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZVRleHQ7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgIGxldCBjb21ldENoYXRVc2Vyc0dyb3VwTWVtYmVycyA9IFtdO1xuICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgbGV0IHVzZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSA9PSBtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSkge1xuICAgICAgICAgIHVzZXIgPSBtZW50aW9uZWRVc2Vyc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dFRtcC5yZXBsYWNlKG1hdGNoWzBdLCBcIkBcIiArIHVzZXIuZ2V0TmFtZSgpKTtcbiAgICAgICAgY29tZXRDaGF0VXNlcnNHcm91cE1lbWJlcnMucHVzaCh1c2VyKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgfVxuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzR3JvdXBNZW1iZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmc/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2xvc2VNb2RhbHMoKSB7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQpIHtcbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlZFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuXG4gIGNhbGxDb252ZXJzYXRpb25TdW1tYXJ5TWV0aG9kKCkge1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcblxuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLm5leHQoe1xuICAgICAgY2hpbGQ6IHsgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlWaWV3OiB0cnVlIH0sXG4gICAgfSk7XG4gIH1cbiAgY2xlYXJDb21wb3Nlcigpe1xuICAgIHRoaXMudGV4dCA9IFwiXCI7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMudXNlck9yR3JvdXBDaGFuZ2VkKGNoYW5nZXMpO1xuICAgICAgaWYgKHRoaXMuaW5pdGlhbFRleHQgIT09IHRoaXMudGV4dCkge1xuICAgICAgICB0aGlzLmNsZWFyQ29tcG9zZXIoKTtcbiAgICAgIH1cbiAgICAgIHRoaXMudGV4dCA9IHRoaXMuaW5pdGlhbFRleHQgfHwgXCJcIjtcbiAgICB9XG4gICAgaWYgKGNoYW5nZXNbXCJ0ZXh0XCJdPy5jdXJyZW50VmFsdWUpIHtcbiAgICAgIHRoaXMuaW5pdGlhbFRleHQgPSBjaGFuZ2VzW1widGV4dFwiXS5jdXJyZW50VmFsdWU7XG4gICAgICB0aGlzLnRleHQgPSB0aGlzLmluaXRpYWxUZXh0O1xuICAgIH1cbiAgfVxuICBcbiAgdXNlck9yR3JvdXBDaGFuZ2VkKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zaG93UHJldmlldykge1xuICAgICAgdGhpcy5jbG9zZVByZXZpZXcoKVxuICAgIH1cbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICAgIGlmIChjaGFuZ2VzW1wiZ3JvdXBcIl0gJiYgdGhpcy5ncm91cCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24/LnVzZXJNZW1iZXJMaXN0VHlwZSA9PSB1bmRlZmluZWRcbiAgICAgICAgKSB7XG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyTGlzdFR5cGUgPSBVc2VyTWVtYmVyTGlzdFR5cGUuZ3JvdXBtZW1iZXJzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuZ3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvblxuICAgICAgICAgIC5ncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5ncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyKFxuICAgICAgICAgICAgdGhpcy5ncm91cC5nZXRHdWlkKClcbiAgICAgICAgICApLnNldExpbWl0KDE1KTtcbiAgICAgIH1cbiAgICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSAmJiB0aGlzLnVzZXIpIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uPy51c2VyTWVtYmVyTGlzdFR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMudXNlck1lbWJlckxpc3RUeXBlID0gVXNlck1lbWJlckxpc3RUeXBlLnVzZXJzO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudXNlcnNSZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uXG4gICAgICAgICAgLnVzZXJzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLnVzZXJzUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcigpLnNldExpbWl0KDE1KTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gZmFsc2U7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IGZhbHNlO1xuICAgIHRoaXMuY2xvc2VNb2RhbHMoKTtcbiAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gdGhpcy50ZXh0O1xuICAgIGlmICh0aGlzLmlucHV0UmVmICYmIHRoaXMuaW5wdXRSZWYubmF0aXZlRWxlbWVudCkge1xuICAgICAgc2V0VGltZW91dCgoKT0+e1xuICAgICAgICB0aGlzLmlucHV0UmVmPy5uYXRpdmVFbGVtZW50Py5lbXB0eUlucHV0RmllbGQoKTtcbiAgICAgICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8ucGFzdGVIdG1sQXRDYXJldCh0aGlzLnRleHQpO1xuICAgICAgfSwwKVxuICAgIH1cbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5jb21wb3NlcklkID0gdGhpcy5nZXRDb21wb3NlcklkKCk7XG4gICAgaWYgKHRoaXMuYXR0YWNobWVudE9wdGlvbnMpIHtcbiAgICAgIHRoaXMuY29tcG9zZXJBY3Rpb25zID0gdGhpcy5hdHRhY2htZW50T3B0aW9ucyhcbiAgICAgICAgdGhpcy51c2VyIHx8IHRoaXMuZ3JvdXAsXG4gICAgICAgIHRoaXMuY29tcG9zZXJJZFxuICAgICAgKTtcbiAgICAgIHRoaXMuYWRkQXR0YWNobWVudENhbGxiYWNrKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuY29tcG9zZXJBY3Rpb25zID1cbiAgICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCk/LmdldEF0dGFjaG1lbnRPcHRpb25zKFxuICAgICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgICB0aGlzLmdyb3VwLFxuICAgICAgICAgIHRoaXMuY29tcG9zZXJJZFxuICAgICAgICApO1xuICAgICAgdGhpcy5hZGRBdHRhY2htZW50Q2FsbGJhY2soKTtcbiAgICB9XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldLnNldENvbXBvc2VyQ29uZmlnKHRoaXMudXNlciwgdGhpcy5ncm91cCwgdGhpcy5jb21wb3NlcklkKTtcbiAgICB9XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnVuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmNsZWFudXAoKTtcbiAgfVxuXG4gIGN1c3RvbVNlbmRNZXRob2QobWVzc2FnZTogU3RyaW5nKSB7XG4gICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIHRoaXMuc2VuZFRleHRNZXNzYWdlKG1lc3NhZ2UpO1xuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge1N0cmluZz1cIlwifSB0ZXh0TXNnXG4gICAqL1xuICBzZW5kVGV4dE1lc3NhZ2UodGV4dE1zZzogU3RyaW5nID0gXCJcIik6IGJvb2xlYW4ge1xuICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgdHJ5IHtcbiAgICAgIC8vIERvbnQgU2VuZCBCbGFuayB0ZXh0IG1lc3NhZ2VzIC0tIGkuZSAtLS0gbWVzc2FnZXMgdGhhdCBvbmx5IGNvbnRhaW4gc3BhY2VzXG4gICAgICBpZiAoXG4gICAgICAgIHRoaXMubWVzc2FnZVRleHQ/LnRyaW0oKT8ubGVuZ3RoID09IDAgJiZcbiAgICAgICAgdGV4dE1zZz8udHJpbSgpPy5sZW5ndGggPT0gMFxuICAgICAgKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBwcmV2aW91cyBtZXNzYWdlIHRvIGJlIHNlbnQgYmVmb3JlIHNlbmRpbmcgdGhlIGN1cnJlbnQgbWVzc2FnZVxuICAgICAgaWYgKHRoaXMubWVzc2FnZVNlbmRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IHRydWU7XG4gICAgICAvLyBJZiBpdHMgYW4gRWRpdCBhbmQgU2VuZCBNZXNzYWdlIE9wZXJhdGlvbiAsIHVzZSBFZGl0IE1lc3NhZ2UgRnVuY3Rpb25cbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkKSB7XG4gICAgICAgIHRoaXMuZWRpdE1lc3NhZ2UoKTtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBsZXQgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICBsZXQgbWVzc2FnZUlucHV0O1xuICAgICAgaWYgKHRleHRNc2cgIT09IG51bGwpIHtcbiAgICAgICAgbWVzc2FnZUlucHV0ID0gdGV4dE1zZy50cmltKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBtZXNzYWdlSW5wdXQgPSB0aGlzLm1lc3NhZ2VUZXh0LnRyaW0oKTtcbiAgICAgIH1cbiAgICAgIGxldCB0ZXh0TWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgbWVzc2FnZUlucHV0LFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICBpZiAodGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0UGFyZW50TWVzc2FnZUlkKHRoaXMucGFyZW50TWVzc2FnZUlkKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMubWVudGlvbmVkVXNlcnMubGVuZ3RoKSB7XG4gICAgICAgIGxldCB1c2VyT2JqZWN0cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICB1c2VyT2JqZWN0cy5wdXNoKFxuICAgICAgICAgICAgdGhpcy5tZW50aW9uZWRVc2Vyc1tpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdC5Hcm91cE1lbWJlclxuICAgICAgICAgICAgICA/ICh0aGlzLm1lbnRpb25lZFVzZXJzW2ldIGFzIENvbWV0Q2hhdC5Vc2VyKVxuICAgICAgICAgICAgICA6IHRoaXMubWVudGlvbmVkVXNlcnNbaV1cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIHRleHRNZXNzYWdlLnNldE1lbnRpb25lZFVzZXJzKHVzZXJPYmplY3RzKTtcbiAgICAgICAgdGhpcy5tZW50aW9uZWRVc2VycyA9IFtdO1xuICAgICAgfVxuXG4gICAgICB0ZXh0TWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgICB0ZXh0TWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIpXG4gICAgICB9XG4gICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuXG4gICAgICAvLyBwbGF5IGF1ZGlvIGFmdGVyIGFjdGlvbiBnZW5lcmF0aW9uXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgIH1cbiAgICAgIC8vY2xlYXJpbmcgTWVzc2FnZSBJbnB1dCBCb3hcbiAgICAgIHRoaXMuY2xlYXJDb21wb3NlcigpXG4gICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dE1lc3NhZ2UgPSAodGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5mb3JtYXRNZXNzYWdlRm9yU2VuZGluZyh0ZXh0TWVzc2FnZSkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIC8vIEVuZCBUeXBpbmcgSW5kaWNhdG9yIEZ1bmN0aW9uXG4gICAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgICAgIGlmICghdGhpcy5vblNlbmRCdXR0b25DbGljaykge1xuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgbWVzc2FnZTogdGV4dE1lc3NhZ2UsXG4gICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICAgIH0pO1xuICAgICAgICBDb21ldENoYXQuc2VuZE1lc3NhZ2UodGV4dE1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSB8IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2VPYmplY3QsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBDaGFuZ2UgdGhlIHNlbmQgYnV0dG9uIHRvIHJlYWN0aW9uIGJ1dHRvblxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVzZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZXRhZGF0YSh7XG4gICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHRleHRNZXNzYWdlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25TZW5kQnV0dG9uQ2xpY2sodGV4dE1lc3NhZ2UsIFByZXZpZXdNZXNzYWdlTW9kZS5ub25lKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbkFpQmFja0J1dHRvbkNsaWNrKCkge1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBlZGl0TWVzc2FnZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZVRvQmVFZGl0ZWQ6IGFueSA9IHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQ7XG4gICAgICBsZXQgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICBsZXQgbWVzc2FnZVRleHQgPSB0aGlzLm1lc3NhZ2VUZXh0LnRyaW0oKTtcbiAgICAgIGxldCBtZW50aW9uZWRVc2VycyA9IFtdO1xuICAgICAgaWYgKG1lc3NhZ2VUb0JlRWRpdGVkLmdldE1lbnRpb25lZFVzZXJzKCkpIHtcbiAgICAgICAgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlVG9CZUVkaXRlZC5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgICAgICBtZXNzYWdlVGV4dCA9XG4gICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRPcmlnaW5hbFRleHQobWVzc2FnZVRleHQpO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgbWVudGlvbmVkVXNlcnNcbiAgICAgICAgKTtcbiAgICAgICAgbWVzc2FnZVRleHQgPVxuICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0T3JpZ2luYWxUZXh0KG1lc3NhZ2VUZXh0KTtcbiAgICAgIH1cbiAgICAgIGxldCB0ZXh0TWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgbWVzc2FnZVRleHQsXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIGlmIChtZW50aW9uZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0TWVudGlvbmVkVXNlcnMobWVudGlvbmVkVXNlcnMpO1xuICAgICAgfVxuICAgICAgdGV4dE1lc3NhZ2Uuc2V0SWQobWVzc2FnZVRvQmVFZGl0ZWQuaWQpO1xuICAgICAgdGhpcy5jbG9zZVByZXZpZXcoKTtcbiAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRleHRNZXNzYWdlID0gKHRoaXMudGV4dEZvcm1hdHRlckxpc3RbaV0uZm9ybWF0TWVzc2FnZUZvclNlbmRpbmcodGV4dE1lc3NhZ2UpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICB9XG4gICAgICBpZiAoIXRoaXMub25TZW5kQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgQ29tZXRDaGF0LmVkaXRNZXNzYWdlKHRleHRNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVzZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgdGhpcy5vblNlbmRCdXR0b25DbGljayh0ZXh0TWVzc2FnZSwgUHJldmlld01lc3NhZ2VNb2RlLmVkaXQpXG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVzZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFJlY2VpdmVyRGV0YWlscygpIHtcbiAgICBsZXQgcmVjZWl2ZXJJZCE6IHN0cmluZztcbiAgICBsZXQgcmVjZWl2ZXJUeXBlITogc3RyaW5nO1xuICAgIGxldCBpc0Jsb2NrZWQgPSBmYWxzZTtcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgcmVjZWl2ZXJJZCA9IHRoaXMudXNlci5nZXRVaWQoKTtcbiAgICAgIHJlY2VpdmVyVHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgIGlzQmxvY2tlZCA9IHRoaXMudXNlci5nZXRCbG9ja2VkQnlNZSgpIHx8IHRoaXMudXNlci5nZXRIYXNCbG9ja2VkTWUoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZ3JvdXAgJiYgdGhpcy5ncm91cC5nZXRHdWlkKCkpIHtcbiAgICAgIHJlY2VpdmVySWQgPSB0aGlzLmdyb3VwLmdldEd1aWQoKTtcbiAgICAgIHJlY2VpdmVyVHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgfVxuICAgIHJldHVybiB7IHJlY2VpdmVySWQ6IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZTogcmVjZWl2ZXJUeXBlLCBpc0Jsb2NrZWQgfTtcbiAgfVxuICBwbGF5QXVkaW8oKSB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgaWYgKHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlIHx8IHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoXG4gICAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5Tb3VuZC5vdXRnb2luZ01lc3NhZ2UsXG4gICAgICAgIHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlIHx8IHRoaXMuY3VzdG9tU291bmRGb3JNZXNzYWdlc1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nTWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge30gdGltZXI9bnVsbFxuICAgKiBAcGFyYW0gIHtzdHJpbmc9XCJcIn0gbWV0YWRhdGFcbiAgICovXG4gIHN0YXJ0VHlwaW5nKHRpbWVyID0gbnVsbCwgbWV0YWRhdGE6IHN0cmluZyA9IFwiXCIpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZ0V2ZW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHR5cGluZ0ludGVydmFsID0gdGltZXIgfHwgNTAwMDtcbiAgICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBpc0Jsb2NrZWQgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHR5cGluZ01ldGFkYXRhID0gbWV0YWRhdGEgfHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdHlwaW5nTm90aWZpY2F0aW9uID0gbmV3IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IoXG4gICAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgICByZWNlaXZlclR5cGUsXG4gICAgICAgICAgdHlwaW5nTWV0YWRhdGFcbiAgICAgICAgKTtcbiAgICAgICAgQ29tZXRDaGF0LnN0YXJ0VHlwaW5nKHR5cGluZ05vdGlmaWNhdGlvbik7XG4gICAgICAgIHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgICAgIH0sIHR5cGluZ0ludGVydmFsKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUFjdGlvbnMgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBhY3Rpb246IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmFjdGlvbjtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgaWYgKGFjdGlvbi5vbkNsaWNrKSB7XG4gICAgICBhY3Rpb24ub25DbGljaygpO1xuICAgIH1cbiAgICBpZih0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pe1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpXG4gICAgfVxuICB9O1xuICBlbmRUeXBpbmcobWV0YWRhdGEgPSBudWxsKSB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmdFdmVudHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgaXNCbG9ja2VkIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0eXBpbmdNZXRhZGF0YSA9IG1ldGFkYXRhIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHR5cGluZ05vdGlmaWNhdGlvbiA9IG5ldyBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKFxuICAgICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgICAgIHR5cGluZ01ldGFkYXRhXG4gICAgICAgICk7XG4gICAgICAgIENvbWV0Q2hhdC5lbmRUeXBpbmcodHlwaW5nTm90aWZpY2F0aW9uKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0ZpbGUgfCBDb21ldENoYXQuTWVkaWFNZXNzYWdlfSBtZXNzYWdlSW5wdXRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBtZXNzYWdlVHlwZVxuICAgKi9cbiAgc2VuZE1lZGlhTWVzc2FnZShtZXNzYWdlSW5wdXQ6IEZpbGUsIG1lc3NhZ2VUeXBlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZVNlbmRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IHRydWU7XG4gICAgICBjb25zdCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgIGxldCBtZWRpYU1lc3NhZ2U6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgbWVzc2FnZUlucHV0LFxuICAgICAgICBtZXNzYWdlVHlwZSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuXG4gICAgICBpZiAodGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgbWVkaWFNZXNzYWdlLnNldFBhcmVudE1lc3NhZ2VJZCh0aGlzLnBhcmVudE1lc3NhZ2VJZCk7XG4gICAgICB9XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0VHlwZShtZXNzYWdlVHlwZSk7XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0TWV0YWRhdGEoe1xuICAgICAgICBbXCJmaWxlXCJdOiBtZXNzYWdlSW5wdXQsXG4gICAgICB9KTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgbWVkaWFNZXNzYWdlLnNldFNlbmRlcih0aGlzLmxvZ2dlZEluVXNlcilcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICB9XG4gICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgICAgIGlmICghdGhpcy5vblNlbmRCdXR0b25DbGljaykge1xuICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgbWVzc2FnZTogbWVkaWFNZXNzYWdlLFxuICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgICB9KTtcbiAgICAgICAgQ29tZXRDaGF0LnNlbmRNZXNzYWdlKG1lZGlhTWVzc2FnZSlcbiAgICAgICAgICAudGhlbigocmVzcG9uc2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkgPT4ge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmVzcG9uc2Uuc2V0TXVpZChtZWRpYU1lc3NhZ2UuZ2V0TXVpZCgpKTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogcmVzcG9uc2UsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5zdWNjZXNzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgICBtZWRpYU1lc3NhZ2Uuc2V0TWV0YWRhdGEoe1xuICAgICAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiBtZWRpYU1lc3NhZ2UsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vblNlbmRCdXR0b25DbGljayhtZWRpYU1lc3NhZ2UsIFByZXZpZXdNZXNzYWdlTW9kZS5ub25lKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaW5wdXRDaGFuZ2VIYW5kbGVyID0gKGV2ZW50OiBhbnkpOiB2b2lkID0+IHtcbiAgICBjb25zdCBmaWxlczogRmlsZUxpc3QgPSBldmVudC50YXJnZXQuZmlsZXM7XG4gICAgaWYgKCFmaWxlcyB8fCBmaWxlcy5sZW5ndGggPT09IDApIHJldHVybjtcbiAgICBBcnJheS5mcm9tKGZpbGVzKS5mb3JFYWNoKChmaWxlOiBGaWxlKSA9PiB7XG4gICAgICBjb25zdCBmaWxlVHlwZSA9IGZpbGUudHlwZTtcbiAgICAgIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiaW1hZ2UvXCIpKSB7XG4gICAgICAgIHRoaXMub25JbWFnZUNoYW5nZShldmVudCk7XG4gICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJ2aWRlby9cIikpIHtcbiAgICAgICAgdGhpcy5vblZpZGVvQ2hhbmdlKGV2ZW50KTtcbiAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcImF1ZGlvL1wiKSkge1xuICAgICAgICB0aGlzLm9uQXVkaW9DaGFuZ2UoZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vbkZpbGVDaGFuZ2UoZXZlbnQpO1xuICAgICAgfVxuICAgIH0pO1xuICAgICAgaWYgKHRoaXMuaW5wdXRFbGVtZW50UmVmPy5uYXRpdmVFbGVtZW50ICYmIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ/LnZhbHVlKSB7XG4gICAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnZhbHVlID0gXCJcIjtcbiAgICB9XG4gIH07XG4gIFxuICBzZW5kU3RpY2tlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIGxldCBzdGlja2VyID0gZXZlbnQ/LmRldGFpbD8uc3RpY2tlclVSTDtcbiAgICBsZXQgc3RpY2tlck5hbWU6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnN0aWNrZXJOYW1lO1xuICAgIGlmICh0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogc3RpY2tlck5hbWUsXG4gICAgICAgICAgdXJsOiBzdGlja2VyLFxuICAgICAgICB9LFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICAgIHRoaXMub25FcnJvcixcbiAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UgfHwgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2VzLFxuICAgICAgICB0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzXG4gICAgICApO1xuICAgIH1cbiAgfTtcbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uVmlkZW9DaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1swXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbMF07XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy52aWRlb1xuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbkF1ZGlvQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25JbWFnZUNoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzWzBdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmltYWdlXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uRmlsZUNoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzW1wiMFwiXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbXCIwXCJdO1xuICAgICAgdmFyIHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGVcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBvcGVuSW1hZ2VQaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImltYWdlLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIG9wZW5GaWxlUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJmaWxlLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIG9wZW52aWRlb1BpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwidmlkZW8vKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbkF1ZGlvUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJhdWRpby8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBoYW5kbGVPdXRzaWRlQ2xpY2soKSB7XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgb3BlbkFjdGlvblNoZWV0ID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuXG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIGhhbmRsZUFpRmVhdHVyZXNDbG9zZSA9IChjYWxsYmFjazogKCkgPT4gdm9pZCkgPT4ge1xuICAgIHRoaXMuYWlGZWF0dXJlc0Nsb3NlQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgfTtcblxuICBjbG9zZVNtYXJ0UmVwbHkgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm47XG4gIH07XG4gIG9wZW5BaUZlYXR1cmVzID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy5haUZlYXR1cmVzQ2xvc2VDYWxsYmFjaykge1xuICAgICAgdGhpcy5haUZlYXR1cmVzQ2xvc2VDYWxsYmFjaygpO1xuICAgIH1cbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9ICF0aGlzLnNob3dBaUZlYXR1cmVzO1xuICAgIHRoaXMuY2xvc2VNZWRpYVJlY29yZGVyKCk7XG4gICAgaWYgKHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuZW1vamlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IHRydWU7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIG9wZW5FbW9qaUtleWJvYXJkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgIHRoaXMuY2xvc2VNZWRpYVJlY29yZGVyKCk7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0FpRmVhdHVyZXMpIHtcbiAgICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9ICF0aGlzLnNob3dBaUZlYXR1cmVzO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBvcGVuTWVkaWFSZWNvcmRlZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gIXRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZDtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIG9wZW5TdGlja2VyS2V5Ym9hcmQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIGNsb3NlUG9wb3ZlcnMoKSB7XG4gICAgaWYgKHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuZW1vamlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgfVxuICB9XG4gIGdldENvbXBvc2VySWQoKTogQ29tcG9zZXJJZCB7XG4gICAgY29uc3QgdXNlciA9IHRoaXMudXNlcjtcbiAgICBpZiAodXNlciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1c2VyOiB1c2VyPy5nZXRVaWQoKSxcbiAgICAgICAgZ3JvdXA6IG51bGwsXG4gICAgICAgIHBhcmVudE1lc3NhZ2VJZDogdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBncm91cCA9IHRoaXMuZ3JvdXA7XG4gICAgaWYgKGdyb3VwICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVzZXI6IG51bGwsXG4gICAgICAgIGdyb3VwOiBncm91cD8uZ2V0R3VpZCgpLFxuICAgICAgICBwYXJlbnRNZXNzYWdlSWQ6IHRoaXMucGFyZW50TWVzc2FnZUlkLFxuICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHsgdXNlcjogbnVsbCwgZ3JvdXA6IG51bGwsIHBhcmVudE1lc3NhZ2VJZDogdGhpcy5wYXJlbnRNZXNzYWdlSWQgfTtcbiAgfVxuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnNldFRoZW1lKCk7XG4gICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdCA9IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICAgID8gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgOiBbXTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgdGhpcy5oYW5kbGVDbGlja091dHNpZGUpO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UgPVxuICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0TWVudGlvbnNUZXh0Rm9ybWF0dGVyKHtcbiAgICAgICAgdGhlbWU6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgfSk7XG4gICAgQ29tZXRDaGF0LmdldExvZ2dlZGluVXNlcigpXG4gICAgICAudGhlbigodXNlcjogQ29tZXRDaGF0LlVzZXIgfCBudWxsKSA9PiB7XG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZU1lbnRpb25zRm9ybWF0dGVyKCk7XG5cbiAgICB0aGlzLmFjdGlvbnMgPSBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRBSU9wdGlvbnMoXG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgIHRoaXMuZ2V0Q29tcG9zZXJJZCgpIGFzIHVua25vd24gYXMgTWFwPHN0cmluZywgYW55PixcbiAgICAgIHRoaXMuYWlPcHRpb25zU3R5bGVcbiAgICApO1xuICAgIHRoaXMuYWlCb3RMaXN0ID0gW107XG5cblxuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgICB0aGlzLmVuYWJsZVN0aWNrZXJLZXlib2FyZCA9IHRydWU7XG4gICAgdGhpcy5zdGlja2VyQ29uZmlndXJhdGlvbiA9XG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKT8uZ2V0QXV4aWxpYXJ5T3B0aW9ucyhcbiAgICAgICAgdGhpcy5jb21wb3NlcklkLFxuICAgICAgICB0aGlzLnVzZXIsXG4gICAgICAgIHRoaXMuZ3JvdXBcbiAgICAgICk7XG4gICAgaWYgKHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24/LmlkID09IFN0aWNrZXJzQ29uc3RhbnRzLnN0aWNrZXIpIHtcbiAgICAgIHRoaXMuZW5hYmxlU3RpY2tlcktleWJvYXJkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5lbmFibGVBaUZlYXR1cmVzKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgZm9yIGRldmVsb3BlciBwcm92aWRlZCBpbnN0YW5jZSBvZiBNZW50aW9uc1RleHRGb3JtYXR0ZXJcbiAgICogSWYgbm90IHByb3ZpZGVkLCBhZGQgZGVmYXVsdFxuICAgKiBJZiBwcm92aWRlZCwgY2hlY2sgaWYgc3R5bGUgaXMgcHJvdmlkZWQgdmlhIGNvbmZpZ3VyYXRpb24sIHRoZW4gYWRkIHN0eWxlLlxuICAgKi9cbiAgaW5pdGlhbGl6ZU1lbnRpb25zRm9ybWF0dGVyID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5kaXNhYmxlTWVudGlvbnMpIHtcbiAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0TWVudGlvbnNUZXh0U3R5bGUoXG4gICAgICAgIHRoaXMuZ2V0TWVudGlvbnNTdHlsZSgpXG4gICAgICApO1xuICAgICAgbGV0IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIhOiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgIGlmICh0aGlzLnRleHRGb3JtYXR0ZXJzIS5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXSBpbnN0YW5jZW9mIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBmb3VuZE1lbnRpb25zRm9ybWF0dGVyID0gdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtcbiAgICAgICAgICAgICAgaVxuICAgICAgICAgICAgXSBhcyBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UgPSBmb3VuZE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChmb3VuZE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UgPSBmb3VuZE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgICF0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldEtleVVwQ2FsbEJhY2soKSB8fFxuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldEtleURvd25DYWxsQmFjaygpXG4gICAgICApIHtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRLZXlVcENhbGxCYWNrKFxuICAgICAgICAgIHRoaXMuc2VhcmNoTWVudGlvbnNcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRLZXlEb3duQ2FsbEJhY2soXG4gICAgICAgICAgdGhpcy5zZWFyY2hNZW50aW9uc1xuICAgICAgICApO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldElkKFxuICAgICAgICAgIHRoaXMubWVudGlvbnNGb3JtYXR0ZXJJbnN0YW5jZUlkXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZm91bmRNZW50aW9uc0Zvcm1hdHRlcikge1xuICAgICAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0LnB1c2godGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIGdldE1lbnRpb25zU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHRoaXMubWVudGlvblN0eWxlTG9jYWw7XG4gIH07XG5cbiAgZ2V0U21hcnRSZXBsaWVzID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSB0cnVlO1xuICAgIHRoaXMucmVwbGllc0FycmF5ID0gW107XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUJvdExpc3QgPSBmYWxzZTtcblxuICAgIHRoaXMuc21hcnRSZXBseVN0YXRlID0gU3RhdGVzLmxvYWRpbmc7XG5cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgICAgPyB0aGlzLnVzZXI/LmdldFVpZCgpXG4gICAgICAgIDogdGhpcy5ncm91cD8uZ2V0R3VpZCgpO1xuICAgICAgbGV0IHJlY2VpdmVyVHlwZTogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICAgIDogQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICAgIENvbWV0Q2hhdC5nZXRTbWFydFJlcGxpZXMocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlKVxuICAgICAgICAudGhlbigocmVzcG9uc2U6IGFueSkgPT4ge1xuICAgICAgICAgIGxldCByZXBsaWVzQXJyYXk6IHN0cmluZ1tdID0gW107XG4gICAgICAgICAgT2JqZWN0LmtleXMocmVzcG9uc2UpLmZvckVhY2goKHJlcGx5KSA9PiB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2VbcmVwbHldICYmIHJlc3BvbnNlW3JlcGx5XSAhPSBcIlwiKSB7XG4gICAgICAgICAgICAgIHRoaXMucmVwbGllc0FycmF5LnB1c2gocmVzcG9uc2VbcmVwbHldKTtcbiAgICAgICAgICAgICAgcmVwbGllc0FycmF5LnB1c2gocmVzcG9uc2VbcmVwbHldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICByZXNvbHZlKHJlcGxpZXNBcnJheSk7XG5cbiAgICAgICAgICB0aGlzLnNtYXJ0UmVwbHlTdGF0ZSA9IFN0YXRlcy5sb2FkZWQ7XG5cbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgICAgdGhpcy5zbWFydFJlcGx5U3RhdGUgPSBTdGF0ZXMuZXJyb3I7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH07XG5cbiAgZW5hYmxlQWlGZWF0dXJlcygpIHtcbiAgICBpZiAodGhpcy5hY3Rpb25zICYmIHRoaXMuYWN0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLmlzQWlFbmFibGVkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5hY3Rpb25zLmZvckVhY2goKGFjdGlvbikgPT4ge1xuICAgICAgICBpZiAoYWN0aW9uLmlkID09PSBcImFpLXNtYXJ0LXJlcGx5XCIpIHtcbiAgICAgICAgICBjb25zdCBuZXdCdXR0b24gPSB7XG4gICAgICAgICAgICAuLi5hY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogYWN0aW9uLnRpdGxlISxcbiAgICAgICAgICAgIG9uQ2xpY2s6IHRoaXMuZ2V0U21hcnRSZXBsaWVzLFxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLmJ1dHRvbnMucHVzaChuZXdCdXR0b24pO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uLmlkID09PSBcImFpLWNvbnZlcnNhdGlvbi1zdW1tYXJ5XCIpIHtcbiAgICAgICAgICBjb25zdCBuZXdCdXR0b24gPSB7XG4gICAgICAgICAgICAuLi5hY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogYWN0aW9uLnRpdGxlISxcbiAgICAgICAgICAgIGlkOiBhY3Rpb24uaWQsXG4gICAgICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PiB0aGlzLmNhbGxDb252ZXJzYXRpb25TdW1tYXJ5TWV0aG9kKCksXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0aGlzLmJ1dHRvbnMucHVzaChuZXdCdXR0b24pO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWN0aW9uLmlkID09PSBcImFpLWJvdHNcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgaWQ6IGFjdGlvbi5pZCxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+XG4gICAgICAgICAgICAgIHRoaXMuc2hvd0FpQm90TWVzc2FnZUxpc3RNZXRob2QoKGFjdGlvbiBhcyBhbnkpLm9uQ2xpY2soKSksXG4gICAgICAgICAgfTtcbiAgICAgICAgICB0aGlzLmJ1dHRvbnMucHVzaChuZXdCdXR0b24pO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgc2hvd0FpQm90TWVzc2FnZUxpc3RNZXRob2QgPSAoYWN0aW9uOiBhbnkpID0+IHtcbiAgICB0aGlzLmFpQm90TGlzdCA9IGFjdGlvbjtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IHRydWU7XG5cbiAgICB0aGlzLmFpQWN0aW9uQnV0dG9ucy5sZW5ndGggPSAwO1xuXG4gICAgdGhpcy5haUJvdExpc3QuZm9yRWFjaCgoZTogYW55LCBpOiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgaWQ6IGUuaWQsXG4gICAgICAgIHRpdGxlOiBlLnRpdGxlLFxuICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwubmV4dCh7XG4gICAgICAgICAgICBjaGlsZDogeyBib3Q6IGUsIHNob3dCb3RWaWV3OiB0cnVlIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICB9O1xuXG4gICAgICB0aGlzLmFpQWN0aW9uQnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgc2VuZFJlcGx5ID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgcmVwbHk6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnJlcGx5O1xuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjQ29tcG9zZU1lc3NhZ2UubmV4dChyZXBseSk7XG4gICAgdGhpcy5yZXBsaWVzQXJyYXkgPSBbXTtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBjb21wb3NlcldyYXBwZXJTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5oZWlnaHQsXG4gICAgICB3aWR0aDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ud2lkdGgsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5iYWNrZ3JvdW5kLFxuICAgICAgYm9yZGVyOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5ib3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJvcmRlclJhZGl1cyxcbiAgICB9O1xuICB9XG4gIHNldFRoZW1lKCkge1xuICAgIHRoaXMuZW1vamlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDMycHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLnN0aWNrZXJQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDMycHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDMycHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLmFpUG9wb3Zlci5iYWNrZ3JvdW5kID0gdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gICAgdGhpcy5haVBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc2V0Q29tcG9zZXJTdHlsZSgpO1xuICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZSA9IHtcbiAgICAgIGxheW91dE1vZGVJY29uVGludDpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLmxheW91dE1vZGVJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLmFjdGlvblNoZWV0U3R5bGU/LmJvcmRlclJhZGl1cyB8fCBcImluaGVyaXRcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5iYWNrZ3JvdW5kIHx8IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOnRoaXMuYWN0aW9uU2hlZXRTdHlsZS5ib3JkZXIgfHwgIFwibm9uZVwiLFxuICAgICAgd2lkdGg6dGhpcy5hY3Rpb25TaGVldFN0eWxlLndpZHRoIHx8IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OnRoaXMuYWN0aW9uU2hlZXRTdHlsZS5oZWlnaHQgfHwgXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS50aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUudGl0bGVDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50OlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUuQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBsaXN0SXRlbUJhY2tncm91bmQ6IHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5saXN0SXRlbUJhY2tncm91bmQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksIFxuICAgICAgbGlzdEl0ZW1JY29uVGludDogdGhpcy5hY3Rpb25TaGVldFN0eWxlLmxpc3RJdGVtSWNvblRpbnQgfHwgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ3MDAoKSwgXG4gICAgICBsaXN0SXRlbUljb25CYWNrZ3JvdW5kOiB0aGlzLmFjdGlvblNoZWV0U3R5bGUubGlzdEl0ZW1JY29uQmFja2dyb3VuZCB8fCAndHJhbnNwYXJlbnQnLFxuICAgICAgICBcbiAgICB9O1xuICAgIHRoaXMucG9wb3ZlclN0eWxlLmJhY2tncm91bmQgPSB0aGlzLmFjdGlvblNoZWV0U3R5bGUuYmFja2dyb3VuZCB8fCB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKTtcbiAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZSA9IHtcbiAgICAgIGxheW91dE1vZGVJY29uVGludDpcbiAgICAgICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUubGF5b3V0TW9kZUljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDpcbiAgICAgICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUudGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUudGl0bGVDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50OlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS5BY3Rpb25TaGVldFNlcGFyYXRvclRpbnQgfHxcbiAgICAgICAgYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCl9YCxcbiAgICB9O1xuXG4gICAgdGhpcy50ZXh0SW5wdXRTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBtYXhIZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/Lm1heElucHV0SGVpZ2h0IHx8IFwiMTAwcHhcIixcbiAgICAgIGJvcmRlcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCb3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmlucHV0Qm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCYWNrZ3JvdW5kLFxuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy50ZXh0Q29sb3IsXG4gICAgICBkaXZpZGVyQ29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmRpdmlkZXJUaW50LFxuICAgIH07XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpXG4gICAgdGhpcy5wcmV2aWV3U3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBwcmV2aWV3VGl0bGVGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3VGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgcHJldmlld1RpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdUaXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1N1YnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdTdWJ0aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5jbG9zZVByZXZpZXdUaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4J1xuICAgIH07XG4gICAgbGV0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgbGV0IGRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUgPSBuZXcgTWVkaWFSZWNvcmRlclN0eWxlKHtcbiAgICAgIHN0YXJ0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIHN1Ym1pdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3RvcEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgdGltZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aW1lclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuYm9yZGVyID0gYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUsXG4gICAgICAuLi50aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuZW1vamlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDhweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc3RpY2tlclBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggOHB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCA4cHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLmVtb2ppQnV0dG9uU3R5bGUgPSB7XG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLnN0aWNrZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy52b2ljZVJlY29yZGluZ0ljb25UaW50IHx8XG4gICAgICBcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuZW1vamlLZXlib2FyZFN0eWxlID0ge1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dENvbG9yLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICB9O1xuXG4gICAgdGhpcy5zdGlja2VyS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGNhdGVnb3J5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfTtcbiAgICB0aGlzLmF0dGFjaG1lbnRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5hdHRhY2hJY29udGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgdGhpcy5jcmVhdGVQb2xsU3R5bGUgPSB7XG4gICAgICBwbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsZXRlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcXVlc3Rpb25JbnB1dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBvcHRpb25JbnB1dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBhbnN3ZXJIZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjFcbiAgICAgICksXG4gICAgICBhbnN3ZXJIZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgYWRkQW5zd2VySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYWRkQW5zd2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBhZGRBbnN3ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBlcnJvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgb3B0aW9uUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBvcHRpb25QbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHF1ZXN0aW9uSW5wdXRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBxdWVzdGlvbklucHV0VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb3B0aW9uSW5wdXRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBvcHRpb25JbnB1dFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiNjIwcHhcIixcbiAgICAgIGJvcmRlcjogXCJcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfTtcbiAgfVxuICBzZXRDb21wb3NlclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VDb21wb3NlclN0eWxlID0gbmV3IE1lc3NhZ2VDb21wb3NlclN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGxpdmVSZWFjdGlvbkljb25UaW50OiBcInJlZFwiLFxuICAgICAgYXR0YWNoSWNvbnRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBzZW5kSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZW1vamlJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGlucHV0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGlucHV0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGlucHV0Qm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGRpdmlkZXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuXG4gICAgICBlbW9qaUtleWJvYXJkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZW1vamlLZXlib2FyZFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdUaXRsZUZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgcHJldmlld1RpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgY2xvc2VQcmV2aWV3VGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGUsXG4gICAgfTtcbiAgICBpZiAoIXRoaXMuaGlkZUxpdmVSZWFjdGlvbikge1xuICAgICAgdGhpcy5saXZlUmVhY3Rpb25TdHlsZSA9IHtcbiAgICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgICBidXR0b25JY29uVGludDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ubGl2ZVJlYWN0aW9uSWNvblRpbnQsXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBjbG9zZVByZXZpZXcoKSB7XG4gICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zaG93UHJldmlldyA9IGZhbHNlO1xuICAgIHRoaXMuZWRpdFByZXZpZXdUZXh0ID0gXCJcIjtcbiAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gbnVsbDtcbiAgICB0aGlzLmNsZWFyQ29tcG9zZXIoKVxuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcblxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBY2NlcHRzIHNlYXJjaCB0ZXJtIGZyb20gbWVudGlvbnNUZXh0Rm9ybWF0dGVyIGFuZCBvcGVucyB0aGUgbWVudGlvbnMgc2VsZWN0IGxpc3RcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm1cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBzZWFyY2hNZW50aW9ucyA9IChzZWFyY2hUZXJtOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIShzZWFyY2hUZXJtICYmIHNlYXJjaFRlcm0ubGVuZ3RoKSkge1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoQ291bnQgPSAxO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICF0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gfHxcbiAgICAgICFzZWFyY2hUZXJtXG4gICAgICAgIC5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnN0YXJ0c1dpdGgodGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCkpXG4gICAgKSB7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9XG4gICAgICAgIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdICYmIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdLmxlbmd0aFxuICAgICAgICAgID8gc2VhcmNoVGVybS5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgICA6IFwiXCI7XG4gICAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSB0cnVlO1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaENvdW50Kys7XG4gICAgICB0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBjbGlja2luZyBhIHVzZXIgZnJvbSB0aGUgbWVudGlvbnMgbGlzdC5cbiAgICogQWRkIHRoZSB1c2VyIHRvIG1lbnRpb25zIHRleHQgZm9ybWF0dGVyIGluc3RhbmNlIGFuZCB0aGVuIGNhbGwgcmVyZW5kZXIgdG8gc3R5bGUgdGhlIG1lbnRpb25cbiAgICogd2l0aGluIG1lc3NhZ2UgaW5wdXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXIgPSAoXG4gICAgdXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgKSA9PiB7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzID0gW3VzZXJdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXG4gICAgICAuLi50aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKSxcbiAgICBdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVSZW5kZXIoKTtcbiAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9IFwiXCI7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZSBtZW50aW9ucyBsaXN0IGlmIHNlYXJjaCByZXR1cm5zIGVtcHR5IGxpc3RcbiAgICovXG4gIGRlZmF1bHRPbkVtcHR5Rm9yTWVudGlvbnMgPSAoKSA9PiB7XG4gICAgdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtID0gdGhpcy5tZW50aW9uc1NlYXJjaFRlcm07XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBnZXRNZW50aW9uSW5mb0ljb25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIGljb25IZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBnYXA6IFwiNXB4XCIsXG4gICAgfTtcbiAgfTtcblxuICBoYW5kbGVDbGlja091dHNpZGUgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmKSB7XG4gICAgICBjb25zdCB1c2VyTWVtYmVyV3JhcHBlclJlY3QgPVxuICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmPy5uYXRpdmVFbGVtZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IGlzT3V0c2lkZUNsaWNrID1cbiAgICAgICAgZXZlbnQ/LmNsaWVudFggPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5sZWZ0IHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRYID49IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8ucmlnaHQgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPj0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py50b3AgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5ib3R0b207XG4gICAgICBpZiAoaXNPdXRzaWRlQ2xpY2spIHtcbiAgICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdXR0b25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAgb25DbGljazogKCkgPT4gUHJvbWlzZTx1bmtub3duPjtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX193cmFwcGVyXCIgW25nU3R5bGVdPVwiY29tcG9zZXJXcmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9uc1wiICpuZ0lmPVwic2hvd0xpc3RGb3JNZW50aW9uc1wiXG4gICAgI3VzZXJNZW1iZXJXcmFwcGVyUmVmPlxuICAgIDxjb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlciBbdXNlck1lbWJlckxpc3RUeXBlXT1cInVzZXJNZW1iZXJMaXN0VHlwZVwiXG4gICAgICBbb25JdGVtQ2xpY2tdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLm9uSXRlbUNsaWNrIHx8IGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXJcIlxuICAgICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgICBbc2VhcmNoS2V5d29yZF09XCJtZW50aW9uc1NlYXJjaFRlcm1cIlxuICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICBbbGlzdEl0ZW1WaWV3XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICBbdXNlclByZXNlbmNlUGxhY2VtZW50XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2VyUHJlc2VuY2VQbGFjZW1lbnRcIlxuICAgICAgW2hpZGVTZXBlcmF0b3JdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgW29uRW1wdHldPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiXG4gICAgICBbbG9hZGluZ0ljb25VcmxdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFtncm91cF09XCJncm91cFwiIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgIFtkaXNhYmxlTG9hZGluZ1N0YXRlXT1cInRydWVcIlxuICAgICAgW29uRXJyb3JdPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiPjwvY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwic2hvd01lbnRpb25zQ291bnRXYXJuaW5nXCJcbiAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9ucy1saW1pdC1leGNlZWRlZFwiPlxuICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvblxuICAgICAgICBbdGV4dF09XCJtZW50aW9uc1dhcm5pbmdUZXh0IHx8IGxvY2FsaXplKCdNRU5USU9OU19MSU1JVF9XQVJOSU5HX01FU1NBR0UnKVwiXG4gICAgICAgIFtpY29uVVJMXT1cIkluZm9TaW1wbGVJY29uXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldE1lbnRpb25JbmZvSWNvblN0eWxlKClcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCJcbiAgICAqbmdJZj1cImhlYWRlclZpZXc7IGVsc2UgbWVzc2FnZVByZXZpZXdcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbWVzc2FnZVByZXZpZXc+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCIgKm5nSWY9XCJzaG93UHJldmlld1wiPlxuICAgICAgPGNvbWV0Y2hhdC1wcmV2aWV3IFtwcmV2aWV3U3R5bGVdPVwicHJldmlld1N0eWxlXCJcbiAgICAgICAgW3ByZXZpZXdTdWJ0aXRsZV09XCJlZGl0UHJldmlld1RleHRcIlxuICAgICAgICAoY2MtcHJldmlldy1jbG9zZS1jbGlja2VkKT1cImNsb3NlUHJldmlldygpXCI+IDwvY29tZXRjaGF0LXByZXZpZXc+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19pbnB1dFwiPlxuXG4gICAgPGNvbWV0Y2hhdC10ZXh0LWlucHV0IChjYy10ZXh0LWlucHV0LWVudGVyZWQpPVwic2VuZE1lc3NhZ2VPbkVudGVyKCRldmVudClcIlxuICAgICAgI2lucHV0UmVmIFt0ZXh0XT1cInRleHRcIlxuICAgICAgKGNjLXRleHQtaW5wdXQtY2hhbmdlZCk9XCJtZXNzYWdlSW5wdXRDaGFuZ2VkKCRldmVudClcIlxuICAgICAgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgW3BsYWNlaG9sZGVyVGV4dF09XCJwbGFjZWhvbGRlclRleHRcIlxuICAgICAgW2F1eGlsaWFyeUJ1dHRvbkFsaWdubWVudF09XCJhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJ0ZXh0Rm9ybWF0dGVyc1wiPlxuXG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInNlY29uZGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlY29uZGFyeUJ1dHRvblZpZXc7ZWxzZSBzZWNvbmRhcnlCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlY29uZGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2Vjb25kYXJ5QnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdHRhY2hidXR0b25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlclxuICAgICAgICAgICAgICAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgICBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUREX1RPX0NIQVQnKVwiIFthY3Rpb25zXT1cImNvbXBvc2VyQWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWN0aW9uU2hlZXRTdHlsZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICBbaGlkZUxheW91dE1vZGVdPVwiaGlkZUxheW91dE1vZGVcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtYWN0aW9uLXNoZWV0PlxuICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAjYWN0aW9uU2hlZXRSZWYgc2xvdD1cImNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlbkFjdGlvblNoZWV0KCRldmVudClcIlxuICAgICAgICAgICAgICAgIFtpY29uVVJMXT1cIiFzaG93QWN0aW9uU2hlZXRJdGVtIHx8IChzaG93RW1vamlLZXlib2FyZCAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbSkgID8gYXR0YWNobWVudEljb25VUkwgIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYXR0YWNobWVudEJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fYXV4aWxpYXJ5XCIgZGF0YS1zbG90PVwiYXV4aWxhcnlWaWV3XCI+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19jdXN0b20tYXV4aWxpYXJ5LXZpZXdcIlxuICAgICAgICAgICpuZ0lmPVwiYXV4aWxhcnlCdXR0b25WaWV3XCI+XG4gICAgICAgICAgPG5nLWNvbnRhaW5lclxuICAgICAgICAgICAgKm5nVGVtcGxhdGVPdXRsZXQ9XCJhdXhpbGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDwhLS0gQUkgQ2FyZHMgLS0+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zdGlja2Vya2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiIWF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlciAoY2MtcG9wb3Zlci1jbGljayk9XCJvcGVuU3RpY2tlcktleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgW3BvcG92ZXJTdHlsZV09XCJhaVBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cInNtYXJ0UmVwbHlTdGF0ZVwiXG4gICAgICAgICAgICAgICpuZ0lmPVwic2hvd1NtYXJ0UmVwbHkgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW1BSSAmJiAhc2hvd0FpQm90TGlzdFwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCIgW2xvYWRpbmdTdGF0ZVRleHRdPVwibG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICAgICAgICA8ZGl2IHNsb3Q9XCJsb2FkZWRWaWV3XCIgY2xhc3M9XCJzbWFydC1yZXBsaWVzLXdyYXBwZXJcIj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2JhY2stYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCJyZXBsaWVzQXJyYXkgJiYgcmVwbGllc0FycmF5Lmxlbmd0aCA+IDAgXCJcbiAgICAgICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQWlCYWNrQnV0dG9uQ2xpY2soKVwiXG4gICAgICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3NtYXJ0cmVwbHktaGVhZGVyLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e3sgbG9jYWxpemUoXCJTVUdHRVNUX0FfUkVQTFlcIikgfX08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgIDxzbWFydC1yZXBsaWVzXG4gICAgICAgICAgICAgICAgICAgICpuZ0lmPVwicmVwbGllc0FycmF5ICYmIHJlcGxpZXNBcnJheS5sZW5ndGggPiAwIFwiXG4gICAgICAgICAgICAgICAgICAgIFtzbWFydFJlcGx5U3R5bGVdPVwic21hcnRSZXBseVN0eWxlXCIgW3JlcGxpZXNdPVwicmVwbGllc0FycmF5XCJcbiAgICAgICAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCInJ1wiIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRSZXBseSgkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cblxuXG5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzaG93QWlCb3RMaXN0ICAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbUFJXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2FpYm90bGlzdFwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiIGFpQm90TGlzdCAmJiBhaUJvdExpc3QubGVuZ3RoPiAxIFwiXG4gICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib25BaUJhY2tCdXR0b25DbGljaygpXCJcbiAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiPlxuICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8cD57eyBsb2NhbGl6ZShcIkNPTUVUQ0hBVF9BU0tfQUlfQk9UXCIpIH19PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXRcbiAgICAgICAgICAgICAgICAqbmdJZj1cInNob3dBaUJvdExpc3QgICYmICFzaG93QWN0aW9uU2hlZXRJdGVtQUlcIiBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYWlBY3Rpb25CdXR0b25zXCIgW3RpdGxlXT1cImxvY2FsaXplKCdBSScpXCJcbiAgICAgICAgICAgICAgICBbYWN0aW9uU2hlZXRTdHlsZV09XCJhaUFjdGlvblNoZWV0U3R5bGVcIiBbaGlkZUxheW91dE1vZGVdPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFjdGlvbi1zaGVldCAqbmdJZj1cInNob3dBY3Rpb25TaGVldEl0ZW1BSVwiIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYnV0dG9uc1wiIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUknKVwiXG4gICAgICAgICAgICAgIFthY3Rpb25TaGVldFN0eWxlXT1cImFpQWN0aW9uU2hlZXRTdHlsZVwiIFtoaWRlTGF5b3V0TW9kZV09XCJ0cnVlXCJcbiAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1hY3Rpb24tc2hlZXQ+XG5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiaXNBaUVuYWJsZWRcIiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdBSScpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgI2FpQnV0dG9uUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuQWlGZWF0dXJlcygkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiIXNob3dBaUZlYXR1cmVzID8gYWlJY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInN0aWNrZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc3RpY2tlcmtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cImVuYWJsZVN0aWNrZXJLZXlib2FyZCAmJiAhYXV4aWxhcnlCdXR0b25WaWV3XCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wb3BvdmVyIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJoYW5kbGVPdXRzaWRlQ2xpY2soKVwiXG4gICAgICAgICAgICBbcG9wb3ZlclN0eWxlXT1cInN0aWNrZXJQb3BvdmVyXCIgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuICAgICAgICAgICAgPHN0aWNrZXJzLWtleWJvYXJkIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW3N0aWNrZXJTdHlsZV09XCJzdGlja2VyS2V5Ym9hcmRTdHlsZVwiXG4gICAgICAgICAgICAgIChjYy1zdGlja2VyLWNsaWNrZWQpPVwic2VuZFN0aWNrZXIoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9zdGlja2Vycy1rZXlib2FyZD5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ1NUSUNLRVInKVwiIHNsb3Q9XCJjaGlsZHJlblwiXG4gICAgICAgICAgICAgICNzdGlja2VyQnV0dG9uUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuU3RpY2tlcktleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXNob3dTdGlja2VyS2V5Ym9hcmQgPyBzdGlja2VyQnV0dG9uSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJzdGlja2VyQnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19lbW9qaWtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cIiFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIiBbcG9wb3ZlclN0eWxlXT1cImVtb2ppUG9wb3ZlclwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZCBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYXBwZW5kRW1vamkoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAjZW1vamlCdXR0b25SZWYgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnRU1PSkknKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuRW1vamlLZXlib2FyZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICFzaG93RW1vamlLZXlib2FyZCAgfHwgKCFzaG93RW1vamlLZXlib2FyZCAmJiBzaG93QWN0aW9uU2hlZXRJdGVtKSA/IGVtb2ppSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJlbW9qaUJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbWVkaWFyZWNvcmRlclwiXG4gICAgICAgICAgKm5nSWY9XCIhaGlkZVZvaWNlUmVjb3JkaW5nXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wb3BvdmVyIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJoYW5kbGVPdXRzaWRlQ2xpY2soKVwiXG4gICAgICAgICAgICBbcG9wb3ZlclN0eWxlXT1cIm1lZGlhUmVjb3JkZWRQb3BvdmVyXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIj5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZWRpYS1yZWNvcmRlciAqbmdJZj1cInRvZ2dsZU1lZGlhUmVjb3JkZWRcIlxuICAgICAgICAgICAgICBbYXV0b1JlY29yZGluZ109XCJ0cnVlXCIgc3RhcnRJY29uVGV4dD1cIlwiIHN0b3BJY29uVGV4dD1cIlwiXG4gICAgICAgICAgICAgIHN1Ym1pdEJ1dHRvbkljb25UZXh0PVwiXCJcbiAgICAgICAgICAgICAgW3N1Ym1pdEJ1dHRvbkljb25VUkxdPVwidm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMXCJcbiAgICAgICAgICAgICAgW3N0YXJ0SWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0YXJ0SWNvblVSTFwiXG4gICAgICAgICAgICAgIFtzdG9wSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0b3BJY29uVVJMXCJcbiAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTFwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1zdWJtaXR0ZWQpPVwic2VuZFJlY29yZGVkTWVkaWEoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1jbG9zZWQpPVwiY2xvc2VNZWRpYVJlY29yZGVyKCRldmVudClcIlxuICAgICAgICAgICAgICBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFttZWRpYVBsYXllclN0eWxlXT1cIm1lZGlhUmVjb3JkZXJTdHlsZVwiPjwvY29tZXRjaGF0LW1lZGlhLXJlY29yZGVyPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdWT0lDRV9SRUNPUkRJTkcnKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiICNtZWRpYVJlY29yZGVkUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuTWVkaWFSZWNvcmRlZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICF0b2dnbGVNZWRpYVJlY29yZGVkID8gdm9pY2VSZWNvcmRpbmdJY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cIm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInByaW1hcnlWaWV3XCI+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJzZW5kQnV0dG9uVmlldztlbHNlIHNlbmRCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlbmRCdXR0b25WaWV3O2NvbnRleHQ6eyBpdGVtOiB1c2VyID8/IGdyb3VwLCBjb21wb3NlcklkOmNvbXBvc2VySWQgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNzZW5kQnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zZW5kYnV0dG9uXCJcbiAgICAgICAgICAgICpuZ0lmPVwic2hvd1NlbmRCdXR0b24gfHwgaGlkZUxpdmVSZWFjdGlvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwic2VuZEJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwic2VuZEJ1dHRvblN0eWxlXCJcbiAgICAgICAgICAgICAgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU0VORF9NRVNTQUdFJylcIlxuICAgICAgICAgICAgICBbZGlzYWJsZWRdPVwiIXNob3dTZW5kQnV0dG9uXCJcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImN1c3RvbVNlbmRNZXRob2QobWVzc2FnZVRleHQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2xpdmVyZWFjdGlvblwiXG4gICAgICAgICAgICAqbmdJZj1cIiFoaWRlTGl2ZVJlYWN0aW9uICYmICFzaG93U2VuZEJ1dHRvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiTGl2ZVJlYWN0aW9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ0xJVkVfUkVBQ1RJT04nKVwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJsaXZlUmVhY3Rpb25TdHlsZVwiXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzZW5kUmVhY3Rpb24oKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvY29tZXRjaGF0LXRleHQtaW5wdXQ+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxpbnB1dCBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX21lZGlhaW5wdXRcIiAjaW5wdXRFbGVtZW50XG4gIChjaGFuZ2UpPVwiaW5wdXRDaGFuZ2VIYW5kbGVyKCRldmVudClcIiAvPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dDcmVhdGVQb2xsc1wiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNyZWF0ZS1wb2xsIFt1c2VyXT1cInVzZXJcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlQ3JlYXRlUG9sbHMoKVwiXG4gICAgW2NyZWF0ZVBvbGxTdHlsZV09XCJjcmVhdGVQb2xsU3R5bGVcIj48L2NyZWF0ZS1wb2xsPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4iXX0=