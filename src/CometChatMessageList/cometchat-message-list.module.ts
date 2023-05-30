import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageListComponent } from "./cometchat-message-list/cometchat-message-list.component";
import { DatePipe } from "@angular/common";

import 'my-cstom-package-lit'
import { CometChatMessageBubble } from "../CometChatMessageBubble/cometchat-message-bubble.module";
import { CometChatOngoingCall } from "../Calls/CometChatOngoingCall/cometchat-ongoing-call.module";
@NgModule({
  declarations: [CometChatMessageListComponent],
  imports: [
    CommonModule,
    CometChatMessageBubble,
    CometChatOngoingCall

  ],
  exports: [CometChatMessageListComponent],
  providers: [DatePipe],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatMessageList {}
