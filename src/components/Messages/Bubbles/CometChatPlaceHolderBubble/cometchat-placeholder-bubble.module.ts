import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatPlaceholderBubbleComponent } from "./cometchat-placeholder-bubble/cometchat-placeholder-bubble.component"; 
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatPlaceholderBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatPlaceholderBubbleComponent],
})
export class CometChatPlaceholderBubble {}