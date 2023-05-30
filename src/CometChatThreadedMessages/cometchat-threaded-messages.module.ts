import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatThreadedMessagesComponent } from "./cometchat-threaded-messages/cometchat-threaded-messages.component";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChatMessageList/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChatMessageComposer/cometchat-message-composer.module";
import 'my-cstom-package-lit'

@NgModule({
  declarations: [CometChatThreadedMessagesComponent],
  imports: [
    CommonModule,
   CometChatMessageHeader,
   CometChatMessageList,
   CometChatMessageComposer,
  ],
  exports: [CometChatThreadedMessagesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatThreadedMessages {}
