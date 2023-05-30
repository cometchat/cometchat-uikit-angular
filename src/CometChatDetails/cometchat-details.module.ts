import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDetailsComponent } from "./cometchat-details/cometchat-details.component";
import { CometChatAddMembers } from "../CometChatAddMembers/cometchat-add-members.module";
import { CometChatBannedMembers } from "../CometChatBannedMembers/cometchat-banned-members.module";
import { CometChatGroupMembers } from "../CometChatGroupMembers/cometchat-group-members.module";
import { CometChatTransferOwnership } from "../CometChatTransferOwnership/cometchat-transfer-ownership.module";

@NgModule({
  declarations: [CometChatDetailsComponent],
  imports: [
    CommonModule,CometChatAddMembers,CometChatBannedMembers,CometChatGroupMembers,CometChatTransferOwnership
  ],
  exports: [CometChatDetailsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatDetails {}
