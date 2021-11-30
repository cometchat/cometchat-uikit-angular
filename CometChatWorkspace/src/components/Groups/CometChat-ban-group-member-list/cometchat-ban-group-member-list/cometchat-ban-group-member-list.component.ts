import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import { BAN_ICON } from "./resources/banIcon";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-ban-group-member-list",
  templateUrl: "./cometchat-ban-group-member-list.component.html",
  styleUrls: ["./cometchat-ban-group-member-list.component.css"],
})
export class CometChatBanGroupMemberListComponent implements OnInit {
  @Input() item = null;
  @Input() member = null;
  @Input() loggedInUser = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  name: string;
  unban;
  banIcon = BAN_ICON;

  constructor() {}

  ngOnInit() {}

  /**
   * propagates and action to unaban the current member
   */
  unbanMember() {
    try {
      this.actionGenerated.emit({
        type: enums.UNBAN,
        payLoad: { member: this.member },
      });
    } catch (error) {
      logger(error);
    }
  }
}
