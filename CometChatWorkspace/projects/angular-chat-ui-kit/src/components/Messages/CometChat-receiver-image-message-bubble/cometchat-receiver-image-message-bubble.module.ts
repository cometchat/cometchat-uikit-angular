import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverImageMessageBubbleComponent } from "./cometchat-receiver-image-message-bubble/cometchat-receiver-image-message-bubble.component";
import { CometChatMessageActions } from "../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatThreadedMessageReplyCount } from "../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatReadReceipt } from "../CometChat-read-receipt/cometchat-read-receipt.module";
import { CometChatMessageReactions } from "../Extensions/CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverImageMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatAvatar,
    CometChatThreadedMessageReplyCount,
    CometChatReadReceipt,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverImageMessageBubbleComponent],
})
export class CometChatReceiverImageMessageBubble { }
