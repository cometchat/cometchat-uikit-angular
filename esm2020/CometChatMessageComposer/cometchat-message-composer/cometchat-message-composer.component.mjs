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
        this.userMemberWrapperConfiguration = new UserMemberWrapperConfiguration({});
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
            if (this.loggedInUser) {
                textMessage.setSender(this.loggedInUser);
            }
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
        this.text = "";
        this.messageText = "";
        this.inputRef?.nativeElement?.emptyInputField();
        this.disableSendButton();
        this.ref.detectChanges();
    }
}
CometChatMessageComposerComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
CometChatMessageComposerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageComposerComponent, selector: "cometchat-message-composer", inputs: { user: "user", group: "group", disableSoundForMessages: "disableSoundForMessages", customSoundForMessage: "customSoundForMessage", disableTypingEvents: "disableTypingEvents", text: "text", placeholderText: "placeholderText", headerView: "headerView", onTextChange: "onTextChange", attachmentIconURL: "attachmentIconURL", attachmentOptions: "attachmentOptions", secondaryButtonView: "secondaryButtonView", auxilaryButtonView: "auxilaryButtonView", auxiliaryButtonsAlignment: "auxiliaryButtonsAlignment", sendButtonView: "sendButtonView", parentMessageId: "parentMessageId", hideLiveReaction: "hideLiveReaction", LiveReactionIconURL: "LiveReactionIconURL", backButtonIconURL: "backButtonIconURL", mentionsWarningText: "mentionsWarningText", mentionsWarningStyle: "mentionsWarningStyle", messageComposerStyle: "messageComposerStyle", onSendButtonClick: "onSendButtonClick", onError: "onError", backdropStyle: "backdropStyle", actionSheetStyle: "actionSheetStyle", aiActionSheetStyle: "aiActionSheetStyle", hideVoiceRecording: "hideVoiceRecording", mediaRecorderStyle: "mediaRecorderStyle", aiOptionsStyle: "aiOptionsStyle", aiIconURL: "aiIconURL", voiceRecordingIconURL: "voiceRecordingIconURL", voiceRecordingCloseIconURL: "voiceRecordingCloseIconURL", voiceRecordingStartIconURL: "voiceRecordingStartIconURL", voiceRecordingStopIconURL: "voiceRecordingStopIconURL", voiceRecordingSubmitIconURL: "voiceRecordingSubmitIconURL", userMemberWrapperConfiguration: "userMemberWrapperConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, outputs: { childEvent: "childEvent" }, viewQueries: [{ propertyName: "inputElementRef", first: true, predicate: ["inputElement"], descendants: true }, { propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }, { propertyName: "emojiButtonRef", first: true, predicate: ["emojiButtonRef"], descendants: true }, { propertyName: "actionSheetRef", first: true, predicate: ["actionSheetRef"], descendants: true }, { propertyName: "stickerButtonRef", first: true, predicate: ["stickerButtonRef"], descendants: true }, { propertyName: "mediaRecordedRef", first: true, predicate: ["mediaRecordedRef"], descendants: true }, { propertyName: "aiButtonRef", first: true, predicate: ["aiButtonRef"], descendants: true }, { propertyName: "userMemberWrapperRef", first: true, predicate: ["userMemberWrapperRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"], components: [{ type: i2.CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: ["userMemberListType", "onItemClick", "listItemView", "avatarStyle", "statusIndicatorStyle", "searchKeyword", "group", "subtitleView", "usersRequestBuilder", "disableUsersPresence", "userPresencePlacement", "hideSeperator", "loadingStateView", "onEmpty", "onError", "groupMemberRequestBuilder", "loadingIconUrl", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-composer", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" *ngIf=\"showListForMentions\"\n    #userMemberWrapperRef>\n    <cometchat-user-member-wrapper [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n          <ng-container\n            *ngTemplateOutlet=\"sendButtonView;context:{ item: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              [disabled]=\"!showSendButton\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCwwQkFBMEIsRUFDMUIscUJBQXFCLEVBRXJCLHFCQUFxQixFQUdyQixvQkFBb0IsRUFHcEIsaUJBQWlCLEVBRWpCLDhCQUE4QixFQUM5QixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBSUwsa0JBQWtCLEdBR25CLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUNMLHdCQUF3QixFQUd4QixzQkFBc0IsRUFDdEIsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUl2QixhQUFhLEVBQ2IsU0FBUyxFQUNULGtCQUFrQixFQUNsQixNQUFNLEVBQ04sa0JBQWtCLEVBQ2xCLFVBQVUsRUFDVixRQUFRLEdBQ1QsTUFBTSw0QkFBNEIsQ0FBQztBQUNwQyxPQUFPLEVBQ0wsdUJBQXVCLEVBRXZCLFNBQVMsRUFFVCxZQUFZLEVBQ1osS0FBSyxFQUdMLE1BQU0sRUFHTixTQUFTLEdBQ1YsTUFBTSxlQUFlLENBQUM7QUFFdkIsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0s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QWxDLEtBQUs7Z0JBQ0csMEJBQTBCO3NCQUFsQyxLQUFLO2dCQUNHLHlCQUF5QjtzQkFBakMsS0FBSztnQkFDRywyQkFBMkI7c0JBQW5DLEtBQUs7Z0JBQ0ksVUFBVTtzQkFBbkIsTUFBTTtnQkFDRSw4QkFBOEI7c0JBQXRDLEtBQUs7Z0JBRUcsZUFBZTtzQkFBdkIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcblxuaW1wb3J0IHtcbiAgQUlPcHRpb25zU3R5bGUsXG4gIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyLFxuICBDb21ldENoYXRTb3VuZE1hbmFnZXIsXG4gIENvbWV0Q2hhdFRleHRGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFVJS2l0VXRpbGl0eSxcbiAgQ29tcG9zZXJJZCxcbiAgQ3JlYXRlUG9sbFN0eWxlLFxuICBNZXNzYWdlQ29tcG9zZXJTdHlsZSxcbiAgU21hcnRSZXBsaWVzU3R5bGUsXG4gIFN0aWNrZXJzQ29uZmlndXJhdGlvbixcbiAgU3RpY2tlcnNDb25zdGFudHMsXG4gIFN0aWNrZXJzU3R5bGUsXG4gIFVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbixcbiAgVXNlck1lbnRpb25TdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtc2hhcmVkXCI7XG5pbXBvcnQge1xuICBBY3Rpb25TaGVldFN0eWxlLFxuICBCYWNrZHJvcFN0eWxlLFxuICBFbW9qaUtleWJvYXJkU3R5bGUsXG4gIE1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgUG9wb3ZlclN0eWxlLFxuICBQcmV2aWV3U3R5bGUsXG59IGZyb20gXCJAY29tZXRjaGF0L3Vpa2l0LWVsZW1lbnRzXCI7XG5pbXBvcnQge1xuICBBdXhpbGlhcnlCdXR0b25BbGlnbm1lbnQsXG4gIENvbWV0Q2hhdEFjdGlvbnNWaWV3LFxuICBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24sXG4gIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMsXG4gIENvbWV0Q2hhdFVJRXZlbnRzLFxuICBDb21ldENoYXRVSUtpdENvbnN0YW50cyxcbiAgSU1lbnRpb25zQ291bnRXYXJuaW5nLFxuICBJTWVzc2FnZXMsXG4gIE1lbnRpb25zVGFyZ2V0RWxlbWVudCxcbiAgTWVzc2FnZVN0YXR1cyxcbiAgUGxhY2VtZW50LFxuICBQcmV2aWV3TWVzc2FnZU1vZGUsXG4gIFN0YXRlcyxcbiAgVXNlck1lbWJlckxpc3RUeXBlLFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXIgaXMgdXNlZCB0byBzZW5kIG1lc3NhZ2UgdG8gdXNlciBvciBncm91cC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtbWVzc2FnZS1jb21wb3NlclwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtbWVzc2FnZS1jb21wb3Nlci5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQFZpZXdDaGlsZChcImlucHV0RWxlbWVudFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW5wdXRFbGVtZW50UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImlucHV0UmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbnB1dFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJlbW9qaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZW1vamlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYWN0aW9uU2hlZXRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGFjdGlvblNoZWV0UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInN0aWNrZXJCdXR0b25SZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHN0aWNrZXJCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwibWVkaWFSZWNvcmRlZFJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgbWVkaWFSZWNvcmRlZFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJhaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYWlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidXNlck1lbWJlcldyYXBwZXJSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHVzZXJNZW1iZXJXcmFwcGVyUmVmITogRWxlbWVudFJlZjtcblxuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2U6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmdFdmVudHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcGxhY2Vob2xkZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkVOVEVSX1lPVVJfTUVTU0FHRV9IRVJFXCIpO1xuXG4gIEBJbnB1dCgpIGhlYWRlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblRleHRDaGFuZ2UhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBASW5wdXQoKSBhdHRhY2htZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvUGx1cy5zdmdcIjtcbiAgQElucHV0KCkgYXR0YWNobWVudE9wdGlvbnM6XG4gICAgfCAoKFxuICAgICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAsXG4gICAgICBjb21wb3NlcklkOiBDb21wb3NlcklkXG4gICAgKSA9PiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSlcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgc2Vjb25kYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsaWFyeUJ1dHRvbnNBbGlnbm1lbnQ6IEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCA9XG4gICAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LnJpZ2h0O1xuICBASW5wdXQoKSBzZW5kQnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgQElucHV0KCkgaGlkZUxpdmVSZWFjdGlvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIExpdmVSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2hlYXJ0LXJlYWN0aW9uLnBuZ1wiO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nVGV4dD86IHN0cmluZztcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nU3R5bGU/OiBhbnk7XG4gIHB1YmxpYyBJbmZvU2ltcGxlSWNvbiA9IFwiYXNzZXRzL0luZm9TaW1wbGVJY29uLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIG1lc3NhZ2VDb21wb3NlclN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uU2VuZEJ1dHRvbkNsaWNrOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UsIHByZXZpZXdNZXNzYWdlTW9kZT86IFByZXZpZXdNZXNzYWdlTW9kZSkgPT4gdm9pZClcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgb25FcnJvcjogKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4gdm9pZCkgfCBudWxsID0gKFxuICAgIGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uXG4gICkgPT4ge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgfTtcbiAgQElucHV0KCkgYmFja2Ryb3BTdHlsZTogQmFja2Ryb3BTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYmEoMCwgMCwgMCwgMC41KVwiLFxuICAgIHBvc2l0aW9uOiBcImZpeGVkXCIsXG4gIH07XG5cbiAgQElucHV0KCkgYWN0aW9uU2hlZXRTdHlsZTogQWN0aW9uU2hlZXRTdHlsZSA9IHtcbiAgICBsYXlvdXRNb2RlSWNvblRpbnQ6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjA0KVwiLFxuICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2IoMjU1LDI1NSwyNTUpXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB0aXRsZUZvbnQ6IFwiNTAwIDE1cHggSW50ZXIsIHNhbnMtc2VyaWZcIixcbiAgICB0aXRsZUNvbG9yOiBcIiMxNDE0MTRcIixcbiAgICBsaXN0SXRlbUJhY2tncm91bmQ6IFwiXCIsXG4gICAgQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50OiBcIjFweCBzb2xpZCBSR0JBKDIwLCAyMCwgMjAsIDAuMDgpXCIsXG4gIH07XG5cbiAgQElucHV0KCkgYWlBY3Rpb25TaGVldFN0eWxlOiBhbnkgPSB7XG4gICAgbGF5b3V0TW9kZUljb25UaW50OiBcInJnYmEoMjAsIDIwLCAyMCwgMC4wNClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDI1NSwyNTUsMjU1KVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgdGl0bGVGb250OiBcIjUwMCAxNXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGl0bGVDb2xvcjogXCIjMTQxNDE0XCIsXG4gICAgbGlzdEl0ZW1CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50OiBcIjFweCBzb2xpZCBSR0JBKDIwLCAyMCwgMjAsIDAuMDgpXCIsXG4gIH07XG5cbiAgQElucHV0KCkgaGlkZVZvaWNlUmVjb3JkaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIEBJbnB1dCgpIG1lZGlhUmVjb3JkZXJTdHlsZTogTWVkaWFSZWNvcmRlclN0eWxlID0ge307XG4gIEBJbnB1dCgpIGFpT3B0aW9uc1N0eWxlOiBBSU9wdGlvbnNTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBhaUljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2FpLWJvdC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9taWMuc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nQ2xvc2VJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9jbG9zZTJ4LnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ1N0YXJ0SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvbWljLnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ1N0b3BJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9zdG9wLnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ1N1Ym1pdEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NlbmQuc3ZnXCI7XG4gIEBPdXRwdXQoKSBjaGlsZEV2ZW50OiBFdmVudEVtaXR0ZXI8dm9pZD4gPSBuZXcgRXZlbnRFbWl0dGVyPHZvaWQ+KCk7XG4gIEBJbnB1dCgpIHVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbjogVXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uID0gbmV3IFVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbih7fSk7XG4gIHB1YmxpYyB1c2VyTWVtYmVyTGlzdFR5cGUhOiBVc2VyTWVtYmVyTGlzdFR5cGU7XG4gIEBJbnB1dCgpIGRpc2FibGVNZW50aW9ucz86IGJvb2xlYW47XG4gIEBJbnB1dCgpIHRleHRGb3JtYXR0ZXJzPzogQXJyYXk8Q29tZXRDaGF0VGV4dEZvcm1hdHRlcj4gPSBbXTtcblxuICBwdWJsaWMgY29tcG9zZXJJZCE6IENvbXBvc2VySWQ7XG4gIG1lbnRpb25zRm9ybWF0dGVySW5zdGFuY2VJZDogc3RyaW5nID0gXCJjb21wb3Nlcl9cIiArIERhdGUubm93KCk7XG4gIHB1YmxpYyBjb21wb3NlckFjdGlvbnM6IENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbltdID0gW107XG4gIHB1YmxpYyBzdGF0ZXM6IHR5cGVvZiBTdGF0ZXMgPSBTdGF0ZXM7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaFRlcm06IHN0cmluZyA9IFwiXCI7XG4gIHB1YmxpYyBzaG93TGlzdEZvck1lbnRpb25zOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBtZW50aW9uc1NlYXJjaENvdW50OiBudW1iZXIgPSAxO1xuICBwdWJsaWMgbGFzdEVtcHR5U2VhcmNoVGVybT86IHN0cmluZyA9IFwiXCI7XG5cbiAgcHVibGljIHNtYXJ0UmVwbHlTdGF0ZTogU3RhdGVzID0gU3RhdGVzLmxvYWRpbmc7XG4gIHB1YmxpYyBzaG93TWVudGlvbnNDb3VudFdhcm5pbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIGdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyITogQ29tZXRDaGF0Lkdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyO1xuICBwdWJsaWMgdXNlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Vc2Vyc1JlcXVlc3RCdWlsZGVyO1xuICBjY1Nob3dNZW50aW9uc0NvdW50V2FybmluZyE6IFN1YnNjcmlwdGlvbjtcblxuICBsb2FkaW5nU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkdFTkVSQVRJTkdfUkVQTElFU1wiKTtcbiAgZXJyb3JTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiU09NRVRISU5HX1dST05HXCIpO1xuICBlbXB0eVN0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJOT19NRVNTQUdFU19GT1VORFwiKTtcbiAgc2hvd0NyZWF0ZVBvbGxzOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dTdGlja2VyS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FjdGlvblNoZWV0SXRlbTogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93QWN0aW9uU2hlZXRJdGVtQUk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd1NtYXJ0UmVwbHk6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FpRmVhdHVyZXM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcmVwbGllc0FycmF5OiBzdHJpbmdbXSA9IFtdO1xuICBhaUJvdExpc3Q6IENvbWV0Q2hhdC5Vc2VyW10gPSBbXTtcbiAgY3VycmVudEFza0FJQm90OiBhbnkgPSBcIlwiO1xuICBpc0FpTW9yZVRoYW5PbmU6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBzaG93UHJldmlldzogYm9vbGVhbiA9IGZhbHNlO1xuICBhaUZlYXR1cmVzQ2xvc2VDYWxsYmFjazogKCgpID0+IHZvaWQpIHwgbnVsbCA9IG51bGw7XG4gIGVkaXRQcmV2aWV3T2JqZWN0ITogQ29tZXRDaGF0LlRleHRNZXNzYWdlO1xuICBjY01lc3NhZ2VFZGl0ITogU3Vic2NyaXB0aW9uO1xuICBjY0NvbXBvc2VNZXNzYWdlITogU3Vic2NyaXB0aW9uO1xuICBwdWJsaWMgdGV4dEZvcm1hdHRlckxpc3Q6IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgID8gWy4uLnRoaXMudGV4dEZvcm1hdHRlcnNdXG4gICAgOiBbXTtcbiAgcHVibGljIG1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gIG1lbnRpb25lZFVzZXJzOiBBcnJheTxDb21ldENoYXQuVXNlciB8IENvbWV0Q2hhdC5Hcm91cE1lbWJlcj4gPSBbXTtcblxuICBwdWJsaWMgYWNjZXB0SGFuZGxlcnM6IGFueSA9IHtcbiAgICBcImltYWdlLypcIjogdGhpcy5vbkltYWdlQ2hhbmdlLmJpbmQodGhpcyksXG4gICAgXCJ2aWRlby8qXCI6IHRoaXMub25WaWRlb0NoYW5nZS5iaW5kKHRoaXMpLFxuICAgIFwiYXVkaW8vKlwiOiB0aGlzLm9uQXVkaW9DaGFuZ2UuYmluZCh0aGlzKSxcbiAgICBcImZpbGUvKlwiOiB0aGlzLm9uRmlsZUNoYW5nZS5iaW5kKHRoaXMpLFxuICB9O1xuICBwdWJsaWMgZW5hYmxlU3RpY2tlcktleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyB0b2dnbGVNZWRpYVJlY29yZGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBzaG93QWlCb3RMaXN0OiBib29sZWFuID0gZmFsc2U7XG4gIG1lbnRpb25zVHlwZVNldEJ5VXNlcjogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc3RpY2tlckNvbmZpZ3VyYXRpb246IHtcbiAgICBpZD86IHN0cmluZztcbiAgICBjb25maWd1cmF0aW9uPzogU3RpY2tlcnNDb25maWd1cmF0aW9uO1xuICB9ID0ge307XG4gIGNsb3NlQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvcGx1cy1yb3RhdGVkLnN2Z1wiO1xuXG4gIGJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuICBhaUFjdGlvbkJ1dHRvbnM6IEJ1dHRvbnNbXSA9IFtdO1xuXG4gIHNtYXJ0UmVwbHlTdHlsZTogU21hcnRSZXBsaWVzU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gIH07XG4gIHNlbmRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuNTgpXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBsaXZlUmVhY3Rpb25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJyZWRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAganVzdGlmeUNvbnRlbnQ6IFwiY2VudGVyXCIsXG4gICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgfTtcbiAgbG9jYWxpemU6IHR5cGVvZiBsb2NhbGl6ZSA9IGxvY2FsaXplO1xuICBlbW9qaUJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG4gIHN0aWNrZXJCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBtZWRpYVJlY29yZGVyQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcblxuICBlbW9qaUtleWJvYXJkU3R5bGU6IEVtb2ppS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHRleHRGb250OiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dEZvbnQsXG4gICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dENvbG9yLFxuICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gIH07XG5cbiAgc3RpY2tlcktleWJvYXJkU3R5bGU6IFN0aWNrZXJzU3R5bGUgPSB7fTtcbiAgdGV4dElucHV0U3R5bGU6IGFueSA9IHt9O1xuICBwcmV2aWV3U3R5bGU6IFByZXZpZXdTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgfTtcbiAgY3JlYXRlUG9sbFN0eWxlOiBDcmVhdGVQb2xsU3R5bGUgPSB7fTtcbiAgc3RvcmVUeXBpbmdJbnRlcnZhbDogYW55O1xuICBlbW9qaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIzMTVweFwiLFxuICAgIGhlaWdodDogXCIzMjBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHN0aWNrZXJQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzAwcHhcIixcbiAgICBoZWlnaHQ6IFwiMzIwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBhaVBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyODBweFwiLFxuICAgIGhlaWdodDogXCIyODBweFwiLFxuXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgbWVkaWFSZWNvcmRlZFBvcG92ZXI6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNTBweFwiLFxuICAgIGhlaWdodDogXCIxMDBweFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHBvcG92ZXJTdHlsZTogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjI3NXB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4MHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgc2VuZEJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1NlbmQuc3ZnXCI7XG4gIGVtb2ppQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3RpcG9wLnN2Z1wiO1xuICBzdGlja2VyQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvU3RpY2tlcnMuc3ZnXCI7XG5cbiAgYWN0aW9ucyE6IChDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24gfCBDb21ldENoYXRBY3Rpb25zVmlldylbXTtcbiAgbWVzc2FnZVRleHQ6IHN0cmluZyA9IFwiXCI7XG4gIGF0dGFjaG1lbnRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBhdXhpbGFyeVBsYWNlbWVudDogUGxhY2VtZW50ID0gUGxhY2VtZW50LnRvcDtcbiAgbWVzc2FnZVNlbmRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgbWVzc2FnZVRvQmVFZGl0ZWQhOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgfCBudWxsO1xuICBwdWJsaWMgZWRpdFByZXZpZXdUZXh0OiBzdHJpbmcgfCBudWxsID0gXCJcIjtcbiAgc2hvd1NlbmRCdXR0b246IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0Vtb2ppS2V5Ym9hcmQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgaXNBaUVuYWJsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgc21hcnRSZXBsaWVzOiBzdHJpbmdbXSA9IFtdO1xuICBsb2dnZWRJblVzZXIhOiBDb21ldENoYXQuVXNlciB8IG51bGw7XG4gIG1lbnRpb25TdHlsZUxvY2FsOiBVc2VyTWVudGlvblN0eWxlID0gbmV3IFVzZXJNZW50aW9uU3R5bGUoe30pO1xuXG4gIHNlbmRNZXNzYWdlT25FbnRlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICB0aGlzLnNlbmRUZXh0TWVzc2FnZShldmVudC5kZXRhaWwudmFsdWUpO1xuICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKClcbiAgfTtcbiAgZGlzYWJsZVNlbmRCdXR0b24oKSB7XG4gICAgdGhpcy5zZW5kQnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBtZXNzYWdlSW5wdXRDaGFuZ2VkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBjb25zdCB0ZXh0ID0gZXZlbnQ/LmRldGFpbD8udmFsdWU/LnRyaW0oKTtcbiAgICB0aGlzLnNlbmRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0ZXh0XG4gICAgICAgID8gdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uc2VuZEljb25UaW50XG4gICAgICAgIDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIGlmICghdGV4dCkge1xuICAgICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAodGhpcy5vblRleHRDaGFuZ2UpIHtcbiAgICAgIHRoaXMub25UZXh0Q2hhbmdlKHRleHQpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gdGV4dDtcbiAgICBpZiAodGV4dCkge1xuICAgICAgdGhpcy5zdGFydFR5cGluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgIH1cbiAgfTtcbiAgYXBwZW5kRW1vamkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLnRleHQgPT09IGV2ZW50Py5kZXRhaWwuaWQpIHtcbiAgICAgIHRoaXMudGV4dCA9IFwiXCIgKyBcIlwiO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICB0aGlzLnRleHQgPSBldmVudD8uZGV0YWlsLmlkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZFJlYWN0aW9uKCkge1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyPy5nZXRVaWQoKSFcbiAgICAgIDogdGhpcy5ncm91cD8uZ2V0R3VpZCgpITtcbiAgICBsZXQgcmVjZWl2ZXJUeXBlID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgdHlwZTogXCJsaXZlX3JlYWN0aW9uXCIsXG4gICAgICByZWFjdGlvbjogXCJoZWFydFwiLFxuICAgIH07XG4gICAgbGV0IHRyYW5zaWVudE1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRyYW5zaWVudE1lc3NhZ2UoXG4gICAgICByZWNlaXZlcklkLFxuICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgZGF0YVxuICAgICk7XG4gICAgQ29tZXRDaGF0LnNlbmRUcmFuc2llbnRNZXNzYWdlKHRyYW5zaWVudE1lc3NhZ2UpO1xuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcImhlYXJ0XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIG9wZW5DcmVhdGVQb2xscyA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDcmVhdGVQb2xscyA9IHRydWU7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGNsb3NlQ3JlYXRlUG9sbHMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q3JlYXRlUG9sbHMgPSBmYWxzZTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZFJlY29yZGVkTWVkaWEgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBmaWxlID0gZXZlbnQ/LmRldGFpbD8uZmlsZTtcbiAgICBpZiAoZmlsZSkge1xuICAgICAgdGhpcy5zZW5kUmVjb3JkZWRBdWRpbyhmaWxlKTtcbiAgICB9XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGNsb3NlTWVkaWFSZWNvcmRlcihldmVudD86IGFueSkge1xuICAgIGlmICh0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQpIHtcbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlZFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSAhdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICBnZXRGb3JtYXR0ZWREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgY29uc3QgeWVhciA9IGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICBjb25zdCBtb250aCA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRNb250aCgpICsgMSk7XG4gICAgY29uc3QgZGF5ID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldERhdGUoKSk7XG4gICAgY29uc3QgaG91cnMgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0SG91cnMoKSk7XG4gICAgY29uc3QgbWludXRlcyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRNaW51dGVzKCkpO1xuICAgIGNvbnN0IHNlY29uZHMgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0U2Vjb25kcygpKTtcblxuICAgIHJldHVybiBgJHt5ZWFyfSR7bW9udGh9JHtkYXl9JHtob3Vyc30ke21pbnV0ZXN9JHtzZWNvbmRzfWA7XG4gIH1cblxuICBwYWRaZXJvKG51bTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbnVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICB9XG5cbiAgc2VuZFJlY29yZGVkQXVkaW8gPSAoZmlsZTogQmxvYikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBmaWxlO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgYGF1ZGlvLXJlY29yZGluZy0ke3RoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSgpfS53YXZgLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIGFkZEF0dGFjaG1lbnRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBvc2VyQWN0aW9ucz8uZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQuaWQpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW86XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuQXVkaW9QaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbnZpZGVvUGlja2VyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkZpbGVQaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmltYWdlOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkltYWdlUGlja2VyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXh0ZW5zaW9uX3BvbGxcIjpcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5DcmVhdGVQb2xscztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgcGFyZW50SWQgPSBvYmplY3Q/Lm1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpXG4gICAgICAgIGlmICgodGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgcGFyZW50SWQgJiYgcGFyZW50SWQgPT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHx8ICghdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgIXBhcmVudElkKSkge1xuICAgICAgICAgIGlmIChvYmplY3Q/LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQgPSBvYmplY3QubWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLm9wZW5FZGl0UHJldmlldygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NvbXBvc2VNZXNzYWdlID0gQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5zdWJzY3JpYmUoXG4gICAgICAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPVxuICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcuc3Vic2NyaWJlKFxuICAgICAgICAoZGF0YTogSU1lbnRpb25zQ291bnRXYXJuaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKGRhdGEuaWQgPT0gdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWQpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnNob3dXYXJuaW5nKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gIH1cbiAgb3BlbkVkaXRQcmV2aWV3KCkge1xuICAgIGxldCBtZXNzYWdlVGV4dFdpdGhNZW50aW9uVGFncyA9IHRoaXMuY2hlY2tGb3JNZW50aW9ucyhcbiAgICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhXG4gICAgKTtcbiAgICB0aGlzLnRleHQgPSBcIlwiO1xuICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgIHRoaXMudGV4dCA9IHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhLmdldFRleHQoKTtcbiAgICB0aGlzLmVkaXRQcmV2aWV3VGV4dCA9IG1lc3NhZ2VUZXh0V2l0aE1lbnRpb25UYWdzO1xuICAgIHRoaXMuc2hvd1ByZXZpZXcgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIEAgZm9yIGV2ZXJ5IG1lbnRpb24gdGhlIG1lc3NhZ2UgYnkgbWF0Y2hpbmcgdWlkXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zICB7dm9pZH1cbiAgICovXG4gIGNoZWNrRm9yTWVudGlvbnMobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgY29uc3QgcmVnZXggPSAvPEB1aWQ6KC4qPyk+L2c7XG4gICAgbGV0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZVRleHQ7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgIGxldCBjb21ldENoYXRVc2Vyc0dyb3VwTWVtYmVycyA9IFtdO1xuICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgbGV0IHVzZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSA9PSBtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSkge1xuICAgICAgICAgIHVzZXIgPSBtZW50aW9uZWRVc2Vyc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dFRtcC5yZXBsYWNlKG1hdGNoWzBdLCBcIkBcIiArIHVzZXIuZ2V0TmFtZSgpKTtcbiAgICAgICAgY29tZXRDaGF0VXNlcnNHcm91cE1lbWJlcnMucHVzaCh1c2VyKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgfVxuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzR3JvdXBNZW1iZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmc/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2xvc2VNb2RhbHMoKSB7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQpIHtcbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlZFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuXG4gIGNhbGxDb252ZXJzYXRpb25TdW1tYXJ5TWV0aG9kKCkge1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcblxuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLm5leHQoe1xuICAgICAgY2hpbGQ6IHsgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlWaWV3OiB0cnVlIH0sXG4gICAgfSk7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMudXNlck9yR3JvdXBDaGFuZ2VkKGNoYW5nZXMpO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJPckdyb3VwQ2hhbmdlZChjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc2hvd1ByZXZpZXcpIHtcbiAgICAgIHRoaXMuY2xvc2VQcmV2aWV3KClcbiAgICB9XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICBpZiAoY2hhbmdlc1tcImdyb3VwXCJdICYmIHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uPy51c2VyTWVtYmVyTGlzdFR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMudXNlck1lbWJlckxpc3RUeXBlID0gVXNlck1lbWJlckxpc3RUeXBlLmdyb3VwbWVtYmVycztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcihcbiAgICAgICAgICAgIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICAgKS5zZXRMaW1pdCgxNSk7XG4gICAgICB9XG4gICAgICBpZiAoY2hhbmdlc1tcInVzZXJcIl0gJiYgdGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbj8udXNlck1lbWJlckxpc3RUeXBlID09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJMaXN0VHlwZSA9IFVzZXJNZW1iZXJMaXN0VHlwZS51c2VycztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvblxuICAgICAgICAgIC51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgxNSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB0aGlzLmNsb3NlTW9kYWxzKCk7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG5cbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICB0aGlzLmNvbXBvc2VySWQgPSB0aGlzLmdldENvbXBvc2VySWQoKTtcbiAgICBpZiAodGhpcy5hdHRhY2htZW50T3B0aW9ucykge1xuICAgICAgdGhpcy5jb21wb3NlckFjdGlvbnMgPSB0aGlzLmF0dGFjaG1lbnRPcHRpb25zKFxuICAgICAgICB0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5jb21wb3NlcklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbXBvc2VyQWN0aW9ucyA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdHRhY2htZW50T3B0aW9ucyhcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB0aGlzLnVzZXIsXG4gICAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgICB0aGlzLmNvbXBvc2VySWRcbiAgICAgICAgKTtcbiAgICAgIHRoaXMuYWRkQXR0YWNobWVudENhbGxiYWNrKCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5zZXRDb21wb3NlckNvbmZpZyh0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMuY29tcG9zZXJJZCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5jbGVhbnVwKCk7XG4gIH1cblxuICBjdXN0b21TZW5kTWV0aG9kKG1lc3NhZ2U6IFN0cmluZykge1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLnNlbmRUZXh0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtTdHJpbmc9XCJcIn0gdGV4dE1zZ1xuICAgKi9cbiAgc2VuZFRleHRNZXNzYWdlKHRleHRNc2c6IFN0cmluZyA9IFwiXCIpOiBib29sZWFuIHtcbiAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgIHRyeSB7XG4gICAgICAvLyBEb250IFNlbmQgQmxhbmsgdGV4dCBtZXNzYWdlcyAtLSBpLmUgLS0tIG1lc3NhZ2VzIHRoYXQgb25seSBjb250YWluIHNwYWNlc1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0Py50cmltKCk/Lmxlbmd0aCA9PSAwICYmXG4gICAgICAgIHRleHRNc2c/LnRyaW0oKT8ubGVuZ3RoID09IDBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyB3YWl0IGZvciB0aGUgcHJldmlvdXMgbWVzc2FnZSB0byBiZSBzZW50IGJlZm9yZSBzZW5kaW5nIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VTZW5kaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSB0cnVlO1xuICAgICAgLy8gSWYgaXRzIGFuIEVkaXQgYW5kIFNlbmQgTWVzc2FnZSBPcGVyYXRpb24gLCB1c2UgRWRpdCBNZXNzYWdlIEZ1bmN0aW9uXG4gICAgICBpZiAodGhpcy5tZXNzYWdlVG9CZUVkaXRlZCkge1xuICAgICAgICB0aGlzLmVkaXRNZXNzYWdlKCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lc3NhZ2VJbnB1dDtcbiAgICAgIGlmICh0ZXh0TXNnICE9PSBudWxsKSB7XG4gICAgICAgIG1lc3NhZ2VJbnB1dCA9IHRleHRNc2cudHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZUlucHV0ID0gdGhpcy5tZXNzYWdlVGV4dC50cmltKCk7XG4gICAgICB9XG4gICAgICBsZXQgdGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIG1lc3NhZ2VJbnB1dCxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIHRleHRNZXNzYWdlLnNldFBhcmVudE1lc3NhZ2VJZCh0aGlzLnBhcmVudE1lc3NhZ2VJZCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdXNlck9iamVjdHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdXNlck9iamVjdHMucHVzaChcbiAgICAgICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgICAgICAgICAgICAgPyAodGhpcy5tZW50aW9uZWRVc2Vyc1tpXSBhcyBDb21ldENoYXQuVXNlcilcbiAgICAgICAgICAgICAgOiB0aGlzLm1lbnRpb25lZFVzZXJzW2ldXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZW50aW9uZWRVc2Vycyh1c2VyT2JqZWN0cyk7XG4gICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgdGV4dE1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgdGV4dE1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyKVxuICAgICAgfVxuICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcblxuICAgICAgLy8gcGxheSBhdWRpbyBhZnRlciBhY3Rpb24gZ2VuZXJhdGlvblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICB9XG4gICAgICAvL2NsZWFyaW5nIE1lc3NhZ2UgSW5wdXQgQm94XG4gICAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gXCJcIjtcbiAgICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXh0TWVzc2FnZSA9ICh0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldLmZvcm1hdE1lc3NhZ2VGb3JTZW5kaW5nKHRleHRNZXNzYWdlKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgLy8gRW5kIFR5cGluZyBJbmRpY2F0b3IgRnVuY3Rpb25cbiAgICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgICAgaWYgKCF0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKSB7XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICBtZXNzYWdlOiB0ZXh0TWVzc2FnZSxcbiAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZSh0ZXh0TWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgc2VuZCBidXR0b24gdG8gcmVhY3Rpb24gYnV0dG9uXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHRleHRNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogdGV4dE1lc3NhZ2UsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vblNlbmRCdXR0b25DbGljayh0ZXh0TWVzc2FnZSwgUHJldmlld01lc3NhZ2VNb2RlLm5vbmUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG9uQWlCYWNrQnV0dG9uQ2xpY2soKSB7XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIGVkaXRNZXNzYWdlKCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtZXNzYWdlVG9CZUVkaXRlZDogYW55ID0gdGhpcy5tZXNzYWdlVG9CZUVkaXRlZDtcbiAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgIGxldCBtZXNzYWdlVGV4dCA9IHRoaXMubWVzc2FnZVRleHQudHJpbSgpO1xuICAgICAgbGV0IG1lbnRpb25lZFVzZXJzID0gW107XG4gICAgICBpZiAobWVzc2FnZVRvQmVFZGl0ZWQuZ2V0TWVudGlvbmVkVXNlcnMoKSkge1xuICAgICAgICBtZW50aW9uZWRVc2VycyA9IG1lc3NhZ2VUb0JlRWRpdGVkLmdldE1lbnRpb25lZFVzZXJzKCk7XG4gICAgICAgIG1lc3NhZ2VUZXh0ID1cbiAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldE9yaWdpbmFsVGV4dChtZXNzYWdlVGV4dCk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgICAgICBtZW50aW9uZWRVc2Vyc1xuICAgICAgICApO1xuICAgICAgICBtZXNzYWdlVGV4dCA9XG4gICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRPcmlnaW5hbFRleHQobWVzc2FnZVRleHQpO1xuICAgICAgfVxuICAgICAgbGV0IHRleHRNZXNzYWdlOiBDb21ldENoYXQuVGV4dE1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRleHRNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBtZXNzYWdlVGV4dCxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgaWYgKG1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZW50aW9uZWRVc2VycyhtZW50aW9uZWRVc2Vycyk7XG4gICAgICB9XG4gICAgICB0ZXh0TWVzc2FnZS5zZXRJZChtZXNzYWdlVG9CZUVkaXRlZC5pZCk7XG4gICAgICB0aGlzLmNsb3NlUHJldmlldygpO1xuICAgICAgdGhpcy5lbmRUeXBpbmcoKTtcbiAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dE1lc3NhZ2UgPSAodGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5mb3JtYXRNZXNzYWdlRm9yU2VuZGluZyh0ZXh0TWVzc2FnZSkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIGlmICghdGhpcy5vblNlbmRCdXR0b25DbGljaykge1xuICAgICAgICBDb21ldENoYXQuZWRpdE1lc3NhZ2UodGV4dE1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKHRleHRNZXNzYWdlLCBQcmV2aWV3TWVzc2FnZU1vZGUuZWRpdClcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgZ2V0UmVjZWl2ZXJEZXRhaWxzKCkge1xuICAgIGxldCByZWNlaXZlcklkITogc3RyaW5nO1xuICAgIGxldCByZWNlaXZlclR5cGUhOiBzdHJpbmc7XG4gICAgbGV0IGlzQmxvY2tlZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLnVzZXIgJiYgdGhpcy51c2VyLmdldFVpZCgpKSB7XG4gICAgICByZWNlaXZlcklkID0gdGhpcy51c2VyLmdldFVpZCgpO1xuICAgICAgcmVjZWl2ZXJUeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyO1xuICAgICAgaXNCbG9ja2VkID0gdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgfHwgdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgcmVjZWl2ZXJJZCA9IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgICAgcmVjZWl2ZXJUeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICB9XG4gICAgcmV0dXJuIHsgcmVjZWl2ZXJJZDogcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlOiByZWNlaXZlclR5cGUsIGlzQmxvY2tlZCB9O1xuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UpIHtcbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQub3V0Z29pbmdNZXNzYWdlLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nTWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHt9IHRpbWVyPW51bGxcbiAgICogQHBhcmFtICB7c3RyaW5nPVwiXCJ9IG1ldGFkYXRhXG4gICAqL1xuICBzdGFydFR5cGluZyh0aW1lciA9IG51bGwsIG1ldGFkYXRhOiBzdHJpbmcgPSBcIlwiKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmdFdmVudHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCB0eXBpbmdJbnRlcnZhbCA9IHRpbWVyIHx8IDUwMDA7XG4gICAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgaXNCbG9ja2VkIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0eXBpbmdNZXRhZGF0YSA9IG1ldGFkYXRhIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHR5cGluZ05vdGlmaWNhdGlvbiA9IG5ldyBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKFxuICAgICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgICAgIHR5cGluZ01ldGFkYXRhXG4gICAgICAgICk7XG4gICAgICAgIENvbWV0Q2hhdC5zdGFydFR5cGluZyh0eXBpbmdOb3RpZmljYXRpb24pO1xuICAgICAgICB0aGlzLnN0b3JlVHlwaW5nSW50ZXJ2YWwgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgICAgICB9LCB0eXBpbmdJbnRlcnZhbCk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVBY3Rpb25zID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgYWN0aW9uOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24gPSBldmVudD8uZGV0YWlsPy5hY3Rpb247XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIGlmIChhY3Rpb24ub25DbGljaykge1xuICAgICAgYWN0aW9uLm9uQ2xpY2soKTtcbiAgICB9XG4gIH07XG4gIGVuZFR5cGluZyhtZXRhZGF0YSA9IG51bGwpIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZ0V2ZW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBpc0Jsb2NrZWQgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICAgIGlmIChpc0Jsb2NrZWQpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHR5cGluZ01ldGFkYXRhID0gbWV0YWRhdGEgfHwgdW5kZWZpbmVkO1xuICAgICAgICBsZXQgdHlwaW5nTm90aWZpY2F0aW9uID0gbmV3IENvbWV0Q2hhdC5UeXBpbmdJbmRpY2F0b3IoXG4gICAgICAgICAgcmVjZWl2ZXJJZCxcbiAgICAgICAgICByZWNlaXZlclR5cGUsXG4gICAgICAgICAgdHlwaW5nTWV0YWRhdGFcbiAgICAgICAgKTtcbiAgICAgICAgQ29tZXRDaGF0LmVuZFR5cGluZyh0eXBpbmdOb3RpZmljYXRpb24pO1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5zdG9yZVR5cGluZ0ludGVydmFsKTtcbiAgICAgICAgdGhpcy5zdG9yZVR5cGluZ0ludGVydmFsID0gbnVsbDtcbiAgICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7RmlsZSB8IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2V9IG1lc3NhZ2VJbnB1dFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IG1lc3NhZ2VUeXBlXG4gICAqL1xuICBzZW5kTWVkaWFNZXNzYWdlKG1lc3NhZ2VJbnB1dDogRmlsZSwgbWVzc2FnZVR5cGU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAodGhpcy5tZXNzYWdlU2VuZGluZykge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnN0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lZGlhTWVzc2FnZTogQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZSA9IG5ldyBDb21ldENoYXQuTWVkaWFNZXNzYWdlKFxuICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICBtZXNzYWdlSW5wdXQsXG4gICAgICAgIG1lc3NhZ2VUeXBlLFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG5cbiAgICAgIGlmICh0aGlzLnBhcmVudE1lc3NhZ2VJZCkge1xuICAgICAgICBtZWRpYU1lc3NhZ2Uuc2V0UGFyZW50TWVzc2FnZUlkKHRoaXMucGFyZW50TWVzc2FnZUlkKTtcbiAgICAgIH1cbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRUeXBlKG1lc3NhZ2VUeXBlKTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRNZXRhZGF0YSh7XG4gICAgICAgIFtcImZpbGVcIl06IG1lc3NhZ2VJbnB1dCxcbiAgICAgIH0pO1xuICAgICAgbWVkaWFNZXNzYWdlLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcbiAgICAgIG1lZGlhTWVzc2FnZS5zZXRNdWlkKENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5JRCgpKTtcbiAgICAgIGlmICh0aGlzLmxvZ2dlZEluVXNlcikge1xuICAgICAgICBtZWRpYU1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyKVxuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXMpIHtcbiAgICAgICAgdGhpcy5wbGF5QXVkaW8oKTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgICAgaWYgKCF0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKSB7XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICBtZXNzYWdlOiBtZWRpYU1lc3NhZ2UsXG4gICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MsXG4gICAgICAgIH0pO1xuICAgICAgICBDb21ldENoYXQuc2VuZE1lc3NhZ2UobWVkaWFNZXNzYWdlKVxuICAgICAgICAgIC50aGVuKChyZXNwb25zZTogQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgICByZXNwb25zZS5zZXRNdWlkKG1lZGlhTWVzc2FnZS5nZXRNdWlkKCkpO1xuICAgICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgICAgICBtZXNzYWdlOiByZXNwb25zZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICAgIG1lZGlhTWVzc2FnZS5zZXRNZXRhZGF0YSh7XG4gICAgICAgICAgICAgIGVycm9yOiB0cnVlLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IG1lZGlhTWVzc2FnZSxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLmVycm9yLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKG1lZGlhTWVzc2FnZSwgUHJldmlld01lc3NhZ2VNb2RlLm5vbmUpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBpbnB1dENoYW5nZUhhbmRsZXIgPSAoZXZlbnQ6IGFueSk6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGhhbmRsZXIgPVxuICAgICAgdGhpcy5hY2NlcHRIYW5kbGVyc1t0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdF0gfHxcbiAgICAgIHRoaXMub25GaWxlQ2hhbmdlLmJpbmQodGhpcyk7XG4gICAgaGFuZGxlcihldmVudCk7XG4gICAgaWYgKHRoaXMuaW5wdXRFbGVtZW50UmVmPy5uYXRpdmVFbGVtZW50ICYmIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQ/LnZhbHVlKSB7XG4gICAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnZhbHVlID0gXCJcIjtcbiAgICB9XG4gIH07XG4gIHNlbmRTdGlja2VyID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWY/Lm5hdGl2ZUVsZW1lbnQ/LmNsaWNrKCk7XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgbGV0IHN0aWNrZXIgPSBldmVudD8uZGV0YWlsPy5zdGlja2VyVVJMO1xuICAgIGxldCBzdGlja2VyTmFtZTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8uc3RpY2tlck5hbWU7XG4gICAgaWYgKHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24/LmNvbmZpZ3VyYXRpb24/LmNjU3RpY2tlckNsaWNrZWQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24/LmNvbmZpZ3VyYXRpb24/LmNjU3RpY2tlckNsaWNrZWQoXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBzdGlja2VyTmFtZSxcbiAgICAgICAgICB1cmw6IHN0aWNrZXIsXG4gICAgICAgIH0sXG4gICAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyISxcbiAgICAgICAgdGhpcy51c2VyLFxuICAgICAgICB0aGlzLmdyb3VwLFxuICAgICAgICB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgICAgdGhpcy5vbkVycm9yLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZSxcbiAgICAgICAgdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlc1xuICAgICAgKTtcbiAgICB9XG4gIH07XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvblZpZGVvQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMudmlkZW9cbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25BdWRpb0NoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzWzBdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uSW1hZ2VDaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1swXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbMF07XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5pbWFnZVxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbkZpbGVDaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1tcIjBcIl0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzW1wiMFwiXTtcbiAgICAgIHZhciByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgb3BlbkltYWdlUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJpbWFnZS8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBvcGVuRmlsZVBpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwiZmlsZS8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBvcGVudmlkZW9QaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcInZpZGVvLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIG9wZW5BdWRpb1BpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwiYXVkaW8vKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgaGFuZGxlT3V0c2lkZUNsaWNrKCkge1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIG9wZW5BY3Rpb25TaGVldCA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcblxuICAgIHRoaXMuY2xvc2VNZWRpYVJlY29yZGVyKCk7XG4gICAgaWYgKHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuZW1vamlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0FpRmVhdHVyZXMpIHtcbiAgICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9ICF0aGlzLnNob3dBaUZlYXR1cmVzO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBoYW5kbGVBaUZlYXR1cmVzQ2xvc2UgPSAoY2FsbGJhY2s6ICgpID0+IHZvaWQpID0+IHtcbiAgICB0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrID0gY2FsbGJhY2s7XG4gIH07XG5cbiAgY2xvc2VTbWFydFJlcGx5ID0gKCkgPT4ge1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgcmV0dXJuO1xuICB9O1xuICBvcGVuQWlGZWF0dXJlcyA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKHRoaXMuYWlGZWF0dXJlc0Nsb3NlQ2FsbGJhY2spIHtcbiAgICAgIHRoaXMuYWlGZWF0dXJlc0Nsb3NlQ2FsbGJhY2soKTtcbiAgICB9XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSB0cnVlO1xuXG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBvcGVuRW1vamlLZXlib2FyZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3Blbk1lZGlhUmVjb3JkZWQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9ICF0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQ7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuZW1vamlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93U3RpY2tlcktleWJvYXJkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0FpRmVhdHVyZXMpIHtcbiAgICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9ICF0aGlzLnNob3dBaUZlYXR1cmVzO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBvcGVuU3RpY2tlcktleWJvYXJkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgIHRoaXMuY2xvc2VNZWRpYVJlY29yZGVyKCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuZW1vamlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9ICF0aGlzLnNob3dFbW9qaUtleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9O1xuICBjbG9zZVBvcG92ZXJzKCkge1xuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgIH1cbiAgfVxuICBnZXRDb21wb3NlcklkKCk6IENvbXBvc2VySWQge1xuICAgIGNvbnN0IHVzZXIgPSB0aGlzLnVzZXI7XG4gICAgaWYgKHVzZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXNlcjogdXNlcj8uZ2V0VWlkKCksXG4gICAgICAgIGdyb3VwOiBudWxsLFxuICAgICAgICBwYXJlbnRNZXNzYWdlSWQ6IHRoaXMucGFyZW50TWVzc2FnZUlkLFxuICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgZ3JvdXAgPSB0aGlzLmdyb3VwO1xuICAgIGlmIChncm91cCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB1c2VyOiBudWxsLFxuICAgICAgICBncm91cDogZ3JvdXA/LmdldEd1aWQoKSxcbiAgICAgICAgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgIH07XG4gICAgfVxuICAgIHJldHVybiB7IHVzZXI6IG51bGwsIGdyb3VwOiBudWxsLCBwYXJlbnRNZXNzYWdlSWQ6IHRoaXMucGFyZW50TWVzc2FnZUlkIH07XG4gIH1cbiAgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRUaGVtZSgpO1xuICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3QgPSB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICA/IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICAgIDogW107XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHRoaXMuaGFuZGxlQ2xpY2tPdXRzaWRlKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlID1cbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldE1lbnRpb25zVGV4dEZvcm1hdHRlcih7XG4gICAgICAgIHRoZW1lOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgIH0pO1xuICAgIENvbWV0Q2hhdC5nZXRMb2dnZWRpblVzZXIoKVxuICAgICAgLnRoZW4oKHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgbnVsbCkgPT4ge1xuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciA9IHVzZXI7XG4gICAgICB9KVxuICAgICAgLmNhdGNoKChlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKGVycm9yKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB0aGlzLmluaXRpYWxpemVNZW50aW9uc0Zvcm1hdHRlcigpO1xuXG4gICAgdGhpcy5hY3Rpb25zID0gQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCkuZ2V0QUlPcHRpb25zKFxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICB0aGlzLmdldENvbXBvc2VySWQoKSBhcyB1bmtub3duIGFzIE1hcDxzdHJpbmcsIGFueT4sXG4gICAgICB0aGlzLmFpT3B0aW9uc1N0eWxlXG4gICAgKTtcbiAgICB0aGlzLmFpQm90TGlzdCA9IFtdO1xuXG5cbiAgICB0aGlzLnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5lbmFibGVTdGlja2VyS2V5Ym9hcmQgPSB0cnVlO1xuICAgIHRoaXMuc3RpY2tlckNvbmZpZ3VyYXRpb24gPVxuICAgICAgQ2hhdENvbmZpZ3VyYXRvci5nZXREYXRhU291cmNlKCk/LmdldEF1eGlsaWFyeU9wdGlvbnMoXG4gICAgICAgIHRoaXMuY29tcG9zZXJJZCxcbiAgICAgICAgdGhpcy51c2VyLFxuICAgICAgICB0aGlzLmdyb3VwXG4gICAgICApO1xuICAgIGlmICh0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5pZCA9PSBTdGlja2Vyc0NvbnN0YW50cy5zdGlja2VyKSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJLZXlib2FyZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuZW5hYmxlU3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgfVxuICAgIHRoaXMuZW5hYmxlQWlGZWF0dXJlcygpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGZvciBkZXZlbG9wZXIgcHJvdmlkZWQgaW5zdGFuY2Ugb2YgTWVudGlvbnNUZXh0Rm9ybWF0dGVyXG4gICAqIElmIG5vdCBwcm92aWRlZCwgYWRkIGRlZmF1bHRcbiAgICogSWYgcHJvdmlkZWQsIGNoZWNrIGlmIHN0eWxlIGlzIHByb3ZpZGVkIHZpYSBjb25maWd1cmF0aW9uLCB0aGVuIGFkZCBzdHlsZS5cbiAgICovXG4gIGluaXRpYWxpemVNZW50aW9uc0Zvcm1hdHRlciA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZU1lbnRpb25zKSB7XG4gICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldE1lbnRpb25zVGV4dFN0eWxlKFxuICAgICAgICB0aGlzLmdldE1lbnRpb25zU3R5bGUoKVxuICAgICAgKTtcbiAgICAgIGxldCBmb3VuZE1lbnRpb25zRm9ybWF0dGVyITogQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICBpZiAodGhpcy50ZXh0Rm9ybWF0dGVycyEubGVuZ3RoKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3RbaV0gaW5zdGFuY2VvZiBDb21ldENoYXRNZW50aW9uc0Zvcm1hdHRlclxuICAgICAgICAgICkge1xuICAgICAgICAgICAgZm91bmRNZW50aW9uc0Zvcm1hdHRlciA9IHRoaXMudGV4dEZvcm1hdHRlckxpc3RbXG4gICAgICAgICAgICAgIGlcbiAgICAgICAgICAgIF0gYXMgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlID0gZm91bmRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZm91bmRNZW50aW9uc0Zvcm1hdHRlcikge1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlID0gZm91bmRNZW50aW9uc0Zvcm1hdHRlcjtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICAhdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRLZXlVcENhbGxCYWNrKCkgfHxcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRLZXlEb3duQ2FsbEJhY2soKVxuICAgICAgKSB7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0S2V5VXBDYWxsQmFjayhcbiAgICAgICAgICB0aGlzLnNlYXJjaE1lbnRpb25zXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0S2V5RG93bkNhbGxCYWNrKFxuICAgICAgICAgIHRoaXMuc2VhcmNoTWVudGlvbnNcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRJZChcbiAgICAgICAgICB0aGlzLm1lbnRpb25zRm9ybWF0dGVySW5zdGFuY2VJZFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWZvdW5kTWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5wdXNoKHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICBnZXRNZW50aW9uc1N0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB0aGlzLm1lbnRpb25TdHlsZUxvY2FsO1xuICB9O1xuXG4gIGdldFNtYXJ0UmVwbGllcyA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dTbWFydFJlcGx5ID0gdHJ1ZTtcbiAgICB0aGlzLnJlcGxpZXNBcnJheSA9IFtdO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gZmFsc2U7XG5cbiAgICB0aGlzLnNtYXJ0UmVwbHlTdGF0ZSA9IFN0YXRlcy5sb2FkaW5nO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgcmVjZWl2ZXJJZDogc3RyaW5nID0gdGhpcy51c2VyXG4gICAgICAgID8gdGhpcy51c2VyPy5nZXRVaWQoKVxuICAgICAgICA6IHRoaXMuZ3JvdXA/LmdldEd1aWQoKTtcbiAgICAgIGxldCByZWNlaXZlclR5cGU6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG4gICAgICBDb21ldENoYXQuZ2V0U21hcnRSZXBsaWVzKHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSlcbiAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBhbnkpID0+IHtcbiAgICAgICAgICBsZXQgcmVwbGllc0FycmF5OiBzdHJpbmdbXSA9IFtdO1xuICAgICAgICAgIE9iamVjdC5rZXlzKHJlc3BvbnNlKS5mb3JFYWNoKChyZXBseSkgPT4ge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlW3JlcGx5XSAmJiByZXNwb25zZVtyZXBseV0gIT0gXCJcIikge1xuICAgICAgICAgICAgICB0aGlzLnJlcGxpZXNBcnJheS5wdXNoKHJlc3BvbnNlW3JlcGx5XSk7XG4gICAgICAgICAgICAgIHJlcGxpZXNBcnJheS5wdXNoKHJlc3BvbnNlW3JlcGx5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcmVzb2x2ZShyZXBsaWVzQXJyYXkpO1xuXG4gICAgICAgICAgdGhpcy5zbWFydFJlcGx5U3RhdGUgPSBTdGF0ZXMubG9hZGVkO1xuXG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goKGVycjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvbikgPT4ge1xuICAgICAgICAgIHRoaXMuc21hcnRSZXBseVN0YXRlID0gU3RhdGVzLmVycm9yO1xuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9O1xuXG4gIGVuYWJsZUFpRmVhdHVyZXMoKSB7XG4gICAgaWYgKHRoaXMuYWN0aW9ucyAmJiB0aGlzLmFjdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5pc0FpRW5hYmxlZCA9IHRydWU7XG5cbiAgICAgIHRoaXMuYWN0aW9ucy5mb3JFYWNoKChhY3Rpb24pID0+IHtcbiAgICAgICAgaWYgKGFjdGlvbi5pZCA9PT0gXCJhaS1zbWFydC1yZXBseVwiKSB7XG4gICAgICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICAgICAgLi4uYWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi50aXRsZSEsXG4gICAgICAgICAgICBvbkNsaWNrOiB0aGlzLmdldFNtYXJ0UmVwbGllcyxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdGhpcy5idXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvbi5pZCA9PT0gXCJhaS1jb252ZXJzYXRpb24tc3VtbWFyeVwiKSB7XG4gICAgICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICAgICAgLi4uYWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi50aXRsZSEsXG4gICAgICAgICAgICBpZDogYWN0aW9uLmlkLFxuICAgICAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT4gdGhpcy5jYWxsQ29udmVyc2F0aW9uU3VtbWFyeU1ldGhvZCgpLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5idXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFjdGlvbi5pZCA9PT0gXCJhaS1ib3RzXCIpIHtcbiAgICAgICAgICBjb25zdCBuZXdCdXR0b24gPSB7XG4gICAgICAgICAgICAuLi5hY3Rpb24sXG4gICAgICAgICAgICB0aXRsZTogYWN0aW9uLnRpdGxlISxcbiAgICAgICAgICAgIGlkOiBhY3Rpb24uaWQsXG4gICAgICAgICAgICBvbkNsaWNrOiBhc3luYyAoKSA9PlxuICAgICAgICAgICAgICB0aGlzLnNob3dBaUJvdE1lc3NhZ2VMaXN0TWV0aG9kKChhY3Rpb24gYXMgYW55KS5vbkNsaWNrKCkpLFxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5idXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHNob3dBaUJvdE1lc3NhZ2VMaXN0TWV0aG9kID0gKGFjdGlvbjogYW55KSA9PiB7XG4gICAgdGhpcy5haUJvdExpc3QgPSBhY3Rpb247XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUJvdExpc3QgPSB0cnVlO1xuXG4gICAgdGhpcy5haUFjdGlvbkJ1dHRvbnMubGVuZ3RoID0gMDtcblxuICAgIHRoaXMuYWlCb3RMaXN0LmZvckVhY2goKGU6IGFueSwgaTogYW55KSA9PiB7XG4gICAgICBjb25zdCBuZXdCdXR0b24gPSB7XG4gICAgICAgIGlkOiBlLmlkLFxuICAgICAgICB0aXRsZTogZS50aXRsZSxcbiAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLm5leHQoe1xuICAgICAgICAgICAgY2hpbGQ6IHsgYm90OiBlLCBzaG93Qm90VmlldzogdHJ1ZSB9LFxuICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgdGhpcy5haUFjdGlvbkJ1dHRvbnMucHVzaChuZXdCdXR0b24pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIHNlbmRSZXBseSA9IChldmVudDogYW55KSA9PiB7XG4gICAgbGV0IHJlcGx5OiBzdHJpbmcgPSBldmVudD8uZGV0YWlsPy5yZXBseTtcbiAgICBDb21ldENoYXRVSUV2ZW50cy5jY0NvbXBvc2VNZXNzYWdlLm5leHQocmVwbHkpO1xuICAgIHRoaXMucmVwbGllc0FycmF5ID0gW107XG4gICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtQUkgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG5cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgY29tcG9zZXJXcmFwcGVyU3R5bGUoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaGVpZ2h0LFxuICAgICAgd2lkdGg6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LndpZHRoLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYmFja2dyb3VuZCxcbiAgICAgIGJvcmRlcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYm9yZGVyLFxuICAgICAgYm9yZGVyUmFkaXVzOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5ib3JkZXJSYWRpdXMsXG4gICAgfTtcbiAgfVxuICBzZXRUaGVtZSgpIHtcbiAgICB0aGlzLmVtb2ppUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zdGlja2VyUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5haVBvcG92ZXIuYmFja2dyb3VuZCA9IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpO1xuICAgIHRoaXMuYWlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDMycHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLnNldENvbXBvc2VyU3R5bGUoKTtcbiAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgICBsYXlvdXRNb2RlSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5sYXlvdXRNb2RlSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUudGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTIpLFxuICAgICAgdGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLkFjdGlvblNoZWV0U2VwYXJhdG9yVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH07XG4gICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgICBsYXlvdXRNb2RlSWNvblRpbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLmxheW91dE1vZGVJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcImluaGVyaXRcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLnRpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDpcbiAgICAgICAgdGhpcy5haUFjdGlvblNoZWV0U3R5bGUuQWN0aW9uU2hlZXRTZXBhcmF0b3JUaW50IHx8XG4gICAgICAgIGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpfWAsXG4gICAgfTtcbiAgICB0aGlzLnRleHRJbnB1dFN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIG1heEhlaWdodDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ubWF4SW5wdXRIZWlnaHQgfHwgXCIxMDBweFwiLFxuICAgICAgYm9yZGVyOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5pbnB1dEJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCb3JkZXJSYWRpdXMsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5pbnB1dEJhY2tncm91bmQsXG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8udGV4dEZvbnQsXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnRleHRDb2xvcixcbiAgICAgIGRpdmlkZXJDb2xvcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZGl2aWRlclRpbnQsXG4gICAgfTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKClcbiAgICB0aGlzLnByZXZpZXdTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IGAxcHggc29saWQgJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpfWAsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIHByZXZpZXdUaXRsZUZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdUaXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBwcmV2aWV3VGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1RpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUNvbG9yOlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3U3VidGl0bGVDb2xvciB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJldmlld1N1YnRpdGxlRm9udDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1N1YnRpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGNsb3NlQnV0dG9uSWNvblRpbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmNsb3NlUHJldmlld1RpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogJzEycHgnXG4gICAgfTtcbiAgICBsZXQgYnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICBsZXQgZGVmYXVsdE1lZGlhUmVjb3JkZXJTdHlsZSA9IG5ldyBNZWRpYVJlY29yZGVyU3R5bGUoe1xuICAgICAgc3RhcnRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgc3VibWl0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBzdG9wSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICB0aW1lclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIHRpbWVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgIH0pO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlZFBvcG92ZXIuYmFja2dyb3VuZCA9XG4gICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZS5ib3JkZXIgPSBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKX1gO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdE1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgICAgIC4uLnRoaXMubWVkaWFSZWNvcmRlclN0eWxlLFxuICAgIH07XG4gICAgdGhpcy5lbW9qaVBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggOHB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zdGlja2VyUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCA4cHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDhweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuZW1vamlCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuc3RpY2tlckJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMubWVkaWFSZWNvcmRlckJ1dHRvblN0eWxlID0ge1xuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICAuLi5idXR0b25TdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuZW1vamlLZXlib2FyZFN0eWxlID0ge1xuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5lbW9qaUtleWJvYXJkVGV4dENvbG9yLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgYWN0aXZlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgaWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKClcbiAgICB9O1xuXG4gICAgdGhpcy5zdGlja2VyS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgZW1wdHlTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVtcHR5U3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBlcnJvclN0YXRlVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGxvYWRpbmdJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGNhdGVnb3J5QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgfTtcbiAgICB0aGlzLmF0dGFjaG1lbnRCdXR0b25TdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5hdHRhY2hJY29udGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgdGhpcy5jcmVhdGVQb2xsU3R5bGUgPSB7XG4gICAgICBwbGFjZWhvbGRlclRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMVxuICAgICAgKSxcbiAgICAgIHBsYWNlaG9sZGVyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZGVsZXRlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0aXRsZUZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50aXRsZTEpLFxuICAgICAgdGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGNsb3NlSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgcXVlc3Rpb25JbnB1dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBvcHRpb25JbnB1dEJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCksXG4gICAgICBhbnN3ZXJIZWxwVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjFcbiAgICAgICksXG4gICAgICBhbnN3ZXJIZWxwVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgYWRkQW5zd2VySWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvblRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRleHQyXG4gICAgICApLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvblRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoXCJkYXJrXCIpLFxuICAgICAgY3JlYXRlUG9sbEJ1dHRvbkJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgYWRkQW5zd2VyVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MiksXG4gICAgICBhZGRBbnN3ZXJUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZXJyb3JUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBlcnJvclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRFcnJvcigpLFxuICAgICAgb3B0aW9uUGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBvcHRpb25QbGFjZWhvbGRlclRleHRDb2xvcjpcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHF1ZXN0aW9uSW5wdXRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBxdWVzdGlvbklucHV0VGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgb3B0aW9uSW5wdXRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBvcHRpb25JbnB1dFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHdpZHRoOiBcIjM2MHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiNjIwcHhcIixcbiAgICAgIGJvcmRlcjogXCJcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50OTAwKCksXG4gICAgfTtcbiAgfVxuICBzZXRDb21wb3NlclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IE1lc3NhZ2VDb21wb3NlclN0eWxlID0gbmV3IE1lc3NhZ2VDb21wb3NlclN0eWxlKHtcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyOiBgbm9uZWAsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGxpdmVSZWFjdGlvbkljb25UaW50OiBcInJlZFwiLFxuICAgICAgYXR0YWNoSWNvbnRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgICBzZW5kSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICAgICAgZW1vamlJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIGlucHV0QmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgIGlucHV0Qm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGlucHV0Qm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGRpdmlkZXJUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgICAgdGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgdGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudCgpLFxuXG4gICAgICBlbW9qaUtleWJvYXJkVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgZW1vamlLZXlib2FyZFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdUaXRsZUZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgcHJldmlld1RpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMlxuICAgICAgKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUNvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgY2xvc2VQcmV2aWV3VGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gICAgfSk7XG4gICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGUsXG4gICAgfTtcbiAgICBpZiAoIXRoaXMuaGlkZUxpdmVSZWFjdGlvbikge1xuICAgICAgdGhpcy5saXZlUmVhY3Rpb25TdHlsZSA9IHtcbiAgICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgICBidXR0b25JY29uVGludDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ubGl2ZVJlYWN0aW9uSWNvblRpbnQsXG4gICAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgICAgZGlzcGxheTogXCJmbGV4XCIsXG4gICAgICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgICAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgICAgfVxuICAgIH1cbiAgfVxuICBjbG9zZVByZXZpZXcoKSB7XG4gICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zaG93UHJldmlldyA9IGZhbHNlO1xuICAgIHRoaXMuZWRpdFByZXZpZXdUZXh0ID0gXCJcIjtcbiAgICB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkID0gbnVsbDtcbiAgICB0aGlzLnRleHQgPSBcIlwiO1xuICAgIHRoaXMubWVzc2FnZVRleHQgPSBcIlwiO1xuICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgIHRoaXMuZGlzYWJsZVNlbmRCdXR0b24oKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgYmFja0J1dHRvblN0eWxlID0gKCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcblxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBBY2NlcHRzIHNlYXJjaCB0ZXJtIGZyb20gbWVudGlvbnNUZXh0Rm9ybWF0dGVyIGFuZCBvcGVucyB0aGUgbWVudGlvbnMgc2VsZWN0IGxpc3RcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlYXJjaFRlcm1cbiAgICogQHJldHVybnMge3ZvaWR9XG4gICAqL1xuICBzZWFyY2hNZW50aW9ucyA9IChzZWFyY2hUZXJtOiBzdHJpbmcpID0+IHtcbiAgICBpZiAoIShzZWFyY2hUZXJtICYmIHNlYXJjaFRlcm0ubGVuZ3RoKSkge1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoQ291bnQgPSAxO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgICF0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gfHxcbiAgICAgICFzZWFyY2hUZXJtXG4gICAgICAgIC5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnN0YXJ0c1dpdGgodGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtLnRvTG93ZXJDYXNlKCkpXG4gICAgKSB7XG4gICAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9XG4gICAgICAgIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdICYmIHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdLmxlbmd0aFxuICAgICAgICAgID8gc2VhcmNoVGVybS5zcGxpdChcIkBcIilbMV1cbiAgICAgICAgICA6IFwiXCI7XG4gICAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSB0cnVlO1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaENvdW50Kys7XG4gICAgICB0aGlzLmxhc3RFbXB0eVNlYXJjaFRlcm0gPSB1bmRlZmluZWQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBjbGlja2luZyBhIHVzZXIgZnJvbSB0aGUgbWVudGlvbnMgbGlzdC5cbiAgICogQWRkIHRoZSB1c2VyIHRvIG1lbnRpb25zIHRleHQgZm9ybWF0dGVyIGluc3RhbmNlIGFuZCB0aGVuIGNhbGwgcmVyZW5kZXIgdG8gc3R5bGUgdGhlIG1lbnRpb25cbiAgICogd2l0aGluIG1lc3NhZ2UgaW5wdXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29tZXRDaGF0LlVzZXJ9IHVzZXJcbiAgICovXG4gIGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXIgPSAoXG4gICAgdXNlcjogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgKSA9PiB7XG4gICAgbGV0IGNvbWV0Q2hhdFVzZXJzID0gW3VzZXJdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXG4gICAgICAuLi50aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKSxcbiAgICBdO1xuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UucmVSZW5kZXIoKTtcbiAgICB0aGlzLnNob3dMaXN0Rm9yTWVudGlvbnMgPSBmYWxzZTtcbiAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9IFwiXCI7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbG9zZSBtZW50aW9ucyBsaXN0IGlmIHNlYXJjaCByZXR1cm5zIGVtcHR5IGxpc3RcbiAgICovXG4gIGRlZmF1bHRPbkVtcHR5Rm9yTWVudGlvbnMgPSAoKSA9PiB7XG4gICAgdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtID0gdGhpcy5tZW50aW9uc1NlYXJjaFRlcm07XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBnZXRNZW50aW9uSW5mb0ljb25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcImZpdC1jb250ZW50XCIsXG4gICAgICB3aWR0aDogXCJmaXQtY29udGVudFwiLFxuICAgICAgYnV0dG9uVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTIpLFxuICAgICAgYnV0dG9uVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgcGFkZGluZzogXCI4cHhcIixcbiAgICAgIGljb25IZWlnaHQ6IFwiMjBweFwiLFxuICAgICAgaWNvbldpZHRoOiBcIjIwcHhcIixcbiAgICAgIGljb25CYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBnYXA6IFwiNXB4XCIsXG4gICAgfTtcbiAgfTtcblxuICBoYW5kbGVDbGlja091dHNpZGUgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmKSB7XG4gICAgICBjb25zdCB1c2VyTWVtYmVyV3JhcHBlclJlY3QgPVxuICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyUmVmPy5uYXRpdmVFbGVtZW50Py5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IGlzT3V0c2lkZUNsaWNrID1cbiAgICAgICAgZXZlbnQ/LmNsaWVudFggPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5sZWZ0IHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRYID49IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8ucmlnaHQgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPj0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py50b3AgfHxcbiAgICAgICAgZXZlbnQ/LmNsaWVudFkgPD0gdXNlck1lbWJlcldyYXBwZXJSZWN0Py5ib3R0b207XG4gICAgICBpZiAoaXNPdXRzaWRlQ2xpY2spIHtcbiAgICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBCdXR0b25zIHtcbiAgdGl0bGU6IHN0cmluZztcbiAgaWQ6IHN0cmluZztcbiAgb25DbGljazogKCkgPT4gUHJvbWlzZTx1bmtub3duPjtcbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX193cmFwcGVyXCIgW25nU3R5bGVdPVwiY29tcG9zZXJXcmFwcGVyU3R5bGUoKVwiPlxuICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9uc1wiICpuZ0lmPVwic2hvd0xpc3RGb3JNZW50aW9uc1wiXG4gICAgI3VzZXJNZW1iZXJXcmFwcGVyUmVmPlxuICAgIDxjb21ldGNoYXQtdXNlci1tZW1iZXItd3JhcHBlciBbdXNlck1lbWJlckxpc3RUeXBlXT1cInVzZXJNZW1iZXJMaXN0VHlwZVwiXG4gICAgICBbb25JdGVtQ2xpY2tdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLm9uSXRlbUNsaWNrIHx8IGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXJcIlxuICAgICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgICBbc2VhcmNoS2V5d29yZF09XCJtZW50aW9uc1NlYXJjaFRlcm1cIlxuICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICBbbGlzdEl0ZW1WaWV3XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICBbdXNlclByZXNlbmNlUGxhY2VtZW50XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2VyUHJlc2VuY2VQbGFjZW1lbnRcIlxuICAgICAgW2hpZGVTZXBlcmF0b3JdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgW29uRW1wdHldPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiXG4gICAgICBbbG9hZGluZ0ljb25VcmxdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFtncm91cF09XCJncm91cFwiIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgIFtkaXNhYmxlTG9hZGluZ1N0YXRlXT1cInRydWVcIlxuICAgICAgW29uRXJyb3JdPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiPjwvY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwic2hvd01lbnRpb25zQ291bnRXYXJuaW5nXCJcbiAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9ucy1saW1pdC1leGNlZWRlZFwiPlxuICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvblxuICAgICAgICBbdGV4dF09XCJtZW50aW9uc1dhcm5pbmdUZXh0IHx8IGxvY2FsaXplKCdNRU5USU9OU19MSU1JVF9XQVJOSU5HX01FU1NBR0UnKVwiXG4gICAgICAgIFtpY29uVVJMXT1cIkluZm9TaW1wbGVJY29uXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldE1lbnRpb25JbmZvSWNvblN0eWxlKClcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCJcbiAgICAqbmdJZj1cImhlYWRlclZpZXc7IGVsc2UgbWVzc2FnZVByZXZpZXdcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbWVzc2FnZVByZXZpZXc+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCIgKm5nSWY9XCJzaG93UHJldmlld1wiPlxuICAgICAgPGNvbWV0Y2hhdC1wcmV2aWV3IFtwcmV2aWV3U3R5bGVdPVwicHJldmlld1N0eWxlXCJcbiAgICAgICAgW3ByZXZpZXdTdWJ0aXRsZV09XCJlZGl0UHJldmlld1RleHRcIlxuICAgICAgICAoY2MtcHJldmlldy1jbG9zZS1jbGlja2VkKT1cImNsb3NlUHJldmlldygpXCI+IDwvY29tZXRjaGF0LXByZXZpZXc+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19pbnB1dFwiPlxuXG4gICAgPGNvbWV0Y2hhdC10ZXh0LWlucHV0IChjYy10ZXh0LWlucHV0LWVudGVyZWQpPVwic2VuZE1lc3NhZ2VPbkVudGVyKCRldmVudClcIlxuICAgICAgI2lucHV0UmVmIFt0ZXh0XT1cInRleHRcIlxuICAgICAgKGNjLXRleHQtaW5wdXQtY2hhbmdlZCk9XCJtZXNzYWdlSW5wdXRDaGFuZ2VkKCRldmVudClcIlxuICAgICAgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgW3BsYWNlaG9sZGVyVGV4dF09XCJwbGFjZWhvbGRlclRleHRcIlxuICAgICAgW2F1eGlsaWFyeUJ1dHRvbkFsaWdubWVudF09XCJhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJ0ZXh0Rm9ybWF0dGVyc1wiPlxuXG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInNlY29uZGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlY29uZGFyeUJ1dHRvblZpZXc7ZWxzZSBzZWNvbmRhcnlCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlY29uZGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2Vjb25kYXJ5QnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdHRhY2hidXR0b25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlclxuICAgICAgICAgICAgICAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgICBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUREX1RPX0NIQVQnKVwiIFthY3Rpb25zXT1cImNvbXBvc2VyQWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWN0aW9uU2hlZXRTdHlsZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gI2FjdGlvblNoZWV0UmVmIHNsb3Q9XCJjaGlsZHJlblwiXG4gICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5BY3Rpb25TaGVldCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICBbaWNvblVSTF09XCIhc2hvd0FjdGlvblNoZWV0SXRlbSB8fCAoc2hvd0Vtb2ppS2V5Ym9hcmQgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW0pICA/IGF0dGFjaG1lbnRJY29uVVJMICA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImF0dGFjaG1lbnRCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2F1eGlsaWFyeVwiIGRhdGEtc2xvdD1cImF1eGlsYXJ5Vmlld1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fY3VzdG9tLWF1eGlsaWFyeS12aWV3XCJcbiAgICAgICAgICAqbmdJZj1cImF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiYXV4aWxhcnlCdXR0b25WaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAsIGNvbXBvc2VySWQ6Y29tcG9zZXJJZCB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8IS0tIEFJIENhcmRzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc3RpY2tlcmtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cIiFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItY2xpY2spPVwib3BlblN0aWNrZXJLZXlib2FyZCgkZXZlbnQpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwiYWlQb3BvdmVyXCIgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJzbWFydFJlcGx5U3RhdGVcIlxuICAgICAgICAgICAgICAqbmdJZj1cInNob3dTbWFydFJlcGx5ICYmICFzaG93QWN0aW9uU2hlZXRJdGVtQUkgJiYgIXNob3dBaUJvdExpc3RcIlxuICAgICAgICAgICAgICBzbG90PVwiY29udGVudFwiIFtsb2FkaW5nU3RhdGVUZXh0XT1cImxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgICAgICAgPGRpdiBzbG90PVwibG9hZGVkVmlld1wiIGNsYXNzPVwic21hcnQtcmVwbGllcy13cmFwcGVyXCI+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc21hcnRyZXBseS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19iYWNrLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwicmVwbGllc0FycmF5ICYmIHJlcGxpZXNBcnJheS5sZW5ndGggPiAwIFwiXG4gICAgICAgICAgICAgICAgICAgICAgW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvbkFpQmFja0J1dHRvbkNsaWNrKClcIlxuICAgICAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiPlxuICAgICAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWhlYWRlci12aWV3XCI+XG4gICAgICAgICAgICAgICAgICAgIDxwPnt7IGxvY2FsaXplKFwiU1VHR0VTVF9BX1JFUExZXCIpIH19PC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc21hcnRyZXBseS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICA8c21hcnQtcmVwbGllc1xuICAgICAgICAgICAgICAgICAgICAqbmdJZj1cInJlcGxpZXNBcnJheSAmJiByZXBsaWVzQXJyYXkubGVuZ3RoID4gMCBcIlxuICAgICAgICAgICAgICAgICAgICBbc21hcnRSZXBseVN0eWxlXT1cInNtYXJ0UmVwbHlTdHlsZVwiIFtyZXBsaWVzXT1cInJlcGxpZXNBcnJheVwiXG4gICAgICAgICAgICAgICAgICAgIFtjbG9zZUljb25VUkxdPVwiJydcIiAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kUmVwbHkoJGV2ZW50KVwiPlxuICAgICAgICAgICAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG5cblxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuXG4gICAgICAgICAgICA8ZGl2ICpuZ0lmPVwic2hvd0FpQm90TGlzdCAgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW1BSVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19haWJvdGxpc3RcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAqbmdJZj1cIiBhaUJvdExpc3QgJiYgYWlCb3RMaXN0Lmxlbmd0aD4gMSBcIlxuICAgICAgICAgICAgICAgICAgW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQWlCYWNrQnV0dG9uQ2xpY2soKVwiXG4gICAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIj5cbiAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgPHA+e3sgbG9jYWxpemUoXCJDT01FVENIQVRfQVNLX0FJX0JPVFwiKSB9fTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYWN0aW9uLXNoZWV0XG4gICAgICAgICAgICAgICAgKm5nSWY9XCJzaG93QWlCb3RMaXN0ICAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbUFJXCIgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFthY3Rpb25zXT1cImFpQWN0aW9uQnV0dG9uc1wiIFt0aXRsZV09XCInQUknXCJcbiAgICAgICAgICAgICAgICBbYWN0aW9uU2hlZXRTdHlsZV09XCJhaUFjdGlvblNoZWV0U3R5bGVcIiBbaGlkZUxheW91dE1vZGVdPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFjdGlvbi1zaGVldCAqbmdJZj1cInNob3dBY3Rpb25TaGVldEl0ZW1BSVwiIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYnV0dG9uc1wiIFt0aXRsZV09XCInQUknXCJcbiAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWlBY3Rpb25TaGVldFN0eWxlXCIgW2hpZGVMYXlvdXRNb2RlXT1cInRydWVcIlxuICAgICAgICAgICAgICAoY2MtYWN0aW9uc2hlZXQtY2xpY2tlZCk9XCJoYW5kbGVBY3Rpb25zKCRldmVudClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gKm5nSWY9XCJpc0FpRW5hYmxlZFwiIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ0FJJylcIlxuICAgICAgICAgICAgICBzbG90PVwiY2hpbGRyZW5cIiAjYWlCdXR0b25SZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5BaUZlYXR1cmVzKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIhc2hvd0FpRmVhdHVyZXMgPyBhaUljb25VUkwgOiBjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwic3RpY2tlckJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zdGlja2Vya2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiZW5hYmxlU3RpY2tlcktleWJvYXJkICYmICFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwic3RpY2tlclBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8c3RpY2tlcnMta2V5Ym9hcmQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICBbc3RpY2tlclN0eWxlXT1cInN0aWNrZXJLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLXN0aWNrZXItY2xpY2tlZCk9XCJzZW5kU3RpY2tlcigkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L3N0aWNrZXJzLWtleWJvYXJkPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU1RJQ0tFUicpXCIgc2xvdD1cImNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgI3N0aWNrZXJCdXR0b25SZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5TdGlja2VyS2V5Ym9hcmQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIFtpY29uVVJMXT1cIiAhc2hvd1N0aWNrZXJLZXlib2FyZCA/IHN0aWNrZXJCdXR0b25JY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInN0aWNrZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2Vtb2ppa2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiIWF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlciAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiIFtwb3BvdmVyU3R5bGVdPVwiZW1vamlQb3BvdmVyXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWVtb2ppLWtleWJvYXJkIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2Vtb2ppS2V5Ym9hcmRTdHlsZV09XCJlbW9qaUtleWJvYXJkU3R5bGVcIlxuICAgICAgICAgICAgICAoY2MtZW1vamktY2xpY2tlZCk9XCJhcHBlbmRFbW9qaSgkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZD5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICNlbW9qaUJ1dHRvblJlZiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdFTU9KSScpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5FbW9qaUtleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXNob3dFbW9qaUtleWJvYXJkICB8fCAoIXNob3dFbW9qaUtleWJvYXJkICYmIHNob3dBY3Rpb25TaGVldEl0ZW0pID8gZW1vamlCdXR0b25JY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImVtb2ppQnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19tZWRpYXJlY29yZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIiFoaWRlVm9pY2VSZWNvcmRpbmdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwibWVkaWFSZWNvcmRlZFBvcG92ZXJcIlxuICAgICAgICAgICAgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LW1lZGlhLXJlY29yZGVyICpuZ0lmPVwidG9nZ2xlTWVkaWFSZWNvcmRlZFwiXG4gICAgICAgICAgICAgIFthdXRvUmVjb3JkaW5nXT1cInRydWVcIiBzdGFydEljb25UZXh0PVwiXCIgc3RvcEljb25UZXh0PVwiXCJcbiAgICAgICAgICAgICAgc3VibWl0QnV0dG9uSWNvblRleHQ9XCJcIlxuICAgICAgICAgICAgICBbc3VibWl0QnV0dG9uSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N1Ym1pdEljb25VUkxcIlxuICAgICAgICAgICAgICBbc3RhcnRJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nU3RhcnRJY29uVVJMXCJcbiAgICAgICAgICAgICAgW3N0b3BJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nU3RvcEljb25VUkxcIlxuICAgICAgICAgICAgICBbY2xvc2VJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nQ2xvc2VJY29uVVJMXCJcbiAgICAgICAgICAgICAgKGNjLW1lZGlhLXJlY29yZGVyLXN1Ym1pdHRlZCk9XCJzZW5kUmVjb3JkZWRNZWRpYSgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgKGNjLW1lZGlhLXJlY29yZGVyLWNsb3NlZCk9XCJjbG9zZU1lZGlhUmVjb3JkZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW21lZGlhUGxheWVyU3R5bGVdPVwibWVkaWFSZWNvcmRlclN0eWxlXCI+PC9jb21ldGNoYXQtbWVkaWEtcmVjb3JkZXI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ1ZPSUNFX1JFQ09SRElORycpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgI21lZGlhUmVjb3JkZWRSZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5NZWRpYVJlY29yZGVkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXRvZ2dsZU1lZGlhUmVjb3JkZWQgPyB2b2ljZVJlY29yZGluZ0ljb25VUkwgOiBjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwibWVkaWFSZWNvcmRlckJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgZGF0YS1zbG90PVwicHJpbWFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlbmRCdXR0b25WaWV3O2Vsc2Ugc2VuZEJ1dHRvblwiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwic2VuZEJ1dHRvblZpZXc7Y29udGV4dDp7IGl0ZW06IHVzZXIgPz8gZ3JvdXAsIGNvbXBvc2VySWQ6Y29tcG9zZXJJZCB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8bmctdGVtcGxhdGUgI3NlbmRCdXR0b24+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX3NlbmRidXR0b25cIlxuICAgICAgICAgICAgKm5nSWY9XCJzaG93U2VuZEJ1dHRvbiB8fCBoaWRlTGl2ZVJlYWN0aW9uXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJzZW5kQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJzZW5kQnV0dG9uU3R5bGVcIlxuICAgICAgICAgICAgICBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdTRU5EX01FU1NBR0UnKVwiXG4gICAgICAgICAgICAgIFtkaXNhYmxlZF09XCIhc2hvd1NlbmRCdXR0b25cIlxuICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY3VzdG9tU2VuZE1ldGhvZChtZXNzYWdlVGV4dClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbGl2ZXJlYWN0aW9uXCJcbiAgICAgICAgICAgICpuZ0lmPVwiIWhpZGVMaXZlUmVhY3Rpb24gJiYgIXNob3dTZW5kQnV0dG9uXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJMaXZlUmVhY3Rpb25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnTElWRV9SRUFDVElPTicpXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImxpdmVSZWFjdGlvblN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cInNlbmRSZWFjdGlvbigpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG4gICAgPC9jb21ldGNoYXQtdGV4dC1pbnB1dD5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPGlucHV0IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbWVkaWFpbnB1dFwiICNpbnB1dEVsZW1lbnRcbiAgKGNoYW5nZSk9XCJpbnB1dENoYW5nZUhhbmRsZXIoJGV2ZW50KVwiIC8+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwic2hvd0NyZWF0ZVBvbGxzXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y3JlYXRlLXBvbGwgW3VzZXJdPVwidXNlclwiIFtncm91cF09XCJncm91cFwiXG4gICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VDcmVhdGVQb2xscygpXCJcbiAgICBbY3JlYXRlUG9sbFN0eWxlXT1cImNyZWF0ZVBvbGxTdHlsZVwiPjwvY3JlYXRlLXBvbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==