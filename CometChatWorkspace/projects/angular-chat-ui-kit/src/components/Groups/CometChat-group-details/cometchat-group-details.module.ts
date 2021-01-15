import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupDetailsComponent } from "./cometchat-group-details/cometchat-group-details.component";
import { CometChatSharedMedia } from "../../Shared/CometChat-shared-media/cometchat-shared-media-view.module";
import { CometChatViewGroupMemberList } from "../CometChat-view-group-member-list/cometchat-view-group-member-list.module";
import { CometChatBanGroupMemberListItem } from "../CometChat-ban-group-member-list-item/cometchat-ban-group-member-list-item.module";
import { CometChatAddGroupMemberList } from "../CometChat-add-group-member-list/cometchat-add-group-member-list.module";

@NgModule({
  declarations: [CometChatGroupDetailsComponent],
  imports: [
    CommonModule,
    CometChatSharedMedia,
    CometChatViewGroupMemberList,
    CometChatBanGroupMemberListItem,
    CometChatAddGroupMemberList,
  ],
  exports: [CometChatGroupDetailsComponent],
})
export class CometChatGroupDetails {}
