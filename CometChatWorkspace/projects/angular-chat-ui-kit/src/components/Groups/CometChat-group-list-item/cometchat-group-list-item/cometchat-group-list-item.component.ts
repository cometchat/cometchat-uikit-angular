import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";

@Component({
  selector: "cometchat-group-list-item",
  templateUrl: "./cometchat-group-list-item.component.html",
  styleUrls: ["./cometchat-group-list-item.component.css"],
})
export class CometChatGroupListItemComponent implements OnInit {
  @Input() group = null;
  @Input() selectedGroup = null;

  @Output() onGroupClick: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {}

  /**
   * Emitting the Group clicked so that it can be used in the parent component
   * @param Any group
   */
  groupClicked(group) {
    this.onGroupClick.emit(group);
  }
}
