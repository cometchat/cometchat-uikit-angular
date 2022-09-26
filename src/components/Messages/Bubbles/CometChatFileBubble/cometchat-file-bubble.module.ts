import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatFileBubbleComponent } from "./cometchat-file-bubble/cometchat-file-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatFileBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatFileBubbleComponent],
})
export class CometChatFileBubble {}