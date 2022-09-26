import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatVideoBubbleComponent } from "./cometchat-video-bubble/cometchat-video-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatVideoBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
  ],
  exports: [CometChatVideoBubbleComponent],
})
export class CometChatVideoBubble {}