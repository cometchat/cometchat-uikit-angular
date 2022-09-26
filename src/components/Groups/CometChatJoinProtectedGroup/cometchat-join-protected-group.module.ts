import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatJoinProtectedGroupComponent } from "./cometchat-join-protected-group/cometchat-join-protected-group.component";
import { FormsModule } from "@angular/forms";
import { CometChatMessageHeader } from "../../Messages/CometChatMessageHeader/cometchat-message-header.module";
@NgModule({
  declarations: [CometChatJoinProtectedGroupComponent],
  imports: [CommonModule,FormsModule,CometChatMessageHeader],
  exports: [CometChatJoinProtectedGroupComponent],
})
export class CometChatJoinProtectedGroup {}
