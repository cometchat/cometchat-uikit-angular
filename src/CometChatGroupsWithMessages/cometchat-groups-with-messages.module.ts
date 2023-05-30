import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatGroupsWithMessagesComponent } from "./cometchat-groups-with-messages/cometchat-groups-with-messages.component";
import { CometChatMessages } from "../CometChatMessages/cometchat-messages.module";
import { CometChatGroups } from "../CometChatGroups/cometchat-groups.module";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";

@NgModule({
  declarations: [CometChatGroupsWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatGroups,
    CometChatMessages,
    BrowserModule,
    BrowserAnimationsModule,
    CometChatMessageHeader
  ],
  exports: [CometChatGroupsWithMessagesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatGroupsWithMessages {}
