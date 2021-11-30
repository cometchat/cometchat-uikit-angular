import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometChatConfirmDialogComponent } from './cometchat-confirm-dialog/cometchat-confirm-dialog.component';
import { CometChatBackdrop } from './../CometChat-backdrop/cometchat-backdrop.module';

@NgModule({
  declarations: [CometChatConfirmDialogComponent],
  imports: [
    CommonModule,
    CometChatBackdrop 
  ],
  exports: [CometChatConfirmDialogComponent]
})
export class CometChatConfirmDialogModule { }
