import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatListItemComponent } from "./cometchat-list-item/cometchat-list-item.component";
@NgModule({
  declarations: [CometChatListItemComponent],
  imports: [CommonModule,],
  exports: [CometChatListItemComponent],
})
export class CometChatListItem { }
