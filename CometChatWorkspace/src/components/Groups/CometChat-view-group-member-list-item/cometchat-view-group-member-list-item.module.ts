import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatViewGroupMemberListItemComponent } from "./cometchat-view-group-member-list-item/cometchat-view-group-member-list-item.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatViewGroupMemberListItemComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatViewGroupMemberListItemComponent],
})
export class CometChatViewGroupMemberListItem {}
