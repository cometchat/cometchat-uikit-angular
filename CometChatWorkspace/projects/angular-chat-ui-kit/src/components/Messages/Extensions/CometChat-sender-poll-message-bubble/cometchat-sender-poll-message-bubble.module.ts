import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatSenderPollMessageBubbleComponent } from "./cometchat-sender-poll-message-bubble/cometchat-sender-poll-message-bubble.component";
import { CometChatMessageActions } from "../../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatReadReciept } from "../../CometChat-read-reciept/cometchat-read-reciept.module";
import { CometChatThreadedMessageReplyCount } from "../../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatSenderPollMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatReadReciept,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatSenderPollMessageBubbleComponent],
})
export class CometChatSenderPollMessageBubble {}
