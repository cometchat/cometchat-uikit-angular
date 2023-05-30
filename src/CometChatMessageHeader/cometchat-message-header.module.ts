import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageHeaderComponent } from "./cometchat-message-header/cometchat-message-header.component";

import { DatePipe } from "@angular/common";

import 'my-cstom-package-lit'
@NgModule({
  declarations: [CometChatMessageHeaderComponent],
  imports: [
    CommonModule,

  ],
  exports: [CometChatMessageHeaderComponent],
  providers: [DatePipe],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CometChatMessageHeader {}