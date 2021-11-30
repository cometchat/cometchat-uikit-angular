import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUserListComponent } from "./cometchat-user-list/cometchat-user-list.component";

import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatUserListComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatUserListComponent],
})
export class CometChatUserList {}
