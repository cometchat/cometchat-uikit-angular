import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMenuListComponent } from "./cometchat-menu-list/cometchat-menu-list.component";
import { CometChatListItem } from "../CometChatListItem/cometchat-list-item.module";
@NgModule({
  declarations: [CometChatMenuListComponent],
  imports: [CommonModule, CometChatListItem],
  exports: [CometChatMenuListComponent],
})
export class CometChatMenuList { }
