import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatSenderStickerMessageBubbleComponent } from "./cometchat-sender-sticker-message-bubble/cometchat-sender-sticker-message-bubble.component";
import { CometChatReadReceipt } from "../../CometChat-read-receipt/cometchat-read-receipt.module";
import { CometChatMessageActions } from "../../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatThreadedMessageReplyCount } from "../../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatSenderStickerMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatReadReceipt,
    CometChatMessageActions,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatSenderStickerMessageBubbleComponent],
})
export class CometChatSenderStickerMessageBubble { }
