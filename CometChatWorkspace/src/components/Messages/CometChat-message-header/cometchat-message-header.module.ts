import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageHeaderComponent } from "./cometchat-message-header/cometchat-message-header.component";
import { CometChatAvatar } from "../../Shared/CometChat-avatar/cometchat-avatar.module";
import { DatePipe } from "@angular/common";

@NgModule({
  declarations: [CometChatMessageHeaderComponent],
  imports: [CommonModule, CometChatAvatar],
  exports: [CometChatMessageHeaderComponent],
  providers: [DatePipe],
})
export class CometChatMessageHeader {}
