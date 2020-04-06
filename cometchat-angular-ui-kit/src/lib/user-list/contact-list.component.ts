import { Component, OnInit, HostListener, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { ContactListManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';
import { STRING_CONSTS } from './string_constants';
import { CONTACT_LIST_ACTIONS, USER_LIST_ACTIONS } from '../string_constants';
import { Helper } from '../helpers/helper';


@Component({
  selector: 'cometchat-contact-list',
  templateUrl: './contact-list.component.html',
  styleUrls: ['./contact-list.component.scss']
})

export class ContactListComponent implements OnInit {


  /**
   * Message to display in case of the error/ or loading in anywhere in the component.
   */
  messageToDisplay = STRING_CONSTS.STRING_MESSAGES.LOADING_MESSSAGE;

  /** needed attributes */
  contactListManager: ContactListManager;
  users: CometChat.User[] = [];
  JSONParser = JSON;

  /** optional attributes */
  @Input() selectedUser?;
  searchStarted?;
  @Input() friendsOnly?= false;

  /**
   * Input  of contact list component
   * it's callback function passed as an attribute. and will be called on each item clicked.
   */
  @Input() onItemSelect?: (user: CometChat.User, type?: string) => void;
  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object }>();

  constructor(private cdRef: ChangeDetectorRef) { }
  /**
   * Determines whether item click on
   */
  onItemClick = (user, type?: string) => {
    if (this.onItemSelect) {
      this.onItemSelect(user, type);
    }
    this.actionPerformed.emit({ action: CONTACT_LIST_ACTIONS.CONTACT_ITEM_SELECTED, payload: { user } });

    this.selectedUser = user; // set the selectedUser to the item clicked.
  }

  ngOnInit() {
    if ((typeof (this.selectedUser) === 'string') && !(this.selectedUser === '')) {
      let tempUser = new CometChat.User({});
      this.selectedUser = Object.assign(tempUser, JSON.parse(this.selectedUser) as CometChat.User) as CometChat.User;
    }

    // creating the instace of ContactListManager (Basic CometChat Manager for contact/user list).
    this.contactListManager = new ContactListManager(undefined, this.friendsOnly);
    this.init();
  }

  /**
   * Inits contact list component
   */
  init() {
    this.contactListManager.isLoggedIn(this.isChatReady);
    this.contactListManager.attachListener(this.callback);
  }

  /**
   * Determines whether search change on
   * @param $event:any
   */
  onSearchChange($event: any) {
    if (this.searchStarted) {
      clearTimeout(this.searchStarted);
    }
    if ($event.target.value.trim() !== STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING) {
      this.searchStarted = setTimeout(() => {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.SEARCH_LOADING;
        this.contactListManager = new ContactListManager($event.target.value, this.friendsOnly);
        this.fetchNext();
      }, 400);
    } else if ($event.target.value.trim() === STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING && $event.data === null) {
      $event.target.value = STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING;
      this.searchStarted = setTimeout(() => {
        this.contactListManager = new ContactListManager(undefined, this.friendsOnly);
        this.fetchNext();
      }, 400);
      // tslint:disable-next-line: max-line-length
    } else if ($event.target.value.trim() === STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING && $event.data === STRING_CONSTS.STRING_MESSAGES.SINGLE_SPACE) {
      $event.target.value = STRING_CONSTS.STRING_MESSAGES.EMPTY_STRING;
    }
  }

  printContactIndex(i: number, user: any) {
    const name = 'name';
    // tslint:disable-next-line: max-line-length
    return (i > 0 && this.users[i - 1][name].substring(0, 1).toLowerCase() === user.name.substring(0, 1).toLowerCase()) ? '' : user.name.substring(0, 1).toUpperCase();
  }
  /**
   * Hosts listener : on host div scroll it will detemine if it reach to bottom and if yes, then if will load next set of users if present.
   * @param elem any
   */
  @HostListener('scroll', ['$event.target'])
  onScroll(elem: any) {
    if ((elem.target.offsetHeight + elem.target.scrollTop + 1) >= elem.target.scrollHeight) {
      this.contactListManager.fetchNext().then((users: CometChat.User[]) => {
        users.map((contact, i) => {
          if (!contact.getAvatar()) {
            users[i] = this.setAvatar(contact);
          }
        });
        this.users = [...this.users, ...users];
      }, (err/*currently not in user| can be checked and use to display specific error message*/) => {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
      });
    }
  }


  /**
   * Fetchs next function is called in the case of the serach.
   */
  fetchNext() {
    this.contactListManager.fetchNext().then((users: CometChat.User[]) => {
      if (users.length > 0) {
        users.map((contact, i) => {
          if (!contact.getAvatar()) {
            users[i] = this.setAvatar(contact);
          }
        });
        this.users = users;
      } else {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_NO_USERS_FOUND;
        this.users = [];
      }
    }, error => {
      this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
    });
  }

  /**
   * callback function: will be called once the user is authenticate with CometChat, or he/ she fails to login.
   * Determines whether CometChat is ready.
   * @param user:CometChat.User on succesfull login function will receive the loged in user object.
   * @param error:any on unsuccessfull login function will receive the error.
   */
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {

      this.contactListManager.fetchNext().then((users: CometChat.User[]) => {

        if (users.length === 0) {
          this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_NO_USERS_FOUND;
        }
        users.map((contact, i) => {
          if (!contact.getAvatar()) {
            users[i] = this.setAvatar(contact);
          }
        });
        this.users = users;
      }, (err/*currently not in user| can be checked and use to display specific error message*/) => {
        this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_LOADING_USERS;
      });
    } else {
      this.messageToDisplay = STRING_CONSTS.STRING_MESSAGES.ERROR_COMETCHAT_LOGIN;
    }
  }

  callback = (event: { action: string, payload?: { onlineUser?: CometChat.User, offlineUser?: CometChat.User } }) => {

    switch (event.action) {
      case USER_LIST_ACTIONS.USER_STATUS_CHANGED.ONLINE:
        // this.user = event.payload.onlineUser;
        this.users.map((user, i) => {
          if (user.getUid().toString() === event.payload.onlineUser.getUid().toString()) {

            this.users[i] = this.setAvatar(event.payload.onlineUser);;
            this.cdRef.detectChanges();
          }
        });
        break;
      case USER_LIST_ACTIONS.USER_STATUS_CHANGED.OFFLINE:
        this.users.map((user, i) => {
          if (user.getUid().toString() === event.payload.offlineUser.getUid().toString()) {
            this.users[i] = this.setAvatar(event.payload.offlineUser);;
            this.cdRef.detectChanges();
          }
        });
        break;
    }

  }


  setAvatar(contact) {
    if (!contact.getAvatar()) {
      contact.setAvatar(Helper.getSVGAvatar(contact.getUid(), contact.getName().substr(0, 1)));

    }
    return contact;

  }
}
