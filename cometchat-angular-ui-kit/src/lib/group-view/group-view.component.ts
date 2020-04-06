import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
@Component({
  selector: 'cometchat-group-view',
  templateUrl: './group-view.component.html',
  styleUrls: ['./group-view.component.scss']
})
export class GroupViewComponent implements OnInit {
  @Input() group: CometChat.Group | any;
  @Input() selected?: boolean;
  constructor() {

  }

  ngOnInit() {
    this.group = Object.assign(JSON.parse(this.group) as CometChat.User);
  }

}
