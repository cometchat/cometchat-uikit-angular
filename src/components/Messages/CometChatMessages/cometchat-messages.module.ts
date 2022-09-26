import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessagesComponent } from "./cometchat-messages/cometchat-messages.component";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChatMessageList/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChatMessageComposer/cometchat-message-composer.module";
import { CometChatLiveReactions } from "../CometChatLiveReactions/cometchat-live-reactions.module";

@NgModule({
  declarations: [CometChatMessagesComponent],
  imports: [
    CommonModule,
    CometChatMessageHeader,
    CometChatMessageComposer,
    CometChatMessageList,
    CometChatLiveReactions,
  ],
  exports: [CometChatMessagesComponent],
})
export class CometChatMessages {}
