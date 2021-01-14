import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatGroupWithMessagesComponent } from "./cometchat-group-with-messages/cometchat-group-with-messages.component";
import { CometChatGroupList } from "../CometChat-group-list/cometchat-group-list.module";
import { CometChatMessages } from "../../Messages/CometChat-messages/cometchat-messages.module";
import { CometChatMessageThread } from "../../Messages/CometChat-message-thread/cometchat-message-thread.module";

import { CometChatImageViewer } from "../../Messages/CometChat-image-viewer/cometchat-image-viewer.module";
import { CometChatGroupDetails } from "../CometChat-group-details/cometchat-group-details.module";
import { CometChatIncomingCall } from "../../Calls/CometChat-incoming-call/cometchat-incoming-call.module";
import { CometChatOutgoingCall } from "../../Calls/CometChat-outgoing-call/cometchat-outgoing-call.module";

@NgModule({
  declarations: [CometChatGroupWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatGroupList,
    CometChatMessages,
    CometChatMessageThread,
    CometChatGroupDetails,
    CometChatImageViewer,
    CometChatIncomingCall,
    CometChatOutgoingCall,
    BrowserModule,
    BrowserAnimationsModule,
  ],
  exports: [CometChatGroupWithMessagesComponent],
})
export class CometChatGroupWithMessages {}
