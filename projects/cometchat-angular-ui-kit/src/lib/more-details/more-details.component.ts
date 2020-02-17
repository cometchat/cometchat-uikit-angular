import { Component, OnInit } from '@angular/core';
import { CometChatManager } from '../cometchat-manager';

@Component({
  selector: 'more-details',
  templateUrl: './more-details.component.html',
  styleUrls: ['./more-details.component.scss']
})
export class MoreDetailsComponent implements OnInit {
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
