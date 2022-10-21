import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatStickerKeyboardComponent } from "./cometchat-sticker-keyboard/cometchat-sticker-keyboard.component"
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";

@NgModule({
  declarations: [CometChatStickerKeyboardComponent],
  imports: [
    CommonModule,
    CometChatDecoratorMessage
  ],
  exports: [CometChatStickerKeyboardComponent]
})
export class CometChatStickerKeyboard {}