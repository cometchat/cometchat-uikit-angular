import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCreateGroupComponent } from "./cometchat-create-group/cometchat-create-group.component";
import { CometChatBackdrop } from "../../Shared";
import { CometChatListBase } from "../../Shared";
import { FormsModule } from '@angular/forms';
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";

@NgModule({
  declarations: [CometChatCreateGroupComponent],
  imports: [CommonModule, CometChatBackdrop,CometChatListBase,FormsModule,CometChatDecoratorMessage],
  exports: [CometChatCreateGroupComponent],
})
export class CometChatCreateGroup {}
