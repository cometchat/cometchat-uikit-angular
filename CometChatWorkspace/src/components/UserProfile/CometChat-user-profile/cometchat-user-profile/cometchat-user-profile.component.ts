import { Component, EventEmitter, OnInit, Output } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
import * as enums from '../../../../utils/enums'
@Component({
  selector: "cometchat-user-profile",
  templateUrl: "./cometchat-user-profile.component.html",
  styleUrls: ["./cometchat-user-profile.component.css"],
})
export class CometChatUserProfileComponent implements OnInit {
  msgListenerId = enums.MESSAGE_ + new Date().getTime();


  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  user: any;
  name: any;

  MORE: String = COMETCHAT_CONSTANTS.MORE;
  ONLINE: String = COMETCHAT_CONSTANTS.ONLINE;
  PREFERENCES: String = COMETCHAT_CONSTANTS.PREFERENCES;
  NOTIFICATIONS: String = COMETCHAT_CONSTANTS.NOTIFICATIONS;
  PRIVACY_AND_SECURITY: String = COMETCHAT_CONSTANTS.PRIVACY_AND_SECURITY;
  CHATS: String = COMETCHAT_CONSTANTS.CHATS;
  OTHER: String = COMETCHAT_CONSTANTS.OTHER;
  HELP: String = COMETCHAT_CONSTANTS.HELP;
  REPORT_PROBLEM: String = COMETCHAT_CONSTANTS.REPORT_PROBLEM;

  constructor() {}

  ngOnInit() {
    try {
      this.getProfile();
    } catch (error) {
      logger(error);
    }
    CometChat.addMessageListener(
      this.msgListenerId,
      new CometChat.MessageListener({
        onCustomMessageReceived: (customMessage: any) => {
          if(customMessage.type == enums.CALL_TYPE_DIRECT){
        
            this.actionGenerated.emit({
              type:enums.CALL_TYPE_DIRECT,
              payLoad:customMessage
            })
          }
          // this.messageUpdated(enums.CUSTOM_MESSAGE_RECEIVED, customMessage);
        },
     
      })
    );
  }

  /**
   * Get Info Of LoggedIn User
   */
  getProfile() {
    try {
      CometChat.getLoggedinUser()
        .then((user) => {
          this.user = user;
          this.name = this.user.name;
        })
        .catch((error) => {
          logger(
            "[CometChatUserInfoScreen] getProfile getLoggedInUser error",
            error
          );
        });
    } catch (error) {
      logger(error);
    }
  }
}
