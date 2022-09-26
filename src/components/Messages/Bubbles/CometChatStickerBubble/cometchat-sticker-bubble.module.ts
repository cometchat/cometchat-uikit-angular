import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatStickerBubbleComponent } from "./cometchat-sticker-bubble/cometchat-sticker-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatStickerBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatStickerBubbleComponent],
})
export class CometChatStickerBubble {}