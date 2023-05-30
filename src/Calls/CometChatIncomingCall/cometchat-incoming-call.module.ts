import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatIncomingCallComponent } from "./cometchat-incoming-call/cometchat-incoming-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import  "my-cstom-package-lit";
import { CometChatOngoingCall } from "../CometChatOngoingCall/cometchat-ongoing-call.module";
@NgModule({
  declarations: [CometChatIncomingCallComponent],
  imports: [
    CommonModule,
CometChatList,
CometChatOngoingCall
  ],
  exports: [CometChatIncomingCallComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatIncomingCall {}
