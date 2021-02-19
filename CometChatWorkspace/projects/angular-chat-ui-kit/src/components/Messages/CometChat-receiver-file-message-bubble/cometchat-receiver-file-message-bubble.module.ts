import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverFileMessageBubbleComponent } from "./cometchat-receiver-file-message-bubble/cometchat-receiver-file-message-bubble.component";
import { CometChatReadReceipt } from "../CometChat-read-receipt/cometchat-read-receipt.module";
import { CometChatMessageActions } from "../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatThreadedMessageReplyCount } from "../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../Extensions/CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverFileMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatAvatar,
    CometChatReadReceipt,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverFileMessageBubbleComponent],
})
export class CometChatReceiverFileMessageBubble { }
