import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { UsersComponent } from './users.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserDataitemDemoComponent } from './user-dataitem-demo/user-dataitem-demo.component';
import { CometChatDataItem } from '@cometchat-pro/angular-ui-kit';
@NgModule({
  declarations: [
    UsersComponent,
    UserDataitemDemoComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatDataItem
  ],
  providers: [],
  bootstrap: [UsersComponent]
})
export class UsersModule { }
