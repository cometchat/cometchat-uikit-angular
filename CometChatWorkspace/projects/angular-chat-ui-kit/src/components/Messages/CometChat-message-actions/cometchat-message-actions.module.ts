import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageActionsComponent } from "./cometchat-message-actions/cometchat-message-actions.component";

@NgModule({
  declarations: [CometChatMessageActionsComponent],
  imports: [CommonModule],
  exports: [CometChatMessageActionsComponent],
})
export class CometChatMessageActions {}
