import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatNavBarComponent } from "./cometchat-nav-bar/cometchat-nav-bar.component";
import { CometChatUserProfile } from "../CometChat-user-profile/cometchat-user-profile.module";
import { CometChatUserList } from "../../Users/CometChat-user-list/cometchat-user-list.module";
import { CometChatGroupList } from "../../Groups/CometChat-group-list/cometchat-group-list.module";
import { CometChatConversationList } from "../../Chats/CometChat-conversation-list/cometchat-conversation-list.module";
@NgModule({
  declarations: [CometChatNavBarComponent],
  imports: [
    CommonModule,
    CometChatUserProfile,
    CometChatUserList,
    CometChatGroupList,
    CometChatConversationList,
  ],
  exports: [CometChatNavBarComponent],
})
export class CometChatNavBar {}
