import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatWhiteboardBubbleComponent } from "./cometchat-whiteboard-bubble/cometchat-whiteboard-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatWhiteboardBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatWhiteboardBubbleComponent],
})
export class CometChatWhiteboardBubble {}