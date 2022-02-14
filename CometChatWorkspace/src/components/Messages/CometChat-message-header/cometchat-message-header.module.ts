import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageHeaderComponent } from "./cometchat-message-header/cometchat-message-header.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { DatePipe } from "@angular/common";
import { CometChatOutgoingDirectCall } from "../../Calls/CometChatOutgoingDirectCall/cometchat-outgoing-direct-call.module";
import { CometChatIncomingDirectCall } from "../../Calls/CometChatIncomingDirectCall/cometchat-incoming-direct-call.module";

@NgModule({
  declarations: [CometChatMessageHeaderComponent],
  imports: [CommonModule, CometChatAvatar,CometChatOutgoingDirectCall,CometChatIncomingDirectCall],
  exports: [CometChatMessageHeaderComponent],
  providers: [DatePipe],
})
export class CometChatMessageHeader {}
