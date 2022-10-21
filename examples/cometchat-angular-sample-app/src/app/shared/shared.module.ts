import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SharedComponent } from './shared.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CometChatDataItemDemoComponent } from './cometchat-data-item-demo/cometchat-data-item-demo.component';
import { CometChatAvatarDemoComponent } from './cometchat-avatar-demo/cometchat-avatar-demo.component';
import { CometChatBadgeCountComponent } from './cometchat-badge-count-demo/cometchat-badge-count-demo.component';
import { CometChatLocalizeDemoComponent } from './cometchat-localize-demo/cometchat-localize-demo.component';
import { CometChatThemeDemoComponent } from './cometchat-theme-demo/cometchat-theme-demo.component';
import { CometChatStatusIndicatorDemoComponent } from './cometchat-status-indicator-demo/cometchat-status-indicator-demo.component';
import { CometChatMessageReceiptDemoComponent } from './cometchat-message-receipt-demo/cometchat-message-receipt-demo.component';
import { CometChatConversationListItemDemoComponent } from './cometchat-conversation-list-item-demo/cometchat-conversation-list-item-demo.component';
import { CometChatSoundManagerDemoComponent } from './cometchat-sound-manager-demo/cometchat-sound-manager-demo.component';
import { CometChatAvatar, CometChatBadgeCount, CometChatDataItem, CometChatConversationListItem, CometChatConversationsWithMessages, CometChatConversation, CometChatUsersWithMessages, CometChatUserList, CometChatUsers, CometChatGroups, CometChatGroupsWithMessages, CometChatGroupList, CometChatMessages, CometChatMessageList, CometChatMessageHeader, CometChatMessageComposer, CometChatConversationList, CometChatStatusIndicator, CometChatBackdrop, CometChatMessageReceipt } from '@cometchat-pro/angular-ui-kit';
@NgModule({
  declarations: [
    SharedComponent,
    CometChatDataItemDemoComponent,
    CometChatAvatarDemoComponent,
    CometChatBadgeCountComponent,
    CometChatLocalizeDemoComponent,
    CometChatThemeDemoComponent,
    CometChatStatusIndicatorDemoComponent,
    CometChatMessageReceiptDemoComponent,
    CometChatConversationListItemDemoComponent,
    CometChatSoundManagerDemoComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatAvatar,
    CometChatBadgeCount,
    CometChatDataItem,
    BrowserAnimationsModule,
    CometChatConversationListItem,
    CometChatConversationsWithMessages,
    CometChatConversation,
    CometChatUsersWithMessages,
    CometChatUserList,
    CometChatUsers,
    RouterModule,
    CometChatGroups,
    CometChatGroupsWithMessages,
    CometChatGroupList,
    CometChatMessages,
    CometChatMessageList,
    CometChatMessageHeader,
    CometChatMessageComposer,
    CometChatConversationList,
    CometChatConversationListItem,
    CometChatStatusIndicator,
    CometChatBackdrop,
    CometChatMessageReceipt,
  ],
  providers: [],
  bootstrap: [SharedComponent]
})
export class SharedModule { }
