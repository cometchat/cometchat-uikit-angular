import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CometChat } from '@cometchat-pro/chat';
import { COMETCHAT_CONSTANTS } from '../../CONSTS';
import { CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'cometchat-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  public theme = new CometChatTheme({})
  public avatarStyles:any = {
    height:"32px",
    width:"32px",
    backgroundColor:"white",
    borderRadius:"24px"
  }
  public error:string=""
  public usersArray:any[] = [
    {
      name:"Iron Man",
      uid:"superhero1",
      avatar:"https://data-us.cometchat.io/assets/images/avatars/ironman.png"
    },
    {
      name:"Captain America",
      uid:"superhero2",
      avatar:"https://data-us.cometchat.io/assets/images/avatars/captainamerica.png"
    },
    {
      name:"Spiderman",
      uid:"superhero3",
      avatar:"https://data-us.cometchat.io/assets/images/avatars/spiderman.png"
    },
    {
      name:"Wolvorine",
      uid:"superhero4",
      avatar:"https://data-us.cometchat.io/assets/images/avatars/wolverine.png"
    }
  ]
  public generateUID:boolean =false;
  public userUID:string="";
  public userName:string=""
  public buttonImage:string="assets/button-opc.png";
  public backgroundImage:string="assets/Image-518@1x.png";
  constructor(private router:Router) { 
//  setTimeout(() => {
//   this.theme.palette.setMode("dark")
//  }, 300);
  }
  ngOnInit(): void {
  }
  consoleInput = (event:any)=>{
   if(event.target?.checked){
     this.generateUID = true;
   }
   else{
     this.generateUID=false;
   }
  }
  createUser(username:string, UID:string){
    var uid ='';
    this.error = ""
    var authKey = COMETCHAT_CONSTANTS.AUTH_KEY;
if(this.generateUID){
  uid = username +  Math.round(+new Date() / 1000)
}
else{
  uid = UID;
}
var name = username;
var user = new CometChat.User(uid);
user.setName(name);
CometChat.createUser(user, authKey).then(
    (user:CometChat.User) => {
      this.loginToDashboard(user.getUid())
    }, error => {
      this.error = error.message
        console.log("error", error);
    }
)
  }
  loginToDashboard(user:string) {
    this.error = ""
 if(user && user != ' '){
  var UID = user
  var authKey = COMETCHAT_CONSTANTS.AUTH_KEY;
  CometChat.getLoggedinUser().then(
    (user) => {
      if (!user) {
        CometChat.login(UID, authKey).then(
          user => {
            console.log("Login Successful:", { user });
            this.router.navigate(['/home']);
          }, error => {
            this.error = error.message
          }
        );
      }
      else {
        this.router.navigate(['/home']);
      }
    }, error => {
      this.error = error.message
    }
  );
 }
  }
  styles:any = {
    loginWrapperStyle : ()=>{
      return{
        background:this.theme.palette.getAccent100()
      }
    },
    errorTextStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getError()
      }
    },
    headerTitleStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.name),
        color:this.theme.palette.getAccent("light")
      }
    },
    headerSectionStyle:()=>{
      return{
        borderBottom: `1px solid ${this.theme.palette.getAccent100()}`

      }
    },
    headerSubtitleStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent400("light")
      }
    },
    titleStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.heading),
        color:this.theme.palette.getAccent("light")
      }
    },
    subtitleStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
      }
    },
    containerStyle:()=>{
      return{
       background:this.theme.palette.getBackground(),
       boxShadow: `${this.theme.palette.getAccent400()} 0px 0px 5px`
      }
    },
    usernameStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.title2),
        color:this.theme.palette.getAccent("light")
      }
    },
    useruidStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600("light")
      }
    },
    userDetailsStyle:()=>{
      return{
        background:this.theme.palette.getSecondary()
      }
    },
    loginMessageStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
      }
    },
    inputStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600(),
        border: `1px solid ${this.theme.palette.getAccent100()}`,
      }
    },
    footerStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent500()
      }
    },
    signupButtonStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle1),
        color:this.theme.palette.getAccent("dark"),
        backgroundColor:this.theme.palette.getPrimary(),
        backgroundImage: `url(${this.buttonImage})`
      }
    },
    sectionImageStyle:()=>{
      return{
        background: `url(${this.backgroundImage}) center center no-repeat`,
        backgroundSize: "contain"
      }
    },
  }
}
