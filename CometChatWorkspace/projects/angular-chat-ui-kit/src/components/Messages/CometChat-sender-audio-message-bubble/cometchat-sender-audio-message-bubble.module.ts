import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatSenderAudioMessageBubbleComponent } from "./cometchat-sender-audio-message-bubble/cometchat-sender-audio-message-bubble.component";
import { CometChatMessageActions } from "../CometChat-message-actions/cometchat-message-actions.module";
import { CometChatReadReciept } from "../CometChat-read-reciept/cometchat-read-reciept.module";
import { CometChatThreadedMessageReplyCount } from "../CometChat-threaded-message-reply-count/cometchat-threaded-message-reply-count.module";
import { CometChatMessageReactions } from "../Extensions/CometChat-message-reactions/cometchat-message-reactions.module";

@NgModule({
  declarations: [CometChatSenderAudioMessageBubbleComponent],
  imports: [
    CommonModule,
    CometChatMessageActions,
    CometChatReadReciept,
    CometChatThreadedMessageReplyCount,
    CometChatMessageReactions,
  ],
  exports: [CometChatSenderAudioMessageBubbleComponent],
})
export class CometChatSenderAudioMessageBubble {}
