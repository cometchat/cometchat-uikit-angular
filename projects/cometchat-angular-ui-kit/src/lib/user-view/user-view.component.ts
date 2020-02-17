import { Component, OnInit, Input } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'user-view',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss']
})
export class UserViewComponent implements OnInit {
  @Input() user: CometChat.User | any;
  json = JSON;

  ngOnInit() {
    console.log(this.user, "here is user");
    this.user = Object.assign(JSON.parse(this.user) as CometChat.User);
  }
}