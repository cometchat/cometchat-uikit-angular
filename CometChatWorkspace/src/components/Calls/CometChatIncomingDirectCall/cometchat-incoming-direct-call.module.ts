import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatIncomingDirectCallComponent } from "./cometchat-incoming-direct-call/cometchat-incoming-direct-call.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";

@NgModule({
  declarations: [CometChatIncomingDirectCallComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatIncomingDirectCallComponent],
})
export class CometChatIncomingDirectCall {}
