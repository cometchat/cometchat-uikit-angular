import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatUsersWithMessagesComponent } from "./cometchat-users-with-messages/cometchat-users-with-messages.component";
import { CometChatMessages } from "../CometChatMessages/cometchat-messages.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";

@NgModule({
  declarations: [CometChatUsersWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatUsers,
    CometChatMessages,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  exports: [CometChatUsersWithMessagesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatUsersWithMessages {}
