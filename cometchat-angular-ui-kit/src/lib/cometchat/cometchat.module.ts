import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CometchatComponent } from './cometchat.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    CometchatComponent
  ],
  exports: [
    CometchatComponent
  ],
  imports: [
    CommonModule, FormsModule
  ]
})
export class CometChatModule { }
