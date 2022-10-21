import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CometChat } from '@cometchat-pro/chat';
import { COMETCHAT_CONSTANTS } from '../../CONSTS';
import { avatarStyles, CometChatTheme, fontHelper } from '@cometchat-pro/angular-ui-kit';
@Component({
  selector: 'cometchat-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public theme = new CometChatTheme({})
  public avatarStyles:any = {
    height:"32px",
    width:"32px",
    backgroundColor:"white",
    borderRadius:"24px"
  }
  public uid:string="";
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
  public buttonImage:string="assets/button-opc.png";
  public backgroundImage:string="assets/Image-518@1x.png";
  constructor(private router:Router) { 
//  setTimeout(() => {
//   this.theme.palette.setMode("dark")
//  }, 300);
  }
  ngOnInit(): void {
    this.checkUserLogIn()
  }
  checkUserLogIn() {
    CometChat.getLoggedinUser().then(
      (user) => {
        if (!user) {
          return;
        }
        else {
          this.router.navigate(['/home'])

        }
      }, error => {
        console.log("Some Error Occured", { error });
      }
    );


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
  signup(){
    this.router.navigate(['/signup']);

  }
  styles:any = {
    loginWrapperStyle : ()=>{
      return{
        background:this.theme.palette.getAccent100()
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
    borderStyle:()=>{
      return{
        borderBottom: `1px solid ${this.theme.palette.getAccent100()}`

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
        font: fontHelper(this.theme.typography.name),
        color:this.theme.palette.getAccent()
      }
    },
    errorTextStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getError()


      }
    },
    useruidStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle2),
        color:this.theme.palette.getAccent600()
      }
    },
    userDetailsStyle:()=>{
      return{
        background:this.theme.palette.getAccent100(),
        backgroundImage: `url(${this.buttonImage})`
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
    buttonStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.subtitle1),
        color:this.theme.palette.getAccent("dark"),
        backgroundColor:this.theme.palette.getPrimary(),
        backgroundImage: `url(${this.buttonImage})`

      }
    },
    signupButtonStyle:()=>{
      return{
        font: fontHelper(this.theme.typography.title2),
        color:this.theme.palette.getAccent600(),
        backgroundColor:"transparent",
        border: `1px solid ${this.theme.palette.getAccent100()}`,
        borderRadius:"4px"

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
