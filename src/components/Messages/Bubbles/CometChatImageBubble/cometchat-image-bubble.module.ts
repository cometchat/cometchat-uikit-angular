import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatImageBubbleComponent } from "./cometchat-image-bubble/cometchat-image-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatImageBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatImageBubbleComponent],
})
export class CometChatImageBubble {}