import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverStickerMessageBubbleComponent } from "./cometchat-receiver-sticker-message-bubble/cometchat-receiver-sticker-message-bubble.component";
import { CometChatMessageActions } from "../../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatThreadedMessageReplyCount } from "../../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatAvatar } from "../../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatReadReceipt } from "../../CometChat-read-receipt/cometchat-read-receipt.module";
import { CometChatMessageReactions } from "../CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverStickerMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatThreadedMessageReplyCount,
    CometChatAvatar,
    CometChatThreadedMessageReplyCount,
    CometChatReadReceipt,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverStickerMessageBubbleComponent],
})
export class CometChatReceiverStickerMessageBubble { }
