import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverPollMessageBubbleComponent } from "./cometchat-receiver-poll-message-bubble/cometchat-receiver-poll-message-bubble.component";
import { CometChatAvatar } from "../../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatThreadedMessageReplyCount } from "../../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatReadReciept } from "../../CometChat-read-reciept/cometchat-read-reciept.module";
import { CometChatMessageActions } from "../../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatMessageReactions } from "../CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverPollMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
    CometChatThreadedMessageReplyCount,
    CometChatReadReciept,
    CometChatMessageActions,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverPollMessageBubbleComponent],
})
export class CometChatReceiverPollMessageBubble {}
