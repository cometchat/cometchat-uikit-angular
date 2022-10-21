import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CometChatConversationsWithMessages, CometChatConversationsWithMessagesComponent } from '@cometchat-pro/angular-ui-kit';
import { ChatsComponent } from './chats/chats.component';
import { ConversationListDemoComponent } from './chats/conversation-list-demo/conversation-list-demo.component';
import { ConversationListitemDemoComponent } from './chats/conversation-listitem-demo/conversation-listitem-demo.component';
import { ConversationsDemoComponent } from './chats/conversations-demo/conversations-demo.component';
import { ConversationsWithMessagesDemoComponent } from './chats/conversations-with-messages-demo/conversations-with-messages-demo.component';
import { GroupDataitemDemoComponent } from './groups/group-dataitem-demo/group-dataitem-demo.component';
import { GroupListDemoComponent } from './groups/group-list-demo/group-list-demo.component';
import { GroupsDemoComponent } from './groups/groups-demo/groups-demo.component';
import { GroupsWithMessagesDemoComponent } from './groups/groups-with-messages-demo/groups-with-messages-demo.component';
import { GroupsComponent } from './groups/groups.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { MessageComposerDemoComponent } from './messages/message-composer-demo/message-composer-demo.component';
import { MessageHeaderDemoComponent } from './messages/message-header-demo/message-header-demo.component';
import { MessageListDemoComponent } from './messages/message-list-demo/message-list-demo.component';
import { MessagesDemoComponent } from './messages/messages-demo/messages-demo.component';
import { MessagesComponent } from './messages/messages.component';
import { CometChatConversationListItemDemoComponent } from './shared/cometchat-conversation-list-item-demo/cometchat-conversation-list-item-demo.component';
import { CometChatDataItemDemoComponent } from './shared/cometchat-data-item-demo/cometchat-data-item-demo.component';
import { SharedComponent } from './shared/shared.component';
import { SharedModule } from './shared/shared.module';
import { SignUpComponent } from './sign-up/sign-up.component';
import { UserDataitemDemoComponent } from './users/user-dataitem-demo/user-dataitem-demo.component';
import { UserListDemoComponent } from './users/user-list-demo/user-list-demo.component';
import { UsersDemoComponent } from './users/users-demo/users-demo.component';
import { UsersWithMessagesDemoComponent } from './users/users-with-messages-demo/users-with-messages-demo.component';
import { UsersComponent } from './users/users.component';
const routes: Routes = [
  { path: '', redirectTo: "login", pathMatch: "full" },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'signup',
    component: SignUpComponent,
  },
  {
    path: 'home',
    component: HomeComponent,
    children:[
      {
        path : '',
        component: ChatsComponent},
      {
       path : 'shared-module',
       component: SharedComponent},
       {
        path : 'users-module',
        component: UsersComponent},
        {
          path : 'groups-module',
          component: GroupsComponent},
          {
            path : 'chats-module',
            component: ChatsComponent},
            {
              path : 'messages-module',
              component: MessagesComponent},
      ]
  },
  {
    path: 'conversations-with-messages',
    component: ConversationsWithMessagesDemoComponent,
  },
  {
    path: 'conversations',
    component: ConversationsDemoComponent,
  },
  {
    path: 'conversation-list',
    component: ConversationListDemoComponent,
  },
  {
    path: 'listitem',
    component: ConversationListitemDemoComponent,
  },
  {
    path: 'users-with-messages',
    component: UsersWithMessagesDemoComponent,
  },
  {
    path: 'user-list',
    component: UserListDemoComponent,
  },
  {
    path: 'user-dataitem',
    component: UserDataitemDemoComponent,
  },
  {
    path: 'users',
    component: UsersDemoComponent,
  },
  {
    path: 'groups-with-messages',
    component: GroupsWithMessagesDemoComponent,
  },
  {
    path: 'group-list',
    component: GroupListDemoComponent,
  },
  {
    path: 'groups',
    component: GroupsDemoComponent,
  },
  {
    path: 'group-dataitem',
    component: GroupDataitemDemoComponent,
  },
  {
    path: 'messages',
    component: MessagesDemoComponent,
  },
  {
    path: 'message-list',
    component: MessageListDemoComponent,
  },
  {
    path: 'message-header',
    component: MessageHeaderDemoComponent,
  },
  {
    path: 'message-composer',
    component: MessageComposerDemoComponent,
  },
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
