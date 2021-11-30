import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationListComponent } from "./cometchat-conversation-list/cometchat-conversation-list.component";
import { CometChatConversationListItem } from "../CometChat-conversation-list-item/cometchat-conversation-list-item.module";
import { CometChatConfirmDialogModule } from "../../Shared/CometChat-confirm-dialog/cometchat-confirm-dialog.module";

@NgModule({
  declarations: [CometChatConversationListComponent],
  imports: [
    CommonModule, 
    CometChatConversationListItem,
    CometChatConfirmDialogModule
  ],
  exports: [CometChatConversationListComponent],
})
export class CometChatConversationList {}
