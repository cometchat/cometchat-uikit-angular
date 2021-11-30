import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatAddGroupMemberListComponent } from "./cometchat-add-group-member-list/cometchat-add-group-member-list.component";
import { CometChatBackdrop } from "../../Shared/CometChat-backdrop/cometchat-backdrop.module";
import { CometChatAddGroupMemberListItem } from "../CometChat-add-group-member-list-item/cometchat-add-group-member-list-item.module";

@NgModule({
  declarations: [CometChatAddGroupMemberListComponent],
  imports: [CommonModule, CometChatBackdrop, CometChatAddGroupMemberListItem],
  exports: [CometChatAddGroupMemberListComponent],
})
export class CometChatAddGroupMemberList {}
