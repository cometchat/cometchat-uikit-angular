import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ChatsComponent } from './chats.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ConversationListitemDemoComponent } from './conversation-listitem-demo/conversation-listitem-demo.component';
import { CometChatConversationListItem } from '@cometchat-pro/angular-ui-kit';
@NgModule({
  declarations: [
    ChatsComponent,
    ConversationListitemDemoComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatConversationListItem
  ],
  providers: [],
  bootstrap: [ChatsComponent]
})
export class ChatsModule { }
