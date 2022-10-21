import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatUIComponent } from './cometchat-ui/cometchat-ui.component';
import { CometChatTabList } from '../Shared/UtilityComponents/CometChatTabList/cometchat-tab-list.module';
import { CometChatConversationsWithMessages } from '../Chats/CometChatConversationsWithMessages/cometchat-conversations-with-messages.module';
import { CometChatUsersWithMessages } from '../Users/CometChatUsersWithMessages/cometchat-users-with-messages.module';
import { CometChatGroupsWithMessages } from '../Groups/CometChatGroupsWithMessages/cometchat-groups-with-messages.module';

@NgModule({
  declarations: [CometChatUIComponent],
  imports: [
    CommonModule,
    CometChatTabList,
    CometChatConversationsWithMessages,
    CometChatUsersWithMessages,
    CometChatGroupsWithMessages
  ],
  exports: [CometChatUIComponent]
})
export class CometChatUI { }
