import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatCallHistoryWithDetailsComponent } from "./cometchat-call-history-with-details/cometchat-call-history-with-details.component";
import { CometChatCallHistory } from "../CometChatCallHistory/cometchat-call-history.module";
import { CometChatCallDetails } from "../CometChatCallDetails/cometchat-call-details.module";

@NgModule({
  declarations: [CometChatCallHistoryWithDetailsComponent],
  imports: [
    CommonModule,
    CometChatCallHistory,
    CometChatCallDetails,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  exports: [CometChatCallHistoryWithDetailsComponent],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatCallHistoryWithDetails {}
