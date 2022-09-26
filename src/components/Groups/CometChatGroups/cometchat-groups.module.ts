import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupsComponent } from "./cometchat-groups/cometchat-groups.component";
import { CometChatListBase } from "../../Shared/UtilityComponents/CometChatListBase/cometchat-list-base.module";
import { CometChatThemeWrapper } from "../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.module";
import { CometChatGroupList } from "../CometChatGroupList/cometchat-group-list.module";
import { CometChatCreateGroup } from "../CometChatCreateGroup/cometchat-create-group.module";
import { CometChatBackdrop } from "../../Shared";
import { CometChatPopover } from "../../Shared/UtilityComponents";
@NgModule({
  declarations: [CometChatGroupsComponent],
  imports: [
    CommonModule,
    CometChatListBase,
    CometChatGroupList,
    CometChatThemeWrapper,
    CometChatCreateGroup,
    CometChatBackdrop,
    CometChatPopover
  ],
  exports: [CometChatGroupsComponent],
})
export class CometChatGroups {}
