import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CometChatMessageEvents {
 
  // this events get triggered when we select an emoji from emoji keyboard
  onEmojiClick: any = new Subject();
   // this events get triggered when we select sticker from sticker keyboard
  onStickerClick: any = new Subject();
 // this events get triggered when a message is sent 
  onMessageSent: any = new Subject();
  // this events get triggered when there is any error while sending a message
  onMessageError: any = new Subject();
  // this events get triggered when we click on edit message option
  onMessageEdit: any = new Subject();
  // this events get triggered when we click on live reaction button
  onLiveReaction: any = new Subject();
    // this events get triggered when we click on react message
  onMessageReact: any = new Subject();
  // this events get triggered when a message is read
  onMessageRead:any = new Subject()
    // this events get triggered when a message is deleted
  onMessageDelete:any = new Subject()
   // this events get triggered when a message is read
  onBack:any = new Subject()
     // this event gets triggered when there is nay error
  onError:any = new Subject()


  /**
   * name of the event to publish
   * @param  {any} event 
   * item to pass in that event
   * @param  {any} item
   */
  publishEvents(event:any,item:any = null){
    event.next(item);
  }
  /**
   * name of the event to subscribe
   * @param  {any} event
   */
  subscribeEvents(event:any){
    return event.asObservable();
  }

}
