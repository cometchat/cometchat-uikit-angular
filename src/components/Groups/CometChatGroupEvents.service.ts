import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CometChatGroupEvents {
 

// calling this event if clicked on user or group
   onGroupClick:any = new Subject();
   // calling this event after creating group
   onGroupCreate:any = new Subject();
   // calling this event once user joins a group
   onGroupMemberJoin:any = new Subject();
    // calling this event if clicked on back button
   onBack:any = new Subject();
   // calling this event if clicked on search
	 onSearch:any =new Subject();
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