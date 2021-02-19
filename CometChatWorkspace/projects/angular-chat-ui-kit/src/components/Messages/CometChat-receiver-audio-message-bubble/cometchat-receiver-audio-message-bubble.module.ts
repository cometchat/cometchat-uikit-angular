import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatReceiverAudioMessageBubbleComponent } from "./cometchat-receiver-audio-message-bubble/cometchat-receiver-audio-message-bubble.component";
import { CometChatMessageActions } from "../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { CometChatReadReceipt } from "../CometChat-read-receipt/cometchat-read-receipt.module";
import { CometChatThreadedMessageReplyCount } from "../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../Extensions/CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatReceiverAudioMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatAvatar,
    CometChatReadReceipt,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatReceiverAudioMessageBubbleComponent],
})
export class CometChatReceiverAudioMessageBubble { }
