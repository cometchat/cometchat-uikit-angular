import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatConversationsComponent } from "./cometchat-conversations/cometchat-conversations.component";
import { CometChatConversationList } from "../CometChatConversationList/cometchat-conversation-list.module";
import { CometChatListBase } from "../../Shared/UtilityComponents/CometChatListBase/cometchat-list-base.module";
import { CometChatThemeWrapper } from "../../Shared/PrimaryComponents/CometChatTheme/CometChatThemeWrapper/cometchat-theme-wrapper.module";
@NgModule({
  declarations: [CometChatConversationsComponent],
  imports: [
    CommonModule,
    CometChatConversationList,
    CometChatListBase,
    CometChatThemeWrapper
  ],
  exports: [CometChatConversationsComponent],
})
export class CometChatConversation {}
