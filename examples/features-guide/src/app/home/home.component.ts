
import { Component, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CometChat } from '@cometchat-pro/chat';
import { COMETCHAT_CONSTANTS } from 'src/CONSTS';

@Component({
  selector: 'cometchat-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
isRichMedia:boolean=false;
richMediaObject:any;
constructor(private _sanitizer:DomSanitizer){}
ngOnInit(): void {
  // this.loginToDashboard("superhero1")
}
checkRichMedia = (message:CometChat.TextMessage)=>{
  let show:boolean=false
  let metadata:any = message.getMetadata()
  if (metadata != null) {
    var injectedObject = metadata["@injected"];
    if (injectedObject != null && injectedObject.hasOwnProperty("extensions")) {
      var extensionsObject = injectedObject["extensions"];
      if (extensionsObject != null && extensionsObject.hasOwnProperty("rich-media")) {
        var richMediaObject = extensionsObject["rich-media"];
    
        if(richMediaObject.html){
          this.richMediaObject = richMediaObject
          show = true
        }
      }
      else{
        show = false
      }
    }
  }
  return show;

}

loginToDashboard(user:string) {
if(user && user != ' '){
var UID = user
var authKey = COMETCHAT_CONSTANTS.AUTH_KEY;
CometChat.getLoggedinUser().then(
  (user) => {
    if (!user) {
      CometChat.login(UID, authKey).then(
        user => {
          window.location.reload();
          console.log("Login Successful:", { user });
       
        }
      );
    }

  }
);

}


}
}
