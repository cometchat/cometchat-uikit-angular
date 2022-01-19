import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-group-list-item",
  templateUrl: "./cometchat-group-list-item.component.html",
  styleUrls: ["./cometchat-group-list-item.component.css"],
})
export class CometChatGroupListItemComponent implements OnInit {
  @Input() group: { [key: string]: string | any} = {};
  @Input() selectedGroup: { [key: string]: string | any} = {};

  @Output() onGroupClick: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Emitting the Group clicked so that it can be used in the parent component
   * @param Any group
   */
  groupClicked(group: object) {
    try {
      this.onGroupClick.emit(group);
    } catch (error) {
      logger(error);
    }
  }
}
