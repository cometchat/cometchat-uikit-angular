import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CometChatUsersEvents {
 
// events
// calling this event if clicked on user or group
   onUserClick:any = new Subject();
   // calling this event if clicked on user or group
   onBack:any = new Subject();
   // calling this event if clicked on search
	 onSearch:any =new Subject();
// calling this event if scrolled to bottom or top of messageList
   onScrollEvent:any = new Subject();
     // this event gets triggered when there is nay error
     onError:any = new Subject()



  /**
   * @param  {any} event
   * @param  {any} item
   */
  publishEvents(event:any,item:any){
    event.next(item);
  }
}