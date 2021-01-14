import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../utils/enums";

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
    this.checked = this.members.find((member) => member.uid === this.user.uid);
  }

  /**
   * toggle the checkbox for each users , that is, to add them or not to add them in the group
   * @param Event event
   */
  handleCheck(event) {
    this.checked = !this.checked;

    this.actionGenerated.emit({
      type: enums.MEMBER_UPDATED,
      payLoad: { user: this.user, userState: this.checked },
    });
  }
}
