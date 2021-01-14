import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatSenderStickerMessageBubbleComponent } from "./cometchat-sender-sticker-message-bubble/cometchat-sender-sticker-message-bubble.component";
import { CometChatReadReciept } from "../../CometChat-read-reciept/cometchat-read-reciept.module";
import { CometChatMessageActions } from "../../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatThreadedMessageReplyCount } from "../../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatSenderStickerMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatReadReciept,
    CometChatMessageActions,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatSenderStickerMessageBubbleComponent],
})
export class CometChatSenderStickerMessageBubble {}
