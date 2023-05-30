import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatTabsComponent } from './cometchat-tabs/cometchat-tabs.component';
import { CometChatConversationsWithMessages } from '../../../CometChatConversationsWithMessages/cometchat-conversations-with-messages.module';
import { CometChatGroupsWithMessages } from '../../../CometChatGroupsWithMessages/cometchat-groups-with-messages.module';
import { CometChatUsersWithMessages } from '../../../CometChatUsersWithMessages/cometchat-users-with-messages.module';
import { CometChatCallHistoryWithDetails } from '../../../Calls/CometChatCallHistoryWithDetails/cometchat-call-history-with-details.module';

@NgModule({
  declarations: [CometChatTabsComponent],
  imports: [
    CommonModule,
    CometChatConversationsWithMessages,
    CometChatUsersWithMessages,
    CometChatGroupsWithMessages,
    CometChatCallHistoryWithDetails
  ],
  exports: [CometChatTabsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatTabs { }
