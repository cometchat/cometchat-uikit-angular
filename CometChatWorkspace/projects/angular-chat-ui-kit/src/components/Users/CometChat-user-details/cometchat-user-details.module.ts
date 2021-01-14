import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUserDetailsComponent } from "./cometchat-user-details/cometchat-user-details.component";
import { CometChatSharedMedia } from "../../Shared/CometChat-shared-media/cometchat-shared-media-view.module";

@NgModule({
  declarations: [CometChatUserDetailsComponent],
  imports: [CommonModule, CometChatSharedMedia],
  exports: [CometChatUserDetailsComponent],
})
export class CometChatUserDetails {}
