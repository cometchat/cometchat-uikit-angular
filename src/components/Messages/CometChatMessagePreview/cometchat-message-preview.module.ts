import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatMessagePreviewComponent } from './cometchat-message-preview/cometchat-message-preview.component';


@NgModule({
  declarations: [CometChatMessagePreviewComponent],
  imports: [
    CommonModule,
  ],
  exports: [CometChatMessagePreviewComponent]
})
export class CometChatMessagePreview { }
