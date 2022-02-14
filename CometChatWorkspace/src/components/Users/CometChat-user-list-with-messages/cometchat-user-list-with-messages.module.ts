import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { CometChatUserListWithMessagesComponent } from "./cometchat-user-list-with-messages/cometchat-user-list-with-messages.component";
import { CometChatUserList } from "../CometChat-user-list/cometchat-user-list.module";
import { CometChatMessages } from "../../Messages/CometChat-messages/cometchat-messages.module";
import { CometChatMessageThread } from "../../Messages/CometChat-message-thread/cometchat-message-thread.module";
import { CometChatImageViewer } from "../../Messages/CometChat-image-viewer/cometchat-image-viewer.module";
import { CometChatUserDetails } from "../CometChat-user-details/cometchat-user-details.module";
import { CometChatIncomingCall } from "../../Calls/CometChat-incoming-call/cometchat-incoming-call.module";
import { CometChatOutgoingCall } from "../../Calls/CometChat-outgoing-call/cometchat-outgoing-call.module";
import { CometChatOutgoingDirectCall } from "../../Calls/CometChatOutgoingDirectCall/cometchat-outgoing-direct-call.module";
import { CometChatIncomingDirectCall } from "../../Calls/CometChatIncomingDirectCall/cometchat-incoming-direct-call.module";
@NgModule({
  declarations: [CometChatUserListWithMessagesComponent],
  imports: [
    CommonModule,
    CometChatUserList,
    CometChatMessages,
    CometChatMessageThread,
    CometChatImageViewer,
    CometChatUserDetails,
    CometChatIncomingCall,
    CometChatOutgoingCall,
    BrowserModule,
    BrowserAnimationsModule,
    CometChatOutgoingDirectCall,
    CometChatIncomingDirectCall
  ],
  exports: [CometChatUserListWithMessagesComponent],
})
export class CometChatUserListWithMessages {}
