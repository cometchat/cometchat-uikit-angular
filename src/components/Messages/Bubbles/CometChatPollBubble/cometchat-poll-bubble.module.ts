import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatPollBubbleComponent } from "./cometchat-poll-bubble/cometchat-poll-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatPollBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatPollBubbleComponent],
})
export class CometChatPollBubble {}