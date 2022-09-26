import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatPopoverComponent } from './cometchat-popover/cometchat-popover.component';
import { CometChatBackdrop } from '../CometChatBackdrop/cometchat-backdrop.module';
@NgModule({
  declarations: [CometChatPopoverComponent],
  imports: [
    CommonModule,
    CometChatBackdrop
  ],
  exports: [CometChatPopoverComponent]
})
export class CometChatPopover { }
