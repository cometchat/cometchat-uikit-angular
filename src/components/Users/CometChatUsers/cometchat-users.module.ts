import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUsersComponent } from "./cometchat-users/cometchat-users.component";
import { CometChatListBase } from "../../Shared/UtilityComponents/CometChatListBase/cometchat-list-base.module";
import { CometChatThemeWrapper } from "../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.module";
import { CometChatUserList } from "../CometChatUserList/cometchat-user-list.module";
@NgModule({
  declarations: [CometChatUsersComponent],
  imports: [
    CommonModule,
    CometChatListBase,
    CometChatUserList,
    CometChatThemeWrapper
  ],
  exports: [CometChatUsersComponent],
})
export class CometChatUsers {}
