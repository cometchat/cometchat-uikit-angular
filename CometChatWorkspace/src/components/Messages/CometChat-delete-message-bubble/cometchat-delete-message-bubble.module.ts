import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDeleteMessageBubbleComponent } from "./cometchat-delete-message-bubble/cometchat-delete-message-bubble.component";

import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatDeleteMessageBubbleComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatDeleteMessageBubbleComponent],
})
export class CometChatDeleteMessageBubble {}
