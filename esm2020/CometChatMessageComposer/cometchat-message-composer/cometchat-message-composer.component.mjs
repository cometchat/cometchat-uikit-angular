import "@cometchat/uikit-shared";
import "@cometchat/uikit-elements";
import { CometChatMentionsFormatter, CometChatSoundManager, CometChatUIKitUtility, MessageComposerStyle, StickersConstants, UserMemberWrapperConfiguration, UserMentionStyle, } from "@cometchat/uikit-shared";
import { MediaRecorderStyle, } from "@cometchat/uikit-elements";
import { AuxiliaryButtonAlignment, CometChatMessageEvents, CometChatUIEvents, CometChatUIKitConstants, MessageStatus, Placement, States, UserMemberListType, fontHelper, localize, } from "@cometchat/uikit-resources";
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
CometChatMessageComposerComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.11", type: CometChatMessageComposerComponent, selector: "cometchat-message-composer", inputs: { user: "user", group: "group", disableSoundForMessages: "disableSoundForMessages", customSoundForMessage: "customSoundForMessage", disableTypingEvents: "disableTypingEvents", text: "text", placeholderText: "placeholderText", headerView: "headerView", onTextChange: "onTextChange", attachmentIconURL: "attachmentIconURL", attachmentOptions: "attachmentOptions", secondaryButtonView: "secondaryButtonView", auxilaryButtonView: "auxilaryButtonView", auxiliaryButtonsAlignment: "auxiliaryButtonsAlignment", sendButtonView: "sendButtonView", parentMessageId: "parentMessageId", hideLiveReaction: "hideLiveReaction", LiveReactionIconURL: "LiveReactionIconURL", backButtonIconURL: "backButtonIconURL", mentionsWarningText: "mentionsWarningText", mentionsWarningStyle: "mentionsWarningStyle", messageComposerStyle: "messageComposerStyle", onSendButtonClick: "onSendButtonClick", onError: "onError", backdropStyle: "backdropStyle", actionSheetStyle: "actionSheetStyle", aiActionSheetStyle: "aiActionSheetStyle", hideVoiceRecording: "hideVoiceRecording", mediaRecorderStyle: "mediaRecorderStyle", aiOptionsStyle: "aiOptionsStyle", aiIconURL: "aiIconURL", voiceRecordingIconURL: "voiceRecordingIconURL", voiceRecordingCloseIconURL: "voiceRecordingCloseIconURL", voiceRecordingStartIconURL: "voiceRecordingStartIconURL", voiceRecordingStopIconURL: "voiceRecordingStopIconURL", voiceRecordingSubmitIconURL: "voiceRecordingSubmitIconURL", userMemberWrapperConfiguration: "userMemberWrapperConfiguration", disableMentions: "disableMentions", textFormatters: "textFormatters" }, outputs: { childEvent: "childEvent" }, viewQueries: [{ propertyName: "inputElementRef", first: true, predicate: ["inputElement"], descendants: true }, { propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }, { propertyName: "emojiButtonRef", first: true, predicate: ["emojiButtonRef"], descendants: true }, { propertyName: "actionSheetRef", first: true, predicate: ["actionSheetRef"], descendants: true }, { propertyName: "stickerButtonRef", first: true, predicate: ["stickerButtonRef"], descendants: true }, { propertyName: "mediaRecordedRef", first: true, predicate: ["mediaRecordedRef"], descendants: true }, { propertyName: "aiButtonRef", first: true, predicate: ["aiButtonRef"], descendants: true }, { propertyName: "userMemberWrapperRef", first: true, predicate: ["userMemberWrapperRef"], descendants: true }], usesOnChanges: true, ngImport: i0, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" #userMemberWrapperRef>\n    <cometchat-user-member-wrapper *ngIf=\"showListForMentions\"\n      [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"], components: [{ type: i2.CometChatUserMemberWrapperComponent, selector: "cometchat-user-member-wrapper", inputs: ["userMemberListType", "onItemClick", "listItemView", "avatarStyle", "statusIndicatorStyle", "searchKeyword", "group", "subtitleView", "usersRequestBuilder", "disableUsersPresence", "userPresencePlacement", "hideSeperator", "loadingStateView", "onEmpty", "onError", "groupMemberRequestBuilder", "loadingIconUrl", "disableLoadingState"] }], directives: [{ type: i3.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.11", ngImport: i0, type: CometChatMessageComposerComponent, decorators: [{
            type: Component,
            args: [{ selector: "cometchat-message-composer", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-message-composer__wrapper\" [ngStyle]=\"composerWrapperStyle()\">\n  <div class=\"cc-messagecomposer__mentions\" #userMemberWrapperRef>\n    <cometchat-user-member-wrapper *ngIf=\"showListForMentions\"\n      [userMemberListType]=\"userMemberListType\"\n      [onItemClick]=\"userMemberWrapperConfiguration.onItemClick || defaultMentionsItemClickHandler\"\n      [usersRequestBuilder]=\"usersRequestBuilder\"\n      [searchKeyword]=\"mentionsSearchTerm\"\n      [subtitleView]=\"userMemberWrapperConfiguration.subtitleView\"\n      [disableUsersPresence]=\"userMemberWrapperConfiguration.disableUsersPresence\"\n      [avatarStyle]=\"userMemberWrapperConfiguration.avatarStyle\"\n      [listItemView]=\"userMemberWrapperConfiguration.listItemView\"\n      [statusIndicatorStyle]=\"userMemberWrapperConfiguration.statusIndicatorStyle\"\n      [userPresencePlacement]=\"userMemberWrapperConfiguration.userPresencePlacement\"\n      [hideSeperator]=\"userMemberWrapperConfiguration.hideSeparator\"\n      [loadingStateView]=\"userMemberWrapperConfiguration.loadingStateView\"\n      [onEmpty]=\"defaultOnEmptyForMentions\"\n      [loadingIconUrl]=\"userMemberWrapperConfiguration.loadingIconURL\"\n      [group]=\"group\" [groupMemberRequestBuilder]=\"groupMembersRequestBuilder\"\n      [disableLoadingState]=\"true\"\n      [onError]=\"defaultOnEmptyForMentions\"></cometchat-user-member-wrapper>\n\n    <div *ngIf=\"showMentionsCountWarning\"\n      class=\"cc-messagecomposer__mentions-limit-exceeded\">\n      <cometchat-icon-button\n        [text]=\"mentionsWarningText || localize('MENTIONS_LIMIT_WARNING_MESSAGE')\"\n        [iconURL]=\"InfoSimpleIcon\"\n        [buttonStyle]=\"getMentionInfoIconStyle()\"></cometchat-icon-button>\n    </div>\n\n  </div>\n  <div class=\"cc-message-composer__header-view\"\n    *ngIf=\"headerView; else messagePreview\">\n    <ng-container\n      *ngTemplateOutlet=\"headerView;context:{ $implicit: user ?? group, composerId:composerId }\">\n    </ng-container>\n  </div>\n  <ng-template #messagePreview>\n    <div class=\"cc-message-composer__header-view\" *ngIf=\"showPreview\">\n      <cometchat-preview [previewStyle]=\"previewStyle\"\n        [previewSubtitle]=\"editPreviewText\"\n        (cc-preview-close-clicked)=\"closePreview()\"> </cometchat-preview>\n    </div>\n  </ng-template>\n  <div class=\"cc-message-composer__input\">\n\n    <cometchat-text-input (cc-text-input-entered)=\"sendMessageOnEnter($event)\"\n      #inputRef [text]=\"text\"\n      (cc-text-input-changed)=\"messageInputChanged($event)\"\n      [textInputStyle]=\"textInputStyle\" [placeholderText]=\"placeholderText\"\n      [auxiliaryButtonAlignment]=\"auxiliaryButtonsAlignment\"\n      [textFormatters]=\"textFormatters\">\n\n      <div data-slot=\"secondaryView\">\n        <div *ngIf=\"secondaryButtonView;else secondaryButton\">\n          <ng-container\n            *ngTemplateOutlet=\"secondaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <ng-template #secondaryButton>\n          <div class=\"cc-message-composer__attachbutton\">\n            <cometchat-popover\n              (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n              [placement]=\"auxilaryPlacement\" [popoverStyle]=\"popoverStyle\">\n              <cometchat-action-sheet slot=\"content\"\n                [title]=\"localize('ADD_TO_CHAT')\" [actions]=\"composerActions\"\n                [actionSheetStyle]=\"actionSheetStyle\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n              <cometchat-button #actionSheetRef slot=\"children\"\n                (cc-button-clicked)=\"openActionSheet($event)\"\n                [iconURL]=\"!showActionSheetItem || (showEmojiKeyboard && !showActionSheetItem)  ? attachmentIconURL  : closeButtonIconURL\"\n                [buttonStyle]=\"attachmentButtonStyle\"></cometchat-button>\n            </cometchat-popover>\n          </div>\n        </ng-template>\n      </div>\n\n      <div class=\"cc-message-composer__auxiliary\" data-slot=\"auxilaryView\">\n        <div class=\"cc-message-composer__custom-auxiliary-view\"\n          *ngIf=\"auxilaryButtonView\">\n          <ng-container\n            *ngTemplateOutlet=\"auxilaryButtonView;context:{ $implicit: user ?? group, composerId:composerId }\">\n          </ng-container>\n        </div>\n        <!-- AI Cards -->\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-click)=\"openStickerKeyboard($event)\"\n            [popoverStyle]=\"aiPopover\" [placement]=\"auxilaryPlacement\">\n            <cometchat-ai-card [state]=\"smartReplyState\"\n              *ngIf=\"showSmartReply && !showActionSheetItemAI && !showAiBotList\"\n              slot=\"content\" [loadingStateText]=\"loadingStateText\"\n              [emptyStateText]=\"emptyStateText\"\n              [errorStateText]=\"errorStateText\">\n              <div slot=\"loadedView\" class=\"smart-replies-wrapper\">\n\n                <div class=\"cc-message-composer__smartreply-header\">\n                  <div class=\"cc-message-composer__back-button\">\n                    <cometchat-button\n                      *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                      [iconURL]=\"backButtonIconURL\"\n                      (cc-button-clicked)=\"onAiBackButtonClick()\"\n                      [buttonStyle]=\"backButtonStyle()\">\n                    </cometchat-button>\n                  </div>\n                  <div class=\"cc-message-composer__smartreply-header-view\">\n                    <p>{{ localize(\"SUGGEST_A_REPLY\") }}</p>\n                  </div>\n                </div>\n\n                <div class=\"cc-message-composer__smartreply-content\">\n                  <smart-replies\n                    *ngIf=\"repliesArray && repliesArray.length > 0 \"\n                    [smartReplyStyle]=\"smartReplyStyle\" [replies]=\"repliesArray\"\n                    [closeIconURL]=\"''\" (cc-reply-clicked)=\"sendReply($event)\">\n                  </smart-replies>\n                </div>\n\n\n\n\n\n              </div>\n            </cometchat-ai-card>\n\n            <div *ngIf=\"showAiBotList  && !showActionSheetItemAI\"\n              slot=\"content\">\n              <div class=\"cc-message-composer__aibotlist\">\n                <cometchat-button *ngIf=\" aiBotList && aiBotList.length> 1 \"\n                  [iconURL]=\"backButtonIconURL\"\n                  (cc-button-clicked)=\"onAiBackButtonClick()\"\n                  [buttonStyle]=\"backButtonStyle()\">\n                </cometchat-button>\n                <p>{{ localize(\"COMETCHAT_ASK_AI_BOT\") }}</p>\n              </div>\n              <cometchat-action-sheet\n                *ngIf=\"showAiBotList  && !showActionSheetItemAI\" slot=\"content\"\n                [actions]=\"aiActionButtons\" [title]=\"'AI'\"\n                [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n                (cc-actionsheet-clicked)=\"handleActions($event)\">\n              </cometchat-action-sheet>\n            </div>\n\n            <cometchat-action-sheet *ngIf=\"showActionSheetItemAI\" slot=\"content\"\n              [actions]=\"buttons\" [title]=\"'AI'\"\n              [actionSheetStyle]=\"aiActionSheetStyle\" [hideLayoutMode]=\"true\"\n              (cc-actionsheet-clicked)=\"handleActions($event)\">\n            </cometchat-action-sheet>\n\n            <cometchat-button *ngIf=\"isAiEnabled\" [hoverText]=\"localize('AI')\"\n              slot=\"children\" #aiButtonRef\n              (cc-button-clicked)=\"openAiFeatures($event)\"\n              [iconURL]=\"!showAiFeatures ? aiIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n\n        <div class=\"cc-message-composer__stickerkeyboard\"\n          *ngIf=\"enableStickerKeyboard && !auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"stickerPopover\" [placement]=\"auxilaryPlacement\">\n            <stickers-keyboard slot=\"content\"\n              [stickerStyle]=\"stickerKeyboardStyle\"\n              (cc-sticker-clicked)=\"sendSticker($event)\">\n            </stickers-keyboard>\n            <cometchat-button [hoverText]=\"localize('STICKER')\" slot=\"children\"\n              #stickerButtonRef\n              (cc-button-clicked)=\"openStickerKeyboard($event)\"\n              [iconURL]=\" !showStickerKeyboard ? stickerButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"stickerButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__emojikeyboard\"\n          *ngIf=\"!auxilaryButtonView\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [placement]=\"auxilaryPlacement\" [popoverStyle]=\"emojiPopover\">\n            <cometchat-emoji-keyboard slot=\"content\"\n              [emojiKeyboardStyle]=\"emojiKeyboardStyle\"\n              (cc-emoji-clicked)=\"appendEmoji($event)\">\n            </cometchat-emoji-keyboard>\n            <cometchat-button #emojiButtonRef [hoverText]=\"localize('EMOJI')\"\n              slot=\"children\" (cc-button-clicked)=\"openEmojiKeyboard($event)\"\n              [iconURL]=\" !showEmojiKeyboard  || (!showEmojiKeyboard && showActionSheetItem) ? emojiButtonIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"emojiButtonStyle\"></cometchat-button>\n          </cometchat-popover>\n        </div>\n        <div class=\"cc-message-composer__mediarecorder\"\n          *ngIf=\"!hideVoiceRecording\">\n          <cometchat-popover (cc-popover-outside-clicked)=\"handleOutsideClick()\"\n            [popoverStyle]=\"mediaRecordedPopover\"\n            [placement]=\"auxilaryPlacement\">\n\n            <cometchat-media-recorder *ngIf=\"toggleMediaRecorded\"\n              [autoRecording]=\"true\" startIconText=\"\" stopIconText=\"\"\n              submitButtonIconText=\"\"\n              [submitButtonIconURL]=\"voiceRecordingSubmitIconURL\"\n              [startIconURL]=\"voiceRecordingStartIconURL\"\n              [stopIconURL]=\"voiceRecordingStopIconURL\"\n              [closeIconURL]=\"voiceRecordingCloseIconURL\"\n              (cc-media-recorder-submitted)=\"sendRecordedMedia($event)\"\n              (cc-media-recorder-closed)=\"closeMediaRecorder($event)\"\n              slot=\"content\"\n              [mediaPlayerStyle]=\"mediaRecorderStyle\"></cometchat-media-recorder>\n            <cometchat-icon-button [hoverText]=\"localize('VOICE_RECORDING')\"\n              slot=\"children\" #mediaRecordedRef\n              (cc-button-clicked)=\"openMediaRecorded($event)\"\n              [iconURL]=\" !toggleMediaRecorded ? voiceRecordingIconURL : closeButtonIconURL\"\n              [buttonStyle]=\"mediaRecorderButtonStyle\"></cometchat-icon-button>\n          </cometchat-popover>\n        </div>\n      </div>\n      <div data-slot=\"primaryView\">\n        <div *ngIf=\"sendButtonView;else sendButton\">\n        </div>\n        <ng-template #sendButton>\n          <div class=\"cc-message-composer__sendbutton\"\n            *ngIf=\"showSendButton || hideLiveReaction\">\n            <cometchat-button [iconURL]=\"sendButtonIconURL\"\n              [buttonStyle]=\"sendButtonStyle\"\n              [hoverText]=\"localize('SEND_MESSAGE')\"\n              (cc-button-clicked)=\"customSendMethod(messageText)\">\n            </cometchat-button>\n          </div>\n          <div class=\"cc-message-composer__livereaction\"\n            *ngIf=\"!hideLiveReaction && !showSendButton\">\n            <cometchat-button [iconURL]=\"LiveReactionIconURL\"\n              [hoverText]=\"localize('LIVE_REACTION')\"\n              [buttonStyle]=\"liveReactionStyle\"\n              (cc-button-clicked)=\"sendReaction()\"></cometchat-button>\n          </div>\n        </ng-template>\n      </div>\n    </cometchat-text-input>\n  </div>\n</div>\n\n<input class=\"cc-message-composer__mediainput\" #inputElement\n  (change)=\"inputChangeHandler($event)\" />\n<cometchat-backdrop *ngIf=\"showCreatePolls\" [backdropStyle]=\"backdropStyle\">\n  <create-poll [user]=\"user\" [group]=\"group\"\n    (cc-close-clicked)=\"closeCreatePolls()\"\n    [createPollStyle]=\"createPollStyle\"></create-poll>\n</cometchat-backdrop>\n", styles: [".cc-message-composer__sendbutton,.cc-message-composer__livereaction{margin:0 5px}.cc-message-composer__wrapper{height:100%;width:100%;position:relative;padding:14px 16px}.cc-message-composer__header-view{height:-moz-fit-content;height:fit-content;width:100%;bottom:120%;padding:0 0 1px}.cc-message-composer__mediainput{display:none}.cc-message-composer__auxiliary{display:flex;gap:8px}.cc-message-composer__smartreply-header{width:100%;display:flex;align-items:center;position:absolute;padding:10px;top:0;z-index:1}.cc-message-composer__back-button{margin-left:2%}.cc-message-composer__smartreply-header-view{margin-left:14%}.cc-message-composer__smartreply-content{max-height:200px}.cc-message-composer__aibotlist{display:flex;padding:10px;align-items:center;gap:45px;font-size:medium}.cc-messagecomposer__mentions{max-height:196px;min-height:28px;overflow:hidden;position:absolute;width:100%;left:50%;transform:translate(-50%,-100%);z-index:2;display:flex;padding:0 16px 1px 14px;box-sizing:border-box}.cc-messagecomposer__mentions cometchat-user-member-wrapper{max-height:196px;min-height:28px;overflow:hidden;width:100%;box-sizing:border-box;min-height:45px}.cc-messagecomposer__mentions::-webkit-scrollbar{display:none}.cc-messagecomposer__mentions-limit-exceeded{margin-top:20px;left:2px;position:relative;padding-left:13px;background-color:#fff}*{box-sizing:border-box}cometchat-ai-card{height:100%;width:100%;display:flex;border-radius:8px;overflow-y:auto;justify-content:center;align-items:center}cometchat-popover{position:relative}\n"] }]
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50LnRzIiwiLi4vLi4vLi4vLi4vLi4vcHJvamVjdHMvY2hhdC11aWtpdC1hbmd1bGFyL3NyYy9Db21ldENoYXRNZXNzYWdlQ29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIvY29tZXRjaGF0LW1lc3NhZ2UtY29tcG9zZXIuY29tcG9uZW50Lmh0bWwiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLDJCQUEyQixDQUFDO0FBRW5DLE9BQU8sRUFFTCwwQkFBMEIsRUFDMUIscUJBQXFCLEVBRXJCLHFCQUFxQixFQUdyQixvQkFBb0IsRUFHcEIsaUJBQWlCLEVBRWpCLDhCQUE4QixFQUM5QixnQkFBZ0IsR0FDakIsTUFBTSx5QkFBeUIsQ0FBQztBQUNqQyxPQUFPLEVBSUwsa0JBQWtCLEdBR25CLE1BQU0sMkJBQTJCLENBQUM7QUFDbkMsT0FBTyxFQUNMLHdCQUF3QixFQUd4QixzQkFBc0IsRUFDdEIsaUJBQWlCLEVBQ2pCLHVCQUF1QixFQUl2QixhQUFhLEVBQ2IsU0FBUyxFQUNULE1BQU0sRUFDTixrQkFBa0IsRUFDbEIsVUFBVSxFQUNWLFFBQVEsR0FDVCxNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFDTCx1QkFBdUIsRUFFdkIsU0FBUyxFQUVULFlBQVksRUFDWixLQUFLLEVBR0wsTUFBTSxFQUdOLFNBQVMsR0FDVixNQUFNLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztB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TUcsaUJBQWlCO3NCQUF6QixLQUFLO2dCQUdHLE9BQU87c0JBQWYsS0FBSztnQkFLRyxhQUFhO3NCQUFyQixLQUFLO2dCQU9HLGdCQUFnQjtzQkFBeEIsS0FBSztnQkFhRyxrQkFBa0I7c0JBQTFCLEtBQUs7Z0JBYUcsa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGtCQUFrQjtzQkFBMUIsS0FBSztnQkFDRyxjQUFjO3NCQUF0QixLQUFLO2dCQUNHLFNBQVM7c0JBQWpCLEtBQUs7Z0JBQ0cscUJBQXFCO3NCQUE3QixLQUFLO2dCQUNHLDBCQUEwQjtzQkFBbEMsS0FBSztnQkFDRywwQkFBMEI7c0JBQWxDLEtBQUs7Z0JBQ0cseUJBQXlCO3NCQUFqQyxLQUFLO2dCQUNHLDJCQUEyQjtzQkFBbkMsS0FBSztnQkFDSSxVQUFVO3NCQUFuQixNQUFNO2dCQUNFLDhCQUE4QjtzQkFBdEMsS0FBSztnQkFFRyxlQUFlO3NCQUF2QixLQUFLO2dCQUNHLGNBQWM7c0JBQXRCLEtBQUsiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgXCJAY29tZXRjaGF0L3Vpa2l0LXNoYXJlZFwiO1xuaW1wb3J0IFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuXG5pbXBvcnQge1xuICBBSU9wdGlvbnNTdHlsZSxcbiAgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXIsXG4gIENvbWV0Q2hhdFNvdW5kTWFuYWdlcixcbiAgQ29tZXRDaGF0VGV4dEZvcm1hdHRlcixcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxuICBDb21wb3NlcklkLFxuICBDcmVhdGVQb2xsU3R5bGUsXG4gIE1lc3NhZ2VDb21wb3NlclN0eWxlLFxuICBTbWFydFJlcGxpZXNTdHlsZSxcbiAgU3RpY2tlcnNDb25maWd1cmF0aW9uLFxuICBTdGlja2Vyc0NvbnN0YW50cyxcbiAgU3RpY2tlcnNTdHlsZSxcbiAgVXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLFxuICBVc2VyTWVudGlvblN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7XG4gIEFjdGlvblNoZWV0U3R5bGUsXG4gIEJhY2tkcm9wU3R5bGUsXG4gIEVtb2ppS2V5Ym9hcmRTdHlsZSxcbiAgTWVkaWFSZWNvcmRlclN0eWxlLFxuICBQb3BvdmVyU3R5bGUsXG4gIFByZXZpZXdTdHlsZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtZWxlbWVudHNcIjtcbmltcG9ydCB7XG4gIEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCxcbiAgQ29tZXRDaGF0QWN0aW9uc1ZpZXcsXG4gIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckFjdGlvbixcbiAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cyxcbiAgQ29tZXRDaGF0VUlFdmVudHMsXG4gIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLFxuICBJTWVudGlvbnNDb3VudFdhcm5pbmcsXG4gIElNZXNzYWdlcyxcbiAgTWVudGlvbnNUYXJnZXRFbGVtZW50LFxuICBNZXNzYWdlU3RhdHVzLFxuICBQbGFjZW1lbnQsXG4gIFN0YXRlcyxcbiAgVXNlck1lbWJlckxpc3RUeXBlLFxuICBmb250SGVscGVyLFxuICBsb2NhbGl6ZSxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gIENvbXBvbmVudCxcbiAgRWxlbWVudFJlZixcbiAgRXZlbnRFbWl0dGVyLFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIE91dHB1dCxcbiAgU2ltcGxlQ2hhbmdlcyxcbiAgVGVtcGxhdGVSZWYsXG4gIFZpZXdDaGlsZCxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcblxuaW1wb3J0IHsgQ2hhdENvbmZpZ3VyYXRvciB9IGZyb20gXCIuLi8uLi9TaGFyZWQvRnJhbWV3b3JrL0NoYXRDb25maWd1cmF0b3JcIjtcbmltcG9ydCB7IENvbWV0Q2hhdCB9IGZyb20gXCJAY29tZXRjaGF0L2NoYXQtc2RrLWphdmFzY3JpcHRcIjtcbmltcG9ydCB7IENvbWV0Q2hhdEV4Y2VwdGlvbiB9IGZyb20gXCIuLi8uLi9TaGFyZWQvVXRpbHMvQ29tZUNoYXRFeGNlcHRpb25cIjtcbmltcG9ydCB7IENvbWV0Q2hhdFRoZW1lU2VydmljZSB9IGZyb20gXCIuLi8uLi9Db21ldENoYXRUaGVtZS5zZXJ2aWNlXCI7XG5pbXBvcnQgeyBTdWJzY3JpcHRpb24gfSBmcm9tIFwicnhqc1wiO1xuXG4vKipcbiAqXG4gKiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXIgaXMgdXNlZCB0byBzZW5kIG1lc3NhZ2UgdG8gdXNlciBvciBncm91cC5cbiAqXG4gKiBAdmVyc2lvbiAxLjAuMFxuICogQGF1dGhvciBDb21ldENoYXRUZWFtXG4gKiBAY29weXJpZ2h0IMKpIDIwMjIgQ29tZXRDaGF0IEluYy5cbiAqXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJjb21ldGNoYXQtbWVzc2FnZS1jb21wb3NlclwiLFxuICB0ZW1wbGF0ZVVybDogXCIuL2NvbWV0Y2hhdC1tZXNzYWdlLWNvbXBvc2VyLmNvbXBvbmVudC5odG1sXCIsXG4gIHN0eWxlVXJsczogW1wiLi9jb21ldGNoYXQtbWVzc2FnZS1jb21wb3Nlci5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIENvbWV0Q2hhdE1lc3NhZ2VDb21wb3NlckNvbXBvbmVudCBpbXBsZW1lbnRzIE9uSW5pdCwgT25DaGFuZ2VzIHtcbiAgQFZpZXdDaGlsZChcImlucHV0RWxlbWVudFwiLCB7IHN0YXRpYzogZmFsc2UgfSkgaW5wdXRFbGVtZW50UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcImlucHV0UmVmXCIsIHsgc3RhdGljOiBmYWxzZSB9KSBpbnB1dFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJlbW9qaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgZW1vamlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwiYWN0aW9uU2hlZXRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGFjdGlvblNoZWV0UmVmITogRWxlbWVudFJlZjtcbiAgQFZpZXdDaGlsZChcInN0aWNrZXJCdXR0b25SZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHN0aWNrZXJCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwibWVkaWFSZWNvcmRlZFJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSlcbiAgbWVkaWFSZWNvcmRlZFJlZiE6IEVsZW1lbnRSZWY7XG4gIEBWaWV3Q2hpbGQoXCJhaUJ1dHRvblJlZlwiLCB7IHN0YXRpYzogZmFsc2UgfSkgYWlCdXR0b25SZWYhOiBFbGVtZW50UmVmO1xuICBAVmlld0NoaWxkKFwidXNlck1lbWJlcldyYXBwZXJSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pXG4gIHVzZXJNZW1iZXJXcmFwcGVyUmVmITogRWxlbWVudFJlZjtcblxuICBASW5wdXQoKSB1c2VyITogQ29tZXRDaGF0LlVzZXI7XG4gIEBJbnB1dCgpIGdyb3VwITogQ29tZXRDaGF0Lkdyb3VwO1xuICBASW5wdXQoKSBkaXNhYmxlU291bmRGb3JNZXNzYWdlczogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBjdXN0b21Tb3VuZEZvck1lc3NhZ2U6IHN0cmluZyA9IFwiXCI7XG4gIEBJbnB1dCgpIGRpc2FibGVUeXBpbmdFdmVudHM6IGJvb2xlYW4gPSBmYWxzZTtcbiAgQElucHV0KCkgdGV4dDogc3RyaW5nID0gXCJcIjtcbiAgQElucHV0KCkgcGxhY2Vob2xkZXJUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkVOVEVSX1lPVVJfTUVTU0FHRV9IRVJFXCIpO1xuXG4gIEBJbnB1dCgpIGhlYWRlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuICBASW5wdXQoKSBvblRleHRDaGFuZ2UhOiAodGV4dDogc3RyaW5nKSA9PiB2b2lkO1xuICBASW5wdXQoKSBhdHRhY2htZW50SWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvUGx1cy5zdmdcIjtcbiAgQElucHV0KCkgYXR0YWNobWVudE9wdGlvbnM6XG4gICAgfCAoKFxuICAgICAgaXRlbTogQ29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXAsXG4gICAgICBjb21wb3NlcklkOiBDb21wb3NlcklkXG4gICAgKSA9PiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSlcbiAgICB8IHVuZGVmaW5lZDtcbiAgQElucHV0KCkgc2Vjb25kYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsYXJ5QnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIGF1eGlsaWFyeUJ1dHRvbnNBbGlnbm1lbnQ6IEF1eGlsaWFyeUJ1dHRvbkFsaWdubWVudCA9XG4gICAgQXV4aWxpYXJ5QnV0dG9uQWxpZ25tZW50LnJpZ2h0O1xuICBASW5wdXQoKSBzZW5kQnV0dG9uVmlldyE6IFRlbXBsYXRlUmVmPGFueT47XG4gIEBJbnB1dCgpIHBhcmVudE1lc3NhZ2VJZDogbnVtYmVyID0gMDtcbiAgQElucHV0KCkgaGlkZUxpdmVSZWFjdGlvbjogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIExpdmVSZWFjdGlvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2hlYXJ0LXJlYWN0aW9uLnBuZ1wiO1xuICBASW5wdXQoKSBiYWNrQnV0dG9uSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvYmFja2J1dHRvbi5zdmdcIjtcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nVGV4dD86IHN0cmluZztcbiAgQElucHV0KCkgbWVudGlvbnNXYXJuaW5nU3R5bGU/OiBhbnk7XG4gIHB1YmxpYyBJbmZvU2ltcGxlSWNvbiA9IFwiYXNzZXRzL0luZm9TaW1wbGVJY29uLnN2Z1wiO1xuXG4gIEBJbnB1dCgpIG1lc3NhZ2VDb21wb3NlclN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IHtcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIG1heElucHV0SGVpZ2h0OiBcIjEwMHB4XCIsXG4gIH07XG4gIEBJbnB1dCgpIG9uU2VuZEJ1dHRvbkNsaWNrOlxuICAgIHwgKChtZXNzYWdlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHZvaWQpXG4gICAgfCB1bmRlZmluZWQ7XG4gIEBJbnB1dCgpIG9uRXJyb3I6ICgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHZvaWQpIHwgbnVsbCA9IChcbiAgICBlcnJvcjogQ29tZXRDaGF0LkNvbWV0Q2hhdEV4Y2VwdGlvblxuICApID0+IHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gIH07XG4gIEBJbnB1dCgpIGJhY2tkcm9wU3R5bGU6IEJhY2tkcm9wU3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgYmFja2dyb3VuZDogXCJyZ2JhKDAsIDAsIDAsIDAuNSlcIixcbiAgICBwb3NpdGlvbjogXCJmaXhlZFwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGFjdGlvblNoZWV0U3R5bGU6IEFjdGlvblNoZWV0U3R5bGUgPSB7XG4gICAgbGF5b3V0TW9kZUljb25UaW50OiBcInJnYmEoMjAsIDIwLCAyMCwgMC4wNClcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgIGJhY2tncm91bmQ6IFwicmdiKDI1NSwyNTUsMjU1KVwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgdGl0bGVGb250OiBcIjUwMCAxNXB4IEludGVyLCBzYW5zLXNlcmlmXCIsXG4gICAgdGl0bGVDb2xvcjogXCIjMTQxNDE0XCIsXG4gICAgbGlzdEl0ZW1CYWNrZ3JvdW5kOiBcIlwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGFpQWN0aW9uU2hlZXRTdHlsZTogYW55ID0ge1xuICAgIGxheW91dE1vZGVJY29uVGludDogXCJyZ2JhKDIwLCAyMCwgMjAsIDAuMDQpXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcImluaGVyaXRcIixcbiAgICBiYWNrZ3JvdW5kOiBcInJnYigyNTUsMjU1LDI1NSlcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgIHRpdGxlRm9udDogXCI1MDAgMTVweCBJbnRlciwgc2Fucy1zZXJpZlwiLFxuICAgIHRpdGxlQ29sb3I6IFwiIzE0MTQxNFwiLFxuICAgIGxpc3RJdGVtQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIEFjdGlvblNoZWV0U2VwYXJhdG9yVGludDogXCIxcHggc29saWQgUkdCQSgyMCwgMjAsIDIwLCAwLjA4KVwiLFxuICB9O1xuXG4gIEBJbnB1dCgpIGhpZGVWb2ljZVJlY29yZGluZzogYm9vbGVhbiA9IGZhbHNlO1xuICBASW5wdXQoKSBtZWRpYVJlY29yZGVyU3R5bGU6IE1lZGlhUmVjb3JkZXJTdHlsZSA9IHt9O1xuICBASW5wdXQoKSBhaU9wdGlvbnNTdHlsZTogQUlPcHRpb25zU3R5bGUgPSB7fTtcbiAgQElucHV0KCkgYWlJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9haS1ib3Quc3ZnXCI7XG4gIEBJbnB1dCgpIHZvaWNlUmVjb3JkaW5nSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvbWljLnN2Z1wiO1xuICBASW5wdXQoKSB2b2ljZVJlY29yZGluZ0Nsb3NlSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvY2xvc2UyeC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdGFydEljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL21pYy5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdG9wSWNvblVSTDogc3RyaW5nID0gXCJhc3NldHMvc3RvcC5zdmdcIjtcbiAgQElucHV0KCkgdm9pY2VSZWNvcmRpbmdTdWJtaXRJY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TZW5kLnN2Z1wiO1xuICBAT3V0cHV0KCkgY2hpbGRFdmVudDogRXZlbnRFbWl0dGVyPHZvaWQ+ID0gbmV3IEV2ZW50RW1pdHRlcjx2b2lkPigpO1xuICBASW5wdXQoKSB1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb246IFVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbiA9IG5ldyBVc2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24oe30pO1xuICBwdWJsaWMgdXNlck1lbWJlckxpc3RUeXBlITogVXNlck1lbWJlckxpc3RUeXBlO1xuICBASW5wdXQoKSBkaXNhYmxlTWVudGlvbnM/OiBib29sZWFuO1xuICBASW5wdXQoKSB0ZXh0Rm9ybWF0dGVycz86IEFycmF5PENvbWV0Q2hhdFRleHRGb3JtYXR0ZXI+ID0gW107XG5cbiAgcHVibGljIGNvbXBvc2VySWQhOiBDb21wb3NlcklkO1xuICBtZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWQ6IHN0cmluZyA9IFwiY29tcG9zZXJfXCIgKyBEYXRlLm5vdygpO1xuICBwdWJsaWMgY29tcG9zZXJBY3Rpb25zOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb25bXSA9IFtdO1xuICBwdWJsaWMgc3RhdGVzOiB0eXBlb2YgU3RhdGVzID0gU3RhdGVzO1xuICBwdWJsaWMgbWVudGlvbnNTZWFyY2hUZXJtOiBzdHJpbmcgPSBcIlwiO1xuICBwdWJsaWMgc2hvd0xpc3RGb3JNZW50aW9uczogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgbWVudGlvbnNTZWFyY2hDb3VudDogbnVtYmVyID0gMTtcbiAgcHVibGljIGxhc3RFbXB0eVNlYXJjaFRlcm0/OiBzdHJpbmcgPSBcIlwiO1xuXG4gIHB1YmxpYyBzbWFydFJlcGx5U3RhdGU6IFN0YXRlcyA9IFN0YXRlcy5sb2FkaW5nO1xuICBwdWJsaWMgc2hvd01lbnRpb25zQ291bnRXYXJuaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIHB1YmxpYyBncm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlciE6IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgcHVibGljIHVzZXJzUmVxdWVzdEJ1aWxkZXIhOiBDb21ldENoYXQuVXNlcnNSZXF1ZXN0QnVpbGRlcjtcbiAgY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmchOiBTdWJzY3JpcHRpb247XG5cbiAgbG9hZGluZ1N0YXRlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXCJHRU5FUkFUSU5HX1JFUExJRVNcIik7XG4gIGVycm9yU3RhdGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIlNPTUVUSElOR19XUk9OR1wiKTtcbiAgZW1wdHlTdGF0ZVRleHQ6IHN0cmluZyA9IGxvY2FsaXplKFwiTk9fTUVTU0FHRVNfRk9VTkRcIik7XG4gIHNob3dDcmVhdGVQb2xsczogYm9vbGVhbiA9IGZhbHNlO1xuICBzaG93U3RpY2tlcktleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dBY3Rpb25TaGVldEl0ZW06IGJvb2xlYW4gPSBmYWxzZTtcbiAgc2hvd0FjdGlvblNoZWV0SXRlbUFJOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dTbWFydFJlcGx5OiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dBaUZlYXR1cmVzOiBib29sZWFuID0gZmFsc2U7XG4gIHJlcGxpZXNBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgYWlCb3RMaXN0OiBDb21ldENoYXQuVXNlcltdID0gW107XG4gIGN1cnJlbnRBc2tBSUJvdDogYW55ID0gXCJcIjtcbiAgaXNBaU1vcmVUaGFuT25lOiBib29sZWFuID0gZmFsc2U7XG5cbiAgc2hvd1ByZXZpZXc6IGJvb2xlYW4gPSBmYWxzZTtcbiAgYWlGZWF0dXJlc0Nsb3NlQ2FsbGJhY2s6ICgoKSA9PiB2b2lkKSB8IG51bGwgPSBudWxsO1xuICBlZGl0UHJldmlld09iamVjdCE6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZTtcbiAgY2NNZXNzYWdlRWRpdCE6IFN1YnNjcmlwdGlvbjtcbiAgY2NDb21wb3NlTWVzc2FnZSE6IFN1YnNjcmlwdGlvbjtcbiAgcHVibGljIHRleHRGb3JtYXR0ZXJMaXN0OiBBcnJheTxDb21ldENoYXRUZXh0Rm9ybWF0dGVyPiA9IHRoaXMudGV4dEZvcm1hdHRlcnNcbiAgICA/IFsuLi50aGlzLnRleHRGb3JtYXR0ZXJzXVxuICAgIDogW107XG4gIHB1YmxpYyBtZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICBtZW50aW9uZWRVc2VyczogQXJyYXk8Q29tZXRDaGF0LlVzZXIgfCBDb21ldENoYXQuR3JvdXBNZW1iZXI+ID0gW107XG5cbiAgcHVibGljIGFjY2VwdEhhbmRsZXJzOiBhbnkgPSB7XG4gICAgXCJpbWFnZS8qXCI6IHRoaXMub25JbWFnZUNoYW5nZS5iaW5kKHRoaXMpLFxuICAgIFwidmlkZW8vKlwiOiB0aGlzLm9uVmlkZW9DaGFuZ2UuYmluZCh0aGlzKSxcbiAgICBcImF1ZGlvLypcIjogdGhpcy5vbkF1ZGlvQ2hhbmdlLmJpbmQodGhpcyksXG4gICAgXCJmaWxlLypcIjogdGhpcy5vbkZpbGVDaGFuZ2UuYmluZCh0aGlzKSxcbiAgfTtcbiAgcHVibGljIGVuYWJsZVN0aWNrZXJLZXlib2FyZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgdG9nZ2xlTWVkaWFSZWNvcmRlZDogYm9vbGVhbiA9IGZhbHNlO1xuICBwdWJsaWMgc2hvd0FpQm90TGlzdDogYm9vbGVhbiA9IGZhbHNlO1xuICBtZW50aW9uc1R5cGVTZXRCeVVzZXI6IGJvb2xlYW4gPSBmYWxzZTtcbiAgcHVibGljIHN0aWNrZXJDb25maWd1cmF0aW9uOiB7XG4gICAgaWQ/OiBzdHJpbmc7XG4gICAgY29uZmlndXJhdGlvbj86IFN0aWNrZXJzQ29uZmlndXJhdGlvbjtcbiAgfSA9IHt9O1xuICBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL3BsdXMtcm90YXRlZC5zdmdcIjtcblxuICBidXR0b25zOiBCdXR0b25zW10gPSBbXTtcbiAgYWlBY3Rpb25CdXR0b25zOiBCdXR0b25zW10gPSBbXTtcblxuICBzbWFydFJlcGx5U3R5bGU6IFNtYXJ0UmVwbGllc1N0eWxlID0ge1xuICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICBoZWlnaHQ6IFwiZml0LWNvbnRlbnRcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICB9O1xuICBzZW5kQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwicmdiYSgyMCwgMjAsIDIwLCAwLjU4KVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgbGl2ZVJlYWN0aW9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwicmVkXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgIGp1c3RpZnlDb250ZW50OiBcImNlbnRlclwiLFxuICAgIGFsaWduSXRlbXM6IFwiY2VudGVyXCIsXG4gIH07XG4gIGxvY2FsaXplOiB0eXBlb2YgbG9jYWxpemUgPSBsb2NhbGl6ZTtcbiAgZW1vamlCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBidXR0b25JY29uVGludDogXCJncmV5XCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICB9O1xuICBzdGlja2VyQnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgbWVkaWFSZWNvcmRlckJ1dHRvblN0eWxlOiBhbnkgPSB7XG4gICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICB3aWR0aDogXCIyNHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgIGJ1dHRvbkljb25UaW50OiBcImdyZXlcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gIH07XG5cbiAgZW1vamlLZXlib2FyZFN0eWxlOiBFbW9qaUtleWJvYXJkU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICB0ZXh0Rm9udDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRGb250LFxuICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRDb2xvcixcbiAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICBib3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgIGFjdGl2ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICBpY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKVxuICB9O1xuXG4gIHN0aWNrZXJLZXlib2FyZFN0eWxlOiBTdGlja2Vyc1N0eWxlID0ge307XG4gIHRleHRJbnB1dFN0eWxlOiBhbnkgPSB7fTtcbiAgcHJldmlld1N0eWxlOiBQcmV2aWV3U3R5bGUgPSB7XG4gICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICB3aWR0aDogXCIxMDAlXCIsXG4gIH07XG4gIGNyZWF0ZVBvbGxTdHlsZTogQ3JlYXRlUG9sbFN0eWxlID0ge307XG4gIHN0b3JlVHlwaW5nSW50ZXJ2YWw6IGFueTtcbiAgZW1vamlQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMzE1cHhcIixcbiAgICBoZWlnaHQ6IFwiMzIwcHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBzdGlja2VyUG9wb3ZlcjogUG9wb3ZlclN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjMwMHB4XCIsXG4gICAgaGVpZ2h0OiBcIjMyMHB4XCIsXG4gICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjhweFwiLFxuICAgIGJveFNoYWRvdzogXCIwcHggMHB4IDhweCByZ2JhKDIwLCAyMCwgMjAsIDAuMilcIixcbiAgfTtcbiAgYWlQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjgwcHhcIixcbiAgICBoZWlnaHQ6IFwiMjgwcHhcIixcblxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIG1lZGlhUmVjb3JkZWRQb3BvdmVyOiBQb3BvdmVyU3R5bGUgPSB7XG4gICAgd2lkdGg6IFwiMjUwcHhcIixcbiAgICBoZWlnaHQ6IFwiMTAwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgYm94U2hhZG93OiBcIjBweCAwcHggOHB4IHJnYmEoMjAsIDIwLCAyMCwgMC4yKVwiLFxuICB9O1xuICBwb3BvdmVyU3R5bGU6IFBvcG92ZXJTdHlsZSA9IHtcbiAgICB3aWR0aDogXCIyNzVweFwiLFxuICAgIGhlaWdodDogXCIyODBweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICBib3hTaGFkb3c6IFwiMHB4IDBweCA4cHggcmdiYSgyMCwgMjAsIDIwLCAwLjIpXCIsXG4gIH07XG4gIHNlbmRCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TZW5kLnN2Z1wiO1xuICBlbW9qaUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1N0aXBvcC5zdmdcIjtcbiAgc3RpY2tlckJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL1N0aWNrZXJzLnN2Z1wiO1xuXG4gIGFjdGlvbnMhOiAoQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uIHwgQ29tZXRDaGF0QWN0aW9uc1ZpZXcpW107XG4gIG1lc3NhZ2VUZXh0OiBzdHJpbmcgPSBcIlwiO1xuICBhdHRhY2htZW50QnV0dG9uU3R5bGU6IGFueSA9IHtcbiAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IFwiZ3JleVwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgfTtcbiAgYXV4aWxhcnlQbGFjZW1lbnQ6IFBsYWNlbWVudCA9IFBsYWNlbWVudC50b3A7XG4gIG1lc3NhZ2VTZW5kaW5nOiBib29sZWFuID0gZmFsc2U7XG4gIG1lc3NhZ2VUb0JlRWRpdGVkITogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgbnVsbDtcbiAgcHVibGljIGVkaXRQcmV2aWV3VGV4dDogc3RyaW5nIHwgbnVsbCA9IFwiXCI7XG4gIHNob3dTZW5kQnV0dG9uOiBib29sZWFuID0gZmFsc2U7XG4gIHNob3dFbW9qaUtleWJvYXJkOiBib29sZWFuID0gZmFsc2U7XG4gIGlzQWlFbmFibGVkOiBib29sZWFuID0gZmFsc2U7XG4gIHNtYXJ0UmVwbGllczogc3RyaW5nW10gPSBbXTtcbiAgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXIgfCBudWxsO1xuICBtZW50aW9uU3R5bGVMb2NhbDogVXNlck1lbnRpb25TdHlsZSA9IG5ldyBVc2VyTWVudGlvblN0eWxlKHt9KTtcblxuICBzZW5kTWVzc2FnZU9uRW50ZXIgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5zZW5kVGV4dE1lc3NhZ2UoZXZlbnQuZGV0YWlsLnZhbHVlKTtcbiAgICB0aGlzLmlucHV0UmVmPy5uYXRpdmVFbGVtZW50Py5lbXB0eUlucHV0RmllbGQoKTtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpXG4gIH07XG4gIGRpc2FibGVTZW5kQnV0dG9uKCkge1xuICAgIHRoaXMuc2VuZEJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH1cbiAgbWVzc2FnZUlucHV0Q2hhbmdlZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgY29uc3QgdGV4dCA9IGV2ZW50Py5kZXRhaWw/LnZhbHVlPy50cmltKCk7XG4gICAgdGhpcy5zZW5kQnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGV4dFxuICAgICAgICA/IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnNlbmRJY29uVGludFxuICAgICAgICA6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgfTtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gdHJ1ZTtcbiAgICBpZiAodGhpcy5vblRleHRDaGFuZ2UpIHtcbiAgICAgIHRoaXMub25UZXh0Q2hhbmdlKHRleHQpO1xuICAgIH1cbiAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gdGV4dDtcbiAgICBpZiAodGV4dCkge1xuICAgICAgdGhpcy5zdGFydFR5cGluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgIH1cbiAgfTtcbiAgYXBwZW5kRW1vamkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLnRleHQgPT09IGV2ZW50Py5kZXRhaWwuaWQpIHtcbiAgICAgIHRoaXMudGV4dCA9IFwiXCIgKyBcIlwiO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICB0aGlzLnRleHQgPSBldmVudD8uZGV0YWlsLmlkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZFJlYWN0aW9uKCkge1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyPy5nZXRVaWQoKSFcbiAgICAgIDogdGhpcy5ncm91cD8uZ2V0R3VpZCgpITtcbiAgICBsZXQgcmVjZWl2ZXJUeXBlID0gdGhpcy51c2VyXG4gICAgICA/IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlclxuICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgIGxldCBkYXRhID0ge1xuICAgICAgdHlwZTogXCJsaXZlX3JlYWN0aW9uXCIsXG4gICAgICByZWFjdGlvbjogXCJoZWFydFwiLFxuICAgIH07XG4gICAgbGV0IHRyYW5zaWVudE1lc3NhZ2UgPSBuZXcgQ29tZXRDaGF0LlRyYW5zaWVudE1lc3NhZ2UoXG4gICAgICByZWNlaXZlcklkLFxuICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgZGF0YVxuICAgICk7XG4gICAgQ29tZXRDaGF0LnNlbmRUcmFuc2llbnRNZXNzYWdlKHRyYW5zaWVudE1lc3NhZ2UpO1xuICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NMaXZlUmVhY3Rpb24ubmV4dChcImhlYXJ0XCIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIG9wZW5DcmVhdGVQb2xscyA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dDcmVhdGVQb2xscyA9IHRydWU7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSAhdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtO1xuICAgIH1cbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGNsb3NlQ3JlYXRlUG9sbHMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93Q3JlYXRlUG9sbHMgPSBmYWxzZTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcbiAgc2VuZFJlY29yZGVkTWVkaWEgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCBmaWxlID0gZXZlbnQ/LmRldGFpbD8uZmlsZTtcbiAgICBpZiAoZmlsZSkge1xuICAgICAgdGhpcy5zZW5kUmVjb3JkZWRBdWRpbyhmaWxlKTtcbiAgICB9XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG4gIGNsb3NlTWVkaWFSZWNvcmRlcihldmVudD86IGFueSkge1xuICAgIGlmICh0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQpIHtcbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlZFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSAhdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfVxuICBnZXRGb3JtYXR0ZWREYXRlKCk6IHN0cmluZyB7XG4gICAgY29uc3QgY3VycmVudERhdGUgPSBuZXcgRGF0ZSgpO1xuXG4gICAgY29uc3QgeWVhciA9IGN1cnJlbnREYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICBjb25zdCBtb250aCA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRNb250aCgpICsgMSk7XG4gICAgY29uc3QgZGF5ID0gdGhpcy5wYWRaZXJvKGN1cnJlbnREYXRlLmdldERhdGUoKSk7XG4gICAgY29uc3QgaG91cnMgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0SG91cnMoKSk7XG4gICAgY29uc3QgbWludXRlcyA9IHRoaXMucGFkWmVybyhjdXJyZW50RGF0ZS5nZXRNaW51dGVzKCkpO1xuICAgIGNvbnN0IHNlY29uZHMgPSB0aGlzLnBhZFplcm8oY3VycmVudERhdGUuZ2V0U2Vjb25kcygpKTtcblxuICAgIHJldHVybiBgJHt5ZWFyfSR7bW9udGh9JHtkYXl9JHtob3Vyc30ke21pbnV0ZXN9JHtzZWNvbmRzfWA7XG4gIH1cblxuICBwYWRaZXJvKG51bTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gbnVtLnRvU3RyaW5nKCkucGFkU3RhcnQoMiwgXCIwXCIpO1xuICB9XG5cbiAgc2VuZFJlY29yZGVkQXVkaW8gPSAoZmlsZTogQmxvYikgPT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBmaWxlO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgYGF1ZGlvLXJlY29yZGluZy0ke3RoaXMuZ2V0Rm9ybWF0dGVkRGF0ZSgpfS53YXZgLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmF1ZGlvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG4gIGFkZEF0dGFjaG1lbnRDYWxsYmFjaygpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBvc2VyQWN0aW9ucz8uZm9yRWFjaCgoZWxlbWVudDogQ29tZXRDaGF0TWVzc2FnZUNvbXBvc2VyQWN0aW9uKSA9PiB7XG4gICAgICBzd2l0Y2ggKGVsZW1lbnQuaWQpIHtcbiAgICAgICAgY2FzZSBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuYXVkaW86XG4gICAgICAgICAgZWxlbWVudC5vbkNsaWNrID0gdGhpcy5vcGVuQXVkaW9QaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbnZpZGVvUGlja2VyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5maWxlOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkZpbGVQaWNrZXI7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLmltYWdlOlxuICAgICAgICAgIGVsZW1lbnQub25DbGljayA9IHRoaXMub3BlbkltYWdlUGlja2VyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwiZXh0ZW5zaW9uX3BvbGxcIjpcbiAgICAgICAgICBlbGVtZW50Lm9uQ2xpY2sgPSB0aGlzLm9wZW5DcmVhdGVQb2xscztcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN1YnNjcmliZVRvRXZlbnRzKCkge1xuICAgIHRoaXMuY2NNZXNzYWdlRWRpdCA9IENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlRWRpdGVkLnN1YnNjcmliZShcbiAgICAgIChvYmplY3Q6IElNZXNzYWdlcykgPT4ge1xuICAgICAgICBsZXQgcGFyZW50SWQgPSBvYmplY3Q/Lm1lc3NhZ2U/LmdldFBhcmVudE1lc3NhZ2VJZCgpXG4gICAgICAgIGlmICgodGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgcGFyZW50SWQgJiYgcGFyZW50SWQgPT0gdGhpcy5wYXJlbnRNZXNzYWdlSWQpIHx8ICghdGhpcy5wYXJlbnRNZXNzYWdlSWQgJiYgIXBhcmVudElkKSkge1xuICAgICAgICAgIGlmIChvYmplY3Q/LnN0YXR1cyA9PSBNZXNzYWdlU3RhdHVzLmlucHJvZ3Jlc3MpIHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQgPSBvYmplY3QubWVzc2FnZSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2U7XG4gICAgICAgICAgICB0aGlzLm9wZW5FZGl0UHJldmlldygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICk7XG4gICAgdGhpcy5jY0NvbXBvc2VNZXNzYWdlID0gQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5zdWJzY3JpYmUoXG4gICAgICAodGV4dDogc3RyaW5nKSA9PiB7XG4gICAgICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICApO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPVxuICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmcuc3Vic2NyaWJlKFxuICAgICAgICAoZGF0YTogSU1lbnRpb25zQ291bnRXYXJuaW5nKSA9PiB7XG4gICAgICAgICAgaWYgKGRhdGEuaWQgPT0gdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWQpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLnNob3dXYXJuaW5nKSB7XG4gICAgICAgICAgICAgIHRoaXMuc2hvd01lbnRpb25zQ291bnRXYXJuaW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICk7XG4gIH1cbiAgb3BlbkVkaXRQcmV2aWV3KCkge1xuICAgIGxldCBtZXNzYWdlVGV4dFdpdGhNZW50aW9uVGFncyA9IHRoaXMuY2hlY2tGb3JNZW50aW9ucyhcbiAgICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhXG4gICAgKTtcbiAgICB0aGlzLnRleHQgPSBcIlwiO1xuICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgIHRoaXMudGV4dCA9IHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQhLmdldFRleHQoKTtcbiAgICB0aGlzLmVkaXRQcmV2aWV3VGV4dCA9IG1lc3NhZ2VUZXh0V2l0aE1lbnRpb25UYWdzO1xuICAgIHRoaXMuc2hvd1ByZXZpZXcgPSB0cnVlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIEAgZm9yIGV2ZXJ5IG1lbnRpb24gdGhlIG1lc3NhZ2UgYnkgbWF0Y2hpbmcgdWlkXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEByZXR1cm5zICB7dm9pZH1cbiAgICovXG4gIGNoZWNrRm9yTWVudGlvbnMobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlKSB7XG4gICAgY29uc3QgcmVnZXggPSAvPEB1aWQ6KC4qPyk+L2c7XG4gICAgbGV0IG1lc3NhZ2VUZXh0ID0gbWVzc2FnZS5nZXRUZXh0KCk7XG4gICAgbGV0IG1lc3NhZ2VUZXh0VG1wID0gbWVzc2FnZVRleHQ7XG4gICAgbGV0IG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgbGV0IG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZS5nZXRNZW50aW9uZWRVc2VycygpO1xuICAgIGxldCBjb21ldENoYXRVc2Vyc0dyb3VwTWVtYmVycyA9IFtdO1xuICAgIHdoaWxlIChtYXRjaCAhPT0gbnVsbCkge1xuICAgICAgbGV0IHVzZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChtYXRjaFsxXSA9PSBtZW50aW9uZWRVc2Vyc1tpXS5nZXRVaWQoKSkge1xuICAgICAgICAgIHVzZXIgPSBtZW50aW9uZWRVc2Vyc1tpXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgbWVzc2FnZVRleHRUbXAgPSBtZXNzYWdlVGV4dFRtcC5yZXBsYWNlKG1hdGNoWzBdLCBcIkBcIiArIHVzZXIuZ2V0TmFtZSgpKTtcbiAgICAgICAgY29tZXRDaGF0VXNlcnNHcm91cE1lbWJlcnMucHVzaCh1c2VyKTtcbiAgICAgIH1cbiAgICAgIG1hdGNoID0gcmVnZXguZXhlYyhtZXNzYWdlVGV4dCk7XG4gICAgfVxuICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0Q29tZXRDaGF0VXNlckdyb3VwTWVtYmVycyhcbiAgICAgIGNvbWV0Q2hhdFVzZXJzR3JvdXBNZW1iZXJzXG4gICAgKTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldExvZ2dlZEluVXNlcih0aGlzLmxvZ2dlZEluVXNlciEpO1xuICAgIHJldHVybiBtZXNzYWdlVGV4dFRtcDtcbiAgfVxuXG4gIHVuc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY01lc3NhZ2VFZGl0Py51bnN1YnNjcmliZSgpO1xuICAgIHRoaXMuY2NTaG93TWVudGlvbnNDb3VudFdhcm5pbmc/LnVuc3Vic2NyaWJlKCk7XG4gIH1cbiAgY2xvc2VNb2RhbHMoKSB7XG4gICAgaWYgKHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSkge1xuICAgICAgdGhpcy5hY3Rpb25TaGVldFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gZmFsc2U7XG4gICAgfVxuICAgIGlmICh0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQpIHtcbiAgICAgIHRoaXMubWVkaWFSZWNvcmRlZFJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZj8ubmF0aXZlRWxlbWVudD8uY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIH1cbiAgfVxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuXG4gIGNhbGxDb252ZXJzYXRpb25TdW1tYXJ5TWV0aG9kKCkge1xuICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSBmYWxzZTtcbiAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcblxuICAgIENvbWV0Q2hhdFVJRXZlbnRzLmNjU2hvd1BhbmVsLm5leHQoe1xuICAgICAgY2hpbGQ6IHsgc2hvd0NvbnZlcnNhdGlvblN1bW1hcnlWaWV3OiB0cnVlIH0sXG4gICAgfSk7XG4gIH1cbiAgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuICAgIGlmIChjaGFuZ2VzW1widXNlclwiXSB8fCBjaGFuZ2VzW1wiZ3JvdXBcIl0pIHtcbiAgICAgIHRoaXMudXNlck9yR3JvdXBDaGFuZ2VkKGNoYW5nZXMpO1xuICAgIH1cbiAgfVxuXG4gIHVzZXJPckdyb3VwQ2hhbmdlZChjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgICBpZiAoY2hhbmdlc1tcImdyb3VwXCJdICYmIHRoaXMuZ3JvdXApIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIHRoaXMudXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uPy51c2VyTWVtYmVyTGlzdFR5cGUgPT0gdW5kZWZpbmVkXG4gICAgICAgICkge1xuICAgICAgICAgIHRoaXMudXNlck1lbWJlckxpc3RUeXBlID0gVXNlck1lbWJlckxpc3RUeXBlLmdyb3VwbWVtYmVycztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyID0gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAuZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgID8gdGhpcy51c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZ3JvdXBNZW1iZXJSZXF1ZXN0QnVpbGRlclxuICAgICAgICAgIDogbmV3IENvbWV0Q2hhdC5Hcm91cE1lbWJlcnNSZXF1ZXN0QnVpbGRlcihcbiAgICAgICAgICAgIHRoaXMuZ3JvdXAuZ2V0R3VpZCgpXG4gICAgICAgICAgKS5zZXRMaW1pdCgxNSk7XG4gICAgICB9XG4gICAgICBpZiAoY2hhbmdlc1tcInVzZXJcIl0gJiYgdGhpcy51c2VyKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbj8udXNlck1lbWJlckxpc3RUeXBlID09IHVuZGVmaW5lZFxuICAgICAgICApIHtcbiAgICAgICAgICB0aGlzLnVzZXJNZW1iZXJMaXN0VHlwZSA9IFVzZXJNZW1iZXJMaXN0VHlwZS51c2VycztcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnVzZXJzUmVxdWVzdEJ1aWxkZXIgPSB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvblxuICAgICAgICAgIC51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgPyB0aGlzLnVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2Vyc1JlcXVlc3RCdWlsZGVyXG4gICAgICAgICAgOiBuZXcgQ29tZXRDaGF0LlVzZXJzUmVxdWVzdEJ1aWxkZXIoKS5zZXRMaW1pdCgxNSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd1NtYXJ0UmVwbHkgPSBmYWxzZTtcbiAgICB0aGlzLmNsb3NlTW9kYWxzKCk7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG5cbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICB0aGlzLmNvbXBvc2VySWQgPSB0aGlzLmdldENvbXBvc2VySWQoKTtcbiAgICBpZiAodGhpcy5hdHRhY2htZW50T3B0aW9ucykge1xuICAgICAgdGhpcy5jb21wb3NlckFjdGlvbnMgPSB0aGlzLmF0dGFjaG1lbnRPcHRpb25zKFxuICAgICAgICB0aGlzLnVzZXIgfHwgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5jb21wb3NlcklkXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmNvbXBvc2VyQWN0aW9ucyA9XG4gICAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdHRhY2htZW50T3B0aW9ucyhcbiAgICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZSxcbiAgICAgICAgICB0aGlzLnVzZXIsXG4gICAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgICB0aGlzLmNvbXBvc2VySWRcbiAgICAgICAgKTtcbiAgICAgIHRoaXMuYWRkQXR0YWNobWVudENhbGxiYWNrKCk7XG4gICAgfVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5zZXRDb21wb3NlckNvbmZpZyh0aGlzLnVzZXIsIHRoaXMuZ3JvdXAsIHRoaXMuY29tcG9zZXJJZCk7XG4gICAgfVxuICB9XG5cbiAgbmdPbkRlc3Ryb3koKTogdm9pZCB7XG4gICAgdGhpcy51bnN1YnNjcmliZVRvRXZlbnRzKCk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5jbGVhbnVwKCk7XG4gIH1cblxuICBjdXN0b21TZW5kTWV0aG9kKG1lc3NhZ2U6IFN0cmluZykge1xuICAgIHRoaXMuc2hvd1NlbmRCdXR0b24gPSBmYWxzZTtcbiAgICB0aGlzLnNlbmRUZXh0TWVzc2FnZShtZXNzYWdlKTtcbiAgICB0aGlzLmRpc2FibGVTZW5kQnV0dG9uKCk7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtTdHJpbmc9XCJcIn0gdGV4dE1zZ1xuICAgKi9cbiAgc2VuZFRleHRNZXNzYWdlKHRleHRNc2c6IFN0cmluZyA9IFwiXCIpOiBib29sZWFuIHtcbiAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgIHRyeSB7XG4gICAgICAvLyBEb250IFNlbmQgQmxhbmsgdGV4dCBtZXNzYWdlcyAtLSBpLmUgLS0tIG1lc3NhZ2VzIHRoYXQgb25seSBjb250YWluIHNwYWNlc1xuICAgICAgaWYgKFxuICAgICAgICB0aGlzLm1lc3NhZ2VUZXh0Py50cmltKCk/Lmxlbmd0aCA9PSAwICYmXG4gICAgICAgIHRleHRNc2c/LnRyaW0oKT8ubGVuZ3RoID09IDBcbiAgICAgICkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICAvLyB3YWl0IGZvciB0aGUgcHJldmlvdXMgbWVzc2FnZSB0byBiZSBzZW50IGJlZm9yZSBzZW5kaW5nIHRoZSBjdXJyZW50IG1lc3NhZ2VcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VTZW5kaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSB0cnVlO1xuICAgICAgLy8gSWYgaXRzIGFuIEVkaXQgYW5kIFNlbmQgTWVzc2FnZSBPcGVyYXRpb24gLCB1c2UgRWRpdCBNZXNzYWdlIEZ1bmN0aW9uXG4gICAgICBpZiAodGhpcy5tZXNzYWdlVG9CZUVkaXRlZCkge1xuICAgICAgICB0aGlzLmVkaXRNZXNzYWdlKCk7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lc3NhZ2VJbnB1dDtcbiAgICAgIGlmICh0ZXh0TXNnICE9PSBudWxsKSB7XG4gICAgICAgIG1lc3NhZ2VJbnB1dCA9IHRleHRNc2cudHJpbSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbWVzc2FnZUlucHV0ID0gdGhpcy5tZXNzYWdlVGV4dC50cmltKCk7XG4gICAgICB9XG4gICAgICBsZXQgdGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIG1lc3NhZ2VJbnB1dCxcbiAgICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgICApO1xuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIHRleHRNZXNzYWdlLnNldFBhcmVudE1lc3NhZ2VJZCh0aGlzLnBhcmVudE1lc3NhZ2VJZCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aCkge1xuICAgICAgICBsZXQgdXNlck9iamVjdHMgPSBbXTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm1lbnRpb25lZFVzZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdXNlck9iamVjdHMucHVzaChcbiAgICAgICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnNbaV0gaW5zdGFuY2VvZiBDb21ldENoYXQuR3JvdXBNZW1iZXJcbiAgICAgICAgICAgICAgPyAodGhpcy5tZW50aW9uZWRVc2Vyc1tpXSBhcyBDb21ldENoYXQuVXNlcilcbiAgICAgICAgICAgICAgOiB0aGlzLm1lbnRpb25lZFVzZXJzW2ldXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXh0TWVzc2FnZS5zZXRNZW50aW9uZWRVc2Vycyh1c2VyT2JqZWN0cyk7XG4gICAgICAgIHRoaXMubWVudGlvbmVkVXNlcnMgPSBbXTtcbiAgICAgIH1cblxuICAgICAgdGV4dE1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgdGV4dE1lc3NhZ2Uuc2V0TXVpZChDb21ldENoYXRVSUtpdFV0aWxpdHkuSUQoKSk7XG4gICAgICBpZiAodGhpcy5sb2dnZWRJblVzZXIpIHtcbiAgICAgICAgdGV4dE1lc3NhZ2Uuc2V0U2VuZGVyKHRoaXMubG9nZ2VkSW5Vc2VyKVxuICAgICAgfVxuICAgICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcblxuICAgICAgLy8gcGxheSBhdWRpbyBhZnRlciBhY3Rpb24gZ2VuZXJhdGlvblxuICAgICAgaWYgKCF0aGlzLmRpc2FibGVTb3VuZEZvck1lc3NhZ2VzKSB7XG4gICAgICAgIHRoaXMucGxheUF1ZGlvKCk7XG4gICAgICB9XG4gICAgICAvL2NsZWFyaW5nIE1lc3NhZ2UgSW5wdXQgQm94XG4gICAgICB0aGlzLm1lc3NhZ2VUZXh0ID0gXCJcIjtcbiAgICAgIHRoaXMuaW5wdXRSZWY/Lm5hdGl2ZUVsZW1lbnQ/LmVtcHR5SW5wdXRGaWVsZCgpO1xuICAgICAgdGhpcy50ZXh0ID0gXCJcIjtcbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy50ZXh0Rm9ybWF0dGVyTGlzdC5sZW5ndGg7IGkrKykge1xuICAgICAgICB0ZXh0TWVzc2FnZSA9ICh0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldLmZvcm1hdE1lc3NhZ2VGb3JTZW5kaW5nKHRleHRNZXNzYWdlKSBhcyBDb21ldENoYXQuVGV4dE1lc3NhZ2UpO1xuICAgICAgfVxuICAgICAgLy8gRW5kIFR5cGluZyBJbmRpY2F0b3IgRnVuY3Rpb25cbiAgICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICAgICAgaWYgKCF0aGlzLm9uU2VuZEJ1dHRvbkNsaWNrKSB7XG4gICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICBtZXNzYWdlOiB0ZXh0TWVzc2FnZSxcbiAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZSh0ZXh0TWVzc2FnZSlcbiAgICAgICAgICAudGhlbigobWVzc2FnZTogQ29tZXRDaGF0LlRleHRNZXNzYWdlIHwgQ29tZXRDaGF0LkJhc2VNZXNzYWdlKSA9PiB7XG4gICAgICAgICAgICBsZXQgbWVzc2FnZU9iamVjdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVzc2FnZU9iamVjdCxcbiAgICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vIENoYW5nZSB0aGUgc2VuZCBidXR0b24gdG8gcmVhY3Rpb24gYnV0dG9uXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5zaG93U2VuZEJ1dHRvbiA9IGZhbHNlO1xuICAgICAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICAgIHRleHRNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogdGV4dE1lc3NhZ2UsXG4gICAgICAgICAgICAgIHN0YXR1czogTWVzc2FnZVN0YXR1cy5lcnJvcixcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5vblNlbmRCdXR0b25DbGljayh0ZXh0TWVzc2FnZSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgb25BaUJhY2tCdXR0b25DbGljaygpIHtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IHRydWU7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9XG5cbiAgZWRpdE1lc3NhZ2UoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1lc3NhZ2VUb0JlRWRpdGVkOiBhbnkgPSB0aGlzLm1lc3NhZ2VUb0JlRWRpdGVkO1xuICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgbGV0IG1lc3NhZ2VUZXh0ID0gdGhpcy5tZXNzYWdlVGV4dC50cmltKCk7XG4gICAgICBsZXQgbWVudGlvbmVkVXNlcnMgPSBbXTtcbiAgICAgIGlmIChtZXNzYWdlVG9CZUVkaXRlZC5nZXRNZW50aW9uZWRVc2VycygpKSB7XG4gICAgICAgIG1lbnRpb25lZFVzZXJzID0gbWVzc2FnZVRvQmVFZGl0ZWQuZ2V0TWVudGlvbmVkVXNlcnMoKTtcbiAgICAgICAgbWVzc2FnZVRleHQgPVxuICAgICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0T3JpZ2luYWxUZXh0KG1lc3NhZ2VUZXh0KTtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKFxuICAgICAgICAgIG1lbnRpb25lZFVzZXJzXG4gICAgICAgICk7XG4gICAgICAgIG1lc3NhZ2VUZXh0ID1cbiAgICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLmdldE9yaWdpbmFsVGV4dChtZXNzYWdlVGV4dCk7XG4gICAgICB9XG4gICAgICBsZXQgdGV4dE1lc3NhZ2U6IENvbWV0Q2hhdC5UZXh0TWVzc2FnZSA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIG1lc3NhZ2VUZXh0LFxuICAgICAgICByZWNlaXZlclR5cGVcbiAgICAgICk7XG4gICAgICBpZiAobWVudGlvbmVkVXNlcnMubGVuZ3RoKSB7XG4gICAgICAgIHRleHRNZXNzYWdlLnNldE1lbnRpb25lZFVzZXJzKG1lbnRpb25lZFVzZXJzKTtcbiAgICAgIH1cbiAgICAgIHRleHRNZXNzYWdlLnNldElkKG1lc3NhZ2VUb0JlRWRpdGVkLmlkKTtcbiAgICAgIHRoaXMuY2xvc2VQcmV2aWV3KCk7XG4gICAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgICB0aGlzLnNob3dNZW50aW9uc0NvdW50V2FybmluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5tZXNzYWdlVG9CZUVkaXRlZCA9IG51bGw7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdGV4dE1lc3NhZ2UgPSAodGhpcy50ZXh0Rm9ybWF0dGVyTGlzdFtpXS5mb3JtYXRNZXNzYWdlRm9yU2VuZGluZyh0ZXh0TWVzc2FnZSkgYXMgQ29tZXRDaGF0LlRleHRNZXNzYWdlKTtcbiAgICAgIH1cbiAgICAgIENvbWV0Q2hhdC5lZGl0TWVzc2FnZSh0ZXh0TWVzc2FnZSlcbiAgICAgICAgLnRoZW4oKG1lc3NhZ2UpID0+IHtcbiAgICAgICAgICB0aGlzLm1lc3NhZ2VTZW5kaW5nID0gZmFsc2U7XG4gICAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VFZGl0ZWQubmV4dCh7XG4gICAgICAgICAgICBtZXNzYWdlOiBtZXNzYWdlLFxuICAgICAgICAgICAgc3RhdHVzOiBNZXNzYWdlU3RhdHVzLnN1Y2Nlc3MsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5yZXNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGdldFJlY2VpdmVyRGV0YWlscygpIHtcbiAgICBsZXQgcmVjZWl2ZXJJZCE6IHN0cmluZztcbiAgICBsZXQgcmVjZWl2ZXJUeXBlITogc3RyaW5nO1xuICAgIGxldCBpc0Jsb2NrZWQgPSBmYWxzZTtcbiAgICBpZiAodGhpcy51c2VyICYmIHRoaXMudXNlci5nZXRVaWQoKSkge1xuICAgICAgcmVjZWl2ZXJJZCA9IHRoaXMudXNlci5nZXRVaWQoKTtcbiAgICAgIHJlY2VpdmVyVHlwZSA9IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUudXNlcjtcbiAgICAgIGlzQmxvY2tlZD0gdGhpcy51c2VyLmdldEJsb2NrZWRCeU1lKCkgfHwgdGhpcy51c2VyLmdldEhhc0Jsb2NrZWRNZSgpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5ncm91cCAmJiB0aGlzLmdyb3VwLmdldEd1aWQoKSkge1xuICAgICAgcmVjZWl2ZXJJZCA9IHRoaXMuZ3JvdXAuZ2V0R3VpZCgpO1xuICAgICAgcmVjZWl2ZXJUeXBlID0gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS5ncm91cDtcbiAgICB9XG4gICAgcmV0dXJuIHsgcmVjZWl2ZXJJZDogcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlOiByZWNlaXZlclR5cGUsIGlzQmxvY2tlZCB9O1xuICB9XG4gIHBsYXlBdWRpbygpIHtcbiAgICBpZiAodGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UpIHtcbiAgICAgIENvbWV0Q2hhdFNvdW5kTWFuYWdlci5wbGF5KFxuICAgICAgICBDb21ldENoYXRTb3VuZE1hbmFnZXIuU291bmQub3V0Z29pbmdNZXNzYWdlLFxuICAgICAgICB0aGlzLmN1c3RvbVNvdW5kRm9yTWVzc2FnZVxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgQ29tZXRDaGF0U291bmRNYW5hZ2VyLnBsYXkoQ29tZXRDaGF0U291bmRNYW5hZ2VyLlNvdW5kLm91dGdvaW5nTWVzc2FnZSk7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHt9IHRpbWVyPW51bGxcbiAgICogQHBhcmFtICB7c3RyaW5nPVwiXCJ9IG1ldGFkYXRhXG4gICAqL1xuICBzdGFydFR5cGluZyh0aW1lciA9IG51bGwsIG1ldGFkYXRhOiBzdHJpbmcgPSBcIlwiKTogdm9pZCB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVUeXBpbmdFdmVudHMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGxldCB0eXBpbmdJbnRlcnZhbCA9IHRpbWVyIHx8IDUwMDA7XG4gICAgICAgIGxldCB7IHJlY2VpdmVySWQsIHJlY2VpdmVyVHlwZSwgaXNCbG9ja2VkIH0gPSB0aGlzLmdldFJlY2VpdmVyRGV0YWlscygpO1xuICAgICAgICBpZiAoaXNCbG9ja2VkKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGxldCB0eXBpbmdNZXRhZGF0YSA9IG1ldGFkYXRhIHx8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IHR5cGluZ05vdGlmaWNhdGlvbiA9IG5ldyBDb21ldENoYXQuVHlwaW5nSW5kaWNhdG9yKFxuICAgICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgICAgcmVjZWl2ZXJUeXBlLFxuICAgICAgICAgIHR5cGluZ01ldGFkYXRhXG4gICAgICAgICk7XG4gICAgICAgIENvbWV0Q2hhdC5zdGFydFR5cGluZyh0eXBpbmdOb3RpZmljYXRpb24pO1xuICAgICAgICB0aGlzLnN0b3JlVHlwaW5nSW50ZXJ2YWwgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICB0aGlzLmVuZFR5cGluZygpO1xuICAgICAgICB9LCB0eXBpbmdJbnRlcnZhbCk7XG4gICAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVBY3Rpb25zID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBsZXQgYWN0aW9uOiBDb21ldENoYXRNZXNzYWdlQ29tcG9zZXJBY3Rpb24gPSBldmVudD8uZGV0YWlsPy5hY3Rpb247XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIGlmIChhY3Rpb24ub25DbGljaykge1xuICAgICAgYWN0aW9uLm9uQ2xpY2soKTtcbiAgICB9XG4gIH07XG4gIGVuZFR5cGluZyhtZXRhZGF0YSA9IG51bGwpIHtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZVR5cGluZ0V2ZW50cykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbGV0IHsgcmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLGlzQmxvY2tlZCB9ID0gdGhpcy5nZXRSZWNlaXZlckRldGFpbHMoKTtcbiAgICAgICAgaWYgKGlzQmxvY2tlZCkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBsZXQgdHlwaW5nTWV0YWRhdGEgPSBtZXRhZGF0YSB8fCB1bmRlZmluZWQ7XG4gICAgICAgIGxldCB0eXBpbmdOb3RpZmljYXRpb24gPSBuZXcgQ29tZXRDaGF0LlR5cGluZ0luZGljYXRvcihcbiAgICAgICAgICByZWNlaXZlcklkLFxuICAgICAgICAgIHJlY2VpdmVyVHlwZSxcbiAgICAgICAgICB0eXBpbmdNZXRhZGF0YVxuICAgICAgICApO1xuICAgICAgICBDb21ldENoYXQuZW5kVHlwaW5nKHR5cGluZ05vdGlmaWNhdGlvbik7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnN0b3JlVHlwaW5nSW50ZXJ2YWwpO1xuICAgICAgICB0aGlzLnN0b3JlVHlwaW5nSW50ZXJ2YWwgPSBudWxsO1xuICAgICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHtGaWxlIHwgQ29tZXRDaGF0Lk1lZGlhTWVzc2FnZX0gbWVzc2FnZUlucHV0XG4gICAqIEBwYXJhbSAge3N0cmluZ30gbWVzc2FnZVR5cGVcbiAgICovXG4gIHNlbmRNZWRpYU1lc3NhZ2UobWVzc2FnZUlucHV0OiBGaWxlLCBtZXNzYWdlVHlwZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLm1lc3NhZ2VTZW5kaW5nKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSB0cnVlO1xuICAgICAgY29uc3QgeyByZWNlaXZlcklkLCByZWNlaXZlclR5cGUgfSA9IHRoaXMuZ2V0UmVjZWl2ZXJEZXRhaWxzKCk7XG4gICAgICBsZXQgbWVkaWFNZXNzYWdlOiBDb21ldENoYXQuTWVkaWFNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5NZWRpYU1lc3NhZ2UoXG4gICAgICAgIHJlY2VpdmVySWQsXG4gICAgICAgIG1lc3NhZ2VJbnB1dCxcbiAgICAgICAgbWVzc2FnZVR5cGUsXG4gICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMucGFyZW50TWVzc2FnZUlkKSB7XG4gICAgICAgIG1lZGlhTWVzc2FnZS5zZXRQYXJlbnRNZXNzYWdlSWQodGhpcy5wYXJlbnRNZXNzYWdlSWQpO1xuICAgICAgfVxuICAgICAgbWVkaWFNZXNzYWdlLnNldFR5cGUobWVzc2FnZVR5cGUpO1xuICAgICAgbWVkaWFNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgW1wiZmlsZVwiXTogbWVzc2FnZUlucHV0LFxuICAgICAgfSk7XG4gICAgICBtZWRpYU1lc3NhZ2Uuc2V0U2VudEF0KENvbWV0Q2hhdFVJS2l0VXRpbGl0eS5nZXRVbml4VGltZXN0YW1wKCkpO1xuICAgICAgbWVkaWFNZXNzYWdlLnNldE11aWQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LklEKCkpO1xuICAgICAgaWYgKHRoaXMubG9nZ2VkSW5Vc2VyKSB7XG4gICAgICAgIG1lZGlhTWVzc2FnZS5zZXRTZW5kZXIodGhpcy5sb2dnZWRJblVzZXIpXG4gICAgICB9XG5cbiAgICAgIGlmICghdGhpcy5kaXNhYmxlU291bmRGb3JNZXNzYWdlcykge1xuICAgICAgICB0aGlzLnBsYXlBdWRpbygpO1xuICAgICAgfVxuICAgICAgdGhpcy5tZXNzYWdlU2VuZGluZyA9IGZhbHNlO1xuICAgICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gICAgICBpZiAoIXRoaXMub25TZW5kQnV0dG9uQ2xpY2spIHtcbiAgICAgICAgQ29tZXRDaGF0TWVzc2FnZUV2ZW50cy5jY01lc3NhZ2VTZW50Lm5leHQoe1xuICAgICAgICAgIG1lc3NhZ2U6IG1lZGlhTWVzc2FnZSxcbiAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuaW5wcm9ncmVzcyxcbiAgICAgICAgfSk7XG4gICAgICAgIENvbWV0Q2hhdC5zZW5kTWVzc2FnZShtZWRpYU1lc3NhZ2UpXG4gICAgICAgICAgLnRoZW4oKHJlc3BvbnNlOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpID0+IHtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIHJlc3BvbnNlLnNldE11aWQobWVkaWFNZXNzYWdlLmdldE11aWQoKSk7XG4gICAgICAgICAgICBDb21ldENoYXRNZXNzYWdlRXZlbnRzLmNjTWVzc2FnZVNlbnQubmV4dCh7XG4gICAgICAgICAgICAgIG1lc3NhZ2U6IHJlc3BvbnNlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuc3VjY2VzcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pXG4gICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgICAgICAgbWVkaWFNZXNzYWdlLnNldE1ldGFkYXRhKHtcbiAgICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIENvbWV0Q2hhdE1lc3NhZ2VFdmVudHMuY2NNZXNzYWdlU2VudC5uZXh0KHtcbiAgICAgICAgICAgICAgbWVzc2FnZTogbWVkaWFNZXNzYWdlLFxuICAgICAgICAgICAgICBzdGF0dXM6IE1lc3NhZ2VTdGF0dXMuZXJyb3IsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZVNlbmRpbmcgPSBmYWxzZTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMub25TZW5kQnV0dG9uQ2xpY2sobWVkaWFNZXNzYWdlKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgaW5wdXRDaGFuZ2VIYW5kbGVyID0gKGV2ZW50OiBhbnkpOiB2b2lkID0+IHtcbiAgICBjb25zdCBoYW5kbGVyID1cbiAgICAgIHRoaXMuYWNjZXB0SGFuZGxlcnNbdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHRdIHx8XG4gICAgICB0aGlzLm9uRmlsZUNoYW5nZS5iaW5kKHRoaXMpO1xuICAgIGhhbmRsZXIoZXZlbnQpO1xuICAgIGlmICh0aGlzLmlucHV0RWxlbWVudFJlZj8ubmF0aXZlRWxlbWVudCAmJiB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50Py52YWx1ZSkge1xuICAgICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC52YWx1ZSA9IFwiXCI7XG4gICAgfVxuICB9O1xuICBzZW5kU3RpY2tlciA9IChldmVudDogYW55KSA9PiB7XG4gICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmPy5uYXRpdmVFbGVtZW50Py5jbGljaygpO1xuICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIGxldCBzdGlja2VyID0gZXZlbnQ/LmRldGFpbD8uc3RpY2tlclVSTDtcbiAgICBsZXQgc3RpY2tlck5hbWU6IHN0cmluZyA9IGV2ZW50Py5kZXRhaWw/LnN0aWNrZXJOYW1lO1xuICAgIGlmICh0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKSB7XG4gICAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uPy5jb25maWd1cmF0aW9uPy5jY1N0aWNrZXJDbGlja2VkKFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogc3RpY2tlck5hbWUsXG4gICAgICAgICAgdXJsOiBzdGlja2VyLFxuICAgICAgICB9LFxuICAgICAgICB0aGlzLmxvZ2dlZEluVXNlciEsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cCxcbiAgICAgICAgdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICAgIHRoaXMub25FcnJvcixcbiAgICAgICAgdGhpcy5jdXN0b21Tb3VuZEZvck1lc3NhZ2UsXG4gICAgICAgIHRoaXMuZGlzYWJsZVNvdW5kRm9yTWVzc2FnZXNcbiAgICAgICk7XG4gICAgfVxuICB9O1xuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25WaWRlb0NoYW5nZShldmVudDogYW55KTogYm9vbGVhbiB7XG4gICAgdHJ5IHtcbiAgICAgIGlmICghZXZlbnQudGFyZ2V0LmZpbGVzWzBdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1swXTtcbiAgICAgIGNvbnN0IHJlYWRlcjogYW55ID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgIHJlYWRlci5hZGRFdmVudExpc3RlbmVyKFxuICAgICAgICBcImxvYWRcIixcbiAgICAgICAgKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG5ld0ZpbGUgPSBuZXcgRmlsZShcbiAgICAgICAgICAgIFtyZWFkZXIucmVzdWx0XSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZS5uYW1lLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlXG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLnNlbmRNZWRpYU1lc3NhZ2UoXG4gICAgICAgICAgICBuZXdGaWxlLFxuICAgICAgICAgICAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVR5cGVzLnZpZGVvXG4gICAgICAgICAgKTtcbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG4gICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIodXBsb2FkZWRGaWxlKTtcbiAgICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgICBpZiAodGhpcy5vbkVycm9yKSB7XG4gICAgICAgIHRoaXMub25FcnJvcihDb21ldENoYXRFeGNlcHRpb24oZXJyb3IpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgLyoqXG4gICAqIEBwYXJhbSAge2FueX0gZXZlbnRcbiAgICovXG4gIG9uQXVkaW9DaGFuZ2UoZXZlbnQ6IGFueSk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICBpZiAoIWV2ZW50LnRhcmdldC5maWxlc1swXSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBjb25zdCB1cGxvYWRlZEZpbGUgPSBldmVudC50YXJnZXQuZmlsZXNbMF07XG4gICAgICBjb25zdCByZWFkZXI6IGFueSA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICByZWFkZXIuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgXCJsb2FkXCIsXG4gICAgICAgICgpID0+IHtcbiAgICAgICAgICBjb25zdCBuZXdGaWxlID0gbmV3IEZpbGUoXG4gICAgICAgICAgICBbcmVhZGVyLnJlc3VsdF0sXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGUubmFtZSxcbiAgICAgICAgICAgIHVwbG9hZGVkRmlsZVxuICAgICAgICAgICk7XG4gICAgICAgICAgdGhpcy5zZW5kTWVkaWFNZXNzYWdlKFxuICAgICAgICAgICAgbmV3RmlsZSxcbiAgICAgICAgICAgIENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VUeXBlcy5hdWRpb1xuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIC8qKlxuICAgKiBAcGFyYW0gIHthbnl9IGV2ZW50XG4gICAqL1xuICBvbkltYWdlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgY29uc3QgdXBsb2FkZWRGaWxlID0gZXZlbnQudGFyZ2V0LmZpbGVzWzBdO1xuICAgICAgY29uc3QgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuaW1hZ2VcbiAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcbiAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcih1cGxvYWRlZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgdGhpcy5vbkVycm9yKENvbWV0Q2hhdEV4Y2VwdGlvbihlcnJvcikpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICAvKipcbiAgICogQHBhcmFtICB7YW55fSBldmVudFxuICAgKi9cbiAgb25GaWxlQ2hhbmdlKGV2ZW50OiBhbnkpOiBib29sZWFuIHtcbiAgICB0cnkge1xuICAgICAgaWYgKCFldmVudC50YXJnZXQuZmlsZXNbXCIwXCJdKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHVwbG9hZGVkRmlsZSA9IGV2ZW50LnRhcmdldC5maWxlc1tcIjBcIl07XG4gICAgICB2YXIgcmVhZGVyOiBhbnkgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgICAgIFwibG9hZFwiLFxuICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgbmV3RmlsZSA9IG5ldyBGaWxlKFxuICAgICAgICAgICAgW3JlYWRlci5yZXN1bHRdLFxuICAgICAgICAgICAgdXBsb2FkZWRGaWxlLm5hbWUsXG4gICAgICAgICAgICB1cGxvYWRlZEZpbGVcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMuc2VuZE1lZGlhTWVzc2FnZShcbiAgICAgICAgICAgIG5ld0ZpbGUsXG4gICAgICAgICAgICBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlVHlwZXMuZmlsZVxuICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZhbHNlXG4gICAgICApO1xuICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKHVwbG9hZGVkRmlsZSk7XG4gICAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICB0aGlzLm9uRXJyb3IoQ29tZXRDaGF0RXhjZXB0aW9uKGVycm9yKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG4gIG9wZW5JbWFnZVBpY2tlciA9ICgpOiB2b2lkID0+IHtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LnR5cGUgPSBcImZpbGVcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmFjY2VwdCA9IFwiaW1hZ2UvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbkZpbGVQaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImZpbGUvKlwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICB0aGlzLmNsb3NlUG9wb3ZlcnMoKTtcbiAgfTtcbiAgb3BlbnZpZGVvUGlja2VyID0gKCk6IHZvaWQgPT4ge1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQudHlwZSA9IFwiZmlsZVwiO1xuICAgIHRoaXMuaW5wdXRFbGVtZW50UmVmLm5hdGl2ZUVsZW1lbnQuYWNjZXB0ID0gXCJ2aWRlby8qXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgIHRoaXMuY2xvc2VQb3BvdmVycygpO1xuICB9O1xuICBvcGVuQXVkaW9QaWNrZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC50eXBlID0gXCJmaWxlXCI7XG4gICAgdGhpcy5pbnB1dEVsZW1lbnRSZWYubmF0aXZlRWxlbWVudC5hY2NlcHQgPSBcImF1ZGlvLypcIjtcbiAgICB0aGlzLmlucHV0RWxlbWVudFJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgdGhpcy5jbG9zZVBvcG92ZXJzKCk7XG4gIH07XG4gIGhhbmRsZU91dHNpZGVDbGljaygpIHtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0gPSBmYWxzZTtcbiAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkID0gZmFsc2U7XG4gICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuICBvcGVuQWN0aW9uU2hlZXQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gZmFsc2U7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG5cbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgaGFuZGxlQWlGZWF0dXJlc0Nsb3NlID0gKGNhbGxiYWNrOiAoKSA9PiB2b2lkKSA9PiB7XG4gICAgdGhpcy5haUZlYXR1cmVzQ2xvc2VDYWxsYmFjayA9IGNhbGxiYWNrO1xuICB9O1xuXG4gIGNsb3NlU21hcnRSZXBseSA9ICgpID0+IHtcbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gZmFsc2U7XG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIHJldHVybjtcbiAgfTtcbiAgb3BlbkFpRmVhdHVyZXMgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmICh0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKSB7XG4gICAgICB0aGlzLmFpRmVhdHVyZXNDbG9zZUNhbGxiYWNrKCk7XG4gICAgfVxuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlbkVtb2ppS2V5Ym9hcmQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGlmIChldmVudD8uZGV0YWlsPy5oYXNPd25Qcm9wZXJ0eShcImlzT3BlblwiKSkge1xuICAgICAgdGhpcy5zaG93RW1vamlLZXlib2FyZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgdGhpcy5jbG9zZU1lZGlhUmVjb3JkZXIoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQpIHtcbiAgICAgIHRoaXMuc3RpY2tlckJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSAhdGhpcy5zaG93U3RpY2tlcktleWJvYXJkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zaG93QWlGZWF0dXJlcykge1xuICAgICAgdGhpcy5haUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dBaUZlYXR1cmVzID0gIXRoaXMuc2hvd0FpRmVhdHVyZXM7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG4gIG9wZW5NZWRpYVJlY29yZGVkID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAoZXZlbnQ/LmRldGFpbD8uaGFzT3duUHJvcGVydHkoXCJpc09wZW5cIikpIHtcbiAgICAgIHRoaXMudG9nZ2xlTWVkaWFSZWNvcmRlZCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnRvZ2dsZU1lZGlhUmVjb3JkZWQgPSAhdGhpcy50b2dnbGVNZWRpYVJlY29yZGVkO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9XG4gICAgaWYgKHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCkge1xuICAgICAgdGhpcy5zdGlja2VyQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZCA9ICF0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQ7XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBaUZlYXR1cmVzKSB7XG4gICAgICB0aGlzLmFpQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FpRmVhdHVyZXMgPSAhdGhpcy5zaG93QWlGZWF0dXJlcztcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgb3BlblN0aWNrZXJLZXlib2FyZCA9IChldmVudDogYW55KSA9PiB7XG4gICAgaWYgKGV2ZW50Py5kZXRhaWw/Lmhhc093blByb3BlcnR5KFwiaXNPcGVuXCIpKSB7XG4gICAgICB0aGlzLnNob3dTdGlja2VyS2V5Ym9hcmQgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5zaG93U3RpY2tlcktleWJvYXJkID0gIXRoaXMuc2hvd1N0aWNrZXJLZXlib2FyZDtcbiAgICB0aGlzLmNsb3NlTWVkaWFSZWNvcmRlcigpO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICBpZiAodGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtKSB7XG4gICAgICB0aGlzLmFjdGlvblNoZWV0UmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbSA9ICF0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW07XG4gICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dFbW9qaUtleWJvYXJkKSB7XG4gICAgICB0aGlzLmVtb2ppQnV0dG9uUmVmLm5hdGl2ZUVsZW1lbnQuY2xpY2soKTtcbiAgICAgIHRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQgPSAhdGhpcy5zaG93RW1vamlLZXlib2FyZDtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcbiAgY2xvc2VQb3BvdmVycygpIHtcbiAgICBpZiAodGhpcy5zaG93RW1vamlLZXlib2FyZCkge1xuICAgICAgdGhpcy5lbW9qaUJ1dHRvblJlZi5uYXRpdmVFbGVtZW50LmNsaWNrKCk7XG4gICAgICB0aGlzLnNob3dFbW9qaUtleWJvYXJkID0gIXRoaXMuc2hvd0Vtb2ppS2V5Ym9hcmQ7XG4gICAgfVxuICAgIGlmICh0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW0pIHtcbiAgICAgIHRoaXMuYWN0aW9uU2hlZXRSZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuICAgICAgdGhpcy5zaG93QWN0aW9uU2hlZXRJdGVtID0gIXRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbTtcbiAgICB9XG4gIH1cbiAgZ2V0Q29tcG9zZXJJZCgpOiBDb21wb3NlcklkIHtcbiAgICBjb25zdCB1c2VyID0gdGhpcy51c2VyO1xuICAgIGlmICh1c2VyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHVzZXI6IHVzZXI/LmdldFVpZCgpLFxuICAgICAgICBncm91cDogbnVsbCxcbiAgICAgICAgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCxcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGdyb3VwID0gdGhpcy5ncm91cDtcbiAgICBpZiAoZ3JvdXAgIT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdXNlcjogbnVsbCxcbiAgICAgICAgZ3JvdXA6IGdyb3VwPy5nZXRHdWlkKCksXG4gICAgICAgIHBhcmVudE1lc3NhZ2VJZDogdGhpcy5wYXJlbnRNZXNzYWdlSWQsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB1c2VyOiBudWxsLCBncm91cDogbnVsbCwgcGFyZW50TWVzc2FnZUlkOiB0aGlzLnBhcmVudE1lc3NhZ2VJZCB9O1xuICB9XG4gIG5nT25Jbml0KCk6IHZvaWQge1xuICAgIHRoaXMuc2V0VGhlbWUoKTtcbiAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0ID0gdGhpcy50ZXh0Rm9ybWF0dGVyc1xuICAgICAgPyB0aGlzLnRleHRGb3JtYXR0ZXJzXG4gICAgICA6IFtdO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCB0aGlzLmhhbmRsZUNsaWNrT3V0c2lkZSk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9XG4gICAgICBDaGF0Q29uZmlndXJhdG9yLmdldERhdGFTb3VyY2UoKS5nZXRNZW50aW9uc1RleHRGb3JtYXR0ZXIoe1xuICAgICAgICB0aGVtZTogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUsXG4gICAgICB9KTtcbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaCgoZXJyb3I6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgaWYgKHRoaXMub25FcnJvcikge1xuICAgICAgICAgIHRoaXMub25FcnJvcihlcnJvcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgdGhpcy5pbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIoKTtcblxuICAgIHRoaXMuYWN0aW9ucyA9IENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpLmdldEFJT3B0aW9ucyhcbiAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLFxuICAgICAgdGhpcy5nZXRDb21wb3NlcklkKCkgYXMgdW5rbm93biBhcyBNYXA8c3RyaW5nLCBhbnk+LFxuICAgICAgdGhpcy5haU9wdGlvbnNTdHlsZVxuICAgICk7XG4gICAgdGhpcy5haUJvdExpc3QgPSBbXTtcblxuXG4gICAgdGhpcy5zdWJzY3JpYmVUb0V2ZW50cygpO1xuICAgIHRoaXMuZW5hYmxlU3RpY2tlcktleWJvYXJkID0gdHJ1ZTtcbiAgICB0aGlzLnN0aWNrZXJDb25maWd1cmF0aW9uID1cbiAgICAgIENoYXRDb25maWd1cmF0b3IuZ2V0RGF0YVNvdXJjZSgpPy5nZXRBdXhpbGlhcnlPcHRpb25zKFxuICAgICAgICB0aGlzLmNvbXBvc2VySWQsXG4gICAgICAgIHRoaXMudXNlcixcbiAgICAgICAgdGhpcy5ncm91cFxuICAgICAgKTtcbiAgICBpZiAodGhpcy5zdGlja2VyQ29uZmlndXJhdGlvbj8uaWQgPT0gU3RpY2tlcnNDb25zdGFudHMuc3RpY2tlcikge1xuICAgICAgdGhpcy5lbmFibGVTdGlja2VyS2V5Ym9hcmQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmVuYWJsZVN0aWNrZXJLZXlib2FyZCA9IGZhbHNlO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZUFpRmVhdHVyZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBmb3IgZGV2ZWxvcGVyIHByb3ZpZGVkIGluc3RhbmNlIG9mIE1lbnRpb25zVGV4dEZvcm1hdHRlclxuICAgKiBJZiBub3QgcHJvdmlkZWQsIGFkZCBkZWZhdWx0XG4gICAqIElmIHByb3ZpZGVkLCBjaGVjayBpZiBzdHlsZSBpcyBwcm92aWRlZCB2aWEgY29uZmlndXJhdGlvbiwgdGhlbiBhZGQgc3R5bGUuXG4gICAqL1xuICBpbml0aWFsaXplTWVudGlvbnNGb3JtYXR0ZXIgPSAoKSA9PiB7XG4gICAgaWYgKCF0aGlzLmRpc2FibGVNZW50aW9ucykge1xuICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRNZW50aW9uc1RleHRTdHlsZShcbiAgICAgICAgdGhpcy5nZXRNZW50aW9uc1N0eWxlKClcbiAgICAgICk7XG4gICAgICBsZXQgZm91bmRNZW50aW9uc0Zvcm1hdHRlciE6IENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgaWYgKHRoaXMudGV4dEZvcm1hdHRlcnMhLmxlbmd0aCkge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGV4dEZvcm1hdHRlckxpc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBpZiAoXG4gICAgICAgICAgICB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W2ldIGluc3RhbmNlb2YgQ29tZXRDaGF0TWVudGlvbnNGb3JtYXR0ZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIgPSB0aGlzLnRleHRGb3JtYXR0ZXJMaXN0W1xuICAgICAgICAgICAgICBpXG4gICAgICAgICAgICBdIGFzIENvbWV0Q2hhdE1lbnRpb25zRm9ybWF0dGVyO1xuICAgICAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGZvdW5kTWVudGlvbnNGb3JtYXR0ZXIpIHtcbiAgICAgICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZSA9IGZvdW5kTWVudGlvbnNGb3JtYXR0ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmIChcbiAgICAgICAgIXRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5VXBDYWxsQmFjaygpIHx8XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2UuZ2V0S2V5RG93bkNhbGxCYWNrKClcbiAgICAgICkge1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleVVwQ2FsbEJhY2soXG4gICAgICAgICAgdGhpcy5zZWFyY2hNZW50aW9uc1xuICAgICAgICApO1xuICAgICAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldEtleURvd25DYWxsQmFjayhcbiAgICAgICAgICB0aGlzLnNlYXJjaE1lbnRpb25zXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMubWVudGlvbnNUZXh0Rm9ybWF0dGVySW5zdGFuY2Uuc2V0SWQoXG4gICAgICAgICAgdGhpcy5tZW50aW9uc0Zvcm1hdHRlckluc3RhbmNlSWRcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKCFmb3VuZE1lbnRpb25zRm9ybWF0dGVyKSB7XG4gICAgICAgIHRoaXMudGV4dEZvcm1hdHRlckxpc3QucHVzaCh0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgZ2V0TWVudGlvbnNTdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4gdGhpcy5tZW50aW9uU3R5bGVMb2NhbDtcbiAgfTtcblxuICBnZXRTbWFydFJlcGxpZXMgPSAoKSA9PiB7XG4gICAgdGhpcy5zaG93U21hcnRSZXBseSA9IHRydWU7XG4gICAgdGhpcy5yZXBsaWVzQXJyYXkgPSBbXTtcbiAgICB0aGlzLnNob3dBY3Rpb25TaGVldEl0ZW1BSSA9IGZhbHNlO1xuICAgIHRoaXMuc2hvd0FpQm90TGlzdCA9IGZhbHNlO1xuXG4gICAgdGhpcy5zbWFydFJlcGx5U3RhdGUgPSBTdGF0ZXMubG9hZGluZztcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgbGV0IHJlY2VpdmVySWQ6IHN0cmluZyA9IHRoaXMudXNlclxuICAgICAgICA/IHRoaXMudXNlcj8uZ2V0VWlkKClcbiAgICAgICAgOiB0aGlzLmdyb3VwPy5nZXRHdWlkKCk7XG4gICAgICBsZXQgcmVjZWl2ZXJUeXBlOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgICAgPyBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLnVzZXJcbiAgICAgICAgOiBDb21ldENoYXRVSUtpdENvbnN0YW50cy5NZXNzYWdlUmVjZWl2ZXJUeXBlLmdyb3VwO1xuICAgICAgQ29tZXRDaGF0LmdldFNtYXJ0UmVwbGllcyhyZWNlaXZlcklkLCByZWNlaXZlclR5cGUpXG4gICAgICAgIC50aGVuKChyZXNwb25zZTogYW55KSA9PiB7XG4gICAgICAgICAgbGV0IHJlcGxpZXNBcnJheTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgICBPYmplY3Qua2V5cyhyZXNwb25zZSkuZm9yRWFjaCgocmVwbHkpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZVtyZXBseV0gJiYgcmVzcG9uc2VbcmVwbHldICE9IFwiXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5yZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgICByZXBsaWVzQXJyYXkucHVzaChyZXNwb25zZVtyZXBseV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJlc29sdmUocmVwbGllc0FycmF5KTtcblxuICAgICAgICAgIHRoaXMuc21hcnRSZXBseVN0YXRlID0gU3RhdGVzLmxvYWRlZDtcblxuICAgICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKChlcnI6IENvbWV0Q2hhdC5Db21ldENoYXRFeGNlcHRpb24pID0+IHtcbiAgICAgICAgICB0aGlzLnNtYXJ0UmVwbHlTdGF0ZSA9IFN0YXRlcy5lcnJvcjtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuICBlbmFibGVBaUZlYXR1cmVzKCkge1xuICAgIGlmICh0aGlzLmFjdGlvbnMgJiYgdGhpcy5hY3Rpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMuaXNBaUVuYWJsZWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLmFjdGlvbnMuZm9yRWFjaCgoYWN0aW9uKSA9PiB7XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktc21hcnQtcmVwbHlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgb25DbGljazogdGhpcy5nZXRTbWFydFJlcGxpZXMsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktY29udmVyc2F0aW9uLXN1bW1hcnlcIikge1xuICAgICAgICAgIGNvbnN0IG5ld0J1dHRvbiA9IHtcbiAgICAgICAgICAgIC4uLmFjdGlvbixcbiAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24udGl0bGUhLFxuICAgICAgICAgICAgaWQ6IGFjdGlvbi5pZCxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHRoaXMuY2FsbENvbnZlcnNhdGlvblN1bW1hcnlNZXRob2QoKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChhY3Rpb24uaWQgPT09IFwiYWktYm90c1wiKSB7XG4gICAgICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICAgICAgLi4uYWN0aW9uLFxuICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi50aXRsZSEsXG4gICAgICAgICAgICBpZDogYWN0aW9uLmlkLFxuICAgICAgICAgICAgb25DbGljazogYXN5bmMgKCkgPT5cbiAgICAgICAgICAgICAgdGhpcy5zaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCgoYWN0aW9uIGFzIGFueSkub25DbGljaygpKSxcbiAgICAgICAgICB9O1xuICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKG5ld0J1dHRvbik7XG4gICAgICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzaG93QWlCb3RNZXNzYWdlTGlzdE1ldGhvZCA9IChhY3Rpb246IGFueSkgPT4ge1xuICAgIHRoaXMuYWlCb3RMaXN0ID0gYWN0aW9uO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlCb3RMaXN0ID0gdHJ1ZTtcblxuICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLmxlbmd0aCA9IDA7XG5cbiAgICB0aGlzLmFpQm90TGlzdC5mb3JFYWNoKChlOiBhbnksIGk6IGFueSkgPT4ge1xuICAgICAgY29uc3QgbmV3QnV0dG9uID0ge1xuICAgICAgICBpZDogZS5pZCxcbiAgICAgICAgdGl0bGU6IGUudGl0bGUsXG4gICAgICAgIG9uQ2xpY2s6IGFzeW5jICgpID0+IHtcbiAgICAgICAgICBDb21ldENoYXRVSUV2ZW50cy5jY1Nob3dQYW5lbC5uZXh0KHtcbiAgICAgICAgICAgIGNoaWxkOiB7IGJvdDogZSwgc2hvd0JvdFZpZXc6IHRydWUgfSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWlBY3Rpb25CdXR0b25zLnB1c2gobmV3QnV0dG9uKTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICBzZW5kUmVwbHkgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGxldCByZXBseTogc3RyaW5nID0gZXZlbnQ/LmRldGFpbD8ucmVwbHk7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NDb21wb3NlTWVzc2FnZS5uZXh0KHJlcGx5KTtcbiAgICB0aGlzLnJlcGxpZXNBcnJheSA9IFtdO1xuICAgIHRoaXMuc2hvd0FjdGlvblNoZWV0SXRlbUFJID0gZmFsc2U7XG4gICAgdGhpcy5zaG93QWlGZWF0dXJlcyA9IGZhbHNlO1xuICAgIHRoaXMuYWlCdXR0b25SZWYubmF0aXZlRWxlbWVudC5jbGljaygpO1xuXG4gICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICB9O1xuXG4gIGNvbXBvc2VyV3JhcHBlclN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBoZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmhlaWdodCxcbiAgICAgIHdpZHRoOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy53aWR0aCxcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJhY2tncm91bmQsXG4gICAgICBib3JkZXI6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmJvcmRlcixcbiAgICAgIGJvcmRlclJhZGl1czogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYm9yZGVyUmFkaXVzLFxuICAgIH07XG4gIH1cbiAgc2V0VGhlbWUoKSB7XG4gICAgdGhpcy5lbW9qaVBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc3RpY2tlclBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMubWVkaWFSZWNvcmRlZFBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggMzJweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuYWlQb3BvdmVyLmJhY2tncm91bmQgPSB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKTtcbiAgICB0aGlzLmFpUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCAzMnB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5zZXRDb21wb3NlclN0eWxlKCk7XG4gICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlID0ge1xuICAgICAgbGF5b3V0TW9kZUljb25UaW50OlxuICAgICAgICB0aGlzLmFjdGlvblNoZWV0U3R5bGUubGF5b3V0TW9kZUljb25UaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBib3JkZXJSYWRpdXM6IFwiaW5oZXJpdFwiLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHRpdGxlRm9udDpcbiAgICAgICAgdGhpcy5hY3Rpb25TaGVldFN0eWxlLnRpdGxlRm9udCB8fFxuICAgICAgICBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUyKSxcbiAgICAgIHRpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS50aXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBBY3Rpb25TaGVldFNlcGFyYXRvclRpbnQ6XG4gICAgICAgIHRoaXMuYWN0aW9uU2hlZXRTdHlsZS5BY3Rpb25TaGVldFNlcGFyYXRvclRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9O1xuICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlID0ge1xuICAgICAgbGF5b3V0TW9kZUljb25UaW50OlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS5sYXlvdXRNb2RlSWNvblRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCJpbmhlcml0XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgdGl0bGVGb250OlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS50aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMiksXG4gICAgICB0aXRsZUNvbG9yOlxuICAgICAgICB0aGlzLmFpQWN0aW9uU2hlZXRTdHlsZS50aXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBBY3Rpb25TaGVldFNlcGFyYXRvclRpbnQ6XG4gICAgICAgIHRoaXMuYWlBY3Rpb25TaGVldFN0eWxlLkFjdGlvblNoZWV0U2VwYXJhdG9yVGludCB8fFxuICAgICAgICBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKX1gLFxuICAgIH07XG4gICAgdGhpcy50ZXh0SW5wdXRTdHlsZSA9IHtcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBtYXhIZWlnaHQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/Lm1heElucHV0SGVpZ2h0IHx8IFwiMTAwcHhcIixcbiAgICAgIGJvcmRlcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCb3JkZXIsXG4gICAgICBib3JkZXJSYWRpdXM6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmlucHV0Qm9yZGVyUmFkaXVzLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uaW5wdXRCYWNrZ3JvdW5kLFxuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnRleHRGb250LFxuICAgICAgdGV4dENvbG9yOiB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy50ZXh0Q29sb3IsXG4gICAgICBkaXZpZGVyQ29sb3I6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmRpdmlkZXJUaW50LFxuICAgIH07XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpXG4gICAgdGhpcy5wcmV2aWV3U3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgd2lkdGg6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCksXG4gICAgICBwcmV2aWV3VGl0bGVGb250OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5wcmV2aWV3VGl0bGVGb250IHx8XG4gICAgICAgIGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgcHJldmlld1RpdGxlQ29sb3I6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdUaXRsZUNvbG9yIHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NDAwKCksXG4gICAgICBwcmV2aWV3U3VidGl0bGVDb2xvcjpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8ucHJldmlld1N1YnRpdGxlQ29sb3IgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6XG4gICAgICAgIHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LnByZXZpZXdTdWJ0aXRsZUZvbnQgfHxcbiAgICAgICAgZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICBjbG9zZUJ1dHRvbkljb25UaW50OlxuICAgICAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlPy5jbG9zZVByZXZpZXdUaW50IHx8XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBib3JkZXJSYWRpdXM6ICcxMnB4J1xuICAgIH07XG4gICAgbGV0IGJ1dHRvblN0eWxlID0ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiMFwiLFxuICAgICAgYmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgIH07XG4gICAgbGV0IGRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUgPSBuZXcgTWVkaWFSZWNvcmRlclN0eWxlKHtcbiAgICAgIHN0YXJ0SWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIHN1Ym1pdEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgc3RvcEljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEVycm9yKCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgdGltZXJUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMiksXG4gICAgICB0aW1lclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICB9KTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZWRQb3BvdmVyLmJhY2tncm91bmQgPVxuICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRCYWNrZ3JvdW5kKCk7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVyU3R5bGUuYm9yZGVyID0gYDFweCBzb2xpZCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MTAwKCl9YDtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRNZWRpYVJlY29yZGVyU3R5bGUsXG4gICAgICAuLi50aGlzLm1lZGlhUmVjb3JkZXJTdHlsZSxcbiAgICB9O1xuICAgIHRoaXMuZW1vamlQb3BvdmVyLmJveFNoYWRvdyA9IGAwcHggMHB4IDhweCAke3RoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAoKX1gO1xuICAgIHRoaXMuc3RpY2tlclBvcG92ZXIuYm94U2hhZG93ID0gYDBweCAwcHggOHB4ICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MCgpfWA7XG4gICAgdGhpcy5tZWRpYVJlY29yZGVkUG9wb3Zlci5ib3hTaGFkb3cgPSBgMHB4IDBweCA4cHggJHt0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwKCl9YDtcbiAgICB0aGlzLmVtb2ppQnV0dG9uU3R5bGUgPSB7XG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlJY29uVGludCB8fFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLnN0aWNrZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLm1lZGlhUmVjb3JkZXJCdXR0b25TdHlsZSA9IHtcbiAgICAgIGJ1dHRvbkljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgLi4uYnV0dG9uU3R5bGUsXG4gICAgfTtcbiAgICB0aGlzLmVtb2ppS2V5Ym9hcmRTdHlsZSA9IHtcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGhlaWdodDogXCIxMDAlXCIsXG4gICAgICBib3JkZXI6IFwibm9uZVwiLFxuICAgICAgdGV4dEZvbnQ6IHRoaXMubWVzc2FnZUNvbXBvc2VyU3R5bGU/LmVtb2ppS2V5Ym9hcmRUZXh0Rm9udCxcbiAgICAgIHRleHRDb2xvcjogdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uZW1vamlLZXlib2FyZFRleHRDb2xvcixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIGFjdGl2ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpXG4gICAgfTtcblxuICAgIHRoaXMuc3RpY2tlcktleWJvYXJkU3R5bGUgPSB7XG4gICAgICB3aWR0aDogXCIxMDAlXCIsXG4gICAgICBoZWlnaHQ6IFwiMTAwJVwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGVtcHR5U3RhdGVUZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnRpdGxlMSksXG4gICAgICBlbXB0eVN0YXRlVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgZXJyb3JTdGF0ZVRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIGVycm9yU3RhdGVUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBsb2FkaW5nSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCIxMnB4XCIsXG4gICAgICBjYXRlZ29yeUJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QmFja2dyb3VuZCgpLFxuICAgIH07XG4gICAgdGhpcy5hdHRhY2htZW50QnV0dG9uU3R5bGUgPSB7XG4gICAgICBoZWlnaHQ6IFwiMjRweFwiLFxuICAgICAgd2lkdGg6IFwiMjRweFwiLFxuICAgICAgYm9yZGVyOiBcIm5vbmVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBidXR0b25JY29uVGludDpcbiAgICAgICAgdGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZT8uYXR0YWNoSWNvbnRpbnQgfHxcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICB9O1xuICAgIHRoaXMuY3JlYXRlUG9sbFN0eWxlID0ge1xuICAgICAgcGxhY2Vob2xkZXJUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGRlbGV0ZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDYwMCgpLFxuICAgICAgdGl0bGVGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGl0bGUxKSxcbiAgICAgIHRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG4gICAgICBjbG9zZUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIHF1ZXN0aW9uSW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgb3B0aW9uSW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgYW5zd2VySGVscFRleHRGb250OiBmb250SGVscGVyKFxuICAgICAgICB0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24xXG4gICAgICApLFxuICAgICAgYW5zd2VySGVscFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ0MDAoKSxcbiAgICAgIGFkZEFuc3dlckljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25UZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS50ZXh0MlxuICAgICAgKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25UZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KFwiZGFya1wiKSxcbiAgICAgIGNyZWF0ZVBvbGxCdXR0b25CYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGFkZEFuc3dlclRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkudGV4dDIpLFxuICAgICAgYWRkQW5zd2VyVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgIGVycm9yVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuICAgICAgZXJyb3JUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0RXJyb3IoKSxcbiAgICAgIG9wdGlvblBsYWNlaG9sZGVyVGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUxXG4gICAgICApLFxuICAgICAgb3B0aW9uUGxhY2Vob2xkZXJUZXh0Q29sb3I6XG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBxdWVzdGlvbklucHV0VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgcXVlc3Rpb25JbnB1dFRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIG9wdGlvbklucHV0VGV4dEZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgb3B0aW9uSW5wdXRUZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB3aWR0aDogXCIzNjBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjYyMHB4XCIsXG4gICAgICBib3JkZXI6IFwiXCIsXG4gICAgICBib3JkZXJSYWRpdXM6IFwiOHB4XCIsXG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDkwMCgpLFxuICAgIH07XG4gIH1cbiAgc2V0Q29tcG9zZXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBNZXNzYWdlQ29tcG9zZXJTdHlsZSA9IG5ldyBNZXNzYWdlQ29tcG9zZXJTdHlsZSh7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICAgIGJvcmRlcjogYG5vbmVgLFxuICAgICAgaGVpZ2h0OiBcIjEwMCVcIixcbiAgICAgIHdpZHRoOiBcIjEwMCVcIixcbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBhdHRhY2hJY29udGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ1MDAoKSxcbiAgICAgIHNlbmRJY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgICBlbW9qaUljb25UaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgaW5wdXRCYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDEwMCgpLFxuICAgICAgaW5wdXRCb3JkZXI6IFwibm9uZVwiLFxuICAgICAgaW5wdXRCb3JkZXJSYWRpdXM6IFwiMTJweFwiLFxuICAgICAgZGl2aWRlclRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50MjAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50KCksXG5cbiAgICAgIGVtb2ppS2V5Ym9hcmRUZXh0Rm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTJcbiAgICAgICksXG4gICAgICBlbW9qaUtleWJvYXJkVGV4dENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDQwMCgpLFxuICAgICAgcHJldmlld1RpdGxlRm9udDogZm9udEhlbHBlcihcbiAgICAgICAgdGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTFcbiAgICAgICksXG4gICAgICBwcmV2aWV3VGl0bGVDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICAgIHByZXZpZXdTdWJ0aXRsZUZvbnQ6IGZvbnRIZWxwZXIoXG4gICAgICAgIHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyXG4gICAgICApLFxuICAgICAgcHJldmlld1N1YnRpdGxlQ29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICBjbG9zZVByZXZpZXdUaW50OiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDUwMCgpLFxuICAgICAgbWF4SW5wdXRIZWlnaHQ6IFwiMTAwcHhcIixcbiAgICB9KTtcbiAgICB0aGlzLm1lc3NhZ2VDb21wb3NlclN0eWxlID0ge1xuICAgICAgLi4uZGVmYXVsdFN0eWxlLFxuICAgICAgLi4udGhpcy5tZXNzYWdlQ29tcG9zZXJTdHlsZSxcbiAgICB9O1xuICB9XG4gIGNsb3NlUHJldmlldygpIHtcbiAgICB0aGlzLnNob3dTZW5kQnV0dG9uID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5zaG93TWVudGlvbnNDb3VudFdhcm5pbmcgPSBmYWxzZTtcbiAgICB0aGlzLnNob3dQcmV2aWV3ID0gZmFsc2U7XG4gICAgdGhpcy5lZGl0UHJldmlld1RleHQgPSBcIlwiO1xuICAgIHRoaXMubWVzc2FnZVRvQmVFZGl0ZWQgPSBudWxsO1xuICAgIHRoaXMudGV4dCA9IFwiXCI7XG4gICAgdGhpcy5tZXNzYWdlVGV4dCA9IFwiXCI7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgdGhpcy5kaXNhYmxlU2VuZEJ1dHRvbigpO1xuICB9XG4gIGJhY2tCdXR0b25TdHlsZSA9ICgpID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgaGVpZ2h0OiBcIjI0cHhcIixcbiAgICAgIHdpZHRoOiBcIjI0cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG5cbiAgICAgIGJvcmRlclJhZGl1czogXCIwXCIsXG4gICAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRQcmltYXJ5KCksXG4gICAgfTtcbiAgfTtcblxuICAvKipcbiAgICogQWNjZXB0cyBzZWFyY2ggdGVybSBmcm9tIG1lbnRpb25zVGV4dEZvcm1hdHRlciBhbmQgb3BlbnMgdGhlIG1lbnRpb25zIHNlbGVjdCBsaXN0XG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZWFyY2hUZXJtXG4gICAqIEByZXR1cm5zIHt2b2lkfVxuICAgKi9cbiAgc2VhcmNoTWVudGlvbnMgPSAoc2VhcmNoVGVybTogc3RyaW5nKSA9PiB7XG4gICAgaWYgKCEoc2VhcmNoVGVybSAmJiBzZWFyY2hUZXJtLmxlbmd0aCkpIHtcbiAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaENvdW50ID0gMTtcbiAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtIHx8XG4gICAgICAhc2VhcmNoVGVybVxuICAgICAgICAuc3BsaXQoXCJAXCIpWzFdXG4gICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgIC5zdGFydHNXaXRoKHRoaXMubGFzdEVtcHR5U2VhcmNoVGVybS50b0xvd2VyQ2FzZSgpKVxuICAgICkge1xuICAgICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPVxuICAgICAgICBzZWFyY2hUZXJtLnNwbGl0KFwiQFwiKVsxXSAmJiBzZWFyY2hUZXJtLnNwbGl0KFwiQFwiKVsxXS5sZW5ndGhcbiAgICAgICAgICA/IHNlYXJjaFRlcm0uc3BsaXQoXCJAXCIpWzFdXG4gICAgICAgICAgOiBcIlwiO1xuICAgICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gdHJ1ZTtcbiAgICAgIHRoaXMubWVudGlvbnNTZWFyY2hDb3VudCsrO1xuICAgICAgdGhpcy5sYXN0RW1wdHlTZWFyY2hUZXJtID0gdW5kZWZpbmVkO1xuICAgICAgdGhpcy5yZWYuZGV0ZWN0Q2hhbmdlcygpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogQ2FsbGVkIHdoZW4gY2xpY2tpbmcgYSB1c2VyIGZyb20gdGhlIG1lbnRpb25zIGxpc3QuXG4gICAqIEFkZCB0aGUgdXNlciB0byBtZW50aW9ucyB0ZXh0IGZvcm1hdHRlciBpbnN0YW5jZSBhbmQgdGhlbiBjYWxsIHJlcmVuZGVyIHRvIHN0eWxlIHRoZSBtZW50aW9uXG4gICAqIHdpdGhpbiBtZXNzYWdlIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbWV0Q2hhdC5Vc2VyfSB1c2VyXG4gICAqL1xuICBkZWZhdWx0TWVudGlvbnNJdGVtQ2xpY2tIYW5kbGVyID0gKFxuICAgIHVzZXI6IENvbWV0Q2hhdC5Vc2VyIHwgQ29tZXRDaGF0Lkdyb3VwTWVtYmVyXG4gICkgPT4ge1xuICAgIGxldCBjb21ldENoYXRVc2VycyA9IFt1c2VyXTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnNldENvbWV0Q2hhdFVzZXJHcm91cE1lbWJlcnMoXG4gICAgICBjb21ldENoYXRVc2Vyc1xuICAgICk7XG4gICAgdGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5zZXRMb2dnZWRJblVzZXIodGhpcy5sb2dnZWRJblVzZXIhKTtcbiAgICB0aGlzLm1lbnRpb25lZFVzZXJzID0gW1xuICAgICAgLi4udGhpcy5tZW50aW9uc1RleHRGb3JtYXR0ZXJJbnN0YW5jZS5nZXRDb21ldENoYXRVc2VyR3JvdXBNZW1iZXJzKCksXG4gICAgXTtcbiAgICB0aGlzLm1lbnRpb25zVGV4dEZvcm1hdHRlckluc3RhbmNlLnJlUmVuZGVyKCk7XG4gICAgdGhpcy5zaG93TGlzdEZvck1lbnRpb25zID0gZmFsc2U7XG4gICAgdGhpcy5tZW50aW9uc1NlYXJjaFRlcm0gPSBcIlwiO1xuICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgfTtcblxuICAvKipcbiAgICogQ2xvc2UgbWVudGlvbnMgbGlzdCBpZiBzZWFyY2ggcmV0dXJucyBlbXB0eSBsaXN0XG4gICAqL1xuICBkZWZhdWx0T25FbXB0eUZvck1lbnRpb25zID0gKCkgPT4ge1xuICAgIHRoaXMubGFzdEVtcHR5U2VhcmNoVGVybSA9IHRoaXMubWVudGlvbnNTZWFyY2hUZXJtO1xuICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgIHRoaXMubWVudGlvbnNTZWFyY2hUZXJtID0gXCJcIjtcbiAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gIH07XG5cbiAgZ2V0TWVudGlvbkluZm9JY29uU3R5bGUgPSAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGhlaWdodDogXCJmaXQtY29udGVudFwiLFxuICAgICAgd2lkdGg6IFwiZml0LWNvbnRlbnRcIixcbiAgICAgIGJ1dHRvblRleHRGb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuc3VidGl0bGUyKSxcbiAgICAgIGJ1dHRvblRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIGJvcmRlclJhZGl1czogXCI4cHhcIixcbiAgICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgICBidXR0b25JY29uVGludDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ2MDAoKSxcbiAgICAgIHBhZGRpbmc6IFwiOHB4XCIsXG4gICAgICBpY29uSGVpZ2h0OiBcIjIwcHhcIixcbiAgICAgIGljb25XaWR0aDogXCIyMHB4XCIsXG4gICAgICBpY29uQmFja2dyb3VuZDogXCJ0cmFuc3BhcmVudFwiLFxuICAgICAgZ2FwOiBcIjVweFwiLFxuICAgIH07XG4gIH07XG5cbiAgaGFuZGxlQ2xpY2tPdXRzaWRlID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICBpZiAodGhpcy51c2VyTWVtYmVyV3JhcHBlclJlZikge1xuICAgICAgY29uc3QgdXNlck1lbWJlcldyYXBwZXJSZWN0ID1cbiAgICAgICAgdGhpcy51c2VyTWVtYmVyV3JhcHBlclJlZj8ubmF0aXZlRWxlbWVudD8uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBpc091dHNpZGVDbGljayA9XG4gICAgICAgIGV2ZW50Py5jbGllbnRYIDw9IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8ubGVmdCB8fFxuICAgICAgICBldmVudD8uY2xpZW50WCA+PSB1c2VyTWVtYmVyV3JhcHBlclJlY3Q/LnJpZ2h0IHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRZID49IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8udG9wIHx8XG4gICAgICAgIGV2ZW50Py5jbGllbnRZIDw9IHVzZXJNZW1iZXJXcmFwcGVyUmVjdD8uYm90dG9tO1xuICAgICAgaWYgKGlzT3V0c2lkZUNsaWNrKSB7XG4gICAgICAgIHRoaXMuc2hvd0xpc3RGb3JNZW50aW9ucyA9IGZhbHNlO1xuICAgICAgICB0aGlzLm1lbnRpb25zU2VhcmNoVGVybSA9IFwiXCI7XG4gICAgICAgIHRoaXMucmVmLmRldGVjdENoYW5nZXMoKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnV0dG9ucyB7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGlkOiBzdHJpbmc7XG4gIG9uQ2xpY2s6ICgpID0+IFByb21pc2U8dW5rbm93bj47XG59XG4iLCI8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fd3JhcHBlclwiIFtuZ1N0eWxlXT1cImNvbXBvc2VyV3JhcHBlclN0eWxlKClcIj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2Vjb21wb3Nlcl9fbWVudGlvbnNcIiAjdXNlck1lbWJlcldyYXBwZXJSZWY+XG4gICAgPGNvbWV0Y2hhdC11c2VyLW1lbWJlci13cmFwcGVyICpuZ0lmPVwic2hvd0xpc3RGb3JNZW50aW9uc1wiXG4gICAgICBbdXNlck1lbWJlckxpc3RUeXBlXT1cInVzZXJNZW1iZXJMaXN0VHlwZVwiXG4gICAgICBbb25JdGVtQ2xpY2tdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLm9uSXRlbUNsaWNrIHx8IGRlZmF1bHRNZW50aW9uc0l0ZW1DbGlja0hhbmRsZXJcIlxuICAgICAgW3VzZXJzUmVxdWVzdEJ1aWxkZXJdPVwidXNlcnNSZXF1ZXN0QnVpbGRlclwiXG4gICAgICBbc2VhcmNoS2V5d29yZF09XCJtZW50aW9uc1NlYXJjaFRlcm1cIlxuICAgICAgW3N1YnRpdGxlVmlld109XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uc3VidGl0bGVWaWV3XCJcbiAgICAgIFtkaXNhYmxlVXNlcnNQcmVzZW5jZV09XCJ1c2VyTWVtYmVyV3JhcHBlckNvbmZpZ3VyYXRpb24uZGlzYWJsZVVzZXJzUHJlc2VuY2VcIlxuICAgICAgW2F2YXRhclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5hdmF0YXJTdHlsZVwiXG4gICAgICBbbGlzdEl0ZW1WaWV3XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5saXN0SXRlbVZpZXdcIlxuICAgICAgW3N0YXR1c0luZGljYXRvclN0eWxlXT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi5zdGF0dXNJbmRpY2F0b3JTdHlsZVwiXG4gICAgICBbdXNlclByZXNlbmNlUGxhY2VtZW50XT1cInVzZXJNZW1iZXJXcmFwcGVyQ29uZmlndXJhdGlvbi51c2VyUHJlc2VuY2VQbGFjZW1lbnRcIlxuICAgICAgW2hpZGVTZXBlcmF0b3JdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmhpZGVTZXBhcmF0b3JcIlxuICAgICAgW2xvYWRpbmdTdGF0ZVZpZXddPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdTdGF0ZVZpZXdcIlxuICAgICAgW29uRW1wdHldPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiXG4gICAgICBbbG9hZGluZ0ljb25VcmxdPVwidXNlck1lbWJlcldyYXBwZXJDb25maWd1cmF0aW9uLmxvYWRpbmdJY29uVVJMXCJcbiAgICAgIFtncm91cF09XCJncm91cFwiIFtncm91cE1lbWJlclJlcXVlc3RCdWlsZGVyXT1cImdyb3VwTWVtYmVyc1JlcXVlc3RCdWlsZGVyXCJcbiAgICAgIFtkaXNhYmxlTG9hZGluZ1N0YXRlXT1cInRydWVcIlxuICAgICAgW29uRXJyb3JdPVwiZGVmYXVsdE9uRW1wdHlGb3JNZW50aW9uc1wiPjwvY29tZXRjaGF0LXVzZXItbWVtYmVyLXdyYXBwZXI+XG5cbiAgICA8ZGl2ICpuZ0lmPVwic2hvd01lbnRpb25zQ291bnRXYXJuaW5nXCJcbiAgICAgIGNsYXNzPVwiY2MtbWVzc2FnZWNvbXBvc2VyX19tZW50aW9ucy1saW1pdC1leGNlZWRlZFwiPlxuICAgICAgPGNvbWV0Y2hhdC1pY29uLWJ1dHRvblxuICAgICAgICBbdGV4dF09XCJtZW50aW9uc1dhcm5pbmdUZXh0IHx8IGxvY2FsaXplKCdNRU5USU9OU19MSU1JVF9XQVJOSU5HX01FU1NBR0UnKVwiXG4gICAgICAgIFtpY29uVVJMXT1cIkluZm9TaW1wbGVJY29uXCJcbiAgICAgICAgW2J1dHRvblN0eWxlXT1cImdldE1lbnRpb25JbmZvSWNvblN0eWxlKClcIj48L2NvbWV0Y2hhdC1pY29uLWJ1dHRvbj5cbiAgICA8L2Rpdj5cblxuICA8L2Rpdj5cbiAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCJcbiAgICAqbmdJZj1cImhlYWRlclZpZXc7IGVsc2UgbWVzc2FnZVByZXZpZXdcIj5cbiAgICA8bmctY29udGFpbmVyXG4gICAgICAqbmdUZW1wbGF0ZU91dGxldD1cImhlYWRlclZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICA8L25nLWNvbnRhaW5lcj5cbiAgPC9kaXY+XG4gIDxuZy10ZW1wbGF0ZSAjbWVzc2FnZVByZXZpZXc+XG4gICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2hlYWRlci12aWV3XCIgKm5nSWY9XCJzaG93UHJldmlld1wiPlxuICAgICAgPGNvbWV0Y2hhdC1wcmV2aWV3IFtwcmV2aWV3U3R5bGVdPVwicHJldmlld1N0eWxlXCJcbiAgICAgICAgW3ByZXZpZXdTdWJ0aXRsZV09XCJlZGl0UHJldmlld1RleHRcIlxuICAgICAgICAoY2MtcHJldmlldy1jbG9zZS1jbGlja2VkKT1cImNsb3NlUHJldmlldygpXCI+IDwvY29tZXRjaGF0LXByZXZpZXc+XG4gICAgPC9kaXY+XG4gIDwvbmctdGVtcGxhdGU+XG4gIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19pbnB1dFwiPlxuXG4gICAgPGNvbWV0Y2hhdC10ZXh0LWlucHV0IChjYy10ZXh0LWlucHV0LWVudGVyZWQpPVwic2VuZE1lc3NhZ2VPbkVudGVyKCRldmVudClcIlxuICAgICAgI2lucHV0UmVmIFt0ZXh0XT1cInRleHRcIlxuICAgICAgKGNjLXRleHQtaW5wdXQtY2hhbmdlZCk9XCJtZXNzYWdlSW5wdXRDaGFuZ2VkKCRldmVudClcIlxuICAgICAgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgW3BsYWNlaG9sZGVyVGV4dF09XCJwbGFjZWhvbGRlclRleHRcIlxuICAgICAgW2F1eGlsaWFyeUJ1dHRvbkFsaWdubWVudF09XCJhdXhpbGlhcnlCdXR0b25zQWxpZ25tZW50XCJcbiAgICAgIFt0ZXh0Rm9ybWF0dGVyc109XCJ0ZXh0Rm9ybWF0dGVyc1wiPlxuXG4gICAgICA8ZGl2IGRhdGEtc2xvdD1cInNlY29uZGFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlY29uZGFyeUJ1dHRvblZpZXc7ZWxzZSBzZWNvbmRhcnlCdXR0b25cIj5cbiAgICAgICAgICA8bmctY29udGFpbmVyXG4gICAgICAgICAgICAqbmdUZW1wbGF0ZU91dGxldD1cInNlY29uZGFyeUJ1dHRvblZpZXc7Y29udGV4dDp7ICRpbXBsaWNpdDogdXNlciA/PyBncm91cCwgY29tcG9zZXJJZDpjb21wb3NlcklkIH1cIj5cbiAgICAgICAgICA8L25nLWNvbnRhaW5lcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjc2Vjb25kYXJ5QnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19hdHRhY2hidXR0b25cIj5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlclxuICAgICAgICAgICAgICAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgICBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCIgW3BvcG92ZXJTdHlsZV09XCJwb3BvdmVyU3R5bGVcIj5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1hY3Rpb24tc2hlZXQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFt0aXRsZV09XCJsb2NhbGl6ZSgnQUREX1RPX0NIQVQnKVwiIFthY3Rpb25zXT1cImNvbXBvc2VyQWN0aW9uc1wiXG4gICAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWN0aW9uU2hlZXRTdHlsZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gI2FjdGlvblNoZWV0UmVmIHNsb3Q9XCJjaGlsZHJlblwiXG4gICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5BY3Rpb25TaGVldCgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgICBbaWNvblVSTF09XCIhc2hvd0FjdGlvblNoZWV0SXRlbSB8fCAoc2hvd0Vtb2ppS2V5Ym9hcmQgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW0pICA/IGF0dGFjaG1lbnRJY29uVVJMICA6IGNsb3NlQnV0dG9uSWNvblVSTFwiXG4gICAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImF0dGFjaG1lbnRCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICA8L2Rpdj5cblxuICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2F1eGlsaWFyeVwiIGRhdGEtc2xvdD1cImF1eGlsYXJ5Vmlld1wiPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fY3VzdG9tLWF1eGlsaWFyeS12aWV3XCJcbiAgICAgICAgICAqbmdJZj1cImF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxuZy1jb250YWluZXJcbiAgICAgICAgICAgICpuZ1RlbXBsYXRlT3V0bGV0PVwiYXV4aWxhcnlCdXR0b25WaWV3O2NvbnRleHQ6eyAkaW1wbGljaXQ6IHVzZXIgPz8gZ3JvdXAsIGNvbXBvc2VySWQ6Y29tcG9zZXJJZCB9XCI+XG4gICAgICAgICAgPC9uZy1jb250YWluZXI+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8IS0tIEFJIENhcmRzIC0tPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc3RpY2tlcmtleWJvYXJkXCJcbiAgICAgICAgICAqbmdJZj1cIiFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItY2xpY2spPVwib3BlblN0aWNrZXJLZXlib2FyZCgkZXZlbnQpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwiYWlQb3BvdmVyXCIgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1haS1jYXJkIFtzdGF0ZV09XCJzbWFydFJlcGx5U3RhdGVcIlxuICAgICAgICAgICAgICAqbmdJZj1cInNob3dTbWFydFJlcGx5ICYmICFzaG93QWN0aW9uU2hlZXRJdGVtQUkgJiYgIXNob3dBaUJvdExpc3RcIlxuICAgICAgICAgICAgICBzbG90PVwiY29udGVudFwiIFtsb2FkaW5nU3RhdGVUZXh0XT1cImxvYWRpbmdTdGF0ZVRleHRcIlxuICAgICAgICAgICAgICBbZW1wdHlTdGF0ZVRleHRdPVwiZW1wdHlTdGF0ZVRleHRcIlxuICAgICAgICAgICAgICBbZXJyb3JTdGF0ZVRleHRdPVwiZXJyb3JTdGF0ZVRleHRcIj5cbiAgICAgICAgICAgICAgPGRpdiBzbG90PVwibG9hZGVkVmlld1wiIGNsYXNzPVwic21hcnQtcmVwbGllcy13cmFwcGVyXCI+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc21hcnRyZXBseS1oZWFkZXJcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19iYWNrLWJ1dHRvblwiPlxuICAgICAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvblxuICAgICAgICAgICAgICAgICAgICAgICpuZ0lmPVwicmVwbGllc0FycmF5ICYmIHJlcGxpZXNBcnJheS5sZW5ndGggPiAwIFwiXG4gICAgICAgICAgICAgICAgICAgICAgW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICAgICAgICAgIChjYy1idXR0b24tY2xpY2tlZCk9XCJvbkFpQmFja0J1dHRvbkNsaWNrKClcIlxuICAgICAgICAgICAgICAgICAgICAgIFtidXR0b25TdHlsZV09XCJiYWNrQnV0dG9uU3R5bGUoKVwiPlxuICAgICAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zbWFydHJlcGx5LWhlYWRlci12aWV3XCI+XG4gICAgICAgICAgICAgICAgICAgIDxwPnt7IGxvY2FsaXplKFwiU1VHR0VTVF9BX1JFUExZXCIpIH19PC9wPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fc21hcnRyZXBseS1jb250ZW50XCI+XG4gICAgICAgICAgICAgICAgICA8c21hcnQtcmVwbGllc1xuICAgICAgICAgICAgICAgICAgICAqbmdJZj1cInJlcGxpZXNBcnJheSAmJiByZXBsaWVzQXJyYXkubGVuZ3RoID4gMCBcIlxuICAgICAgICAgICAgICAgICAgICBbc21hcnRSZXBseVN0eWxlXT1cInNtYXJ0UmVwbHlTdHlsZVwiIFtyZXBsaWVzXT1cInJlcGxpZXNBcnJheVwiXG4gICAgICAgICAgICAgICAgICAgIFtjbG9zZUljb25VUkxdPVwiJydcIiAoY2MtcmVwbHktY2xpY2tlZCk9XCJzZW5kUmVwbHkoJGV2ZW50KVwiPlxuICAgICAgICAgICAgICAgICAgPC9zbWFydC1yZXBsaWVzPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuXG5cblxuXG5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1haS1jYXJkPlxuXG4gICAgICAgICAgICA8ZGl2ICpuZ0lmPVwic2hvd0FpQm90TGlzdCAgJiYgIXNob3dBY3Rpb25TaGVldEl0ZW1BSVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19haWJvdGxpc3RcIj5cbiAgICAgICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiAqbmdJZj1cIiBhaUJvdExpc3QgJiYgYWlCb3RMaXN0Lmxlbmd0aD4gMSBcIlxuICAgICAgICAgICAgICAgICAgW2ljb25VUkxdPVwiYmFja0J1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQWlCYWNrQnV0dG9uQ2xpY2soKVwiXG4gICAgICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwiYmFja0J1dHRvblN0eWxlKClcIj5cbiAgICAgICAgICAgICAgICA8L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgICAgICAgPHA+e3sgbG9jYWxpemUoXCJDT01FVENIQVRfQVNLX0FJX0JPVFwiKSB9fTwvcD5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDxjb21ldGNoYXQtYWN0aW9uLXNoZWV0XG4gICAgICAgICAgICAgICAgKm5nSWY9XCJzaG93QWlCb3RMaXN0ICAmJiAhc2hvd0FjdGlvblNoZWV0SXRlbUFJXCIgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICAgIFthY3Rpb25zXT1cImFpQWN0aW9uQnV0dG9uc1wiIFt0aXRsZV09XCInQUknXCJcbiAgICAgICAgICAgICAgICBbYWN0aW9uU2hlZXRTdHlsZV09XCJhaUFjdGlvblNoZWV0U3R5bGVcIiBbaGlkZUxheW91dE1vZGVdPVwidHJ1ZVwiXG4gICAgICAgICAgICAgICAgKGNjLWFjdGlvbnNoZWV0LWNsaWNrZWQpPVwiaGFuZGxlQWN0aW9ucygkZXZlbnQpXCI+XG4gICAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LWFjdGlvbi1zaGVldCAqbmdJZj1cInNob3dBY3Rpb25TaGVldEl0ZW1BSVwiIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2FjdGlvbnNdPVwiYnV0dG9uc1wiIFt0aXRsZV09XCInQUknXCJcbiAgICAgICAgICAgICAgW2FjdGlvblNoZWV0U3R5bGVdPVwiYWlBY3Rpb25TaGVldFN0eWxlXCIgW2hpZGVMYXlvdXRNb2RlXT1cInRydWVcIlxuICAgICAgICAgICAgICAoY2MtYWN0aW9uc2hlZXQtY2xpY2tlZCk9XCJoYW5kbGVBY3Rpb25zKCRldmVudClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWFjdGlvbi1zaGVldD5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gKm5nSWY9XCJpc0FpRW5hYmxlZFwiIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ0FJJylcIlxuICAgICAgICAgICAgICBzbG90PVwiY2hpbGRyZW5cIiAjYWlCdXR0b25SZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5BaUZlYXR1cmVzKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIhc2hvd0FpRmVhdHVyZXMgPyBhaUljb25VUkwgOiBjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwic3RpY2tlckJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvY29tZXRjaGF0LXBvcG92ZXI+XG4gICAgICAgIDwvZGl2PlxuXG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zdGlja2Vya2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiZW5hYmxlU3RpY2tlcktleWJvYXJkICYmICFhdXhpbGFyeUJ1dHRvblZpZXdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwic3RpY2tlclBvcG92ZXJcIiBbcGxhY2VtZW50XT1cImF1eGlsYXJ5UGxhY2VtZW50XCI+XG4gICAgICAgICAgICA8c3RpY2tlcnMta2V5Ym9hcmQgc2xvdD1cImNvbnRlbnRcIlxuICAgICAgICAgICAgICBbc3RpY2tlclN0eWxlXT1cInN0aWNrZXJLZXlib2FyZFN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLXN0aWNrZXItY2xpY2tlZCk9XCJzZW5kU3RpY2tlcigkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L3N0aWNrZXJzLWtleWJvYXJkPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU1RJQ0tFUicpXCIgc2xvdD1cImNoaWxkcmVuXCJcbiAgICAgICAgICAgICAgI3N0aWNrZXJCdXR0b25SZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5TdGlja2VyS2V5Ym9hcmQoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIFtpY29uVVJMXT1cIiAhc2hvd1N0aWNrZXJLZXlib2FyZCA/IHN0aWNrZXJCdXR0b25JY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cInN0aWNrZXJCdXR0b25TdHlsZVwiPjwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2NvbWV0Y2hhdC1wb3BvdmVyPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzcz1cImNjLW1lc3NhZ2UtY29tcG9zZXJfX2Vtb2ppa2V5Ym9hcmRcIlxuICAgICAgICAgICpuZ0lmPVwiIWF1eGlsYXJ5QnV0dG9uVmlld1wiPlxuICAgICAgICAgIDxjb21ldGNoYXQtcG9wb3ZlciAoY2MtcG9wb3Zlci1vdXRzaWRlLWNsaWNrZWQpPVwiaGFuZGxlT3V0c2lkZUNsaWNrKClcIlxuICAgICAgICAgICAgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiIFtwb3BvdmVyU3R5bGVdPVwiZW1vamlQb3BvdmVyXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWVtb2ppLWtleWJvYXJkIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW2Vtb2ppS2V5Ym9hcmRTdHlsZV09XCJlbW9qaUtleWJvYXJkU3R5bGVcIlxuICAgICAgICAgICAgICAoY2MtZW1vamktY2xpY2tlZCk9XCJhcHBlbmRFbW9qaSgkZXZlbnQpXCI+XG4gICAgICAgICAgICA8L2NvbWV0Y2hhdC1lbW9qaS1rZXlib2FyZD5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtYnV0dG9uICNlbW9qaUJ1dHRvblJlZiBbaG92ZXJUZXh0XT1cImxvY2FsaXplKCdFTU9KSScpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5FbW9qaUtleWJvYXJkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXNob3dFbW9qaUtleWJvYXJkICB8fCAoIXNob3dFbW9qaUtleWJvYXJkICYmIHNob3dBY3Rpb25TaGVldEl0ZW0pID8gZW1vamlCdXR0b25JY29uVVJMIDogY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImVtb2ppQnV0dG9uU3R5bGVcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19tZWRpYXJlY29yZGVyXCJcbiAgICAgICAgICAqbmdJZj1cIiFoaWRlVm9pY2VSZWNvcmRpbmdcIj5cbiAgICAgICAgICA8Y29tZXRjaGF0LXBvcG92ZXIgKGNjLXBvcG92ZXItb3V0c2lkZS1jbGlja2VkKT1cImhhbmRsZU91dHNpZGVDbGljaygpXCJcbiAgICAgICAgICAgIFtwb3BvdmVyU3R5bGVdPVwibWVkaWFSZWNvcmRlZFBvcG92ZXJcIlxuICAgICAgICAgICAgW3BsYWNlbWVudF09XCJhdXhpbGFyeVBsYWNlbWVudFwiPlxuXG4gICAgICAgICAgICA8Y29tZXRjaGF0LW1lZGlhLXJlY29yZGVyICpuZ0lmPVwidG9nZ2xlTWVkaWFSZWNvcmRlZFwiXG4gICAgICAgICAgICAgIFthdXRvUmVjb3JkaW5nXT1cInRydWVcIiBzdGFydEljb25UZXh0PVwiXCIgc3RvcEljb25UZXh0PVwiXCJcbiAgICAgICAgICAgICAgc3VibWl0QnV0dG9uSWNvblRleHQ9XCJcIlxuICAgICAgICAgICAgICBbc3VibWl0QnV0dG9uSWNvblVSTF09XCJ2b2ljZVJlY29yZGluZ1N1Ym1pdEljb25VUkxcIlxuICAgICAgICAgICAgICBbc3RhcnRJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nU3RhcnRJY29uVVJMXCJcbiAgICAgICAgICAgICAgW3N0b3BJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nU3RvcEljb25VUkxcIlxuICAgICAgICAgICAgICBbY2xvc2VJY29uVVJMXT1cInZvaWNlUmVjb3JkaW5nQ2xvc2VJY29uVVJMXCJcbiAgICAgICAgICAgICAgKGNjLW1lZGlhLXJlY29yZGVyLXN1Ym1pdHRlZCk9XCJzZW5kUmVjb3JkZWRNZWRpYSgkZXZlbnQpXCJcbiAgICAgICAgICAgICAgKGNjLW1lZGlhLXJlY29yZGVyLWNsb3NlZCk9XCJjbG9zZU1lZGlhUmVjb3JkZXIoJGV2ZW50KVwiXG4gICAgICAgICAgICAgIHNsb3Q9XCJjb250ZW50XCJcbiAgICAgICAgICAgICAgW21lZGlhUGxheWVyU3R5bGVdPVwibWVkaWFSZWNvcmRlclN0eWxlXCI+PC9jb21ldGNoYXQtbWVkaWEtcmVjb3JkZXI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWljb24tYnV0dG9uIFtob3ZlclRleHRdPVwibG9jYWxpemUoJ1ZPSUNFX1JFQ09SRElORycpXCJcbiAgICAgICAgICAgICAgc2xvdD1cImNoaWxkcmVuXCIgI21lZGlhUmVjb3JkZWRSZWZcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9wZW5NZWRpYVJlY29yZGVkKCRldmVudClcIlxuICAgICAgICAgICAgICBbaWNvblVSTF09XCIgIXRvZ2dsZU1lZGlhUmVjb3JkZWQgPyB2b2ljZVJlY29yZGluZ0ljb25VUkwgOiBjbG9zZUJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwibWVkaWFSZWNvcmRlckJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtaWNvbi1idXR0b24+XG4gICAgICAgICAgPC9jb21ldGNoYXQtcG9wb3Zlcj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgZGF0YS1zbG90PVwicHJpbWFyeVZpZXdcIj5cbiAgICAgICAgPGRpdiAqbmdJZj1cInNlbmRCdXR0b25WaWV3O2Vsc2Ugc2VuZEJ1dHRvblwiPlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNzZW5kQnV0dG9uPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1tZXNzYWdlLWNvbXBvc2VyX19zZW5kYnV0dG9uXCJcbiAgICAgICAgICAgICpuZ0lmPVwic2hvd1NlbmRCdXR0b24gfHwgaGlkZUxpdmVSZWFjdGlvblwiPlxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwic2VuZEJ1dHRvbkljb25VUkxcIlxuICAgICAgICAgICAgICBbYnV0dG9uU3R5bGVdPVwic2VuZEJ1dHRvblN0eWxlXCJcbiAgICAgICAgICAgICAgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnU0VORF9NRVNTQUdFJylcIlxuICAgICAgICAgICAgICAoY2MtYnV0dG9uLWNsaWNrZWQpPVwiY3VzdG9tU2VuZE1ldGhvZChtZXNzYWdlVGV4dClcIj5cbiAgICAgICAgICAgIDwvY29tZXRjaGF0LWJ1dHRvbj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbGl2ZXJlYWN0aW9uXCJcbiAgICAgICAgICAgICpuZ0lmPVwiIWhpZGVMaXZlUmVhY3Rpb24gJiYgIXNob3dTZW5kQnV0dG9uXCI+XG4gICAgICAgICAgICA8Y29tZXRjaGF0LWJ1dHRvbiBbaWNvblVSTF09XCJMaXZlUmVhY3Rpb25JY29uVVJMXCJcbiAgICAgICAgICAgICAgW2hvdmVyVGV4dF09XCJsb2NhbGl6ZSgnTElWRV9SRUFDVElPTicpXCJcbiAgICAgICAgICAgICAgW2J1dHRvblN0eWxlXT1cImxpdmVSZWFjdGlvblN0eWxlXCJcbiAgICAgICAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cInNlbmRSZWFjdGlvbigpXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9kaXY+XG4gICAgPC9jb21ldGNoYXQtdGV4dC1pbnB1dD5cbiAgPC9kaXY+XG48L2Rpdj5cblxuPGlucHV0IGNsYXNzPVwiY2MtbWVzc2FnZS1jb21wb3Nlcl9fbWVkaWFpbnB1dFwiICNpbnB1dEVsZW1lbnRcbiAgKGNoYW5nZSk9XCJpbnB1dENoYW5nZUhhbmRsZXIoJGV2ZW50KVwiIC8+XG48Y29tZXRjaGF0LWJhY2tkcm9wICpuZ0lmPVwic2hvd0NyZWF0ZVBvbGxzXCIgW2JhY2tkcm9wU3R5bGVdPVwiYmFja2Ryb3BTdHlsZVwiPlxuICA8Y3JlYXRlLXBvbGwgW3VzZXJdPVwidXNlclwiIFtncm91cF09XCJncm91cFwiXG4gICAgKGNjLWNsb3NlLWNsaWNrZWQpPVwiY2xvc2VDcmVhdGVQb2xscygpXCJcbiAgICBbY3JlYXRlUG9sbFN0eWxlXT1cImNyZWF0ZVBvbGxTdHlsZVwiPjwvY3JlYXRlLXBvbGw+XG48L2NvbWV0Y2hhdC1iYWNrZHJvcD5cbiJdfQ==