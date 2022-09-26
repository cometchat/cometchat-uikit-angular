import { CometChat } from "@cometchat-pro/chat";
import { ConversationType } from "../Constants/UIKitConstants";
export type conversationTypes = typeof ConversationType.both | typeof ConversationType.users | typeof ConversationType.groups;
export type callBack = (data?: object) => any;
export type conversationObject = CometChat.Conversation
export type messageObject = CometChat.BaseMessage;
