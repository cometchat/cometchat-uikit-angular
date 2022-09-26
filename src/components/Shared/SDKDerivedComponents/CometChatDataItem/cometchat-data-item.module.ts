import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatDataItemComponent } from "./cometchat-data-item/cometchat-data-item.component";
import { CometChatAvatar } from "../../SecondaryComponents/CometChatAvatar/cometchat-avatar.module";
import { CometChatStatusIndicator } from "../../SecondaryComponents/CometChatStatusIndicator/cometchat-status-indicator.module";
@NgModule({
  declarations: [CometChatDataItemComponent],
  imports: [CommonModule,CometChatAvatar,CometChatStatusIndicator],
  exports: [CometChatDataItemComponent],
})
export class CometChatDataItem {}
