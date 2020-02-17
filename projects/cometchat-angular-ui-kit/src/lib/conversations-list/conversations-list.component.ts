import { Component, OnInit, HostListener, Input, ChangeDetectorRef } from '@angular/core';
import { ConversationListManager } from './cometchat-manager';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'conversations-list',
  templateUrl: './conversations-list.component.html',
  styleUrls: ['./conversations-list.component.scss']
})

export class ConversationsListComponent implements OnInit {
  conversationManager: ConversationListManager;
  conversations: CometChat.Conversation[] = [];
  @Input() onItemSelect: (user: CometChat.Conversation) => void;
  JSONParser = JSON;
  loader = true;
  constructor(private cdRef: ChangeDetectorRef) {

  }
  onItemClicked = (conv: CometChat.Conversation) => {
    this.cdRef.detectChanges();
    this.onItemSelect(conv);
    this.conversations.map((conversation, i) => {
      if (conversation.getConversationId() === conv.getConversationId()) {
        conv.setUnreadMessageCount(0);
        this.conversations[i] = conv;
        console.log(conv);
      }
    });

    this.cdRef.detectChanges();
  }
  ngOnInit() {
    this.conversationManager = new ConversationListManager();
    this.init();
  }

  init() {
    this.conversationManager.isLoggedIn(this.isChatReady);
  }
  @HostListener('scroll', ['$event.target'])
  onScroll(elem) {
    if ((elem.target.offsetHeight + elem.target.scrollTop) >= elem.target.scrollHeight) {
      this.conversationManager.fetchNext().then((conversations: CometChat.Conversation[]) => {
        this.conversations = [...this.conversations, ...conversations];
      }, error => {
        // TODO error in fetching contact list
      });
    } else {
      console.log(elem.target.scrollHeight);
    }
  }
  onMessageUpdated = (payload, isReceipt) => {
    if (isReceipt) {

    } else {
      CometChat.CometChatHelper.getConversationFromMessage(payload).then(conv => {
        this.conversations.map((conversation, i) => {
          if (conversation.getConversationId() === conv.getConversationId()) {
            conv.setUnreadMessageCount(parseInt(conversation.getUnreadMessageCount()) + 1);
            this.conversations.splice(i, 1);
            this.conversations.splice(0, 0, conv);
          }
          this.cdRef.detectChanges();
        });
      });


    }
  }
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.conversationManager.attachListener(this.onMessageUpdated);
      this.conversationManager.fetchNext().then((conversations: CometChat.Conversation[]) => {
        console.log('This are the conversation list', { conversations });
        this.conversations = conversations;
        this.loader = false;
      }, (err) => {
        console.log('Failed to fetch the user list', err);
      });
    } else {
      // TODO handle is chatusr logedin Failes.
    }
  }
}
