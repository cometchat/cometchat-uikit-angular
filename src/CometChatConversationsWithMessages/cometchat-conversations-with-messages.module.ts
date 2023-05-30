import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatConversationsWithMessagesComponent } from "./cometchat-conversations-with-messages/cometchat-conversations-with-messages.component";
import { CometChatConversations } from "../CometChatConversations/cometchat-conversations.module";
import { CometChatMessages } from "../CometChatMessages/cometchat-messages.module";

@NgModule({
  declarations: [CometChatConversationsWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatConversations,
    CometChatMessages,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  exports: [CometChatConversationsWithMessagesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatConversationsWithMessages {}
