import { Component, Input, OnChanges, HostListener, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { MessageListManager } from './cometchat-manager';


@Component({
  selector: 'message-list-body',
  templateUrl: './message-list-body.component.html',
  styleUrls: ['./message-list-body.component.scss']
})
export class MessageListBodyComponent implements OnChanges, AfterViewInit, AfterViewChecked {
  private TAG = 'MessagesListComponent';
  dateClass = Date;
  messagesManager: MessageListManager;
  JSONParser = JSON;
  scrollTrigger = false;
  currentScrollPossition = 0;
  loggedInUser: CometChat.User | any;

  @Input() messages?;
  @Input() refreshMessageList?;
  @Input() user?;
  @Input() group?;
  loading = true;
  @ViewChild('thisRed', { read: ElementRef, static: true }) tref: ElementRef;

  constructor(private cdRef: ChangeDetectorRef) {

  }

  setMessage(message) {
    return JSON.stringify(message);
  }

  ngAfterViewInit() {
    this.tref.nativeElement.scrollTop = 0;
    this.tref.nativeElement.onChange = () => {
    };
  }
  ngAfterViewChecked() {
    if (!this.scrollTrigger) {
      this.tref.nativeElement.scrollTop = this.tref.nativeElement.scrollHeight - this.currentScrollPossition;
    }
  }
  getTime = (timstamp) => {
    return (new Date(timstamp * 1000)).toLocaleString();
  }

  @HostListener('scroll', ['$event.target'])
  onScroll(elem) {
    this.scrollTrigger = true;
    if (elem.target.scrollTop === 0 && this.messages.length > 0) {
      this.currentScrollPossition = this.tref.nativeElement.scrollHeight;
      this.messagesManager.fetchPrevious().then((messages: CometChat.BaseMessage[]) => {
        this.messages = [...messages, ...this.messages];
        this.scrollTrigger = false;
      });
    }
  }

  ngOnChanges() {
    console.log('message list component is getting called');
    if (this.refreshMessageList !== '') {
      this.messages = this.messages.filter((msg: CometChat.BaseMessage) => {
        return msg['id'] !== JSON.parse(this.refreshMessageList)[0].id;
      });
      let a: CometChat.BaseMessage = {} as CometChat.BaseMessage;
      Object.assign(a, JSON.parse(this.refreshMessageList)[0]);
      this.messages.push(a);
      this.scrollToBottom();
      console.log('message list component is getting called', 'we are here1');
    }
    if (this.user && !(this.user instanceof Object)) {
      this.group = undefined;
      this.user = JSON.parse(this.user);
      this.messagesManager = new MessageListManager(this.user.uid, 'user');
      this.refreshMessageList = '';
      this.messages = [];
      this.init();
      console.log('message list component is getting called', 'we are here2');
    } else if (this.group && !(this.group instanceof Object)) {
      this.user = undefined;
      this.group = JSON.parse(this.group);
      this.messagesManager = new MessageListManager(this.group.guid, 'group');
      this.refreshMessageList = '';
      this.messages = [];
      this.init();
      console.log('message list component is getting called', 'we are here3');
    } else {
      return;
    }
  }

  printDate(time1, time2?) {
    if (time2) {
      if (new Date(time1 * 1000).getDate() - new Date(time2 * 1000).getDate()) {
        return new Date(time1 * 1000).toLocaleDateString();
      }
    } else {
      return new Date(time1 * 1000).toLocaleDateString();
    }
    return undefined;
  }

  init() {
    this.loading = true;
    this.messagesManager.isLoggedIn(this.isChatReady);
    this.messagesManager.attachListener((message, isReceipt) => this.callback(message, isReceipt));

  }
  isChatReady = (user?: CometChat.User) => {
    if (user) {
      this.loggedInUser = user;
      this.messagesManager.fetchPrevious().then((messages: CometChat.BaseMessage[]) => {
        this.scrollTrigger = false;
        this.currentScrollPossition = 0;
        this.messages = messages;
        for (let i = (messages.length - 1); i >= 0; i--) {
          let message = messages[i];
          if (message.getSender().getUid() !== this.loggedInUser.getUid()) {
            this.markMessageAsRead(message);
            break;
          }
        }
        console.log('message list component is getting called', 'we are here4');
        this.cdRef.detectChanges();
        this.scrollToBottom();
        this.loading = false;
      }, (err) => {
        console.log(this.TAG, { err });
      });
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }

  callback = (msg: CometChat.BaseMessage | CometChat.MessageReceipt, isReceipt: boolean = false) => {
    console.log("messages received", msg);
    if (!isReceipt) {
      const message = msg as CometChat.BaseMessage;
      const currentscrollHeight = this.tref.nativeElement.scrollHeight;

      this.messages = this.messages.filter((msg: CometChat.BaseMessage) => {
        return msg['id'] !== message['id'];
      });

      this.messages.push(message);
      this.markMessageAsRead(message);
      if (this.tref.nativeElement.scrollTop + this.tref.nativeElement.offsetHeight >= currentscrollHeight) {
        this.scrollToBottom();
      }
    } else {
      const messageReceipt = msg as CometChat.MessageReceipt;
      if (messageReceipt.getReceiverType() === 'user') {
        this.messages.map((msgObject: CometChat.BaseMessage, index) => {
          if (!msgObject['deliveredAt'] && (messageReceipt.RECEIPT_TYPE.DELIVERY_RECEIPT === messageReceipt.getReceiptType() && messageReceipt.getSender().getUid() === this.user.uid)) {
            msgObject['deliveredAt'] = parseInt(messageReceipt.getDeliveredAt().toString());
          }
          if (!msgObject['readAt'] && (messageReceipt.RECEIPT_TYPE.READ_RECEIPT === messageReceipt.getReceiptType() && messageReceipt.getSender().getUid() === this.user.uid)) {
            msgObject['readAt'] = parseInt(messageReceipt.getReadAt().toString());
          }
        });
        console.log('this is messages objects', this.messages)
      } else {
        //TODO update if receiver type is group;
      }

      this.cdRef.detectChanges();
    }

  }


  private scrollToBottom = () => {
    console.log('message list component is getting called', 'we are here5');
    this.cdRef.detectChanges();
    this.tref.nativeElement.scrollTop = this.tref.nativeElement.scrollHeight + this.tref.nativeElement.offsetHeight;
  }

  private markMessageAsRead(message: CometChat.BaseMessage) {

    if (!(message.getReadAt() || message.getReadByMeAt())) {
      if (message.getReceiverType() === 'user') {
        CometChat.markAsRead(message.getId().toString(), message.getSender().getUid(), message.getReceiverType());
      } else {
        CometChat.markAsRead(message.getId().toString(), message.getReceiverId(), message.getReceiverType());
      }
    }
  }

}
