import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatListBaseComponent } from "./cometchat-list-base/cometchat-list-base.component";
import { CometChatConversationListItem } from "../../SDKDerivedComponents/CometChatConversationListItem/cometchat-conversation-list-item.module";
import { CometChatConversationList } from "../../../Chats/CometChatConversationList/cometchat-conversation-list.module";
@NgModule({
  declarations: [CometChatListBaseComponent],
  imports: [CommonModule,CometChatConversationListItem,CometChatConversationList],
  exports: [CometChatListBaseComponent],
})
export class CometChatListBase {}
