import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationListItemComponent } from "./cometchat-conversation-list-item/cometchat-conversation-list-item.component";
import { CometChatBadgeCount } from "../../Shared/CometChat-badge-count/cometchat-badge-count.module";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatConversationListItemComponent],
  imports: [CommonModule, CometChatAvatar, CometChatBadgeCount],
  exports: [CometChatConversationListItemComponent],
})
export class CometChatConversationListItem {}
