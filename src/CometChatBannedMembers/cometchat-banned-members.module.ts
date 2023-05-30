import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatBannedMembersComponent } from "./cometchat-banned-members/cometchat-banned-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import 'my-cstom-package-lit'
import { CometChatList } from "../CometChatList/cometchat-list.module";
@NgModule({
  declarations: [CometChatBannedMembersComponent],
  imports: [CommonModule,FormsModule,CometChatMessageHeader,CometChatUsers,CometChatList],
  exports: [CometChatBannedMembersComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatBannedMembers {}
