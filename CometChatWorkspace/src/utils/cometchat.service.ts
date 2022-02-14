import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CometChatService {

  /* 
   Getting deleted conversation from cometchat-convsersation-list component.
   */
  conversationDeleted = new Subject();

  /*
   Getting confirm dialog decision from cometchat-confirm-dialog component.
   */
  onConfirmDialogClick = new Subject();

  /*
   Getting left group from cometchat-group-details component.
   */
  onLeaveGroup = new Subject();

  // directcalll listener
  

}
