import { Component, OnInit, HostListener, Input, Output, EventEmitter } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { ContactListManager } from './cometchat-manager';

@Component({
  selector: 'contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})

export class ContactListComponent implements OnInit {
  contactList: ContactListManager;
  users: any = [];
  loader = true;
  @Input() onItemSelect: (user: CometChat.User) => void;
  JSONParser = JSON;

  ngOnInit() {
    this.contactList = new ContactListManager();
    console.log('this.contactList', this.contactList);
    this.init();
  }

  updateSearchModel(searchKey) {
    this.contactList = new ContactListManager(searchKey);
    this.init();
  }

  @HostListener('scroll', ['$event.target'])
  onScroll(elem) {
    if ((elem.target.offsetHeight + elem.target.scrollTop) >= elem.target.scrollHeight) {
      this.contactList.fetchNext().then((users: CometChat.User[]) => {
        this.users = [...this.users, ...users];
        this.loader = false;
      }, error => {
        // TODO error in fetching contact list
      });
    } else {
      // console.log(elem.target.scrollHeight);
    }
  }

  init() {
    this.contactList.isLoggedIn(this.isChatReady);
  }
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.contactList.fetchNext().then((users: CometChat.User[]) => {
        this.users = users;
        this.loader = false;
      }, (err) => {
        console.log('Failed to fetch the user list', err);
      });
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }


}
