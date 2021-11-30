import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessagesComponent } from "./cometchat-messages/cometchat-messages.component";
import { CometChatMessageHeader } from "../CometChat-message-header/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChat-message-list/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChat-message-composer/cometchat-message-composer.module";
import { CometChatLiveReactions } from "../CometChat-live-reactions/cometchat-live-reactions.module";

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
