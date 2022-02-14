import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CometChatUIComponent } from "./cometchat-ui/cometchat-ui.component";
import { CometChatNavBar } from "../../UserProfile/CometChat-nav-bar/cometchat-nav-bar.module";
import { CometChatMessages } from "../../Messages/CometChat-messages/cometchat-messages.module";
import { CometChatUserDetails } from "../../Users/CometChat-user-details/cometchat-user-details.module";
import { CometChatMessageThread } from "../../Messages/CometChat-message-thread/cometchat-message-thread.module";
import { CometChatImageViewer } from "../../Messages/CometChat-image-viewer/cometchat-image-viewer.module";
import { CometChatGroupDetails } from "../../Groups/CometChat-group-details/cometchat-group-details.module";
import { CometChatIncomingCall } from "../../Calls/CometChat-incoming-call/cometchat-incoming-call.module";
import { CometChatOutgoingCall } from "../../Calls/CometChat-outgoing-call/cometchat-outgoing-call.module";
import { CometChatOutgoingDirectCall } from "../../Calls/CometChatOutgoingDirectCall/cometchat-outgoing-direct-call.module";
import { CometChatIncomingDirectCall } from "../../Calls/CometChatIncomingDirectCall/cometchat-incoming-direct-call.module";
@NgModule({
  declarations: [CometChatUIComponent],
  imports: [
    CommonModule,
    CometChatNavBar,
    CometChatMessages,
    CometChatUserDetails,
    CometChatMessageThread,
    CometChatImageViewer,
    CometChatGroupDetails,
    CometChatIncomingCall,
    CometChatOutgoingCall,
    CometChatOutgoingDirectCall,
    CometChatIncomingDirectCall
    
  ],
  exports: [CometChatUIComponent],
})
export class CometChatUI {}
