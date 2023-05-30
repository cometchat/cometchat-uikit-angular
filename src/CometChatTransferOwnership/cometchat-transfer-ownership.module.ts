import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatTransferOwnershipComponent } from "./cometchat-transfer-ownership/cometchat-transfer-ownership.component";
import { FormsModule } from "@angular/forms";
import { CometChatGroupMembers } from "../CometChatGroupMembers/cometchat-group-members.module";
@NgModule({
  declarations: [CometChatTransferOwnershipComponent],
  imports: [CommonModule,FormsModule,CometChatGroupMembers],
  exports: [CometChatTransferOwnershipComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatTransferOwnership {}
