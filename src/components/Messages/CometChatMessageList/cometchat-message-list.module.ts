import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageListComponent } from "./cometchat-message-list/cometchat-message-list.component";
import { DatePipe } from "@angular/common";
import { CometChatAudioBubble } from "../Bubbles/CometChatAudioBubble/cometchat-audio-bubble.module";
import { CometChatFileBubble } from "../Bubbles/CometChatFileBubble/cometchat-file-bubble.module";
import { CometChatImageBubble } from "../Bubbles/CometChatImageBubble/cometchat-image-bubble.module";
import { CometChatTextBubble } from "../Bubbles/CometChatTextBubble/cometchat-text-bubble.module";
import { CometChatVideoBubble } from "../Bubbles/CometChatVideoBubble/cometchat-video-bubble.module";
import { CometChatPollBubble } from "../Bubbles/CometChatPollBubble/cometchat-poll-bubble.module";
import { CometChatStickerBubble } from "../Bubbles/CometChatStickerBubble/cometchat-sticker-bubble.module";
import { CometChatMessageBubble } from "../Bubbles/CometChatMessageBubble/cometchat-message-bubble.module";
import { CometChatDate } from "../../Shared/SecondaryComponents/CometChatDate/cometchat-date.module";
import { CometChatActionSheet } from "../../Shared/UtilityComponents/CometChatActionSheet/cometchat-action-sheet.module";
import { CometChatEmojiKeyboard } from "../CometChatEmojiKeyboard/cometchat-emoji-keyboard.module";
import { CometChatSmartReply } from "../CometChatSmartReply/cometchat-smart-reply.module";
import { CometChatNewMessageIndicator } from "../CometChatNewMessageIndicator/cometchat-new-message-indicator.module";
import { CometChatPopover } from "../../Shared/UtilityComponents";
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";
@NgModule({
  declarations: [CometChatMessageListComponent],
  imports: [
    CommonModule,
    CometChatTextBubble,
    CometChatFileBubble,
    CometChatFileBubble,
    CometChatImageBubble,
    CometChatImageBubble,
    CometChatVideoBubble,
    CometChatVideoBubble,
    CometChatAudioBubble,
    CometChatAudioBubble,
    CometChatTextBubble,
    CometChatPollBubble,
    CometChatPollBubble,
    CometChatStickerBubble,
    CometChatStickerBubble,
    CometChatDate,
    CometChatMessageBubble,
    CometChatActionSheet,
    CometChatEmojiKeyboard,
    CometChatSmartReply,
    CometChatNewMessageIndicator,
    CometChatPopover,
    CometChatDecoratorMessage


  ],
  exports: [CometChatMessageListComponent],
  providers: [DatePipe],
})
export class CometChatMessageList {}
