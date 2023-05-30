import { CometChatMessageOption,MessageBubbleAlignment, CometChatMessageTemplate, CometChatMessageComposerAction, CometChatTheme, localize, CometChatUIKitConstants, fontHelper } from "uikit-resources-lerna";
import { ConversationUtils} from "uikit-utils-lerna";
import { CometChat } from "@cometchat-pro/chat";
import { DataSource } from "../Framework/DataSource";
import { ChatConfigurator } from "../Framework/ChatConfigurator";
export class MessageUtils implements DataSource {
    getEditOption(theme: CometChatTheme): CometChatMessageOption {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.editMessage,
            title: localize("EDIT_MESSAGE"),
            iconURL: "assets/editicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600()
        });
    }
    getDeleteOption(theme: CometChatTheme): CometChatMessageOption {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.deleteMessage,
            title: localize("DELETE"),
            iconURL: "assets/deleteicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600()
        });
    }
    getReplyInThreadOption(theme: CometChatTheme): CometChatMessageOption {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.replyInThread,
            title: localize("REPLY_IN_THREAD"),
            iconURL: "assets/threadicon.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600()
        });
    }
    getCopyOption(theme: CometChatTheme): CometChatMessageOption {
        return new CometChatMessageOption({
            id: CometChatUIKitConstants.MessageOption.copyMessage,
            title: localize("COPY_MESSAGE"),
            iconURL: "assets/Copy.svg",
            onClick: null,
            iconTint: theme.palette.getAccent600(),
            backgroundColor: "transparent",
            titleFont: fontHelper(theme.typography.subtitle1),
            titleColor: theme.palette.getAccent600()
        });
    }
    isSentByMe(loggedInUser: CometChat.User, message: CometChat.BaseMessage): boolean {
        return loggedInUser.getUid() === message.getSender().getUid();
    }
    getTextMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let _isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);
        let _isModerator: boolean = false;
        if (group?.getScope() == CometChatUIKitConstants.groupMemberScope.moderator) {
            _isModerator = true;
        }
        let messageOptionList: Array<CometChatMessageOption> = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        if (_isSentByMe) {
            messageOptionList.push(this.getEditOption(theme));
        }
        messageOptionList.push(this.getCopyOption(theme));
        return messageOptionList;
    }
    getImageMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let messageOptionList: CometChatMessageOption[] = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    getVideoMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let messageOptionList: CometChatMessageOption[] = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    getAudioMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let messageOptionList: CometChatMessageOption[] = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    getFileMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let messageOptionList: CometChatMessageOption[] = [];
        messageOptionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        return messageOptionList;
    }
    getBottomView(_messageObject: CometChat.BaseMessage, _alignment: MessageBubbleAlignment) {
        return null;
    }
    getTextMessageTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.text,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getAudioMessageTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.audio,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getVideoMessageTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.video,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getImageMessageTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.image,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getGroupActionTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.groupMember,
            category: CometChatUIKitConstants.MessageCategory.action,
        });
    }
    getFileMessageTemplate(): CometChatMessageTemplate {
        return new CometChatMessageTemplate({
            type: CometChatUIKitConstants.MessageTypes.file,
            category: CometChatUIKitConstants.MessageCategory.message,
            options: ChatConfigurator.getDataSource().getMessageOptions,
        });
    }
    getAllMessageTemplates(): Array<CometChatMessageTemplate> {
        return [
            ChatConfigurator.getDataSource().getTextMessageTemplate(),
            ChatConfigurator.getDataSource().getImageMessageTemplate(),
            ChatConfigurator.getDataSource().getVideoMessageTemplate(),
            ChatConfigurator.getDataSource().getAudioMessageTemplate(),
            ChatConfigurator.getDataSource().getFileMessageTemplate(),
            ChatConfigurator.getDataSource().getGroupActionTemplate(),
        ];
    }
    getMessageTemplate(messageType: string, messageCategory: string): CometChatMessageTemplate | null {
        let _template: CometChatMessageTemplate | null = null;
        if (messageCategory != CometChatUIKitConstants.MessageCategory.call) {
            switch (messageType) {
                case CometChatUIKitConstants.MessageTypes.text:
                    _template = ChatConfigurator.getDataSource().getTextMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    _template = ChatConfigurator.getDataSource().getImageMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    _template = ChatConfigurator.getDataSource().getVideoMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.groupMember:
                    _template = ChatConfigurator.getDataSource().getGroupActionTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    _template = ChatConfigurator.getDataSource().getFileMessageTemplate();
                    break;
                case CometChatUIKitConstants.MessageTypes.audio:
                    _template = ChatConfigurator.getDataSource().getAudioMessageTemplate();
                    break;
            }
        }
        return _template;
    }
    getMessageOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let _optionList: Array<CometChatMessageOption> = [];
        let _isSentByMe: boolean = false;
        if (loggedInUser.getUid() == messageObject.getSender()?.getUid()) {
            _isSentByMe = true;
        }
        if (messageObject.getCategory() == CometChatUIKitConstants.MessageCategory.message) {
            switch (messageObject.getType()) {
                case CometChatUIKitConstants.MessageTypes.text:
                    _optionList = ChatConfigurator.getDataSource().getTextMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.image:
                    _optionList = ChatConfigurator.getDataSource().getImageMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.video:
                    _optionList = ChatConfigurator.getDataSource().getVideoMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.groupMember:
                    _optionList = [];
                    break;
                case CometChatUIKitConstants.MessageTypes.file:
                    _optionList = ChatConfigurator.getDataSource().getFileMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
                case CometChatUIKitConstants.MessageTypes.audio:
                    _optionList = ChatConfigurator.getDataSource().getAudioMessageOptions(loggedInUser, messageObject, theme, group);
                    break;
            }
        } else if (messageObject.getCategory() == CometChatUIKitConstants.MessageCategory.custom) {
            _optionList = ChatConfigurator.getDataSource().getCommonOptions(loggedInUser, messageObject, theme, group);
        }
        return _optionList;
    }
    getCommonOptions(loggedInUser: CometChat.User, messageObject: CometChat.BaseMessage, theme: CometChatTheme, group?: CometChat.Group): Array<CometChatMessageOption> {
        let _isSentByMe: boolean = this.isSentByMe(loggedInUser, messageObject);
        let _isModerator: boolean = false;
        if (group?.getScope() == CometChatUIKitConstants.groupMemberScope.moderator) _isModerator = true;
        let messageOptionList: Array<CometChatMessageOption> = [];
        if (_isSentByMe == true || _isModerator == true)
            messageOptionList.push(this.getDeleteOption(theme));
        if (!messageObject.getParentMessageId()) {
            messageOptionList.push(this.getReplyInThreadOption(theme));
        }
        return messageOptionList;
    }
    getAllMessageTypes(): Array<string> {
        return [
            CometChatUIKitConstants.MessageTypes.text,
            CometChatUIKitConstants.MessageTypes.image,
            CometChatUIKitConstants.MessageTypes.audio,
            CometChatUIKitConstants.MessageTypes.video,
            CometChatUIKitConstants.MessageTypes.file,
            CometChatUIKitConstants.MessageTypes.groupMember
        ];
    }
    addList(): string {
        return "<Message Utils>";
    }
    getAllMessageCategories(): Array<string> {
        return [CometChatUIKitConstants.MessageCategory.message, CometChatUIKitConstants.MessageCategory.action];
    }
    getAuxiliaryOptions(id:ComposerId, user?: CometChat.User, group?: CometChat.Group): any {
        return null;
    }
    getId(): string {
        return "messageUtils";
    }
    getActionMessage(message: CometChat.Action):string  {
        try {
            if (message instanceof CometChat.Action) {
                const action = message.getAction();
                const actionBy = message.getActionBy();
                const actionOn = message.getActionOn();

                const byString = (actionBy as CometChat.User).getName();
                const forString =
                    action === CometChatUIKitConstants.groupMemberAction.JOINED ||
                        action === CometChatUIKitConstants.groupMemberAction.LEFT
                        ? ""
                        : (actionOn as CometChat.User).getName();

                switch (action) {
                    case CometChatUIKitConstants.groupMemberAction.ADDED:
                        return `${byString} ${localize("ADDED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.JOINED:
                        return `${byString} ${localize("JOINED")}`;
                    case CometChatUIKitConstants.groupMemberAction.LEFT:
                        return `${byString} ${localize("LEFT")}`;
                    case CometChatUIKitConstants.groupMemberAction.KICKED:
                        return `${byString} ${localize("KICKED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.BANNED:
                        return `${byString} ${localize("BANNED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.UNBANNED:
                        return `${byString} ${localize("UNBANNED")} ${forString}`;
                    case CometChatUIKitConstants.groupMemberAction.SCOPE_CHANGE:
                        return `${byString} ${localize("MADE")} ${forString} ${message.getNewScope()}`;
                    default:
                        return "";
                }
            }
            else{
                return  ""
            }
        } catch(e) {
            return "";
        }
    }

    imageAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.image,
            title: localize("ATTACH_IMAGE"),
            iconURL: "assets/photolibrary.svg",
            onClick:null,
            iconTint:theme.palette.getAccent700(),
            titleFont:fontHelper(theme.typography.subtitle1),
            titleColor:theme.palette.getAccent700(),
            borderRadius:"8px",
            background:theme.palette.getAccent100()
        });
    }
    videoAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.video,
            title: localize("ATTACH_VIDEO"),
            iconURL: "assets/video.svg",
            onClick:null,
            iconTint:theme.palette.getAccent700(),
            titleFont:fontHelper(theme.typography.subtitle1),
            titleColor:theme.palette.getAccent700(),
            borderRadius:"8px",
            background:theme.palette.getAccent100()
        });
    }
    audioAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.audio,
            title: localize("ATTACH_AUDIO"),
            iconURL: "assets/audio-file.svg",
            onClick:null,
            iconTint:theme.palette.getAccent700(),
            titleFont:fontHelper(theme.typography.subtitle1),
            titleColor:theme.palette.getAccent700(),
            borderRadius:"8px",
            background:theme.palette.getAccent100()
        });
    }
    fileAttachmentOption(theme: CometChatTheme): CometChatMessageComposerAction {
        return new CometChatMessageComposerAction({
            id: CometChatUIKitConstants.MessageTypes.file,
            title: localize("ATTACH_FILE"),
            iconURL: "assets/attachment-file.svg",
            onClick:null,
            iconTint:theme.palette.getAccent700(),
            titleFont:fontHelper(theme.typography.subtitle1),
            titleColor:theme.palette.getAccent700(),
            borderRadius:"8px",
            background:theme.palette.getAccent100()
        });
    }
    getAttachmentOptions(theme: CometChatTheme,user?:CometChat.User,group?:CometChat.Group, id?: ComposerId): CometChatMessageComposerAction[] {
        let actions: Array<CometChatMessageComposerAction> = [
            this.imageAttachmentOption(theme),
            this.videoAttachmentOption(theme),
            this.audioAttachmentOption(theme),
            this.fileAttachmentOption(theme)
        ];
        return actions;
    }
    getLastConversationMessage(conversation: CometChat.Conversation, loggedInUser: CometChat.User): string {
        return ConversationUtils.getLastConversationMessage(conversation, loggedInUser);
    }
}
export type ComposerId = {parentMessageId : number | null, user : string | null, group : string | null};