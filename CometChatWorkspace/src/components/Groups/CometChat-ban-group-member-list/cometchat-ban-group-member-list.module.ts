import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatBanGroupMemberListComponent } from "./cometchat-ban-group-member-list/cometchat-ban-group-member-list.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatBanGroupMemberListComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatBanGroupMemberListComponent],
})
export class CometChatBanGroupMemberList {}
