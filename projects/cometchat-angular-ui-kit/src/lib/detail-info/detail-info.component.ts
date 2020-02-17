import { Component, OnInit, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
// import { ConversationHeaderManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';


@Component({
  selector: 'detail-info',
  templateUrl: './detail-info.component.html',
  styleUrls: ['./detail-info.component.scss']
})
export class DetailInfoComponent implements OnChanges {

  @Input() user?;
  @Input() group?;
  @Input() blockeUser = false;

  constructor(private cdRef: ChangeDetectorRef) {
    console.log('we are here and selected user')
  }
  ngOnChanges() {

    // console.log('detail detail', this.user = JSON.parse(this.user));
    if(this.user) {
      this.blockeUser = this.user.blockedByMe;
    }
    

    // console.log("show block user ", this.blockeUser);
  }

  toggleBlockUser = (event) => {
    if(this.user) {
      if (!this.blockeUser) {
        let usersList = [this.user.uid];
        console.log(event.target)
        CometChat.blockUsers(usersList).then(
          list => {
            this.blockeUser = !this.blockeUser;
            console.log("users list blocked", { list });
          },
          error => {
            console.log("Blocking user fails with error", error);
          }
        );
      } else {
        let usersList = [this.user.uid];
  
        CometChat.unblockUsers(usersList).then(
          list => {
            this.blockeUser = !this.blockeUser;
  
            console.log("users list unblocked", { list });
          },
          error => {
            console.log("unblocking user fails with error", error);
          }
        );
      }
    }
  }

}
