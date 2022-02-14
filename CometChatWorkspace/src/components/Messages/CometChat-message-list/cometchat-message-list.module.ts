import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageListComponent } from "./cometchat-message-list/cometchat-message-list.component";
import { CometChatSenderTextMessageBubble } from "../CometChat-sender-text-message-bubble/cometchat-sender-text-message-bubble.module";
import { CometChatReceiverTextMessageBubble } from "../CometChat-receiver-text-message-bubble/cometchat-receiver-text-message-bubble.module";
import { CometChatSenderFileMessageBubble } from "../CometChat-sender-file-message-bubble/cometchat-sender-file-message-bubble.module";
import { CometChatReceiverFileMessageBubble } from "../CometChat-receiver-file-message-bubble/cometchat-receiver-file-message-bubble.module";
import { CometChatSenderImageMessageBubble } from "../CometChat-sender-image-message-bubble/cometchat-sender-image-message-bubble.module";
import { CometChatReceiverImageMessageBubble } from "../CometChat-receiver-image-message-bubble/cometchat-receiver-image-message-bubble.module";
import { CometChatSenderVideoMessageBubble } from "../CometChat-sender-video-message-bubble/cometchat-sender-video-message-bubble.module";
import { CometChatReceiverVideoMessageBubble } from "../CometChat-receiver-video-message-bubble/cometchat-receiver-video-message-bubble.module";
import { CometChatSenderAudioMessageBubble } from "../CometChat-sender-audio-message-bubble/cometchat-sender-audio-message-bubble.module";
import { CometChatReceiverAudioMessageBubble } from "../CometChat-receiver-audio-message-bubble/cometchat-receiver-audio-message-bubble.module";
import { CometChatDeleteMessageBubble } from "../CometChat-delete-message-bubble/cometchat-delete-message-bubble.module";
import { CometChatSenderPollMessageBubble } from "../Extensions/CometChat-sender-poll-message-bubble/cometchat-sender-poll-message-bubble.module";
import { CometChatReceiverPollMessageBubble } from "../Extensions/CometChat-receiver-poll-message-bubble/cometchat-receiver-poll-message-bubble.module";
import { CometChatSenderStickerMessageBubble } from "../Extensions/CometChat-sender-sticker-message-bubble/cometchat-sender-sticker-message-bubble.module";
import { CometChatReceiverStickerMessageBubble } from "../Extensions/CometChat-receiver-sticker-message-bubble/cometchat-receiver-sticker-message-bubble.module";
import { CometChatActionMessageBubble } from "../CometChat-action-message-bubble/cometchat-action-message-bubble.module";
import { DatePipe } from "@angular/common";
import { CometChatSenderDirectCallBubble } from "../CometChat-sender-directcall-bubble/cometchat-sender-directcall-bubble.module";
import { CometChatReceiverDirectCallBubble } from "../CometChat-receiver-directcall-bubble/cometchat-receiver-directcall-bubble.module";
@NgModule({
  declarations: [CometChatMessageListComponent],
  imports: [
    CommonModule,
    CometChatSenderTextMessageBubble,
    CometChatSenderFileMessageBubble,
    CometChatReceiverFileMessageBubble,
    CometChatSenderImageMessageBubble,
    CometChatReceiverImageMessageBubble,
    CometChatSenderVideoMessageBubble,
    CometChatReceiverVideoMessageBubble,
    CometChatSenderAudioMessageBubble,
    CometChatReceiverAudioMessageBubble,
    CometChatReceiverTextMessageBubble,
    CometChatDeleteMessageBubble,
    CometChatSenderPollMessageBubble,
    CometChatReceiverPollMessageBubble,
    CometChatSenderStickerMessageBubble,
    CometChatReceiverStickerMessageBubble,
    CometChatActionMessageBubble,
    CometChatSenderDirectCallBubble,
    CometChatReceiverDirectCallBubble
  ],
  exports: [CometChatMessageListComponent],
  providers: [DatePipe],
})
export class CometChatMessageList {}
