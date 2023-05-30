import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallDetailsComponent } from "./cometchat-call-details/cometchat-call-details.component";
import { CometChatCallButtons } from "../CometChatCallButtons/cometchat-call-buttons.module";
import { CometChatList } from "../../CometChatList/cometchat-list.module";

@NgModule({
  declarations: [CometChatCallDetailsComponent],
  imports: [
    CommonModule,
    CometChatCallButtons,
    CometChatList
  ],
  exports: [CometChatCallDetailsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatCallDetails {}
