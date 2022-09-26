import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatDividerComponent } from './cometchat-divider/cometchat-divider.component';

@NgModule({
  declarations: [CometChatDividerComponent],
  imports: [
    CommonModule,
  ],
  exports: [CometChatDividerComponent]
})
export class CometChatDivider { }
