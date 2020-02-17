import { NgModule } from '@angular/core';
import { AvatarComponent } from './avatar/avatar.component';
import { ContactListComponent } from './contact-list/contact-list.component';
import { UserViewComponent } from './user-view/user-view.component';
import { GroupViewComponent } from './group-view/group-view.component';
import { GroupListComponent } from './group-list/group-list.component';
import { ConversationsListComponent } from './conversations-list/conversations-list.component';
import { ConversationViewComponent } from './conversation-view/conversation-view.component';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BadgecountComponent } from './badgecount/badgecount.component';
import { DemoUserViewComponent } from './demo-user-view/demo-user-view.component';
import { AppConversationScreenComponent } from './cometchat-conversation-list-screen/app-conversation-screen.component';
import { AppGroupScreenComponent } from './cometchat-group-list-screen/app-group-screen.component';
import { AppContactScreenComponent } from './cometchat-user-list-screen/app-contact-screen.component';
import { DetailInfoGroupComponent } from './detail-info-group/detail-info-group.component';



import { CometchatEmbededComponent } from './cometchat-embeded/cometchat-embeded.component';
import { StatusIndicatorComponent } from './status-indicator/status-indicator.component';
import { DetailInfoComponent } from './detail-info/detail-info.component';
import { MediaMessageComposerComponent } from './media-message-composer/media-message-composer.component';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { MessageListFooterComponent } from './message-list-footer/message-list-footer.component';
import { MessageListBodyComponent } from './message-list-body/message-list-body.component';
import { MessageListHeaderComponent } from './message-list-header/message-list-header.component';
import { MoreDetailsComponent } from './more-details/more-details.component';
import { GroupConversationDetailsComponent } from './group-conversation-details/group-conversation-details.component';
import { ConversationDetailsComponent } from './conversation-details/conversation-details.component';
import { MessageListComponent } from './message-list/message-list.component';
import { CallDetailsComponent } from './call-details/call-details.component';
import { MoreListComponent } from './more-list/more-list.component';
import { SearchComponent } from './search/search.component';
import { CallListComponent } from './call-list/call-list.component';
import { NavComponent } from './nav/nav.component';
import { SearchFilterPipe } from './search-filter.pipe';
import { LoaderComponent } from './loader/loader.component';



@NgModule({
  declarations: [
    ContactListComponent,
    UserViewComponent,
    AvatarComponent,
    GroupViewComponent,
    GroupListComponent,
    NavComponent,
    CallListComponent,
    SearchComponent,
    SearchFilterPipe,
    ConversationViewComponent,
    ConversationsListComponent,
    MessageListComponent,
    CallDetailsComponent,
    ConversationDetailsComponent,
    GroupConversationDetailsComponent,
    MoreListComponent,
    MoreDetailsComponent,
    MessageListHeaderComponent,
    MessageListBodyComponent,
    MessageListFooterComponent,
    MessageBubbleComponent,
    MediaMessageComposerComponent,
    DetailInfoComponent,
    StatusIndicatorComponent,
    CometchatEmbededComponent,
    DetailInfoGroupComponent,
    AppContactScreenComponent,
    AppGroupScreenComponent,
    AppConversationScreenComponent,
    DemoUserViewComponent,
    BadgecountComponent, LoaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    ContactListComponent,
    UserViewComponent,
    AvatarComponent,
    GroupViewComponent,
    GroupListComponent,
    NavComponent,
    CallListComponent,
    SearchComponent,
    SearchFilterPipe,
    ConversationViewComponent,
    ConversationsListComponent,
    MessageListComponent,
    CallDetailsComponent,
    ConversationDetailsComponent,
    GroupConversationDetailsComponent,
    MoreListComponent,
    MoreDetailsComponent,
    MessageListHeaderComponent,
    MessageListBodyComponent,
    MessageListFooterComponent,
    MessageBubbleComponent,
    MediaMessageComposerComponent,
    DetailInfoComponent,
    StatusIndicatorComponent,
    CometchatEmbededComponent,
    DetailInfoGroupComponent,
    AppContactScreenComponent,
    AppGroupScreenComponent,
    AppConversationScreenComponent,
    DemoUserViewComponent,
    BadgecountComponent,
    LoaderComponent
  ]
})
export class CometchatAngularUiKitModule { }
