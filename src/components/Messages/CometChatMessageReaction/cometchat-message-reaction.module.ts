import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatMessageReactionComponent } from './cometchat-message-reaction/cometchat-message-reaction.component';
import { CometChatListItem } from '../../Shared/UtilityComponents/CometChatListItem/cometchat-list-item.module';
import { CometChatPopover } from '../../Shared/UtilityComponents/CometChatPopover/cometchat-popover.module';
import { CometChatEmojiKeyboard } from '../CometChatEmojiKeyboard/cometchat-emoji-keyboard.module';


@NgModule({
  declarations: [CometChatMessageReactionComponent],
  imports: [
    CommonModule,
    CometChatListItem,
    CometChatEmojiKeyboard,
    CometChatPopover
  ],
  exports: [CometChatMessageReactionComponent]
})
export class CometChatMessageReaction { }
