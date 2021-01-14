import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatOutgoingCallComponent } from "./cometchat-outgoing-call/cometchat-outgoing-call.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatOutgoingCallComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatOutgoingCallComponent],
})
export class CometChatOutgoingCall {}
