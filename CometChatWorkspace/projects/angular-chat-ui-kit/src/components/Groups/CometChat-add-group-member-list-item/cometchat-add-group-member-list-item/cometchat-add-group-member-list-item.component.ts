import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-add-group-member-list-item",
  templateUrl: "./cometchat-add-group-member-list-item.component.html",
  styleUrls: ["./cometchat-add-group-member-list-item.component.css"],
})
export class CometChatAddGroupMemberListItemComponent implements OnInit {
  @Input() item = null;
  @Input() type = null;
  @Input() user = null;
  @Input() members = null;

  checked: boolean = false;

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {
    try {
      this.checked = this.members.find(
        (member) => member.uid === this.user.uid
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * toggle the checkbox for each users , that is, to add them or not to add them in the group
   * @param Event event
   */
  handleCheck(event) {
    try {
      this.checked = !this.checked;

      this.actionGenerated.emit({
        type: enums.MEMBER_UPDATED,
        payLoad: { user: this.user, userState: this.checked },
      });
    } catch (error) {
      logger(error);
    }
  }
}
