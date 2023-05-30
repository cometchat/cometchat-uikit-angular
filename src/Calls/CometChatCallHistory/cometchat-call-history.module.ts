import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatCallHistoryComponent } from "./cometchat-call-history/cometchat-call-history.component";
import { CometChatList } from "../../CometChatList/cometchat-list.module";
import  "my-cstom-package-lit";
@NgModule({
  declarations: [CometChatCallHistoryComponent],
  imports: [
    CommonModule,
CometChatList,
  ],
  exports: [CometChatCallHistoryComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatCallHistory {}
