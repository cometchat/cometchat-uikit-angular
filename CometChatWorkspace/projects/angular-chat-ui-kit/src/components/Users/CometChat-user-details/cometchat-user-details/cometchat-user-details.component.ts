import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
} from "@angular/core";
import * as enums from "../../../utils/enums";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-user-details",
  templateUrl: "./cometchat-user-details.component.html",
  styleUrls: ["./cometchat-user-details.component.css"],
})
export class CometChatUserDetailsComponent implements OnInit, OnChanges {
  @Input() item = null;
  @Input() type = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  OPTIONS: String = STRING_MESSAGES.OPTIONS;
  DETAILS: String = STRING_MESSAGES.DETAILS;

  blockUserText: string;
  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["item"]) {
      this.getBlockStatus(change["item"].currentValue);
    }
  }
  ngOnInit() {}

  getBlockStatus(item) {
    if (item.blockedByMe) {
      this.blockUserText = STRING_MESSAGES.UNBLOCK_USER;
    } else {
      this.blockUserText = STRING_MESSAGES.BLOCK_USER;
    }
    // return this.blockUserText;
  }

  toggleBlockUser() {
    if (this.blockUserText === STRING_MESSAGES.BLOCK_USER) {
      this.actionGenerated.emit({
        type: enums.BLOCK_USER,
      });
    } else if (this.blockUserText === STRING_MESSAGES.UNBLOCK_USER) {
      this.actionGenerated.emit({
        type: enums.UNBLOCK_USER,
      });
    }
  }

  /**
   * Close thread when opened in small screen
   */
  closeThreadView() {
    this.actionGenerated.emit({
      type: enums.CLOSE_DETAIL_CLICKED,
    });
  }
}
