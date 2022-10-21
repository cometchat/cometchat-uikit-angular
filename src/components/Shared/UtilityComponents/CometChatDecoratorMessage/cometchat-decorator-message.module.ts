import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatDecoratorMessageComponent } from './cometchat-decorator-message/cometchat-decorator-message.component';

@NgModule({
  declarations: [CometChatDecoratorMessageComponent],
  imports: [
    CommonModule,
  ],
  exports: [CometChatDecoratorMessageComponent]
})
export class CometChatDecoratorMessage { }
