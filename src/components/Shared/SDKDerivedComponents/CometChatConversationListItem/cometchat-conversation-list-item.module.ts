import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationListItemComponent } from "./cometchat-conversation-list-item/cometchat-conversation-list-item.component";
import { CometChatAvatar } from "../../SecondaryComponents/CometChatAvatar/cometchat-avatar.module";
import { CometChatBadgeCount } from "../../SecondaryComponents/CometChatBadgeCount/cometchat-badge-count.module";
import { CometChatStatusIndicator } from "../../SecondaryComponents/CometChatStatusIndicator/cometchat-status-indicator.module";
import { CometChatMessageReceipt } from "../../SecondaryComponents/CometChatMessageReceipt/cometchat-message-receipt.module";
import { CometChatMenuList } from "../../UtilityComponents/CometChatMenuList/cometchat-menu-list.module";
import { CometChatDate } from "../../SecondaryComponents/CometChatDate/cometchat-date.module";
@NgModule({
  declarations: [CometChatConversationListItemComponent],
  imports: [CommonModule, CometChatAvatar, CometChatBadgeCount,CometChatStatusIndicator,CometChatMessageReceipt,CometChatMenuList,CometChatDate],
  exports: [CometChatConversationListItemComponent],
})
export class CometChatConversationListItem {}
