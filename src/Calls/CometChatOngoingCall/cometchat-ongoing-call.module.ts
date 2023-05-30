import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatOngoingCallComponent } from "./cometchat-ongoing-call/cometchat-ongoing-call.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";

@NgModule({
  declarations: [CometChatOngoingCallComponent],
  imports: [
    CommonModule,
CometChatList,
  ],
  exports: [CometChatOngoingCallComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatOngoingCall {}
