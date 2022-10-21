import { Component, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'custom-error-state',
  templateUrl: './custom-error-state.component.html',
  styleUrls: ['./custom-error-state.component.scss']
})
export class CustomErrorStateComponent implements OnInit {
public showError:boolean=false;
  constructor() { }

  ngOnInit(): void {
    CometChat.getLoggedinUser().then((user)=>{
      if(user){
        CometChat.logout().then(()=>{
          this.showError = true;
        })

      }


    })

  }

}
