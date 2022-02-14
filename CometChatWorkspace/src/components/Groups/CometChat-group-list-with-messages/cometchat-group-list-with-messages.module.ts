import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatGroupListWithMessagesComponent } from "./cometchat-group-list-with-messages/cometchat-group-list-with-messages.component";
import { CometChatGroupList } from "../CometChat-group-list/cometchat-group-list.module";
import { CometChatMessages } from "../../Messages/CometChat-messages/cometchat-messages.module";
import { CometChatMessageThread } from "../../Messages/CometChat-message-thread/cometchat-message-thread.module";
import { CometChatOutgoingDirectCall } from "../../Calls/CometChatOutgoingDirectCall/cometchat-outgoing-direct-call.module";
import { CometChatImageViewer } from "../../Messages/CometChat-image-viewer/cometchat-image-viewer.module";
import { CometChatGroupDetails } from "../CometChat-group-details/cometchat-group-details.module";
import { CometChatIncomingCall } from "../../Calls/CometChat-incoming-call/cometchat-incoming-call.module";
import { CometChatOutgoingCall } from "../../Calls/CometChat-outgoing-call/cometchat-outgoing-call.module";
import { CometChatIncomingDirectCall } from "../../Calls/CometChatIncomingDirectCall/cometchat-incoming-direct-call.module";

@NgModule({
  declarations: [CometChatGroupListWithMessagesComponent],
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
    CometChatOutgoingDirectCall,
    CometChatIncomingDirectCall
  ],
  exports: [CometChatGroupListWithMessagesComponent],
})
export class CometChatGroupListWithMessages {}
