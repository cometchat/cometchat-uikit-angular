import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageComposerComponent } from "./cometchat-message-composer/cometchat-message-composer.component";
import { CometChatSmartReplyPreview } from "../Extensions/CometChat-smart-reply-preview/cometchat-smart-reply-preview.module";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { CometChatStickerKeyboard } from "../CometChat-sticker-keyboard/cometchat-sticker-keyboard.module";
import { CometChatCreatePoll } from "../Extensions/CometChat-create-poll/cometchat-create-poll.module";
@NgModule({
  declarations: [CometChatMessageComposerComponent],
  imports: [
    CommonModule,
    CometChatSmartReplyPreview,
    PickerModule,
    CometChatStickerKeyboard,
    CometChatCreatePoll,
  ],
  exports: [CometChatMessageComposerComponent],
})
export class CometChatMessageComposer {}
