import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { SharedComponent } from './shared.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AvatarDemoComponent } from './avatar-demo/avatar-demo.component';
import { BadgeComponent } from './badge-demo/badge-demo.component';
import { LocalizeDemoComponent } from './localize-demo/localize-demo.component';
import { ThemeDemoComponent } from './theme-demo/theme-demo.component';
import { StatusIndicatorDemoComponent } from './status-indicator-demo/status-indicator-demo.component';
import { ReceiptDemoComponent } from './message-receipt-demo/message-receipt-demo.component';
import { ListItemDemoComponent } from './list-item-demo/list-item-demo.component';
import { SoundManagerDemoComponent } from './sound-manager-demo/sound-manager-demo.component';
import {  CometChatConversationsWithMessages, CometChatConversations, CometChatUsersWithMessages, CometChatUsers, CometChatGroups, CometChatGroupsWithMessages, CometChatMessages, CometChatMessageList, CometChatMessageHeader, CometChatMessageComposer, CometChatDetails } from '@cometchat-pro/angular-ui-kit';
import { TextBubbleDemoComponent } from './text-bubble-demo/text-bubble-demo.component';
import { AudioBubbleDemoComponent } from './audio-bubble-demo/audio-bubble-demo.component';
import { VideoBubbleDemoComponent } from './video-bubble-demo/video-bubble-demo.component';
import { FileBubbleDemoComponent } from './file-bubble-demo/file-bubble-demo.component';
import { ImageBubbleDemoComponent } from './image-bubble-demo/image-bubble-demo.component';
import { DetailsDemoComponent } from './details-demo/details-demo.component';
@NgModule({
  declarations: [
    SharedComponent,
    AvatarDemoComponent,
    BadgeComponent,
    LocalizeDemoComponent,
    ThemeDemoComponent,
    StatusIndicatorDemoComponent,
    ReceiptDemoComponent,
    ListItemDemoComponent,
    SoundManagerDemoComponent,
    TextBubbleDemoComponent,
    AudioBubbleDemoComponent,
    VideoBubbleDemoComponent,
    FileBubbleDemoComponent,
    ImageBubbleDemoComponent,
    DetailsDemoComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    BrowserAnimationsModule,
    CometChatConversationsWithMessages,
    CometChatConversations,
    CometChatUsersWithMessages,
    CometChatUsers,
    RouterModule,
    CometChatGroups,
    CometChatGroupsWithMessages,
    CometChatMessages,
    CometChatMessageList,
    CometChatMessageHeader,
    CometChatMessageComposer,
    CometChatDetails,
  ],
  providers: [],
  bootstrap: [SharedComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedModule { }
