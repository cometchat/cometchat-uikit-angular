import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageHeaderComponent } from "./cometchat-message-header/cometchat-message-header.component"; 
import { CometChatAvatar } from "../../Shared/SecondaryComponents/CometChatAvatar/cometchat-avatar.module";
import { DatePipe } from "@angular/common";
import { CometChatDataItem } from "../../Shared/SDKDerivedComponents/CometChatDataItem/cometchat-data-item.module";
@NgModule({
  declarations: [CometChatMessageHeaderComponent],
  imports: [
    CommonModule,
    CometChatAvatar,
    CometChatDataItem
  ],
  exports: [CometChatMessageHeaderComponent],
  providers: [DatePipe],
})
export class CometChatMessageHeader {}