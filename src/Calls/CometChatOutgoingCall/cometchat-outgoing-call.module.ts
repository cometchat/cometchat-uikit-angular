import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatOutgoingCallComponent } from "./cometchat-outgoing-call/cometchat-outgoing-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import  "my-cstom-package-lit";
@NgModule({
  declarations: [CometChatOutgoingCallComponent],
  imports: [
    CommonModule,
CometChatList,
  ],
  exports: [CometChatOutgoingCallComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatOutgoingCall {}
