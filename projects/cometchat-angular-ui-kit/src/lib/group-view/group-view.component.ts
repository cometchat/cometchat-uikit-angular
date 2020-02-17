import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'group-view',
  templateUrl: './group-view.component.html',
  styleUrls: ['./group-view.component.scss']
})
export class GroupViewComponent implements OnInit {
  @Input() group: CometChat.Group | any;
  constructor() { }

  ngOnInit() {
    this.group = Object.assign(JSON.parse(this.group) as CometChat.Group);
    console.log('group', this.group)
  }

}


