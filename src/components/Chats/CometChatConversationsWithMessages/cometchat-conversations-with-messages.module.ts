import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatConversationsWithMessagesComponent } from "./cometchat-conversations-with-messages/cometchat-conversations-with-messages.component";
import { CometChatConversation } from "../CometChatConversations/cometchat-conversations.module";
import { CometChatMessages } from "../../Messages/CometChatMessages/cometchat-messages.module";
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";

@NgModule({
  declarations: [CometChatConversationsWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatConversation,
    CometChatMessages,
    BrowserModule,
    BrowserAnimationsModule,
    CometChatDecoratorMessage
  ],
  exports: [CometChatConversationsWithMessagesComponent],
})
export class CometChatConversationsWithMessages {}
