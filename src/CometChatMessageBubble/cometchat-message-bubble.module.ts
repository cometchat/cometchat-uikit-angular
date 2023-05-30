import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageBubbleComponent } from "./cometchat-message-bubble/cometchat-message-bubble.component";
@NgModule({
  declarations: [CometChatMessageBubbleComponent],
  imports: [
    CommonModule,
  ],
  exports: [CometChatMessageBubbleComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatMessageBubble {}