import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatSmartReplyComponent } from "./cometchat-smart-reply/cometchat-smart-reply.component";
import { CometChatListItem } from "../../Shared";
@NgModule({
  declarations: [CometChatSmartReplyComponent],
  imports: [CommonModule,CometChatListItem],
  exports: [CometChatSmartReplyComponent],
})
export class CometChatSmartReply{}
