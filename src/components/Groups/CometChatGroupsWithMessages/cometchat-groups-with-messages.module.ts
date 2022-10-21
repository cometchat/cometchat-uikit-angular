import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatGroupsWithMessagesComponent } from "./cometchat-groups-with-messages/cometchat-groups-with-messages.component";
import { CometChatGroups } from "../CometChatGroups/cometchat-groups.module";
import { CometChatMessages } from "../../Messages/CometChatMessages/cometchat-messages.module";
import { CometChatJoinProtectedGroup } from "../CometChatJoinProtectedGroup/cometchat-join-protected-group.module";
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";
@NgModule({
  declarations: [CometChatGroupsWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatGroups,
    CometChatMessages,
    BrowserModule,
    BrowserAnimationsModule,
    CometChatJoinProtectedGroup,
    CometChatDecoratorMessage
  ],
  exports: [CometChatGroupsWithMessagesComponent],
})
export class CometChatGroupsWithMessages {}
