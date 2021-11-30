import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageThreadComponent } from "./cometchat-message-thread/cometchat-message-thread.component";
import { CometChatSenderTextMessageBubble } from "../CometChat-sender-text-message-bubble/cometchat-sender-text-message-bubble.module";
import { CometChatMessageList } from "../CometChat-message-list/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChat-message-composer/cometchat-message-composer.module";
import { CometChatReceiverTextMessageBubble } from "../CometChat-receiver-text-message-bubble/cometchat-receiver-text-message-bubble.module";
import { CometChatSenderFileMessageBubble } from "../CometChat-sender-file-message-bubble/cometchat-sender-file-message-bubble.module";
import { CometChatReceiverFileMessageBubble } from "../CometChat-receiver-file-message-bubble/cometchat-receiver-file-message-bubble.module";
import { CometChatSenderImageMessageBubble } from "../CometChat-sender-image-message-bubble/cometchat-sender-image-message-bubble.module";
import { CometChatReceiverImageMessageBubble } from "../CometChat-receiver-image-message-bubble/cometchat-receiver-image-message-bubble.module";
import { CometChatSenderVideoMessageBubble } from "../CometChat-sender-video-message-bubble/cometchat-sender-video-message-bubble.module";
import { CometChatReceiverVideoMessageBubble } from "../CometChat-receiver-video-message-bubble/cometchat-receiver-video-message-bubble.module";
import { CometChatSenderAudioMessageBubble } from "../CometChat-sender-audio-message-bubble/cometchat-sender-audio-message-bubble.module";
import { CometChatReceiverAudioMessageBubble } from "../CometChat-receiver-audio-message-bubble/cometchat-receiver-audio-message-bubble.module";
import { CometChatSenderStickerMessageBubble } from "../Extensions/CometChat-sender-sticker-message-bubble/cometchat-sender-sticker-message-bubble.module";
import { CometChatReceiverStickerMessageBubble } from "../Extensions/CometChat-receiver-sticker-message-bubble/cometchat-receiver-sticker-message-bubble.module";
import { CometChatSenderPollMessageBubble } from "../Extensions/CometChat-sender-poll-message-bubble/cometchat-sender-poll-message-bubble.module";
import { CometChatReceiverPollMessageBubble } from "../Extensions/CometChat-receiver-poll-message-bubble/cometchat-receiver-poll-message-bubble.module";

@NgModule({
  declarations: [CometChatMessageThreadComponent],
  imports: [
    CommonModule,
    CometChatSenderTextMessageBubble,
    CometChatReceiverTextMessageBubble,
    CometChatSenderFileMessageBubble,
    CometChatReceiverFileMessageBubble,
    CometChatSenderImageMessageBubble,
    CometChatReceiverImageMessageBubble,
    CometChatSenderAudioMessageBubble,
    CometChatReceiverAudioMessageBubble,
    CometChatSenderVideoMessageBubble,
    CometChatReceiverVideoMessageBubble,
    CometChatMessageList,
    CometChatMessageComposer,
    CometChatSenderStickerMessageBubble,
    CometChatReceiverStickerMessageBubble,
    CometChatSenderPollMessageBubble,
    CometChatReceiverPollMessageBubble,
  ],
  exports: [CometChatMessageThreadComponent],
})
export class CometChatMessageThread {}
