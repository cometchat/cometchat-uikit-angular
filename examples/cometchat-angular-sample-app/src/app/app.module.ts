import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { CometChatAvatar, CometChatBackdrop, CometChatBadgeCount, CometChatConversation, CometChatConversationList, CometChatConversationListItem, CometChatConversationsWithMessages, CometChatDataItem, CometChatGroupList, CometChatGroups, CometChatGroupsWithMessages, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatMessageReceipt, CometChatMessages, CometChatStatusIndicator, CometChatUserList, CometChatUsers, CometChatUsersWithMessages } from '@cometchat-pro/angular-ui-kit';
import { SharedComponent } from './shared/shared.component';
import { ChatsComponent } from './chats/chats.component';
import { UsersComponent } from './users/users.component';
import { GroupsComponent } from './groups/groups.component';
import { MessagesComponent } from './messages/messages.component';
import { RouterModule } from '@angular/router';
import { CometChatThemeDemoComponent } from './shared/cometchat-theme-demo/cometchat-theme-demo.component';
import { CometChatLocalizeDemoComponent } from './shared/cometchat-localize-demo/cometchat-localize-demo.component';
import { CometChatSoundManagerDemoComponent } from './shared/cometchat-sound-manager-demo/cometchat-sound-manager-demo.component';
import { CometChatDataItemDemoComponent } from './shared/cometchat-data-item-demo/cometchat-data-item-demo.component';
import { CometChatConversationListItemDemoComponent } from './shared/cometchat-conversation-list-item-demo/cometchat-conversation-list-item-demo.component';
import { CometChatMessageReceiptDemoComponent } from './shared/cometchat-message-receipt-demo/cometchat-message-receipt-demo.component';
import { CometChatAvatarDemoComponent } from './shared/cometchat-avatar-demo/cometchat-avatar-demo.component';
import { CometChatBadgeCountComponent } from './shared/cometchat-badge-count-demo/cometchat-badge-count-demo.component';
import { CometChatStatusIndicatorDemoComponent } from './shared/cometchat-status-indicator-demo/cometchat-status-indicator-demo.component';
import { MessagesDemoComponent } from './messages/messages-demo/messages-demo.component';
import { GroupsDemoComponent } from './groups/groups-demo/groups-demo.component';
import { UsersDemoComponent } from './users/users-demo/users-demo.component';
import { HomeComponent } from './home/home.component';
import { ConversationsWithMessagesDemoComponent } from './chats/conversations-with-messages-demo/conversations-with-messages-demo.component';
import { ConversationsDemoComponent } from './chats/conversations-demo/conversations-demo.component';
import { ConversationListDemoComponent } from './chats/conversation-list-demo/conversation-list-demo.component';
import { UsersWithMessagesDemoComponent } from './users/users-with-messages-demo/users-with-messages-demo.component';
import { UserListDemoComponent } from './users/user-list-demo/user-list-demo.component';
import { GroupListDemoComponent } from './groups/group-list-demo/group-list-demo.component';
import { GroupsWithMessagesDemoComponent } from './groups/groups-with-messages-demo/groups-with-messages-demo.component';
import { MessageListDemoComponent } from './messages/message-list-demo/message-list-demo.component';
import { MessageComposerDemoComponent } from './messages/message-composer-demo/message-composer-demo.component';
import { MessageHeaderDemoComponent } from './messages/message-header-demo/message-header-demo.component';
import { SharedModule } from './shared/shared.module';
import { MessagesModule } from './messages/messages.module';
import { UsersModule } from './users/users.module';
import { ChatsModule } from './chats/chats.module';
import { GroupsModule } from './groups/groups.module';
import { HomeModule } from './home/home.module';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    SignUpComponent,
    MessagesDemoComponent,
    GroupsDemoComponent,
    UsersDemoComponent,
    ConversationsWithMessagesDemoComponent,
    ConversationsDemoComponent,
    ConversationListDemoComponent,
    UsersWithMessagesDemoComponent,
    UserListDemoComponent,
    GroupListDemoComponent,
    GroupsWithMessagesDemoComponent,
    MessageListDemoComponent,
    MessageComposerDemoComponent,
    MessageHeaderDemoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CometChatAvatar,
    CometChatBadgeCount,
    CometChatDataItem,
    BrowserAnimationsModule,
    CometChatConversationListItem,
    CometChatConversationsWithMessages,
    HomeModule,
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
    SharedModule,
    MessagesModule,
    UsersModule,
    ChatsModule,
    GroupsModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
