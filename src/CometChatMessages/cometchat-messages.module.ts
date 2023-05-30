import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessagesComponent } from "./cometchat-messages/cometchat-messages.component";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatMessageList } from "../CometChatMessageList/cometchat-message-list.module";
import { CometChatMessageComposer } from "../CometChatMessageComposer/cometchat-message-composer.module";
import 'my-cstom-package-lit'
import { CometChatThreadedMessages } from "../CometChatThreadedMessages/cometchat-threaded-messages.module";
import { CometChatDetails } from "../CometChatDetails/cometchat-details.module";
import { CometChatCallButtons } from "../Calls/CometChatCallButtons/cometchat-call-buttons.module";

@NgModule({
  declarations: [CometChatMessagesComponent],
  imports: [
    CommonModule,
   CometChatMessageHeader,
   CometChatMessageList,
   CometChatMessageComposer,
   CometChatThreadedMessages,
   CometChatDetails,
   CometChatCallButtons
  ],
  exports: [CometChatMessagesComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatMessages {}
