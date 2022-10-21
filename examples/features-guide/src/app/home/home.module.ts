import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CometChatConversationList, CometChatMessageList, CometChatConversationsWithMessages } from '@cometchat-pro/angular-ui-kit';
import { CustomEmptyStateComponent } from '../guides/custom-empty-state/custom-empty-state.component';
import { CustomErrorStateComponent } from '../guides/custom-error-state/custom-error-state.component';
import { CustomLoadingStateComponent } from '../guides/custom-loading-state/custom-loading-state.component';
import { MessageAlignmentComponent } from '../guides/message-alignment/message-alignment.component';
import { CustomSoundManagerComponent } from '../guides/custom-sound-manager/custom-sound-manager.component';
import { ExcludeMessageTypesComponent } from '../guides/exclude-message-types/exclude-message-types.component';
import { ExcludeMessageOptionsComponent } from '../guides/exclude-message-options/exclude-message-options.component';
import { CustomMessageBubbleComponent } from '../guides/custom-message-bubble/custom-message-bubble.component';
import { CustomMessageOptionsComponent } from '../guides/custom-message-options/custom-message-options.component';
import { CustomMessageTypesComponent } from '../guides/custom-message-types/custom-message-types.component';
import {CometChatMessages} from '@cometchat-pro/angular-ui-kit'
import { MessageThemeComponent } from '../guides/message-theme/message-theme.component';
import { PredefinedMessageOptionsComponent } from '../guides/predefined-message-options/predefined-message-options.component';
@NgModule({
  declarations: [
    HomeComponent,
    CustomEmptyStateComponent,
    CustomErrorStateComponent,
    CustomLoadingStateComponent,
    MessageAlignmentComponent,
    CustomSoundManagerComponent,
    ExcludeMessageTypesComponent,
    ExcludeMessageOptionsComponent,
    CustomMessageBubbleComponent,
    CustomMessageOptionsComponent,
    CustomMessageTypesComponent,
    MessageThemeComponent,
    PredefinedMessageOptionsComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatConversationList,
    CometChatMessageList,
    CometChatMessages,
    CometChatConversationsWithMessages
    
  ],
  exports: [HomeComponent],
  providers: [],
  bootstrap: [HomeComponent]
})
export class HomeModule { }
