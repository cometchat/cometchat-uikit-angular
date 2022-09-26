import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageComposerComponent } from "./cometchat-message-composer/cometchat-message-composer.component";
import { CometChatActionSheet } from "../../Shared/UtilityComponents/CometChatActionSheet/cometchat-action-sheet.module";

import { CometChatEmojiKeyboard } from "../CometChatEmojiKeyboard/cometchat-emoji-keyboard.module";
import { CometChatStickerKeyboard } from "../CometChatStickerKeyboard/cometchat-sticker-keyboard.module";
import { CometChatMessagePreview } from "../CometChatMessagePreview/cometchat-message-preview.module";
import { FormsModule } from "@angular/forms";
import { CometChatPopover } from "../../Shared/UtilityComponents";
import { CometChatCreatePoll } from "../CometChatCreatePoll/cometchat-create-poll.module";
import { CometChatBackdrop } from "../../Shared";
@NgModule({
  declarations: [CometChatMessageComposerComponent],
  imports: [
    CommonModule,
    CometChatActionSheet,

    CometChatEmojiKeyboard,
    CometChatStickerKeyboard,
    CometChatMessagePreview,
    FormsModule,
    CometChatPopover,
    CometChatCreatePoll,
    CometChatBackdrop
  ],
  exports: [CometChatMessageComposerComponent],
})
export class CometChatMessageComposer {}