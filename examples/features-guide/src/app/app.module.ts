import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { CometChatAvatar, CometChatBackdrop, CometChatBadgeCount, CometChatConversation, CometChatConversationList, CometChatConversationListItem, CometChatConversationsWithMessages, CometChatDataItem, CometChatGroupList, CometChatGroups, CometChatGroupsWithMessages, CometChatMessageComposer, CometChatMessageHeader, CometChatMessageList, CometChatMessageReceipt, CometChatMessages, CometChatStatusIndicator, CometChatUserList, CometChatUsers, CometChatUsersWithMessages } from '@cometchat-pro/angular-ui-kit';
import { RouterModule } from '@angular/router';
import { HomeModule } from './home/home.module';
import { CustomMessageTypesComponent } from './guides/custom-message-types/custom-message-types.component';
import { CustomMessageOptionsComponent } from './guides/custom-message-options/custom-message-options.component';
import { CustomMessageBubbleComponent } from './guides/custom-message-bubble/custom-message-bubble.component';
import { ExcludeMessageTypesComponent } from './guides/exclude-message-types/exclude-message-types.component';
import { ExcludeMessageOptionsComponent } from './guides/exclude-message-options/exclude-message-options.component';
import { MessageThemeComponent } from './guides/message-theme/message-theme.component';
import { PredefinedMessageOptionsComponent } from './guides/predefined-message-options/predefined-message-options.component';
@NgModule({
  declarations: [
    AppComponent,
   

  ],
  imports: [
    BrowserModule,
    HomeModule,
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
    CometChatMessageHeader,
    CometChatMessageComposer,
    CometChatConversationList,
    CometChatConversationListItem,
    CometChatStatusIndicator,
    CometChatBackdrop,
    CometChatMessageReceipt,
    FormsModule,

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
