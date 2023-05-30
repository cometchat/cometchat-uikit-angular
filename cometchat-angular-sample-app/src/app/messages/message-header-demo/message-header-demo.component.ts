import { Component, Input, OnInit } from '@angular/core';
import { CometChatTheme, CometChatThemeService } from '@cometchat-pro/angular-ui-kit';
import { CometChat } from '@cometchat-pro/chat';

@Component({
  selector: 'cometchat-message-header-demo',
  templateUrl: './message-header-demo.component.html',
  styleUrls: ['./message-header-demo.component.scss']
})
export class MessageHeaderDemoComponent implements OnInit {
  public user!:CometChat.User;
  infoIconStyle:string = "assets/info.svg"
  detailsButtonStyle:any = {
    height:"24px",
    width:"24px",
    border:"none",
    borderRadius:"0",
    background:"transparent",
    buttonIconTint:"#3399FF",
    padding:"0 8px"
  }
  constructor(private themeService:CometChatThemeService) {

    CometChat.getUser("superhero5").then((user:CometChat.User)=>{
      this.user = user

    })
    .catch((error:CometChat.CometChatException)=>{
      console.log(error)
    })

  }

  ngOnInit(): void {
  }
  wrapperStyle = () => {
    return {
      width: "100%",
      height: "100%",
      background: this.themeService.theme.palette.getBackground(),
    }
  }

}
