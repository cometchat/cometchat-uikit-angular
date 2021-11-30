import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatViewGroupMemberListComponent } from "./cometchat-view-group-member-list/cometchat-view-group-member-list.component";
import { CometChatBackdrop } from "../../Shared/CometChat-backdrop/cometchat-backdrop.module";
import { CometChatViewGroupMemberListItem } from "../CometChat-view-group-member-list-item/cometchat-view-group-member-list-item.module";

@NgModule({
  declarations: [CometChatViewGroupMemberListComponent],
  imports: [CommonModule, CometChatBackdrop, CometChatViewGroupMemberListItem],
  exports: [CometChatViewGroupMemberListComponent],
})
export class CometChatViewGroupMemberList {}
