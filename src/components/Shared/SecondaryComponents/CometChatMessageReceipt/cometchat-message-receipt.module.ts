import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatMessageReceiptComponent } from "./cometchat-message-receipt/cometchat-message-receipt.component";
@NgModule({
  declarations: [CometChatMessageReceiptComponent],
  imports: [CommonModule],
  exports: [CometChatMessageReceiptComponent],
})
export class CometChatMessageReceipt { }
