import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'demo-user-view',
  templateUrl: './demo-user-view.component.html',
  styleUrls: ['./demo-user-view.component.scss']
})
export class DemoUserViewComponent implements OnInit {

  userObject;

  constructor() { }

  ngOnInit() {
    CometChat.getLoggedinUser().then(user => {
      console.log('user', user);
      this.userObject = JSON.stringify(user);
    });
  }

}
