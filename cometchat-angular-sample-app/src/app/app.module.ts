import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login/login.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { CometChatConversations, CometChatConversationsWithMessages,  CometChatGroups, CometChatGroupsWithMessages, CometChatIncomingCall, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatMessages, CometChatUsers, CometChatUsersWithMessages } from '@cometchat-pro/angular-ui-kit';
import { RouterModule } from '@angular/router';
import { MessagesDemoComponent } from './messages/messages-demo/messages-demo.component';
import { GroupsDemoComponent } from './groups/groups-demo/groups-demo.component';
import { UsersDemoComponent } from './users/users-demo/users-demo.component';
import { ConversationsWithMessagesDemoComponent } from './chats/conversations-with-messages-demo/conversations-with-messages-demo.component';
import { ConversationsDemoComponent } from './chats/conversations-demo/conversations-demo.component';
import { UsersWithMessagesDemoComponent } from './users/users-with-messages-demo/users-with-messages-demo.component';
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
import { CallsModule } from './calls/calls.module';
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
    UsersWithMessagesDemoComponent,
    GroupsWithMessagesDemoComponent,
    MessageListDemoComponent,
    MessageComposerDemoComponent,
    MessageHeaderDemoComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CometChatConversationsWithMessages,
    CometChatConversations,
    HomeModule,
    CometChatUsersWithMessages,
    CometChatUsers,
    RouterModule,
    CometChatGroups,
    CometChatGroupsWithMessages,
    CometChatMessages,
    CometChatMessageList,
    CometChatMessageHeader,
    CometChatMessageComposer,
    SharedModule,
    MessagesModule,
    UsersModule,
    ChatsModule,
    GroupsModule,
    CallsModule,
    FormsModule,
    CometChatIncomingCall
  ],
  providers: [],
  bootstrap: [AppComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
