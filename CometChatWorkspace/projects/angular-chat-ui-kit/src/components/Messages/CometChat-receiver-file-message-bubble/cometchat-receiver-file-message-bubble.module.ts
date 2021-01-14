import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverFileMessageBubbleComponent } from "./cometchat-receiver-file-message-bubble/cometchat-receiver-file-message-bubble.component";
import { CometChatReadReciept } from "../CometChat-read-reciept/cometchat-read-reciept.module";
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
    CometChatReadReciept,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverFileMessageBubbleComponent],
})
export class CometChatReceiverFileMessageBubble {}
