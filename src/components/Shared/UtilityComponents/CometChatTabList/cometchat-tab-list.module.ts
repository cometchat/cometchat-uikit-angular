import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatTabListComponent } from './cometchat-tab-list/cometchat-tab-list.component';
import { CometChatListItem } from '../CometChatListItem/cometchat-list-item.module';

@NgModule({
  declarations: [CometChatTabListComponent],
  imports: [
    CommonModule,
    CometChatListItem
  ],
  exports: [CometChatTabListComponent]
})
export class CometChatTabList { }
