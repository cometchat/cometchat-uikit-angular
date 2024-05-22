import { Component, Input, ViewChild, ChangeDetectionStrategy, Output, EventEmitter, } from "@angular/core";
import { CometChat } from "@cometchat/chat-sdk-javascript";
import { MediaRecorderStyle, } from "@cometchat/uikit-elements";
import { localize, AuxiliaryButtonAlignment, Placement, CometChatMessageEvents, CometChatUIKitConstants, MessageStatus, fontHelper, CometChatUIEvents, States, UserMemberListType, } from "@cometchat/uikit-resources";
import { MessageComposerStyle, CometChatSoundManager, StickersConstants, CometChatUIKitUtility, CometChatMentionsFormatter, UserMentionStyle, } from "@cometchat/uikit-shared";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import "@cometchat/uikit-shared";
import "@cometchat/uikit-elements";
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
        this.customSoundForMessage = "";
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
        this.childEvent = new EventEmitter();
        this.textFormatters = [];
        this.mentionsFormatterInstanceId = "composer_" + Date.now();
        this.composerActions = [];
        this.states = States;
        this.mentionsSearchTerm = "";
        this.showListForMentions = false;
        this.mentionsSearchCount = 1;
        this.lastEmptySearchTerm = "";
        this.smartReplyState = States.loading;
        this.showMentionsCountWarning = false;
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
        this.acceptHandlers = {
            "image/*": this.onImageChange.bind(this),
            "video/*": this.onVideoChange.bind(this),
            "audio/*": this.onAudioChange.bind(this),
            "file/*": this.onFileChange.bind(this),
        };
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
        this.sendButtonIconURL = "assets/Send.svg";
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
            this.inputRef?.nativeElement?.emptyInputField();
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
            this.showSendButton = true;
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
        this.handleActions = (event) => {
            let action = event?.detail?.action;
            this.showAiFeatures = false;
            if (action.onClick) {
                action.onClick();
            }
        };
        this.inputChangeHandler = (event) => {
            const handler = this.acceptHandlers[this.inputElementRef.nativeElement.accept] ||
                this.onFileChange.bind(this);
            handler(event);
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
                }, this.loggedInUser, this.user, this.group, this.parentMessageId, this.onError, this.customSoundForMessage, this.disableSoundForMessages);
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
                    element.onClick = this.openAudioPicker;
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    element.onClick = this.openvideoPicker;
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    element.onClick = this.openFilePicker;
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    element.onClick = this.openImagePicker;
                    break;
                case "extension_poll":
                    element.onClick = this.openCreatePolls;
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
                    this.openEditPreview();
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
        this.text = "";
        this.inputRef?.nativeElement?.emptyInputField();
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
    ngOnChanges(changes) {
        if (changes["user"] || changes["group"]) {
            this.userOrGroupChanged(changes);
        }
    }
    userOrGroupChanged(changes) {
        if (!this.disableMentions) {
            this.showListForMentions = false;
            if (changes["group"] && this.group) {
                if (this.userMemberWrapperConfiguration.userMemberListType == undefined) {
                    this.userMemberListType = UserMemberListType.groupmembers;
                }
                this.groupMembersRequestBuilder = this.userMemberWrapperConfiguration
                    .groupMemberRequestBuilder
                    ? this.userMemberWrapperConfiguration.groupMemberRequestBuilder
                    : new CometChat.GroupMembersRequestBuilder(this.group.getGuid()).setLimit(15);
            }
            if (changes["user"] && this.user) {
                if (this.userMemberWrapperConfiguration.userMemberListType == undefined) {
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
        this.messageText = "";
        this.inputRef?.nativeElement?.emptyInputField();
        this.showSendButton = false;
        this.text = "";
        this.composerId = this.getComposerId();
        if (this.attachmentOptions) {
            this.composerActions = this.attachmentOptions(this.user || this.group, this.composerId);
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
            this.showMentionsCountWarning = false;
            // play audio after action generation
            if (!this.disableSoundForMessages) {
                this.playAudio();
            }
            //clearing Message Input Box
            this.messageText = "";
            this.inputRef?.nativeElement?.emptyInputField();
            this.text = "";
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
                this.onSendButtonClick(textMessage);
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
            this.inputRef?.nativeElement?.emptyInputField();
            this.showMentionsCountWarning = false;
            this.messageToBeEdited = null;
            for (let i = 0; i < this.textFormatterList.length; i++) {
                textMessage = this.textFormatterList[i].formatMessageForSending(textMessage);
            }
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
        catch (error) {
            if (this.onError) {
                this.onError(CometChatException(error));
            }
        }
    }
    getReceiverDetails() {
        let receiverId;
        let receiverType;
        if (this.user && this.user.getUid()) {
            receiverId = this.user.getUid();
            receiverType = CometChatUIKitConstants.MessageReceiverType.user;
        }
        else if (this.group && this.group.getGuid()) {
            receiverId = this.group.getGuid();
            receiverType = CometChatUIKitConstants.MessageReceiverType.group;
        }
        return { receiverId: receiverId, receiverType: receiverType };
    }
    playAudio() {
        if (this.customSoundForMessage) {
            CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage, this.customSoundForMessage);
        }
        else {
            CometChatSoundManager.play(CometChatSoundManager.Sound.outgoingMessage);
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
                let { receiverId, receiverType } = this.getReceiverDetails();
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
                let { receiverId, receiverType } = this.getReceiverDetails();
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
                this.onSendButtonClick(mediaMessage);
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
            borderRadius: "inherit",
            background: this.themeService.theme.palette.getBackground(),
            border: "none",
            width: "100%",
            height: "100%",
            titleFont: this.actionSheetStyle.titleFont ||
                fontHelper(this.themeService.theme.typography.title2),
            titleColor: this.actionSheetStyle.titleColor ||
                this.themeService.theme.palette.getAccent(),
            ActionSheetSeparatorTint: this.actionSheetStyle.ActionSheetSeparatorTint ||
                this.themeService.theme.palette.getAccent400(),
        };
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
            buttonIconTint: this.themeService.theme.palette.getAccent600(),
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
    }
    closePreview() {
        this.showSendButton = false;
        this.showListForMentions = false;
        this.showMentionsCountWarning = false;
        this.showPreview = false;
        this.editPreviewText = "";
        this.messageToBeEdited = null;
        this.text = "";
        this.messageText = "";
        this.inputRef?.nativeElement?.emptyInputField();
        this.disableSendButton();
    }
}
CometChatMessageComposerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageComposerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageComposerComponent, selector: "cometchat-message-composer", inputs: { user: "user", group: "group", disableSoundForMessages: "disableSoundForMessages", customSoundForMessage: "customSoundForMessage", disableTypingEvents: "disableTypingEvents", text: "text", placeholderText: "placeholderText", headerView: "headerView", onTextChange: "onTextChange", attachmentIconURL: "attachmentIconURL", attachmentOptions: "attachmentOptions", secondaryButtonView: "secondaryButtonView", auxilaryButtonView: "auxilaryButtonView", auxiliaryButtonsAlignment: "auxiliaryButtonsAlignment", sendButtonView: "sendButtonView", parentMessageId: "parentMessageId", hideLiveReaction: "hideLiveReaction", LiveReactionIconURL: "LiveReactionIconURL", backButtonIconURL: "backButtonIconURL", mentionsWarningText: "mentionsWarningText", mentionsWarningStyle: "mentionsWarningStyle", messageComposerStyle: "messageComposerStyle", onSendButtonClick: "onSendButtonClick", onError: "onError", backdropStyle: "backdropStyle", actionSheetStyle: "actionSheetStyle", aiActionSheetStyle: "aiActionSheetStyle", hideVoiceRecording: "hideVoiceRecording", mediaRecorderStyle: "mediaRecorderStyle", aiOptionsStyle: "aiOptionsStyle", aiIconURL: "aiIconURL", voiceRecordingIconURL: "voiceRecordingIconURL", voiceRecordingCloseIconURL: "voiceRecordingCloseIconURL", voiceRecordingStartIconURL: "voiceRecordingStartIconURL", voiceRecordingStopIconURL: "voiceRecordingStopIconURL", voiceRecordingSubmitIconURL: "voiceRecordingSubmitIconURL", userMemberWrapperConfiguration: "userMemberWrapperConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, outputs: { childEvent: "childEvent" }, viewQueries: [{ propertyName: "inputElementRef", first: true, predicate: ["inputElement"], descendants: true }, { propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }, { propertyName: "emojiButtonRef", first: true, predicate: ["emojiButtonRef"], descendants: true }, { propertyName: "actionSheetRef", first: true, predicate: ["actionSheetRef"], descendants: true }, { propertyName: "stickerButtonRef", first: true, predicate: ["stickerButtonRef"], descendants: true }, { propertyName: "mediaRecordedRef", first: true, predicate: ["mediaRecordedRef"], descendants: true }, { propertyName: "aiButtonRef", first: true, predicate: ["aiButtonRef"], descendants: true }, { propertyName: "userMemberWrapperRef", first: true, predicate: ["userMemberWrapperRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" #userMemberWrapperRef>\n    <cometchat-user-member-wrapper *ngIf=\"showListForMentions\"\n      [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"], components: [{ type: i2.CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: ["userMemberListType", "onItemClick", "listItemView", "avatarStyle", "statusIndicatorStyle", "searchKeyword", "group", "subtitleView", "usersRequestBuilder", "disableUsersPresence", "userPresencePlacement", "hideSeperator", "loadingStateView", "onEmpty", "onError", "groupMemberRequestBuilder", "loadingIconUrl", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-composer", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" #userMemberWrapperRef>\n    <cometchat-user-member-wrapper *ngIf=\"showListForMentions\"\n      [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"] }]
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
            }], childEvent: [{
                type: Output
            }], userMemberWrapperConfiguration: [{
                type: Input
            }], disableMentions: [{
                type: Input
            }], textFormatters: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUNMLFNBQVMsRUFFVCxLQUFLLEVBQ0wsU0FBUyxFQUVULHVCQUF1QixFQUt2QixNQUFNLEVBQ04sWUFBWSxHQUNiLE1BQU0sZUFBZSxDQUFDO0FBQ3ZCLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUMzRCxPQUFPLEVBS0wsa0JBQWtCLEdBRW5CLE1BQU0sMkJBQTJCLENBQUM7QUFFbkMsT0FBTyxFQUNMLFFBQVEsRUFFUix3QkFBd0IsRUFDeEIsU0FBUyxFQUNULHNCQUFzQixFQUN0Qix1QkFBdUIsRUFFdkIsYUFBYSxFQUNiLFVBQVUsRUFDVixpQkFBaUIsRUFFakIsTUFBTSxFQUVOLGtCQUFrQixHQUVuQixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFDTCxvQkFBb0IsRUFDcEIscUJBQXFCLEVBQ3JCLGlCQUFpQixFQUlqQixxQkFBcUIsRUFJckIsMEJBQTBCLEVBRTFCLGdCQUFnQixHQUVqQixNQUFNLHlCQUF5QixDQUFDO0FBRWpDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlDQUF5QyxDQUFDO0FBQzNFLE9BQU8seUJBQXlC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RyxpQkFBaUI7c0JBQXpCLEtBQUs7Z0JBTUcsbUJBQW1CO3NCQUEzQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyx5QkFBeUI7c0JBQWpDLEtBQUs7Z0JBRUcsY0FBYztzQkFBdEIsS0FBSztnQkFDRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBQ0csaUJBQWlCO3NCQUF6QixLQUFLO2dCQUNHLG1CQUFtQjtzQkFBM0IsS0FBSztnQkFDRyxvQkFBb0I7c0JBQTVCLEtBQUs7Z0JBR0csb0JBQW9CO3NCQUE1QixLQUFLO2dCQU1HLGlCQUFpQjtzQkFBekIsS0FBSztnQkFHRyxPQUFPO3NCQUFmLEtBQUs7Z0JBS0csYUFBYTtzQkFBckIsS0FBSztnQkFPRyxnQkFBZ0I7c0JBQXhCLEtBQUs7Z0JBYUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQWFHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBQ0csY0FBYztzQkFBdEIsS0FBSztnQkFDRyxTQUFTO3NCQUFqQixLQUFLO2dCQUNHLHFCQUFxQjtzQkFBN0IsS0FBSztnQkFDRywwQkFBMEI7c0JBQWxDLEtBQUs7Z0JBQ0csMEJBQTBCO3NCQUFsQyxLQUFLO2dCQUNHLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRywyQkFBMkI7c0JBQW5DLEtBQUs7Z0JBQ0ksVUFBVTtzQkFBbkIsTUFBTTtnQkFDRSw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBRUcsZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQ29tcG9uZW50LFxuICBPbkluaXQsXG4gIElucHV0LFxuICBWaWV3Q2hpbGQsXG4gIEVsZW1lbnRSZWYsXG4gIENoYW5nZURldGVjdGlvblN0cmF0ZWd5LFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgT25DaGFuZ2VzLFxuICBTaW1wbGVDaGFuZ2VzLFxuICBUZW1wbGF0ZVJlZixcbiAgT3V0cHV0LFxuICBFdmVudEVtaXR0ZXIsXG59IGZyb20gXCJAYW5ndWxhci9jb3JlXCI7XG5pbXBvcnQgeyBDb21ldENoYXQgfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQge1xuICBFbW9qaUtleWJvYXJkU3R5bGUsXG4gIFBvcG92ZXJTdHlsZSxcbiAgQWN0aW9uU2hlZXRTdHlsZSxcbiAgUHJldmlld1N0eWxlLFxuICBNZWRpYVJlY29yZGVyU3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuaW1wb3J0IHtcbiAgbG9jYWxpemUsXG4gIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbixcbiAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LFxuICBQbGFjZW1lbnQsXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBJTWVzc2FnZXMsXG4gIE1lc3NhZ2VTdGF0dXMsXG4gIGZvbnRIZWxwZXIsXG4gIENvbWV0Q2hhdFVJRXZlbnRzLFxuICBDb21ldENoYXRBY3Rpb25zVmlldyxcbiAgU3RhdGVzLFxuICBJTWVudGlvbnNDb3VudFdhcm5pbmcsXG4gIFVzZXJNZW1iZXJMaXN0VHlwZSxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1yZXNvdXJjZXNcIjtcbmltcG9ydCB7XG4gIE1lc3NhZ2VDb21wb3NlclN0eWxlLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIFN0aWNrZXJzQ29uc3RhbnRzLFxuICBTdGlja2Vyc0NvbmZpZ3VyYXRpb24sXG4gIFN0aWNrZXJzU3R5bGUsXG4gIENyZWF0ZVBvbGxTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBDb21wb3NlcklkLFxuICBTbWFydFJlcGxpZXNTdHlsZSxcbiAgQUlPcHRpb25zU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRUZXh0Rm9ybWF0dGVyLFxuICBVc2VyTWVudGlvblN0eWxlLFxuICBVc2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24sXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4uLy4uL0NvbWV0Q2hhdFRoZW1lLnNlcnZpY2VcIjtcbmltcG9ydCB7IENoYXRDb25maWd1cmF0b3IgfSBmcm9tIFwiLi4vLi4vU2hhcmVkL0ZyYW1ld29yay9DaGF0Q29uZmlndXJhdG9yXCI7XG5pbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHsgQ29tZXRDaGF0RXhjZXB0aW9uIH0gZnJvbSBcIi4uLy4uL1NoYXJlZC9VdGlscy9Db21lQ2hhdEV4Y2VwdGlvblwiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXIgaXMgdXNlZCB0byBzZW5kIG1lc3NhZ2UgdG8gdXNlciBvciBncm91cC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtbWVzc2FnZS1jb21wb3NlclwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtbWVzc2FnZS1jb21wb3Nlci5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQFZpZXdDaGlsZChcImlucHV0RWxlbWVudFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW5wdXRFbGVtZW50UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImlucHV0UmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbnB1dFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJlbW9qaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZW1vamlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYWN0aW9uU2hlZXRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGFjdGlvblNoZWV0UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInN0aWNrZXJCdXR0b25SZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHN0aWNrZXJCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwibWVkaWFSZWNvcmRlZFJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgbWVkaWFSZWNvcmRlZFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJhaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYWlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidXNlck1lbWJlcldyYXBwZXJSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHVzZXJNZW1iZXJXcmFwcGVyUmVmITogRWxlbWVudFJlZjtcblxuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2U6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmdFdmVudHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcGxhY2Vob2xkZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkVOVEVSX1lPVVJfTUVTU0FHRV9IRVJFXCIpO1xuXG4gIEBJbnB1dCgpIGhlYWRlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblRleHRDaGFuZ2UhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBASW5wdXQoKSBhdHRhY2htZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvUGx1cy5zdmdcIjtcbiAgQElucHV0KCkgYXR0YWNobWVudE9wdGlvbnM6XG4gICAgfCAoKFxuICAgICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAsXG4gICAgICBjb21wb3NlcklkOiBDb21wb3NlcklkXG4gICAgKSA9PiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSlcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgc2Vjb25kYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsaWFyeUJ1dHRvbnNBbGlnbm1lbnQ6IEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCA9XG4gICAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LnJpZ2h0O1xuICBASW5wdXQoKSBzZW5kQnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgQElucHV0KCkgaGlkZUxpdmVSZWFjdGlvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIExpdmVSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2hlYXJ0LXJlYWN0aW9uLnBuZ1wiO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nVGV4dD86IHN0cmluZztcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nU3R5bGU/OiBhbnk7XG4gIHB1YmxpYyBJbmZvU2ltcGxlSWNvbiA9IFwiYXNzZXRzL0luZm9TaW1wbGVJY29uLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIG1lc3NhZ2VDb21wb3NlclN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uU2VuZEJ1dHRvbkNsaWNrOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHZvaWQpXG4gICAgfCB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGFjdGlvblNoZWV0U3R5bGU6IEFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgbGF5b3V0TW9kZUljb25UaW50OiBcInJnYmEoMjAsIDIwLCAyMCwgMC4wNClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDI1NSwyNTUsMjU1KVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgdGl0bGVGb250OiBcIjUwMCAxNXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGl0bGVDb2xvcjogXCIjMTQxNDE0XCIsXG4gICAgbGlzdEl0ZW1CYWNrZ3JvdW5kOiBcIlwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGFpQWN0aW9uU2hlZXRTdHlsZTogYW55ID0ge1xuICAgIGxheW91dE1vZGVJY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuMDQpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImluaGVyaXRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYigyNTUsMjU1LDI1NSlcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHRpdGxlRm9udDogXCI1MDAgMTVweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiIzE0MTQxNFwiLFxuICAgIGxpc3RJdGVtQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGhpZGVWb2ljZVJlY29yZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBtZWRpYVJlY29yZGVyU3R5bGU6IE1lZGlhUmVjb3JkZXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBhaU9wdGlvbnNTdHlsZTogQUlPcHRpb25zU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYWlJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9haS1ib3Quc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvbWljLnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdGFydEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21pYy5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdG9wSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc3RvcC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TZW5kLnN2Z1wiO1xuICBAT3V0cHV0KCkgY2hpbGRFdmVudDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuICBASW5wdXQoKSB1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24hOiBVc2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb247XG4gIHB1YmxpYyB1c2VyTWVtYmVyTGlzdFR5cGUhOiBVc2VyTWVtYmVyTGlzdFR5cGU7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9ucz86IGJvb2xlYW47XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBbXTtcblxuICBwdWJsaWMgY29tcG9zZXJJZCE6IENvbXBvc2VySWQ7XG4gIG1lbnRpb25zRm9ybWF0dGVySW5zdGFuY2VJZDogc3RyaW5nID0gXCJjb21wb3Nlcl9cIiArIERhdGUubm93KCk7XG4gIHB1YmxpYyBjb21wb3NlckFjdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbltdID0gW107XG4gIHB1YmxpYyBzdGF0ZXM6IHR5cGVvZiBTdGF0ZXMgPSBTdGF0ZXM7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaFRlcm06IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBzaG93TGlzdEZvck1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaENvdW50OiBudW1iZXIgPSAxO1xuICBwdWJsaWMgbGFzdEVtcHR5U2VhcmNoVGVybT86IHN0cmluZyA9IFwiXCI7XG5cbiAgcHVibGljIHNtYXJ0UmVwbHlTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBzaG93TWVudGlvbnNDb3VudFdhcm5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBjY1Nob3dNZW50aW9uc0NvdW50V2FybmluZyE6IFN1YnNjcmlwdGlvbjtcblxuICBsb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfUkVQTElFU1wiKTtcbiAgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc2hvd0NyZWF0ZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dTdGlja2VyS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FjdGlvblNoZWV0SXRlbTogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93QWN0aW9uU2hlZXRJdGVtQUk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd1NtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FpRmVhdHVyZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVwbGllc0FycmF5OiBzdHJpbmdbXSA9IFtdO1xuICBhaUJvdExpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgY3VycmVudEFza0FJQm90OiBhbnkgPSBcIlwiO1xuICBpc0FpTW9yZVRoYW5PbmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBzaG93UHJldmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBhaUZlYXR1cmVzQ2xvc2VDYWxsYmFjazogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIGVkaXRQcmV2aWV3T2JqZWN0ITogQ29tZXRDaGF0LlRleHRNZXNzYWdlO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY0NvbXBvc2VNZXNzYWdlITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgdGV4dEZvcm1hdHRlckxpc3Q6IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgID8gWy4uLnRoaXMudGV4dEZvcm1hdHRlcnNdXG4gICAgOiBbXTtcbiAgcHVibGljIG1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gIG1lbnRpb25lZFVzZXJzOiBBcnJheTxDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cE1lbWJlcj4gPSBbXTtcblxuICBwdWJsaWMgYWNjZXB0SGFuZGxlcnM6IGFueSA9IHtcbiAgICBcImltYWdlLypcIjogdGhpcy5vbkltYWdlQ2hhbmdlLmJpbmQodGhpcyksXG4gICAgXCJ2aWRlby8qXCI6IHRoaXMub25WaWRlb0NoYW5nZS5iaW5kKHRoaXMpLFxuICAgIFwiYXVkaW8vKlwiOiB0aGlzLm9uQXVkaW9DaGFuZ2UuYmluZCh0aGlzKSxcbiAgICBcImZpbGUvKlwiOiB0aGlzLm9uRmlsZUNoYW5nZS5iaW5kKHRoaXMpLFxuICB9O1xuICBwdWJsaWMgZW5hYmxlU3RpY2tlcktleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyB0b2dnbGVNZWRpYVJlY29yZGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93QWlCb3RMaXN0OiBib29sZWFuID0gZmFsc2U7XG4gIG1lbnRpb25zVHlwZVNldEJ5VXNlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc3RpY2tlckNvbmZpZ3VyYXRpb246IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBjb25maWd1cmF0aW9uPzogU3RpY2tlcnNDb25maWd1cmF0aW9uO1xuICB9ID0ge307XG4gIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvcGx1cy1yb3RhdGVkLnN2Z1wiO1xuXG4gIGJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuICBhaUFjdGlvbkJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuXG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHNlbmRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBsaXZlUmVhY3Rpb25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZWRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgfTtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICBlbW9qaUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIHN0aWNrZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBtZWRpYVJlY29yZGVyQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcblxuICBlbW9qaUtleWJvYXJkU3R5bGU6IEVtb2ppS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dEZvbnQsXG4gICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dENvbG9yLFxuICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gIH07XG5cbiAgc3RpY2tlcktleWJvYXJkU3R5bGU6IFN0aWNrZXJzU3R5bGUgPSB7fTtcbiAgdGV4dElucHV0U3R5bGU6IGFueSA9IHt9O1xuICBwcmV2aWV3U3R5bGU6IFByZXZpZXdTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgY3JlYXRlUG9sbFN0eWxlOiBDcmVhdGVQb2xsU3R5bGUgPSB7fTtcbiAgc3RvcmVUeXBpbmdJbnRlcnZhbDogYW55O1xuICBlbW9qaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIzMTVweFwiLFxuICAgIGhlaWdodDogXCIzMjBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHN0aWNrZXJQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICBoZWlnaHQ6IFwiMzIwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBhaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyODBweFwiLFxuICAgIGhlaWdodDogXCIyODBweFwiLFxuXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgbWVkaWFSZWNvcmRlZFBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNTBweFwiLFxuICAgIGhlaWdodDogXCIxMDBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHBvcG92ZXJTdHlsZTogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI3NXB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4MHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgc2VuZEJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NlbmQuc3ZnXCI7XG4gIGVtb2ppQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3RpcG9wLnN2Z1wiO1xuICBzdGlja2VyQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3RpY2tlcnMuc3ZnXCI7XG5cbiAgYWN0aW9ucyE6IChDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24gfCBDb21ldENoYXRBY3Rpb25zVmlldylbXTtcbiAgbWVzc2FnZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIGF0dGFjaG1lbnRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBhdXhpbGFyeVBsYWNlbWVudDogUGxhY2VtZW50ID0gUGxhY2VtZW50LnRvcDtcbiAgbWVzc2FnZVNlbmRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZVRvQmVFZGl0ZWQhOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgfCBudWxsO1xuICBwdWJsaWMgZWRpdFByZXZpZXdUZXh0OiBzdHJpbmcgfCBudWxsID0gXCJcIjtcbiAgc2hvd1NlbmRCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0Vtb2ppS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNBaUVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBsaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIG1lbnRpb25TdHlsZUxvY2FsOiBVc2VyTWVudGlvblN0eWxlID0gbmV3IFVzZXJNZW50aW9uU3R5bGUoe30pO1xuXG4gIHNlbmRNZXNzYWdlT25FbnRlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICB0aGlzLnNlbmRUZXh0TWVzc2FnZShldmVudC5kZXRhaWwudmFsdWUpO1xuICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKClcbiAgfTtcbiAgZGlzYWJsZVNlbmRCdXR0b24oKSB7XG4gICAgdGhpcy5zZW5kQnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBtZXNzYWdlSW5wdXRDaGFuZ2VkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gZXZlbnQ/LmRldGFpbD8udmFsdWU/LnRyaW0oKTtcbiAgICB0aGlzLnNlbmRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0ZXh0XG4gICAgICAgID8gdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uc2VuZEljb25UaW50XG4gICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSB0cnVlO1xuICAgIGlmICh0aGlzLm9uVGV4dENoYW5nZSkge1xuICAgICAgdGhpcy5vblRleHRDaGFuZ2UodGV4dCk7XG4gICAgfVxuICAgIHRoaXMubWVzc2FnZVRleHQgPSB0ZXh0O1xuICAgIGlmICh0ZXh0KSB7XG4gICAgICB0aGlzLnN0YXJ0VHlwaW5nKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgfVxuICB9O1xuICBhcHBlbmRFbW9qaSA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKHRoaXMudGV4dCA9PT0gZXZlbnQ/LmRldGFpbC5pZCkge1xuICAgICAgdGhpcy50ZXh0ID0gXCJcIiArIFwiXCI7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIHRoaXMudGV4dCA9IGV2ZW50Py5kZXRhaWwuaWQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzZW5kUmVhY3Rpb24oKSB7XG4gICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgPyB0aGlzLnVzZXI/LmdldFVpZCgpIVxuICAgICAgOiB0aGlzLmdyb3VwPy5nZXRHdWlkKCkhO1xuICAgIGxldCByZWNlaXZlclR5cGUgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgbGV0IGRhdGEgPSB7XG4gICAgICB0eXBlOiBcImxpdmVfcmVhY3Rpb25cIixcbiAgICAgIHJlYWN0aW9uOiBcImhlYXJ0XCIsXG4gICAgfTtcbiAgICBsZXQgdHJhbnNpZW50TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVHJhbnNpZW50TWVzc2FnZShcbiAgICAgIHJlY2VpdmVySWQsXG4gICAgICByZWNlaXZlclR5cGUsXG4gICAgICBkYXRhXG4gICAgKTtcbiAgICBDb21ldENoYXQuc2VuZFRyYW5zaWVudE1lc3NhZ2UodHJhbnNpZW50TWVzc2FnZSk7XG4gICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY0xpdmVSZWFjdGlvbi5uZXh0KFwiaGVhcnRcIik7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgb3BlbkNyZWF0ZVBvbGxzID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0NyZWF0ZVBvbGxzID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgfVxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgY2xvc2VDcmVhdGVQb2xscyA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDcmVhdGVQb2xscyA9IGZhbHNlO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuICBzZW5kUmVjb3JkZWRNZWRpYSA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IGZpbGUgPSBldmVudD8uZGV0YWlsPy5maWxlO1xuICAgIGlmIChmaWxlKSB7XG4gICAgICB0aGlzLnNlbmRSZWNvcmRlZEF1ZGlvKGZpbGUpO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgY2xvc2VNZWRpYVJlY29yZGVyKGV2ZW50PzogYW55KSB7XG4gICAgaWYgKHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCkge1xuICAgICAgdGhpcy5tZWRpYVJlY29yZGVkUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9ICF0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9XG4gIGdldEZvcm1hdHRlZERhdGUoKTogc3RyaW5nIHtcbiAgICBjb25zdCBjdXJyZW50RGF0ZSA9IG5ldyBEYXRlKCk7XG5cbiAgICBjb25zdCB5ZWFyID0gY3VycmVudERhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xuICAgIGNvbnN0IG1vbnRoID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldE1vbnRoKCkgKyAxKTtcbiAgICBjb25zdCBkYXkgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0RGF0ZSgpKTtcbiAgICBjb25zdCBob3VycyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRIb3VycygpKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldE1pbnV0ZXMoKSk7XG4gICAgY29uc3Qgc2Vjb25kcyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRTZWNvbmRzKCkpO1xuXG4gICAgcmV0dXJuIGAke3llYXJ9JHttb250aH0ke2RheX0ke2hvdXJzfSR7bWludXRlc30ke3NlY29uZHN9YDtcbiAgfVxuXG4gIHBhZFplcm8obnVtOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBudW0udG9TdHJpbmcoKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIH1cblxuICBzZW5kUmVjb3JkZWRBdWRpbyA9IChmaWxlOiBCbG9iKSA9PiB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGZpbGU7XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICBgYXVkaW8tcmVjb3JkaW5nLSR7dGhpcy5nZXRGb3JtYXR0ZWREYXRlKCl9LndhdmAsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW9cbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcbiAgYWRkQXR0YWNobWVudENhbGxiYWNrKCk6IHZvaWQge1xuICAgIHRoaXMuY29tcG9zZXJBY3Rpb25zPy5mb3JFYWNoKChlbGVtZW50OiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24pID0+IHtcbiAgICAgIHN3aXRjaCAoZWxlbWVudC5pZCkge1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpbzpcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5BdWRpb1BpY2tlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW86XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVudmlkZW9QaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmZpbGU6XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuRmlsZVBpY2tlcjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2U6XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuSW1hZ2VQaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgXCJleHRlbnNpb25fcG9sbFwiOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkNyZWF0ZVBvbGxzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0ID0gQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQuc3Vic2NyaWJlKFxuICAgICAgKG9iamVjdDogSU1lc3NhZ2VzKSA9PiB7XG4gICAgICAgIGxldCBwYXJlbnRJZCA9IG9iamVjdD8ubWVzc2FnZT8uZ2V0UGFyZW50TWVzc2FnZUlkKClcbiAgICAgICAgaWYgKCh0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJiBwYXJlbnRJZCAmJiBwYXJlbnRJZCA9PSB0aGlzLnBhcmVudE1lc3NhZ2VJZCkgfHwgKCF0aGlzLnBhcmVudE1lc3NhZ2VJZCAmJiAhcGFyZW50SWQpKSB7XG4gICAgICAgICAgaWYgKG9iamVjdD8uc3RhdHVzID09IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcykge1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlVG9CZUVkaXRlZCA9IG9iamVjdC5tZXNzYWdlIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZTtcbiAgICAgICAgICAgIHRoaXMub3BlbkVkaXRQcmV2aWV3KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmNjQ29tcG9zZU1lc3NhZ2UgPSBDb21ldENoYXRVSUV2ZW50cy5jY0NvbXBvc2VNZXNzYWdlLnN1YnNjcmliZShcbiAgICAgICh0ZXh0OiBzdHJpbmcpID0+IHtcbiAgICAgICAgdGhpcy50ZXh0ID0gdGV4dDtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY1Nob3dNZW50aW9uc0NvdW50V2FybmluZyA9XG4gICAgICBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dNZW50aW9uc0NvdW50V2FybmluZy5zdWJzY3JpYmUoXG4gICAgICAgIChkYXRhOiBJTWVudGlvbnNDb3VudFdhcm5pbmcpID0+IHtcbiAgICAgICAgICBpZiAoZGF0YS5pZCA9PSB0aGlzLm1lbnRpb25zRm9ybWF0dGVySW5zdGFuY2VJZCkge1xuICAgICAgICAgICAgaWYgKGRhdGEuc2hvd1dhcm5pbmcpIHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgKTtcbiAgfVxuICBvcGVuRWRpdFByZXZpZXcoKSB7XG4gICAgbGV0IG1lc3NhZ2VUZXh0V2l0aE1lbnRpb25UYWdzID0gdGhpcy5jaGVja0Zvck1lbnRpb25zKFxuICAgICAgdGhpcy5tZXNzYWdlVG9CZUVkaXRlZCFcbiAgICApO1xuICAgIHRoaXMudGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgdGhpcy50ZXh0ID0gdGhpcy5tZXNzYWdlVG9CZUVkaXRlZCEuZ2V0VGV4dCgpO1xuICAgIHRoaXMuZWRpdFByZXZpZXdUZXh0ID0gbWVzc2FnZVRleHRXaXRoTWVudGlvblRhZ3M7XG4gICAgdGhpcy5zaG93UHJldmlldyA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgQCBmb3IgZXZlcnkgbWVudGlvbiB0aGUgbWVzc2FnZSBieSBtYXRjaGluZyB1aWRcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHJldHVybnMgIHt2b2lkfVxuICAgKi9cbiAgY2hlY2tGb3JNZW50aW9ucyhtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UpIHtcbiAgICBjb25zdCByZWdleCA9IC88QHVpZDooLio/KT4vZztcbiAgICBsZXQgbWVzc2FnZVRleHQgPSBtZXNzYWdlLmdldFRleHQoKTtcbiAgICBsZXQgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dDtcbiAgICBsZXQgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzR3JvdXBNZW1iZXJzID0gW107XG4gICAgd2hpbGUgKG1hdGNoICE9PSBudWxsKSB7XG4gICAgICBsZXQgdXNlcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWVudGlvbmVkVXNlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKG1hdGNoWzFdID09IG1lbnRpb25lZFVzZXJzW2ldLmdldFVpZCgpKSB7XG4gICAgICAgICAgdXNlciA9IG1lbnRpb25lZFVzZXJzW2ldO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodXNlcikge1xuICAgICAgICBtZXNzYWdlVGV4dFRtcCA9IG1lc3NhZ2VUZXh0VG1wLnJlcGxhY2UobWF0Y2hbMF0sIFwiQFwiICsgdXNlci5nZXROYW1lKCkpO1xuICAgICAgICBjb21ldENoYXRVc2Vyc0dyb3VwTWVtYmVycy5wdXNoKHVzZXIpO1xuICAgICAgfVxuICAgICAgbWF0Y2ggPSByZWdleC5leGVjKG1lc3NhZ2VUZXh0KTtcbiAgICB9XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKFxuICAgICAgY29tZXRDaGF0VXNlcnNHcm91cE1lbWJlcnNcbiAgICApO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0TG9nZ2VkSW5Vc2VyKHRoaXMubG9nZ2VkSW5Vc2VyISk7XG4gICAgcmV0dXJuIG1lc3NhZ2VUZXh0VG1wO1xuICB9XG5cbiAgdW5zdWJzY3JpYmVUb0V2ZW50cygpIHtcbiAgICB0aGlzLmNjTWVzc2FnZUVkaXQ/LnVuc3Vic2NyaWJlKCk7XG4gICAgdGhpcy5jY1Nob3dNZW50aW9uc0NvdW50V2FybmluZz8udW5zdWJzY3JpYmUoKTtcbiAgfVxuICBjbG9zZU1vZGFscygpIHtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWY/Lm5hdGl2ZUVsZW1lbnQ/LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCkge1xuICAgICAgdGhpcy5tZWRpYVJlY29yZGVkUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gZmFsc2U7XG4gICAgfVxuICB9XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgcmVmOiBDaGFuZ2VEZXRlY3RvclJlZixcbiAgICBwcml2YXRlIHRoZW1lU2VydmljZTogQ29tZXRDaGF0VGhlbWVTZXJ2aWNlXG4gICkgeyB9XG5cbiAgY2FsbENvbnZlcnNhdGlvblN1bW1hcnlNZXRob2QoKSB7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuXG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwubmV4dCh7XG4gICAgICBjaGlsZDogeyBzaG93Q29udmVyc2F0aW9uU3VtbWFyeVZpZXc6IHRydWUgfSxcbiAgICB9KTtcbiAgfVxuICBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdIHx8IGNoYW5nZXNbXCJncm91cFwiXSkge1xuICAgICAgdGhpcy51c2VyT3JHcm91cENoYW5nZWQoY2hhbmdlcyk7XG4gICAgfVxuICB9XG5cbiAgdXNlck9yR3JvdXBDaGFuZ2VkKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICAgIGlmIChjaGFuZ2VzW1wiZ3JvdXBcIl0gJiYgdGhpcy5ncm91cCkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24udXNlck1lbWJlckxpc3RUeXBlID09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJMaXN0VHlwZSA9IFVzZXJNZW1iZXJMaXN0VHlwZS5ncm91cG1lbWJlcnM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5ncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlciA9IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uXG4gICAgICAgICAgLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA/IHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmdyb3VwTWVtYmVyUmVxdWVzdEJ1aWxkZXJcbiAgICAgICAgICA6IG5ldyBDb21ldENoYXQuR3JvdXBNZW1iZXJzUmVxdWVzdEJ1aWxkZXIoXG4gICAgICAgICAgICB0aGlzLmdyb3VwLmdldEd1aWQoKVxuICAgICAgICAgICkuc2V0TGltaXQoMTUpO1xuICAgICAgfVxuICAgICAgaWYgKGNoYW5nZXNbXCJ1c2VyXCJdICYmIHRoaXMudXNlcikge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24udXNlck1lbWJlckxpc3RUeXBlID09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJMaXN0VHlwZSA9IFVzZXJNZW1iZXJMaXN0VHlwZS51c2VycztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvblxuICAgICAgICAgIC51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgxNSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB0aGlzLmNsb3NlTW9kYWxzKCk7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG5cbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICB0aGlzLmNvbXBvc2VySWQgPSB0aGlzLmdldENvbXBvc2VySWQoKTtcbiAgICBpZiAodGhpcy5hdHRhY2htZW50T3B0aW9ucykge1xuICAgICAgdGhpcy5jb21wb3NlckFjdGlvbnMgPSB0aGlzLmF0dGFjaG1lbnRPcHRpb25zKFxuICAgICAgICB0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5jb21wb3NlcklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbXBvc2VyQWN0aW9ucyA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdHRhY2htZW50T3B0aW9ucyhcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB0aGlzLnVzZXIsXG4gICAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgICB0aGlzLmNvbXBvc2VySWRcbiAgICAgICAgKTtcbiAgICAgIHRoaXMuYWRkQXR0YWNobWVudENhbGxiYWNrKCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5zZXRDb21wb3NlckNvbmZpZyh0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMuY29tcG9zZXJJZCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5jbGVhbnVwKCk7XG4gIH1cblxuICBjdXN0b21TZW5kTWV0aG9kKG1lc3NhZ2U6IFN0cmluZykge1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLnNlbmRUZXh0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtTdHJpbmc9XCJcIn0gdGV4dE1zZ1xuICAgKi9cbiAgc2VuZFRleHRNZXNzYWdlKHRleHRNc2c6IFN0cmluZyA9IFwiXCIpOiBib29sZWFuIHtcbiAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgIHRyeSB7XG4gICAgICAvLyBEb250IFNlbmQgQmxhbmsgdGV4dCBtZXNzYWdlcyAtLSBpLmUgLS0tIG1lc3NhZ2VzIHRoYXQgb25seSBjb250YWluIHNwYWNlc1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0Py50cmltKCk/Lmxlbmd0aCA9PSAwICYmXG4gICAgICAgIHRleHRNc2c/LnRyaW0oKT8ubGVuZ3RoID09IDBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyB3YWl0IGZvciB0aGUgcHJldmlvdXMgbWVzc2FnZSB0byBiZSBzZW50IGJlZm9yZSBzZW5kaW5nIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VTZW5kaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSB0cnVlO1xuICAgICAgLy8gSWYgaXRzIGFuIEVkaXQgYW5kIFNlbmQgTWVzc2FnZSBPcGVyYXRpb24gLCB1c2UgRWRpdCBNZXNzYWdlIEZ1bmN0aW9uXG4gICAgICBpZiAodGhpcy5tZXNzYWdlVG9CZUVkaXRlZCkge1xuICAgICAgICB0aGlzLmVkaXRNZXNzYWdlKCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lc3NhZ2VJbnB1dDtcbiAgICAgIGlmICh0ZXh0TXNnICE9PSBudWxsKSB7XG4gICAgICAgIG1lc3NhZ2VJbnB1dCA9IHRleHRNc2cudHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZUlucHV0ID0gdGhpcy5tZXNzYWdlVGV4dC50cmltKCk7XG4gICAgICB9XG4gICAgICBsZXQgdGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIG1lc3NhZ2VJbnB1dCxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIHRleHRNZXNzYWdlLnNldFBhcmVudE1lc3NhZ2VJZCh0aGlzLnBhcmVudE1lc3NhZ2VJZCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdXNlck9iamVjdHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdXNlck9iamVjdHMucHVzaChcbiAgICAgICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgICAgICAgICAgICAgPyAodGhpcy5tZW50aW9uZWRVc2Vyc1tpXSBhcyBDb21ldENoYXQuVXNlcilcbiAgICAgICAgICAgICAgOiB0aGlzLm1lbnRpb25lZFVzZXJzW2ldXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZW50aW9uZWRVc2Vycyh1c2VyT2JqZWN0cyk7XG4gICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgdGV4dE1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgdGV4dE1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuXG4gICAgICAvLyBwbGF5IGF1ZGlvIGFmdGVyIGFjdGlvbiBnZW5lcmF0aW9uXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgIH1cbiAgICAgIC8vY2xlYXJpbmcgTWVzc2FnZSBJbnB1dCBCb3hcbiAgICAgIHRoaXMubWVzc2FnZVRleHQgPSBcIlwiO1xuICAgICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgICB0aGlzLnRleHQgPSBcIlwiO1xuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHRleHRNZXNzYWdlID0gKHRoaXMudGV4dEZvcm1hdHRlckxpc3RbaV0uZm9ybWF0TWVzc2FnZUZvclNlbmRpbmcodGV4dE1lc3NhZ2UpIGFzIENvbWV0Q2hhdC5UZXh0TWVzc2FnZSk7XG4gICAgICB9XG4gICAgICAvLyBFbmQgVHlwaW5nIEluZGljYXRvciBGdW5jdGlvblxuICAgICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gICAgICBpZiAoIXRoaXMub25TZW5kQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgIG1lc3NhZ2U6IHRleHRNZXNzYWdlLFxuICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5pbnByb2dyZXNzLFxuICAgICAgICB9KTtcbiAgICAgICAgQ29tZXRDaGF0LnNlbmRNZXNzYWdlKHRleHRNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChtZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgfCBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIGxldCBtZXNzYWdlT2JqZWN0OiBDb21ldENoYXQuQmFzZU1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlT2JqZWN0LFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gQ2hhbmdlIHRoZSBzZW5kIGJ1dHRvbiB0byByZWFjdGlvbiBidXR0b25cbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnJlc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycygpO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0TWV0YWRhdGEoe1xuICAgICAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiB0ZXh0TWVzc2FnZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKHRleHRNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBvbkFpQmFja0J1dHRvbkNsaWNrKCkge1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gdHJ1ZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cblxuICBlZGl0TWVzc2FnZSgpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbWVzc2FnZVRvQmVFZGl0ZWQ6IGFueSA9IHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQ7XG4gICAgICBsZXQgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICBsZXQgbWVzc2FnZVRleHQgPSB0aGlzLm1lc3NhZ2VUZXh0LnRyaW0oKTtcbiAgICAgIGxldCBtZW50aW9uZWRVc2VycyA9IFtdO1xuICAgICAgaWYgKG1lc3NhZ2VUb0JlRWRpdGVkLmdldE1lbnRpb25lZFVzZXJzKCkpIHtcbiAgICAgICAgbWVudGlvbmVkVXNlcnMgPSBtZXNzYWdlVG9CZUVkaXRlZC5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgICAgICBtZXNzYWdlVGV4dCA9XG4gICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRPcmlnaW5hbFRleHQobWVzc2FnZVRleHQpO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICAgICAgbWVudGlvbmVkVXNlcnNcbiAgICAgICAgKTtcbiAgICAgICAgbWVzc2FnZVRleHQgPVxuICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0T3JpZ2luYWxUZXh0KG1lc3NhZ2VUZXh0KTtcbiAgICAgIH1cbiAgICAgIGxldCB0ZXh0TWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgbWVzc2FnZVRleHQsXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcbiAgICAgIGlmIChtZW50aW9uZWRVc2Vycy5sZW5ndGgpIHtcbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0TWVudGlvbmVkVXNlcnMobWVudGlvbmVkVXNlcnMpO1xuICAgICAgfVxuICAgICAgdGV4dE1lc3NhZ2Uuc2V0SWQobWVzc2FnZVRvQmVFZGl0ZWQuaWQpO1xuICAgICAgdGhpcy5jbG9zZVByZXZpZXcoKTtcbiAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgICB0aGlzLmlucHV0UmVmPy5uYXRpdmVFbGVtZW50Py5lbXB0eUlucHV0RmllbGQoKTtcbiAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gbnVsbDtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXh0TWVzc2FnZSA9ICh0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldLmZvcm1hdE1lc3NhZ2VGb3JTZW5kaW5nKHRleHRNZXNzYWdlKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgQ29tZXRDaGF0LmVkaXRNZXNzYWdlKHRleHRNZXNzYWdlKVxuICAgICAgICAudGhlbigobWVzc2FnZSkgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZUVkaXRlZC5uZXh0KHtcbiAgICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UsXG4gICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnJlc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycygpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycm9yKSA9PiB7XG4gICAgICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0UmVjZWl2ZXJEZXRhaWxzKCkge1xuICAgIGxldCByZWNlaXZlcklkITogc3RyaW5nO1xuICAgIGxldCByZWNlaXZlclR5cGUhOiBzdHJpbmc7XG4gICAgaWYgKHRoaXMudXNlciAmJiB0aGlzLnVzZXIuZ2V0VWlkKCkpIHtcbiAgICAgIHJlY2VpdmVySWQgPSB0aGlzLnVzZXIuZ2V0VWlkKCk7XG4gICAgICByZWNlaXZlclR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXI7XG4gICAgfSBlbHNlIGlmICh0aGlzLmdyb3VwICYmIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpKSB7XG4gICAgICByZWNlaXZlcklkID0gdGhpcy5ncm91cC5nZXRHdWlkKCk7XG4gICAgICByZWNlaXZlclR5cGUgPSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIH1cbiAgICByZXR1cm4geyByZWNlaXZlcklkOiByZWNlaXZlcklkLCByZWNlaXZlclR5cGU6IHJlY2VpdmVyVHlwZSB9O1xuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UpIHtcbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQub3V0Z29pbmdNZXNzYWdlLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nTWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHt9IHRpbWVyPW51bGxcbiAgICogQHBhcmFtICB7c3RyaW5nPVwiXCJ9IG1ldGFkYXRhXG4gICAqL1xuICBzdGFydFR5cGluZyh0aW1lciA9IG51bGwsIG1ldGFkYXRhOiBzdHJpbmcgPSBcIlwiKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmdFdmVudHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCB0eXBpbmdJbnRlcnZhbCA9IHRpbWVyIHx8IDUwMDA7XG4gICAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgICAgbGV0IHR5cGluZ01ldGFkYXRhID0gbWV0YWRhdGEgfHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdHlwaW5nTm90aWZpY2F0aW9uID0gbmV3IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IoXG4gICAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgICByZWNlaXZlclR5cGUsXG4gICAgICAgICAgdHlwaW5nTWV0YWRhdGFcbiAgICAgICAgKTtcbiAgICAgICAgQ29tZXRDaGF0LnN0YXJ0VHlwaW5nKHR5cGluZ05vdGlmaWNhdGlvbik7XG4gICAgICAgIHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIHRoaXMuZW5kVHlwaW5nKCk7XG4gICAgICAgIH0sIHR5cGluZ0ludGVydmFsKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGhhbmRsZUFjdGlvbnMgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBhY3Rpb246IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbiA9IGV2ZW50Py5kZXRhaWw/LmFjdGlvbjtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgaWYgKGFjdGlvbi5vbkNsaWNrKSB7XG4gICAgICBhY3Rpb24ub25DbGljaygpO1xuICAgIH1cbiAgfTtcbiAgZW5kVHlwaW5nKG1ldGFkYXRhID0gbnVsbCkge1xuICAgIGlmICghdGhpcy5kaXNhYmxlVHlwaW5nRXZlbnRzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBsZXQgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICAgIGxldCB0eXBpbmdNZXRhZGF0YSA9IG1ldGFkYXRhIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHR5cGluZ05vdGlmaWNhdGlvbiA9IG5ldyBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKFxuICAgICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgICAgIHR5cGluZ01ldGFkYXRhXG4gICAgICAgICk7XG4gICAgICAgIENvbWV0Q2hhdC5lbmRUeXBpbmcodHlwaW5nTm90aWZpY2F0aW9uKTtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuc3RvcmVUeXBpbmdJbnRlcnZhbCA9IG51bGw7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge0ZpbGUgfCBDb21ldENoYXQuTWVkaWFNZXNzYWdlfSBtZXNzYWdlSW5wdXRcbiAgICogQHBhcmFtICB7c3RyaW5nfSBtZXNzYWdlVHlwZVxuICAgKi9cbiAgc2VuZE1lZGlhTWVzc2FnZShtZXNzYWdlSW5wdXQ6IEZpbGUsIG1lc3NhZ2VUeXBlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKHRoaXMubWVzc2FnZVNlbmRpbmcpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IHRydWU7XG4gICAgICBjb25zdCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgIGxldCBtZWRpYU1lc3NhZ2U6IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZShcbiAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgbWVzc2FnZUlucHV0LFxuICAgICAgICBtZXNzYWdlVHlwZSxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuXG4gICAgICBpZiAodGhpcy5wYXJlbnRNZXNzYWdlSWQpIHtcbiAgICAgICAgbWVkaWFNZXNzYWdlLnNldFBhcmVudE1lc3NhZ2VJZCh0aGlzLnBhcmVudE1lc3NhZ2VJZCk7XG4gICAgICB9XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0VHlwZShtZXNzYWdlVHlwZSk7XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0TWV0YWRhdGEoe1xuICAgICAgICBbXCJmaWxlXCJdOiBtZXNzYWdlSW5wdXQsXG4gICAgICB9KTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG5cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gICAgICBpZiAoIXRoaXMub25TZW5kQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgIG1lc3NhZ2U6IG1lZGlhTWVzc2FnZSxcbiAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZShtZWRpYU1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlc3BvbnNlLnNldE11aWQobWVkaWFNZXNzYWdlLmdldE11aWQoKSk7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3BvbnNlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgbWVkaWFNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVkaWFNZXNzYWdlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25TZW5kQnV0dG9uQ2xpY2sobWVkaWFNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaW5wdXRDaGFuZ2VIYW5kbGVyID0gKGV2ZW50OiBhbnkpOiB2b2lkID0+IHtcbiAgICBjb25zdCBoYW5kbGVyID1cbiAgICAgIHRoaXMuYWNjZXB0SGFuZGxlcnNbdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHRdIHx8XG4gICAgICB0aGlzLm9uRmlsZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgIGhhbmRsZXIoZXZlbnQpO1xuICB9O1xuICBzZW5kU3RpY2tlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIGxldCBzdGlja2VyID0gZXZlbnQ/LmRldGFpbD8uc3RpY2tlclVSTDtcbiAgICBsZXQgc3RpY2tlck5hbWU6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnN0aWNrZXJOYW1lO1xuICAgIGlmICh0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogc3RpY2tlck5hbWUsXG4gICAgICAgICAgdXJsOiBzdGlja2VyLFxuICAgICAgICB9LFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICAgIHRoaXMub25FcnJvcixcbiAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25WaWRlb0NoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzWzBdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uQXVkaW9DaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1swXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbMF07XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbkltYWdlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25GaWxlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbXCIwXCJdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1tcIjBcIl07XG4gICAgICB2YXIgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZVxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIG9wZW5JbWFnZVBpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwiaW1hZ2UvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbkZpbGVQaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImZpbGUvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbnZpZGVvUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJ2aWRlby8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBvcGVuQXVkaW9QaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImF1ZGlvLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIGhhbmRsZU91dHNpZGVDbGljaygpIHtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSBmYWxzZTtcbiAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvcGVuQWN0aW9uU2hlZXQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG5cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgaGFuZGxlQWlGZWF0dXJlc0Nsb3NlID0gKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgdGhpcy5haUZlYXR1cmVzQ2xvc2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9O1xuXG4gIGNsb3NlU21hcnRSZXBseSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybjtcbiAgfTtcbiAgb3BlbkFpRmVhdHVyZXMgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlbkVtb2ppS2V5Ym9hcmQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIG9wZW5NZWRpYVJlY29yZGVkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSAhdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlblN0aWNrZXJLZXlib2FyZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgY2xvc2VQb3BvdmVycygpIHtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICB9XG4gIH1cbiAgZ2V0Q29tcG9zZXJJZCgpOiBDb21wb3NlcklkIHtcbiAgICBjb25zdCB1c2VyID0gdGhpcy51c2VyO1xuICAgIGlmICh1c2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVzZXI6IHVzZXI/LmdldFVpZCgpLFxuICAgICAgICBncm91cDogbnVsbCxcbiAgICAgICAgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGdyb3VwID0gdGhpcy5ncm91cDtcbiAgICBpZiAoZ3JvdXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXNlcjogbnVsbCxcbiAgICAgICAgZ3JvdXA6IGdyb3VwPy5nZXRHdWlkKCksXG4gICAgICAgIHBhcmVudE1lc3NhZ2VJZDogdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB1c2VyOiBudWxsLCBncm91cDogbnVsbCwgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCB9O1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWUoKTtcbiAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0ID0gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgPyB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICA6IFtdO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrT3V0c2lkZSk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9XG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICB9KTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIoKTtcblxuICAgIHRoaXMuYWN0aW9ucyA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFJT3B0aW9ucyhcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgdGhpcy5nZXRDb21wb3NlcklkKCkgYXMgdW5rbm93biBhcyBNYXA8c3RyaW5nLCBhbnk+LFxuICAgICAgdGhpcy5haU9wdGlvbnNTdHlsZVxuICAgICk7XG4gICAgdGhpcy5haUJvdExpc3QgPSBbXTtcblxuXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuZW5hYmxlU3RpY2tlcktleWJvYXJkID0gdHJ1ZTtcbiAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uID1cbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdXhpbGlhcnlPcHRpb25zKFxuICAgICAgICB0aGlzLmNvbXBvc2VySWQsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cFxuICAgICAgKTtcbiAgICBpZiAodGhpcy5zdGlja2VyQ29uZmlndXJhdGlvbj8uaWQgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VyS2V5Ym9hcmQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZUFpRmVhdHVyZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgZGV2ZWxvcGVyIHByb3ZpZGVkIGluc3RhbmNlIG9mIE1lbnRpb25zVGV4dEZvcm1hdHRlclxuICAgKiBJZiBub3QgcHJvdmlkZWQsIGFkZCBkZWZhdWx0XG4gICAqIElmIHByb3ZpZGVkLCBjaGVjayBpZiBzdHlsZSBpcyBwcm92aWRlZCB2aWEgY29uZmlndXJhdGlvbiwgdGhlbiBhZGQgc3R5bGUuXG4gICAqL1xuICBpbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRNZW50aW9uc1RleHRTdHlsZShcbiAgICAgICAgdGhpcy5nZXRNZW50aW9uc1N0eWxlKClcbiAgICAgICk7XG4gICAgICBsZXQgZm91bmRNZW50aW9uc0Zvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMudGV4dEZvcm1hdHRlcnMhLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIgPSB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W1xuICAgICAgICAgICAgICBpXG4gICAgICAgICAgICBdIGFzIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgIXRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5VXBDYWxsQmFjaygpIHx8XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5RG93bkNhbGxCYWNrKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleVVwQ2FsbEJhY2soXG4gICAgICAgICAgdGhpcy5zZWFyY2hNZW50aW9uc1xuICAgICAgICApO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleURvd25DYWxsQmFjayhcbiAgICAgICAgICB0aGlzLnNlYXJjaE1lbnRpb25zXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0SWQoXG4gICAgICAgICAgdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWRcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3QucHVzaCh0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZ2V0TWVudGlvbnNTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5tZW50aW9uU3R5bGVMb2NhbDtcbiAgfTtcblxuICBnZXRTbWFydFJlcGxpZXMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IHRydWU7XG4gICAgdGhpcy5yZXBsaWVzQXJyYXkgPSBbXTtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zbWFydFJlcGx5U3RhdGUgPSBTdGF0ZXMubG9hZGluZztcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICAgOiB0aGlzLmdyb3VwPy5nZXRHdWlkKCk7XG4gICAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgQ29tZXRDaGF0LmdldFNtYXJ0UmVwbGllcyhyZWNlaXZlcklkLCByZWNlaXZlclR5cGUpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IHJlcGxpZXNBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZXNwb25zZSkuZm9yRWFjaCgocmVwbHkpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVtyZXBseV0gJiYgcmVzcG9uc2VbcmVwbHldICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgICByZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUocmVwbGllc0FycmF5KTtcblxuICAgICAgICAgIHRoaXMuc21hcnRSZXBseVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICB0aGlzLnNtYXJ0UmVwbHlTdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBlbmFibGVBaUZlYXR1cmVzKCkge1xuICAgIGlmICh0aGlzLmFjdGlvbnMgJiYgdGhpcy5hY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuaXNBaUVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLmFjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktc21hcnQtcmVwbHlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgb25DbGljazogdGhpcy5nZXRTbWFydFJlcGxpZXMsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktY29udmVyc2F0aW9uLXN1bW1hcnlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgaWQ6IGFjdGlvbi5pZCxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHRoaXMuY2FsbENvbnZlcnNhdGlvblN1bW1hcnlNZXRob2QoKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktYm90c1wiKSB7XG4gICAgICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICAgICAgLi4uYWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi50aXRsZSEsXG4gICAgICAgICAgICBpZDogYWN0aW9uLmlkLFxuICAgICAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT5cbiAgICAgICAgICAgICAgdGhpcy5zaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCgoYWN0aW9uIGFzIGFueSkub25DbGljaygpKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCA9IChhY3Rpb246IGFueSkgPT4ge1xuICAgIHRoaXMuYWlCb3RMaXN0ID0gYWN0aW9uO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gdHJ1ZTtcblxuICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLmxlbmd0aCA9IDA7XG5cbiAgICB0aGlzLmFpQm90TGlzdC5mb3JFYWNoKChlOiBhbnksIGk6IGFueSkgPT4ge1xuICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICBpZDogZS5pZCxcbiAgICAgICAgdGl0bGU6IGUudGl0bGUsXG4gICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dQYW5lbC5uZXh0KHtcbiAgICAgICAgICAgIGNoaWxkOiB7IGJvdDogZSwgc2hvd0JvdFZpZXc6IHRydWUgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnJlcGxpZXNBcnJheSA9IFtdO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGNvbXBvc2VyV3JhcHBlclN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH1cbiAgc2V0VGhlbWUoKSB7XG4gICAgdGhpcy5lbW9qaVBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc3RpY2tlclBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlZFBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuYWlQb3BvdmVyLmJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKTtcbiAgICB0aGlzLmFpUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zZXRDb21wb3NlclN0eWxlKCk7XG4gICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlID0ge1xuICAgICAgbGF5b3V0TW9kZUljb25UaW50OlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUubGF5b3V0TW9kZUljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLnRpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS50aXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBBY3Rpb25TaGVldFNlcGFyYXRvclRpbnQ6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5BY3Rpb25TaGVldFNlcGFyYXRvclRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9O1xuICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlID0ge1xuICAgICAgbGF5b3V0TW9kZUljb25UaW50OlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS5sYXlvdXRNb2RlSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS50aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS50aXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBBY3Rpb25TaGVldFNlcGFyYXRvclRpbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLkFjdGlvblNoZWV0U2VwYXJhdG9yVGludCB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgIH07XG4gICAgdGhpcy50ZXh0SW5wdXRTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBtYXhIZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/Lm1heElucHV0SGVpZ2h0IHx8IFwiMTAwcHhcIixcbiAgICAgIGJvcmRlcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCb3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmlucHV0Qm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCYWNrZ3JvdW5kLFxuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy50ZXh0Q29sb3IsXG4gICAgICBkaXZpZGVyQ29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmRpdmlkZXJUaW50LFxuICAgIH07XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpXG4gICAgdGhpcy5wcmV2aWV3U3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBwcmV2aWV3VGl0bGVGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3VGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgcHJldmlld1RpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdUaXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1N1YnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdTdWJ0aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5jbG9zZVByZXZpZXdUaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4J1xuICAgIH07XG4gICAgbGV0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgbGV0IGRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUgPSBuZXcgTWVkaWFSZWNvcmRlclN0eWxlKHtcbiAgICAgIHN0YXJ0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIHN1Ym1pdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3RvcEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgdGltZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aW1lclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuYm9yZGVyID0gYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUsXG4gICAgICAuLi50aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuZW1vamlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDhweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc3RpY2tlclBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggOHB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCA4cHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLmVtb2ppQnV0dG9uU3R5bGUgPSB7XG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLnN0aWNrZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmVtb2ppS2V5Ym9hcmRUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRDb2xvcixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGFjdGl2ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgfTtcblxuICAgIHRoaXMuc3RpY2tlcktleWJvYXJkU3R5bGUgPSB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBjYXRlZ29yeUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIH07XG4gICAgdGhpcy5hdHRhY2htZW50QnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYXR0YWNoSWNvbnRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIHRoaXMuY3JlYXRlUG9sbFN0eWxlID0ge1xuICAgICAgcGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlbGV0ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHF1ZXN0aW9uSW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgb3B0aW9uSW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYW5zd2VySGVscFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xXG4gICAgICApLFxuICAgICAgYW5zd2VySGVscFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGFkZEFuc3dlckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGFkZEFuc3dlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgYWRkQW5zd2VyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGVycm9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgZXJyb3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIG9wdGlvblBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgb3B0aW9uUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBxdWVzdGlvbklucHV0VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgcXVlc3Rpb25JbnB1dFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9wdGlvbklucHV0VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgb3B0aW9uSW5wdXRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjYyMHB4XCIsXG4gICAgICBib3JkZXI6IFwiXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH07XG4gIH1cbiAgc2V0Q29tcG9zZXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IG5ldyBNZXNzYWdlQ29tcG9zZXJTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBhdHRhY2hJY29udGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHNlbmRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlbW9qaUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgaW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgaW5wdXRCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgaW5wdXRCb3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgZGl2aWRlclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG5cbiAgICAgIGVtb2ppS2V5Ym9hcmRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBlbW9qaUtleWJvYXJkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJldmlld1RpdGxlRm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwcmV2aWV3VGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgcHJldmlld1N1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBjbG9zZVByZXZpZXdUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgbWF4SW5wdXRIZWlnaHQ6IFwiMTAwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZSxcbiAgICB9O1xuICB9XG4gIGNsb3NlUHJldmlldygpIHtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dQcmV2aWV3ID0gZmFsc2U7XG4gICAgdGhpcy5lZGl0UHJldmlld1RleHQgPSBcIlwiO1xuICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQgPSBudWxsO1xuICAgIHRoaXMudGV4dCA9IFwiXCI7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpO1xuICB9XG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcblxuICAvKipcbiAgICogQWNjZXB0cyBzZWFyY2ggdGVybSBmcm9tIG1lbnRpb25zVGV4dEZvcm1hdHRlciBhbmQgb3BlbnMgdGhlIG1lbnRpb25zIHNlbGVjdCBsaXN0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2hUZXJtXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgc2VhcmNoTWVudGlvbnMgPSAoc2VhcmNoVGVybTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCEoc2VhcmNoVGVybSAmJiBzZWFyY2hUZXJtLmxlbmd0aCkpIHtcbiAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaENvdW50ID0gMTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtIHx8XG4gICAgICAhc2VhcmNoVGVybVxuICAgICAgICAuc3BsaXQoXCJAXCIpWzFdXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5zdGFydHNXaXRoKHRoaXMubGFzdEVtcHR5U2VhcmNoVGVybS50b0xvd2VyQ2FzZSgpKVxuICAgICkge1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPVxuICAgICAgICBzZWFyY2hUZXJtLnNwbGl0KFwiQFwiKVsxXSAmJiBzZWFyY2hUZXJtLnNwbGl0KFwiQFwiKVsxXS5sZW5ndGhcbiAgICAgICAgICA/IHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdXG4gICAgICAgICAgOiBcIlwiO1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gdHJ1ZTtcbiAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hDb3VudCsrO1xuICAgICAgdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gY2xpY2tpbmcgYSB1c2VyIGZyb20gdGhlIG1lbnRpb25zIGxpc3QuXG4gICAqIEFkZCB0aGUgdXNlciB0byBtZW50aW9ucyB0ZXh0IGZvcm1hdHRlciBpbnN0YW5jZSBhbmQgdGhlbiBjYWxsIHJlcmVuZGVyIHRvIHN0eWxlIHRoZSBtZW50aW9uXG4gICAqIHdpdGhpbiBtZXNzYWdlIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBkZWZhdWx0TWVudGlvbnNJdGVtQ2xpY2tIYW5kbGVyID0gKFxuICAgIHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyXG4gICkgPT4ge1xuICAgIGxldCBjb21ldENoYXRVc2VycyA9IFt1c2VyXTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICBjb21ldENoYXRVc2Vyc1xuICAgICk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRMb2dnZWRJblVzZXIodGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgICB0aGlzLm1lbnRpb25lZFVzZXJzID0gW1xuICAgICAgLi4udGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKCksXG4gICAgXTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnJlUmVuZGVyKCk7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2UgbWVudGlvbnMgbGlzdCBpZiBzZWFyY2ggcmV0dXJucyBlbXB0eSBsaXN0XG4gICAqL1xuICBkZWZhdWx0T25FbXB0eUZvck1lbnRpb25zID0gKCkgPT4ge1xuICAgIHRoaXMubGFzdEVtcHR5U2VhcmNoVGVybSA9IHRoaXMubWVudGlvbnNTZWFyY2hUZXJtO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgZ2V0TWVudGlvbkluZm9JY29uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICBpY29uSGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIGljb25XaWR0aDogXCIyMHB4XCIsXG4gICAgICBpY29uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZ2FwOiBcIjVweFwiLFxuICAgIH07XG4gIH07XG5cbiAgaGFuZGxlQ2xpY2tPdXRzaWRlID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy51c2VyTWVtYmVyV3JhcHBlclJlZikge1xuICAgICAgY29uc3QgdXNlck1lbWJlcldyYXBwZXJSZWN0ID1cbiAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlclJlZj8ubmF0aXZlRWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBpc091dHNpZGVDbGljayA9XG4gICAgICAgIGV2ZW50Py5jbGllbnRYIDw9IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8ubGVmdCB8fFxuICAgICAgICBldmVudD8uY2xpZW50WCA+PSB1c2VyTWVtYmVyV3JhcHBlclJlY3Q/LnJpZ2h0IHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRZID49IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8udG9wIHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRZIDw9IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8uYm90dG9tO1xuICAgICAgaWYgKGlzT3V0c2lkZUNsaWNrKSB7XG4gICAgICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9IFwiXCI7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnV0dG9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIG9uQ2xpY2s6ICgpID0+IFByb21pc2U8dW5rbm93bj47XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cImNvbXBvc2VyV3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2Vjb21wb3Nlcl9fbWVudGlvbnNcIiAjdXNlck1lbWJlcldyYXBwZXJSZWY+XG4gICAgPGNvbWV0Y2hhdC11c2VyLW1lbWJlci13cmFwcGVyICpuZ0lmPVwic2hvd0xpc3RGb3JNZW50aW9uc1wiXG4gICAgICBbdXNlck1lbWJlckxpc3RUeXBlXT1cInVzZXJNZW1iZXJMaXN0VHlwZVwiXG4gICAgICBbb25JdGVtQ2xpY2tdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLm9uSXRlbUNsaWNrIHx8IGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXJcIlxuICAgICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgICBbc2VhcmNoS2V5d29yZF09XCJtZW50aW9uc1NlYXJjaFRlcm1cIlxuICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICBbbGlzdEl0ZW1WaWV3XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICBbdXNlclByZXNlbmNlUGxhY2VtZW50XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2VyUHJlc2VuY2VQbGFjZW1lbnRcIlxuICAgICAgW2hpZGVTZXBlcmF0b3JdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgW29uRW1wdHldPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiXG4gICAgICBbbG9hZGluZ0ljb25VcmxdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFtncm91cF09XCJncm91cFwiIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgIFtkaXNhYmxlTG9hZGluZ1N0YXRlXT1cInRydWVcIlxuICAgICAgW29uRXJyb3JdPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiPjwvY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwic2hvd01lbnRpb25zQ291bnRXYXJuaW5nXCJcbiAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9ucy1saW1pdC1leGNlZWRlZFwiPlxuICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvblxuICAgICAgICBbdGV4dF09XCJtZW50aW9uc1dhcm5pbmdUZXh0IHx8IGxvY2FsaXplKCdNRU5USU9OU19MSU1JVF9XQVJOSU5HX01FU1NBR0UnKVwiXG4gICAgICAgIFtpY29uVVJMXT1cIkluZm9TaW1wbGVJY29uXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldE1lbnRpb25JbmZvSWNvblN0eWxlKClcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCJcbiAgICAqbmdJZj1cImhlYWRlclZpZXc7IGVsc2UgbWVzc2FnZVByZXZpZXdcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbWVzc2FnZVByZXZpZXc+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCIgKm5nSWY9XCJzaG93UHJldmlld1wiPlxuICAgICAgPGNvbWV0Y2hhdC1wcmV2aWV3IFtwcmV2aWV3U3R5bGVdPVwicHJldmlld1N0eWxlXCJcbiAgICAgICAgW3ByZXZpZXdTdWJ0aXRsZV09XCJlZGl0UHJldmlld1RleHRcIlxuICAgICAgICAoY2MtcHJldmlldy1jbG9zZS1jbGlja2VkKT1cImNsb3NlUHJldmlldygpXCI+IDwvY29tZXRjaGF0LXByZXZpZXc+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19pbnB1dFwiPlxuXG4gICAgPGNvbWV0Y2hhdC10ZXh0LWlucHV0IChjYy10ZXh0LWlucHV0LWVudGVyZWQpPVwic2VuZE1lc3NhZ2VPbkVudGVyKCRldmVudClcIlxuICAgICAgI2lucHV0UmVmIFt0ZXh0XT1cInRleHRcIlxuICAgICAgKGNjLXRleHQtaW5wdXQtY2hhbmdlZCk9XCJtZXNzYWdlSW5wdXRDaGFuZ2VkKCRldmVudClcIlxuICAgICAgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgW3BsYWNlaG9sZGVyVGV4dF09XCJwbGFjZWhvbGRlclRleHRcIlxuICAgICAgW2F1eGlsaWFyeUJ1dHRvbkFsaWdubWVudF09XCJhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJ0ZXh0Rm9ybWF0dGVyc1wiPlxuXG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInNlY29uZGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlY29uZGFyeUJ1dHRvblZpZXc7ZWxzZSBzZWNvbmRhcnlCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlY29uZGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2Vjb25kYXJ5QnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdHRhY2hidXR0b25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlclxuICAgICAgICAgICAgICAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgICBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXQgc2xvdD1cImNvbnRlbnRcIiBbYWN0aW9uc109XCJjb21wb3NlckFjdGlvbnNcIlxuICAgICAgICAgICAgICAgIFthY3Rpb25TaGVldFN0eWxlXT1cImFjdGlvblNoZWV0U3R5bGVcIlxuICAgICAgICAgICAgICAgIChjYy1hY3Rpb25zaGVldC1jbGlja2VkKT1cImhhbmRsZUFjdGlvbnMoJGV2ZW50KVwiPlxuICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1hY3Rpb24tc2hlZXQ+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICNhY3Rpb25TaGVldFJlZiBzbG90PVwiY2hpbGRyZW5cIlxuICAgICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuQWN0aW9uU2hlZXQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgW2ljb25VUkxdPVwiIXNob3dBY3Rpb25TaGVldEl0ZW0gfHwgKHNob3dFbW9qaUtleWJvYXJkICYmICFzaG93QWN0aW9uU2hlZXRJdGVtKSAgPyBhdHRhY2htZW50SWNvblVSTCAgOiBjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJhdHRhY2htZW50QnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdXhpbGlhcnlcIiBkYXRhLXNsb3Q9XCJhdXhpbGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2N1c3RvbS1hdXhpbGlhcnktdmlld1wiXG4gICAgICAgICAgKm5nSWY9XCJhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImF1eGlsYXJ5QnV0dG9uVmlldztjb250ZXh0OnsgJGltcGxpY2l0OiB1c2VyID8/IGdyb3VwLCBjb21wb3NlcklkOmNvbXBvc2VySWQgfVwiPlxuICAgICAgICAgIDwvbmctY29udGFpbmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPCEtLSBBSSBDYXJkcyAtLT5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3N0aWNrZXJrZXlib2FyZFwiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlciAoY2MtcG9wb3Zlci1jbGljayk9XCJvcGVuU3RpY2tlcktleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgW3BvcG92ZXJTdHlsZV09XCJhaVBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFpLWNhcmQgW3N0YXRlXT1cInNtYXJ0UmVwbHlTdGF0ZVwiXG4gICAgICAgICAgICAgICpuZ0lmPVwic2hvd1NtYXJ0UmVwbHkgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW1BSSAmJiAhc2hvd0FpQm90TGlzdFwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCIgW2xvYWRpbmdTdGF0ZVRleHRdPVwibG9hZGluZ1N0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlbXB0eVN0YXRlVGV4dF09XCJlbXB0eVN0YXRlVGV4dFwiXG4gICAgICAgICAgICAgIFtlcnJvclN0YXRlVGV4dF09XCJlcnJvclN0YXRlVGV4dFwiPlxuICAgICAgICAgICAgICA8ZGl2IHNsb3Q9XCJsb2FkZWRWaWV3XCIgY2xhc3M9XCJzbWFydC1yZXBsaWVzLXdyYXBwZXJcIj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWhlYWRlclwiPlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2JhY2stYnV0dG9uXCI+XG4gICAgICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uXG4gICAgICAgICAgICAgICAgICAgICAgKm5nSWY9XCJyZXBsaWVzQXJyYXkgJiYgcmVwbGllc0FycmF5Lmxlbmd0aCA+IDAgXCJcbiAgICAgICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQWlCYWNrQnV0dG9uQ2xpY2soKVwiXG4gICAgICAgICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImJhY2tCdXR0b25TdHlsZSgpXCI+XG4gICAgICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3NtYXJ0cmVwbHktaGVhZGVyLXZpZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgPHA+e3sgbG9jYWxpemUoXCJTVUdHRVNUX0FfUkVQTFlcIikgfX08L3A+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgICAgIDxzbWFydC1yZXBsaWVzXG4gICAgICAgICAgICAgICAgICAgICpuZ0lmPVwicmVwbGllc0FycmF5ICYmIHJlcGxpZXNBcnJheS5sZW5ndGggPiAwIFwiXG4gICAgICAgICAgICAgICAgICAgIFtzbWFydFJlcGx5U3R5bGVdPVwic21hcnRSZXBseVN0eWxlXCIgW3JlcGxpZXNdPVwicmVwbGllc0FycmF5XCJcbiAgICAgICAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCInJ1wiIChjYy1yZXBseS1jbGlja2VkKT1cInNlbmRSZXBseSgkZXZlbnQpXCI+XG4gICAgICAgICAgICAgICAgICA8L3NtYXJ0LXJlcGxpZXM+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cblxuXG5cblxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWFpLWNhcmQ+XG5cbiAgICAgICAgICAgIDxkaXYgKm5nSWY9XCJzaG93QWlCb3RMaXN0ICAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbUFJXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNvbnRlbnRcIj5cbiAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2FpYm90bGlzdFwiPlxuICAgICAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICpuZ0lmPVwiIGFpQm90TGlzdCAmJiBhaUJvdExpc3QubGVuZ3RoPiAxIFwiXG4gICAgICAgICAgICAgICAgICBbaWNvblVSTF09XCJiYWNrQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib25BaUJhY2tCdXR0b25DbGljaygpXCJcbiAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiPlxuICAgICAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgICAgICA8cD57eyBsb2NhbGl6ZShcIkNPTUVUQ0hBVF9BU0tfQUlfQk9UXCIpIH19PC9wPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXRcbiAgICAgICAgICAgICAgICAqbmdJZj1cInNob3dBaUJvdExpc3QgICYmICFzaG93QWN0aW9uU2hlZXRJdGVtQUlcIiBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYWlBY3Rpb25CdXR0b25zXCIgW3RpdGxlXT1cIidBSSdcIlxuICAgICAgICAgICAgICAgIFthY3Rpb25TaGVldFN0eWxlXT1cImFpQWN0aW9uU2hlZXRTdHlsZVwiIFtoaWRlTGF5b3V0TW9kZV09XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAoY2MtYWN0aW9uc2hlZXQtY2xpY2tlZCk9XCJoYW5kbGVBY3Rpb25zKCRldmVudClcIj5cbiAgICAgICAgICAgICAgPC9jb21ldGNoYXQtYWN0aW9uLXNoZWV0PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYWN0aW9uLXNoZWV0ICpuZ0lmPVwic2hvd0FjdGlvblNoZWV0SXRlbUFJXCIgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICBbYWN0aW9uc109XCJidXR0b25zXCIgW3RpdGxlXT1cIidBSSdcIlxuICAgICAgICAgICAgICBbYWN0aW9uU2hlZXRTdHlsZV09XCJhaUFjdGlvblNoZWV0U3R5bGVcIiBbaGlkZUxheW91dE1vZGVdPVwidHJ1ZVwiXG4gICAgICAgICAgICAgIChjYy1hY3Rpb25zaGVldC1jbGlja2VkKT1cImhhbmRsZUFjdGlvbnMoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtYWN0aW9uLXNoZWV0PlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAqbmdJZj1cImlzQWlFbmFibGVkXCIgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnQUknKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiICNhaUJ1dHRvblJlZlxuICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwib3BlbkFpRmVhdHVyZXMoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIFtpY29uVVJMXT1cIiFzaG93QWlGZWF0dXJlcyA/IGFpSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJzdGlja2VyQnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3N0aWNrZXJrZXlib2FyZFwiXG4gICAgICAgICAgKm5nSWY9XCJlbmFibGVTdGlja2VyS2V5Ym9hcmRcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwic3RpY2tlclBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8c3RpY2tlcnMta2V5Ym9hcmQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICBbc3RpY2tlclN0eWxlXT1cInN0aWNrZXJLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLXN0aWNrZXItY2xpY2tlZCk9XCJzZW5kU3RpY2tlcigkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L3N0aWNrZXJzLWtleWJvYXJkPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU1RJQ0tFUicpXCIgc2xvdD1cImNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgI3N0aWNrZXJCdXR0b25SZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5TdGlja2VyS2V5Ym9hcmQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIFtpY29uVVJMXT1cIiAhc2hvd1N0aWNrZXJLZXlib2FyZCA/IHN0aWNrZXJCdXR0b25JY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInN0aWNrZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2Vtb2ppa2V5Ym9hcmRcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIiBbcG9wb3ZlclN0eWxlXT1cImVtb2ppUG9wb3ZlclwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZCBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFtlbW9qaUtleWJvYXJkU3R5bGVdPVwiZW1vamlLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLWVtb2ppLWNsaWNrZWQpPVwiYXBwZW5kRW1vamkoJGV2ZW50KVwiPlxuICAgICAgICAgICAgPC9jb21ldGNoYXQtZW1vamkta2V5Ym9hcmQ+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAjZW1vamlCdXR0b25SZWYgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnRU1PSkknKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuRW1vamlLZXlib2FyZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICFzaG93RW1vamlLZXlib2FyZCAgfHwgKCFzaG93RW1vamlLZXlib2FyZCAmJiBzaG93QWN0aW9uU2hlZXRJdGVtKSA/IGVtb2ppQnV0dG9uSWNvblVSTCA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJlbW9qaUJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbWVkaWFyZWNvcmRlclwiXG4gICAgICAgICAgKm5nSWY9XCIhaGlkZVZvaWNlUmVjb3JkaW5nXCI+XG4gICAgICAgICAgPGNvbWV0Y2hhdC1wb3BvdmVyIChjYy1wb3BvdmVyLW91dHNpZGUtY2xpY2tlZCk9XCJoYW5kbGVPdXRzaWRlQ2xpY2soKVwiXG4gICAgICAgICAgICBbcG9wb3ZlclN0eWxlXT1cIm1lZGlhUmVjb3JkZWRQb3BvdmVyXCJcbiAgICAgICAgICAgIFtwbGFjZW1lbnRdPVwiYXV4aWxhcnlQbGFjZW1lbnRcIj5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1tZWRpYS1yZWNvcmRlciAqbmdJZj1cInRvZ2dsZU1lZGlhUmVjb3JkZWRcIlxuICAgICAgICAgICAgICBbYXV0b1JlY29yZGluZ109XCJ0cnVlXCIgc3RhcnRJY29uVGV4dD1cIlwiIHN0b3BJY29uVGV4dD1cIlwiXG4gICAgICAgICAgICAgIHN1Ym1pdEJ1dHRvbkljb25UZXh0PVwiXCJcbiAgICAgICAgICAgICAgW3N1Ym1pdEJ1dHRvbkljb25VUkxdPVwidm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMXCJcbiAgICAgICAgICAgICAgW3N0YXJ0SWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0YXJ0SWNvblVSTFwiXG4gICAgICAgICAgICAgIFtzdG9wSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N0b3BJY29uVVJMXCJcbiAgICAgICAgICAgICAgW2Nsb3NlSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTFwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1zdWJtaXR0ZWQpPVwic2VuZFJlY29yZGVkTWVkaWEoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIChjYy1tZWRpYS1yZWNvcmRlci1jbG9zZWQpPVwiY2xvc2VNZWRpYVJlY29yZGVyKCRldmVudClcIlxuICAgICAgICAgICAgICBzbG90PVwiY29udGVudFwiXG4gICAgICAgICAgICAgIFttZWRpYVBsYXllclN0eWxlXT1cIm1lZGlhUmVjb3JkZXJTdHlsZVwiPjwvY29tZXRjaGF0LW1lZGlhLXJlY29yZGVyPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvbiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdWT0lDRV9SRUNPUkRJTkcnKVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjaGlsZHJlblwiICNtZWRpYVJlY29yZGVkUmVmXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvcGVuTWVkaWFSZWNvcmRlZCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgW2ljb25VUkxdPVwiICF0b2dnbGVNZWRpYVJlY29yZGVkID8gdm9pY2VSZWNvcmRpbmdJY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cIm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWljb24tYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInByaW1hcnlWaWV3XCI+XG4gICAgICAgIDxkaXYgKm5nSWY9XCJzZW5kQnV0dG9uVmlldztlbHNlIHNlbmRCdXR0b25cIj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2VuZEJ1dHRvbj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc2VuZGJ1dHRvblwiXG4gICAgICAgICAgICAqbmdJZj1cInNob3dTZW5kQnV0dG9uIHx8IGhpZGVMaXZlUmVhY3Rpb25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cInNlbmRCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInNlbmRCdXR0b25TdHlsZVwiXG4gICAgICAgICAgICAgIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ1NFTkRfTUVTU0FHRScpXCJcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImN1c3RvbVNlbmRNZXRob2QobWVzc2FnZVRleHQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2xpdmVyZWFjdGlvblwiXG4gICAgICAgICAgICAqbmdJZj1cIiFoaWRlTGl2ZVJlYWN0aW9uICYmICFzaG93U2VuZEJ1dHRvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiTGl2ZVJlYWN0aW9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ0xJVkVfUkVBQ1RJT04nKVwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJsaXZlUmVhY3Rpb25TdHlsZVwiXG4gICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJzZW5kUmVhY3Rpb24oKVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgIDwvZGl2PlxuICAgIDwvY29tZXRjaGF0LXRleHQtaW5wdXQ+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxpbnB1dCBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX21lZGlhaW5wdXRcIiAjaW5wdXRFbGVtZW50XG4gIChjaGFuZ2UpPVwiaW5wdXRDaGFuZ2VIYW5kbGVyKCRldmVudClcIiAvPlxuPGNvbWV0Y2hhdC1iYWNrZHJvcCAqbmdJZj1cInNob3dDcmVhdGVQb2xsc1wiIFtiYWNrZHJvcFN0eWxlXT1cImJhY2tkcm9wU3R5bGVcIj5cbiAgPGNyZWF0ZS1wb2xsIFt1c2VyXT1cInVzZXJcIiBbZ3JvdXBdPVwiZ3JvdXBcIlxuICAgIChjYy1jbG9zZS1jbGlja2VkKT1cImNsb3NlQ3JlYXRlUG9sbHMoKVwiXG4gICAgW2NyZWF0ZVBvbGxTdHlsZV09XCJjcmVhdGVQb2xsU3R5bGVcIj48L2NyZWF0ZS1wb2xsPlxuPC9jb21ldGNoYXQtYmFja2Ryb3A+XG4iXX0=