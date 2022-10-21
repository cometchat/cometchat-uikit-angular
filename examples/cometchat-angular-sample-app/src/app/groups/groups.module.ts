import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { GroupsComponent } from './groups.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GroupDataitemDemoComponent } from './group-dataitem-demo/group-dataitem-demo.component';
import { CometChatDataItem } from '@cometchat-pro/angular-ui-kit';
@NgModule({
  declarations: [
    GroupsComponent,
    GroupDataitemDemoComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatDataItem
  ],
  providers: [],
  bootstrap: [GroupsComponent]
})
export class GroupsModule { }
