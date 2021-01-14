import { Component, OnInit } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatManager } from "../../../utils/controller";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-user-profile",
  templateUrl: "./cometchat-user-profile.component.html",
  styleUrls: ["./cometchat-user-profile.component.css"],
})
export class CometChatUserProfileComponent implements OnInit {
  user;
  name: string;

  MORE: String = STRING_MESSAGES.MORE;
  ONLINE: String = STRING_MESSAGES.ONLINE;
  PREFERENCES: String = STRING_MESSAGES.PREFERENCES;
  NOTIFICATIONS: String = STRING_MESSAGES.NOTIFICATIONS;
  PRIVACY_AND_SECURITY: String = STRING_MESSAGES.PRIVACY_AND_SECURITY;
  CHATS: String = STRING_MESSAGES.CHATS;
  OTHER: String = STRING_MESSAGES.OTHER;
  HELP: String = STRING_MESSAGES.HELP;
  REPORT_PROBLEM: String = STRING_MESSAGES.REPORT_PROBLEM;

  constructor() {}

  ngOnInit() {
    this.getProfile();
  }

  getProfile() {
    new CometChatManager()
      .getLoggedInUser()
      .then((user) => {
        this.user = user;
        this.name = this.user.name;
      })
      .catch((error) => {
        console.log(
          "[CometChatUserInfoScreen] getProfile getLoggedInUser error",
          error
        );
      });
  }
}
