import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { CometChatLiveReactionsComponent } from "./cometchat-live-reactions/cometchat-live-reactions.component";

@NgModule({
  declarations: [CometChatLiveReactionsComponent],
  imports: [CommonModule, BrowserModule, BrowserAnimationsModule],
  exports: [CometChatLiveReactionsComponent],
})
export class CometChatLiveReactions {}
