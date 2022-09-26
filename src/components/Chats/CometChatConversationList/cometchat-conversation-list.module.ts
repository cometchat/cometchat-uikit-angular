import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationListComponent } from "./cometchat-conversation-list/cometchat-conversation-list.component";
import { CometChatConversationListItem } from "../../Shared/SDKDerivedComponents/CometChatConversationListItem/cometchat-conversation-list-item.module";
import { CometChatConfirmDialogModule } from "../../Shared/UtilityComponents/CometChatConfirmDialog/cometchat-confirm-dialog.module";
import { CometChatBackdrop } from "../../Shared/UtilityComponents/CometChatBackdrop/cometchat-backdrop.module";
import { CometChatPopover } from "../../Shared/UtilityComponents";
@NgModule({
  declarations: [CometChatConversationListComponent],
  imports: [
    CommonModule, 
    CometChatConversationListItem,
    CometChatConfirmDialogModule,
    CometChatBackdrop,
    CometChatPopover
  ],
  exports: [CometChatConversationListComponent],
})
export class CometChatConversationList {}
