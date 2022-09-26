import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatActionSheetComponent } from "./cometchat-action-sheet/cometchat-action-sheet.component";
import { CometChatListItem } from "../../SecondaryComponents";

@NgModule({
  declarations: [CometChatActionSheetComponent],
  imports: [
    CommonModule,
    CometChatListItem
  ],
  exports: [CometChatActionSheetComponent],
})
export class CometChatActionSheet {}