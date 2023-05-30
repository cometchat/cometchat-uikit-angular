import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatAddMembersComponent } from "./cometchat-add-members/cometchat-add-members.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../CometChatMessageHeader/cometchat-message-header.module";
import { CometChatUsers } from "../CometChatUsers/cometchat-users.module";
import 'my-cstom-package-lit'
@NgModule({
  declarations: [CometChatAddMembersComponent],
  imports: [CommonModule,FormsModule,CometChatMessageHeader,CometChatUsers],
  exports: [CometChatAddMembersComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatAddMembers {}
