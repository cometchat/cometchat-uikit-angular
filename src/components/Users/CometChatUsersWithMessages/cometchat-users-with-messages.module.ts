import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatUsersWithMessagesComponent } from "./cometchat-users-with-messages/cometchat-users-with-messages.component";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import { CometChatMessages } from "../../Messages/CometChatMessages/cometchat-messages.module";

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
})
export class CometChatUsersWithMessages {}
