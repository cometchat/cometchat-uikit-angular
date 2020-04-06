// tslint:disable-next-line: max-line-length
import { Component, Input, OnChanges, HostListener, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { MessageListManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-messages-list',
  templateUrl: './messages-list.component.html',
  styleUrls: ['./messages-list.component.scss']
})
export class MessagesListComponent implements OnChanges, AfterViewInit, AfterViewChecked, OnDestroy {
  ngOnDestroy(): void {
    this.callback = null;
    if (this.messagesManager) {
      this.messagesManager.removeListeners();
      this.messagesManager = null;
    }
  }

  private TAG = 'MessagesListComponent';
  dateClass = Date;
  messagesManager: MessageListManager;
  JSONParser = JSON;
  scrollTrigger = false;
  currentScrollPossition = 0;
  loggedInUser: CometChat.User | any;
  decoreMessage: string = 'LOADING...';

  @Input() messages?: CometChat.BaseMessage[] | any = [];
  @Input() refreshMessageList?;
  @Input() user?;
  @Input() group?;
  @Input() reload: boolean;
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
    this.decoreMessage = "LOADING...";
    if (this.refreshMessageList !== '' && this.refreshMessageList !== 'true') {
      this.messages = this.messages.filter((msg: CometChat.BaseMessage) => {
        return msg['id'] !== JSON.parse(this.refreshMessageList)[0].id;
      });
      this.messages.push(JSON.parse(this.refreshMessageList)[0]);
      this.scrollToBottom();

    }
    if (this.user && !(this.user instanceof Object)) {
      this.group = undefined;
      this.user = JSON.parse(this.user);
      if (this.messagesManager) {

        this.messagesManager.removeListeners();
      }
      this.messagesManager = new MessageListManager(this.user.uid, 'user');
      this.refreshMessageList = '';
      this.messages = [];
      this.init();

    } else if (this.group && !(this.group instanceof Object)) {
      this.user = undefined;
      this.group = JSON.parse(this.group);
      if (this.messagesManager) {
        this.messagesManager.removeListeners();
      }
      this.messagesManager = new MessageListManager(this.group.guid, 'group');
      this.refreshMessageList = '';
      this.messages = [];
      this.init();

    } else if (this.refreshMessageList === 'true') {
      this.messagesManager = new MessageListManager(this.group.guid, 'group');
      this.refreshMessageList = '';
      this.messages = [];
      this.init();
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
        if (messages.length === 0) { this.decoreMessage = 'No messages found' }
        for (let i = (messages.length - 1); i >= 0; i--) {
          let message = messages[i];
          if (message.getSender().getUid() !== this.loggedInUser.getUid()) {
            this.markMessageAsRead(message);
            break;
          }
        }

        this.cdRef.detectChanges();
        this.scrollToBottom();
      }, (err) => {
        // TODO handle fatching fail.

      });
    } else {
      // TODO handle login fail
    }
  }

  callback = (msg: CometChat.BaseMessage | CometChat.MessageReceipt, isReceipt: boolean = false) => {

    if (!isReceipt) {
      const message = msg as CometChat.BaseMessage;
      const currentscrollHeight = this.tref.nativeElement.scrollHeight;

      this.messages = this.messages.filter((msg: CometChat.BaseMessage) => {
        return msg['id'] !== message['id'];
      });

      this.messages.push(message);
      this.markMessageAsRead(message);

      if (this.tref.nativeElement.scrollTop + this.tref.nativeElement.offsetHeight + 10 >= currentscrollHeight) {
        this.scrollToBottom();
      }
    } else {
      const messageReceipt = msg as CometChat.MessageReceipt;
      if (messageReceipt.getReceiverType() === 'user') {
        this.messages.map((msgObject, index) => {
          if (!msgObject['deliveredAt'] && (messageReceipt.RECEIPT_TYPE.DELIVERY_RECEIPT === messageReceipt.getReceiptType() && messageReceipt.getSender().getUid() === this.user.uid)) {
            msgObject['deliveredAt'] = messageReceipt.getDeliveredAt();
          }
          if (!msgObject['readAt'] && (messageReceipt.RECEIPT_TYPE.READ_RECEIPT === messageReceipt.getReceiptType() && messageReceipt.getSender().getUid() === this.user.uid)) {
            msgObject['readAt'] = messageReceipt.getReadAt();
          }
        });
      } else {
        //TODO update if receiver type is group;
      }

      this.cdRef.detectChanges();
    }

  }


  private scrollToBottom = () => {
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

  handleBubbleActions = ($event) => {
    this.messages = [...this.messages, $event.payload.message];
  }

}
