import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUserListComponent } from "./cometchat-user-list/cometchat-user-list.component";
import { CometChatDataItem } from "../../Shared/SDKDerivedComponents/CometChatDataItem/cometchat-data-item.module";
@NgModule({
  declarations: [CometChatUserListComponent],
  imports: [
    CommonModule, 
    CometChatDataItem
  ],
  exports: [CometChatUserListComponent],
})
export class CometChatUserList {}
