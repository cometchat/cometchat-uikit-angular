import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDocumentBubbleComponent } from "./cometchat-document-bubble/cometchat-document-bubble.component";
import { CometChatAvatar } from "../../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatDocumentBubbleComponent],
  imports: [
    CommonModule,
    CometChatAvatar
  ],
  exports: [CometChatDocumentBubbleComponent],
})
export class CometChatDocumentBubble {}