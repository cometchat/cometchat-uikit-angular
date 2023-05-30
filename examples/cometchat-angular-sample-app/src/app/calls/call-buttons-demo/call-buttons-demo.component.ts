import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CometChat } from '@cometchat-pro/chat';
import { CometChatThemeService } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: "call-buttons-demo",
  templateUrl: "./call-buttons-demo.component.html",
  styleUrls: ["./call-buttons-demo.component.scss"],

})
export class CallButtonsDemoComponent implements OnInit {
  user!:CometChat.User | null;
  ngOnInit(): void {

  }
  constructor(private themeService:CometChatThemeService){
    CometChat.getLoggedinUser().then((user:CometChat.User | null)=>{
      this.user = user
    })
    .catch((error:CometChat.CometChatException)=>{
      console.log(error)
    })
  }
  wrapperStyle = () => {
    return {
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
    }
  }
}
