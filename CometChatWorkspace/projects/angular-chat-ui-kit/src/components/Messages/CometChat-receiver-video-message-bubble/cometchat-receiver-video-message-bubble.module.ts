import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverVideoMessageBubbleComponent } from "./cometchat-receiver-video-message-bubble/cometchat-receiver-video-message-bubble.component";
import { CometChatMessageActions } from "../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatThreadedMessageReplyCount } from "../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatReadReciept } from "../CometChat-read-reciept/cometchat-read-reciept.module";
import { CometChatMessageReactions } from "../Extensions/CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverVideoMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
    CometChatMessageActions,
    CometChatThreadedMessageReplyCount,
    CometChatReadReciept,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverVideoMessageBubbleComponent],
})
export class CometChatReceiverVideoMessageBubble {}
