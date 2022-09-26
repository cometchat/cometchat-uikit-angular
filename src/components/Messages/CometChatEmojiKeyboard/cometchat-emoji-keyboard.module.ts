import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatEmojiKeyboardComponent } from "./cometchat-emoji-keyboard/cometchat-emoji-keyboard.component";

import { CometChatListItem } from "../../Shared";
@NgModule({
  declarations: [CometChatEmojiKeyboardComponent],
  imports: [
    CommonModule,
    CometChatListItem
  ],
  exports: [CometChatEmojiKeyboardComponent]
})
export class CometChatEmojiKeyboard {}