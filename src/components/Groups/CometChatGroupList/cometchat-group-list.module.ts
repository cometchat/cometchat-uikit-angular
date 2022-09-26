import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupListComponent } from "./cometchat-group-list/cometchat-group-list.component";
import { CometChatDataItem } from "../../Shared/SDKDerivedComponents/CometChatDataItem/cometchat-data-item.module";

@NgModule({
  declarations: [CometChatGroupListComponent],
  imports: [CommonModule,CometChatDataItem],
  exports: [CometChatGroupListComponent],
})
export class CometChatGroupList {}
