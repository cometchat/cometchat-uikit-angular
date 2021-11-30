import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatAddGroupMemberListItemComponent } from "./cometchat-add-group-member-list-item/cometchat-add-group-member-list-item.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatAddGroupMemberListItemComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatAddGroupMemberListItemComponent],
})
export class CometChatAddGroupMemberListItem {}
