import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDeleteBubbleComponent } from "./cometchat-delete-bubble/cometchat-delete-bubble.component"; 


@NgModule({
  declarations: [CometChatDeleteBubbleComponent],
  imports: [
    CommonModule
  ],
  exports: [CometChatDeleteBubbleComponent],
})
export class CometChatDeleteBubble {}