import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCreatePollComponent } from "./cometchat-create-poll/cometchat-create-poll.component";
import { CometChatBackdrop } from "../../../Shared/CometChat-backdrop/cometchat-backdrop.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

@NgModule({
  declarations: [CometChatCreatePollComponent],
  imports: [CommonModule, CometChatBackdrop, FormsModule, ReactiveFormsModule],
  exports: [CometChatCreatePollComponent],
})
export class CometChatCreatePoll {}
