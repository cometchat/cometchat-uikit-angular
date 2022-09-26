import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatTextBubbleComponent } from "./cometchat-text-bubble/cometchat-text-bubble.component"; 
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatTextBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatTextBubbleComponent],
})
export class CometChatTextBubble {}