import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatIncomingCallComponent } from "./cometchat-incoming-call/cometchat-incoming-call.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatIncomingCallComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatIncomingCallComponent],
})
export class CometChatIncomingCall {}
