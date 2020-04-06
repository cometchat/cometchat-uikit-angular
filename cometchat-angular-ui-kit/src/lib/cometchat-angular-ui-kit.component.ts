import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cometchat-angular-ui-kit',
  templateUrl: './cometchat-angular-ui-kit.component.html',
  styleUrls: ['./cometchat-angular-ui-kit.component.scss']
})
export class CometchatAngularUiKitComponent implements OnInit {
  friendsOnly: boolean = false
  ngOnInit(): void {
    const params = new URLSearchParams(location.search);
    if (params.get('friendsOnly')) {
      this.friendsOnly = true;
    }
  }
}
