import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupListComponent } from "./cometchat-group-list/cometchat-group-list.component";
import { CometChatDataItem } from "../../Shared/SDKDerivedComponents/CometChatDataItem/cometchat-data-item.module";
import { CometChatDecoratorMessage } from "../../Shared/UtilityComponents/CometChatDecoratorMessage/cometchat-decorator-message.module";

@NgModule({
  declarations: [CometChatGroupListComponent],
  imports: [CommonModule,CometChatDataItem,CometChatDecoratorMessage],
  exports: [CometChatGroupListComponent],
})
export class CometChatGroupList {}
