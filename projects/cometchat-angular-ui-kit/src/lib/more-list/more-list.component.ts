import { Component, OnInit } from '@angular/core';
import { CometChatManager } from '../cometchat-manager';

@Component({
  selector: 'more-list',
  templateUrl: './more-list.component.html',
  styleUrls: ['./more-list.component.scss']
})
export class MoreListComponent implements OnInit {
  user?;
  ccManager = new CometChatManager();
  constructor() {
    this.ccManager.isLoggedIn((user) => {
      this.user = user;
    })
  }
  ngOnInit() {
  }

}
