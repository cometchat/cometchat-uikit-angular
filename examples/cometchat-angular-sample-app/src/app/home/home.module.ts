import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {CometChatIncomingCall} from '@cometchat-pro/angular-ui-kit'
@NgModule({
  declarations: [
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatIncomingCall
  ],
  providers: [],
  bootstrap: [HomeComponent]
})
export class HomeModule { }
