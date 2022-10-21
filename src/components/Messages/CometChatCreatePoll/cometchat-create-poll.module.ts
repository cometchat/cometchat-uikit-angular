import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCreatePollComponent } from "./cometchat-create-poll/cometchat-create-poll.component";
import { CometChatBackdrop } from "../../Shared/UtilityComponents/CometChatBackdrop/cometchat-backdrop.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";

@NgModule({
  declarations: [CometChatCreatePollComponent],
  imports: [CommonModule, CometChatBackdrop, FormsModule, ReactiveFormsModule,CometChatDecoratorMessage],
  exports: [CometChatCreatePollComponent],
})
export class CometChatCreatePoll {}