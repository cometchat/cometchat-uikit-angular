import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatGroupListComponent } from "./cometchat-group-list/cometchat-group-list.component";
import { CometChatGroupListItem } from "../CometChat-group-list-item/cometchat-group-list-item.module";
import { CometChatCreateGroup } from "../CometChat-create-group/cometchat-create-group.module";

@NgModule({
  declarations: [CometChatGroupListComponent],
  imports: [CommonModule, CometChatGroupListItem, CometChatCreateGroup],
  exports: [CometChatGroupListComponent],
})
export class CometChatGroupList {}
