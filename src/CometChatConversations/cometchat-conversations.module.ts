import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationsComponent } from "./cometchat-conversations/cometchat-conversations.component";
import { CometChatList } from "../CometChatList/cometchat-list.module";
import 'my-cstom-package-lit'
@NgModule({
  declarations: [CometChatConversationsComponent],
  imports: [
    CommonModule,
    CometChatList
  ],
  exports: [CometChatConversationsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatConversations {}
