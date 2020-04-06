import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { CometchatComponent } from './cometchat/cometchat.component';
import { CometChatModule } from './cometchat/cometchat.module';
import { AvatarComponent } from './avatar/avatar.component';
import { ContactListComponent } from './user-list/contact-list.component';
import { UserViewComponent } from './user-view/user-view.component';
import { GroupViewComponent } from './group-view/group-view.component';
import { GroupListComponent } from './group-list/group-list.component';
import { ConversationsListComponent } from './conversations-list/conversations-list.component';
import { ConversationViewComponent } from './conversation-view/conversation-view.component';
import { BadgeComponent } from './badge/badge.component';
import { BottomNavigationComponent } from './bottom-navigation/bottom-navigation.component';
import { MessagesListComponent } from './messages-list/messages-list.component';
import { MessageBubbleComponent } from './message-bubble/message-bubble.component';
import { MessageComposerComponent } from './message-composer/message-composer.component';
import { ConversationScreenComponent } from './conversation-screen/conversation-screen.component';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';

import { SidebarComponent } from './sidebar/sidebar.component';
import { MediaMessageComposerComponent } from './media-message-composer/media-message-composer.component';

import { LoginComponentComponent } from './login-component/login-component.component';
import { ProfileItemComponent } from './profile-item/profile-item.component';
import { MediaMessageComposerPreviewComponent } from './media-message-composer-preview/media-message-composer-preview.component';
import { EntityDetailsComponentComponent } from './entity-details-component/entity-details-component.component';
import { CometchatEmbeddedComponent } from './cometchat-embedded/cometchat-embedded.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { GroupMemberListComponent } from './group-member-list/group-member-list.component';
import { CreateGroupScreenComponent } from './create-group-screen/create-group-screen.component';
import { PopUpWindowComponent } from './pop-up-window/pop-up-window.component'
import { FormsModule } from '@angular/forms';
import { AddMembersComponentComponent } from './add-members-component/add-members-component.component';
import { CometchatDockedComponent } from './cometchat-docked/cometchat-docked.component';
import { CallingScreenComponent } from './calling-screen/calling-screen.component';
import { FullScreenIframeComponent } from './full-screen-iframe/full-screen-iframe.component';
import { SafePipe } from './safe.pipe';
import { EmojiModule, EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { PickerModule, EmojiFrequentlyService, EmojiSearch } from '@ctrl/ngx-emoji-mart';
import { StatusIndicatorComponent } from './status-indicator/status-indicator.component';
import { CometchatAngularUiKitComponent } from './cometchat-angular-ui-kit.component';
import { ContactScreenComponent } from './contact-screen/contact-screen.component';
import { ConversationsScreenComponent } from './conversations-screen/conversations-screen.component';
import { GroupScreenComponent } from './group-screen/group-screen.component';

@NgModule({
  declarations: [
    AvatarComponent,
    ContactListComponent,
    UserViewComponent,
    GroupViewComponent,
    GroupListComponent,
    ConversationsListComponent,
    ConversationViewComponent,
    BadgeComponent,
    BottomNavigationComponent,
    MessagesListComponent,
    MessageBubbleComponent,
    MessageComposerComponent,
    ConversationScreenComponent,
    ConversationHeaderComponent,
    SidebarComponent,
    MediaMessageComposerComponent,
    LoginComponentComponent,
    ProfileItemComponent,
    MediaMessageComposerPreviewComponent,
    EntityDetailsComponentComponent,
    CometchatEmbeddedComponent,
    UserProfileComponent,
    GroupMemberListComponent,
    CreateGroupScreenComponent,
    PopUpWindowComponent,
    AddMembersComponentComponent,
    CometchatDockedComponent,
    CallingScreenComponent,
    FullScreenIframeComponent,
    SafePipe,
    StatusIndicatorComponent,
    CometchatAngularUiKitComponent,
    ContactScreenComponent,
    ConversationsScreenComponent,
    GroupScreenComponent
  ],
  imports: [
    BrowserModule,
    CometChatModule,
    FormsModule,
    EmojiModule,
    PickerModule
  ], exports: [AvatarComponent,
    ContactListComponent,
    UserViewComponent,
    GroupViewComponent,
    GroupListComponent,
    ConversationsListComponent,
    ConversationViewComponent,
    BadgeComponent,
    BottomNavigationComponent,
    MessagesListComponent,
    MessageBubbleComponent,
    MessageComposerComponent,
    ConversationScreenComponent,
    ConversationHeaderComponent,
    SidebarComponent,
    MediaMessageComposerComponent,
    LoginComponentComponent,
    ProfileItemComponent,
    MediaMessageComposerPreviewComponent,
    EntityDetailsComponentComponent,
    CometchatEmbeddedComponent,
    UserProfileComponent,
    GroupMemberListComponent,
    CreateGroupScreenComponent,
    PopUpWindowComponent,
    AddMembersComponentComponent,
    CometchatDockedComponent,
    CallingScreenComponent,
    FullScreenIframeComponent,
    SafePipe,
    StatusIndicatorComponent,
    CometchatAngularUiKitComponent,
    ContactScreenComponent,
    ConversationsScreenComponent,
    GroupScreenComponent
  ],
  providers: [EmojiFrequentlyService, EmojiService, EmojiSearch],
  bootstrap: [CometchatAngularUiKitComponent]
})
export class CometchatAngularUiKitModule {
}
