import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupActionBubbleComponent } from "./cometchat-group-action-bubble/cometchat-group-action-bubble.component"; 


@NgModule({
  declarations: [CometChatGroupActionBubbleComponent],
  imports: [
    CommonModule
  ],
  exports: [CometChatGroupActionBubbleComponent],
})
export class CometChatGroupActionBubble {}