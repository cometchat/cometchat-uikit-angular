import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatAudioBubbleComponent } from "./cometchat-audio-bubble/cometchat-audio-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatAudioBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
  ],
  exports: [CometChatAudioBubbleComponent],
})
export class CometChatAudioBubble {}