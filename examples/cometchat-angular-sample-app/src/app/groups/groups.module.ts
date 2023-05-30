import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { GroupsComponent } from './groups.component';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CreateGroupDemoComponent } from './create-group-demo/create-group-demo.component';
import { JoinGroupDemoComponent } from './join-group-demo/join-group-demo.component';
import { GroupMembersDemoComponent } from './group-members-demo/group-members-demo.component';
import { CometChatAddMembers, CometChatBannedMembers, CometChatDetails, CometChatGroupMembers, CometChatTransferOwnership } from '@cometchat-pro/angular-ui-kit';
import { AddMembersDemoComponent } from './add-members-demo/add-members-democomponent';
import { TransferOwnershipDemoComponent } from './transfer-ownership-demo/transfer-ownership-demo.component';
import { BannedMembersDemoComponent } from './banned-members-demo/banned-members-demo.component';

@NgModule({
  declarations: [
    GroupsComponent,
    CreateGroupDemoComponent,
    JoinGroupDemoComponent,
    GroupMembersDemoComponent,
    AddMembersDemoComponent,
    TransferOwnershipDemoComponent,
    BannedMembersDemoComponent,  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatGroupMembers,
    CometChatAddMembers,
    CometChatTransferOwnership,
    CometChatBannedMembers,
    CometChatDetails
  ],
  providers: [],
  bootstrap: [GroupsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class GroupsModule { }
