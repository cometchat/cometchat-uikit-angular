import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupMembersComponent } from "./cometchat-group-members/cometchat-group-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import 'my-cstom-package-lit'
import { CometChatList } from "../CometChatList/cometchat-list.module";
@NgModule({
  declarations: [CometChatGroupMembersComponent],
  imports: [CommonModule,FormsModule,CometChatMessageHeader,CometChatUsers,CometChatList],
  exports: [CometChatGroupMembersComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatGroupMembers {}
