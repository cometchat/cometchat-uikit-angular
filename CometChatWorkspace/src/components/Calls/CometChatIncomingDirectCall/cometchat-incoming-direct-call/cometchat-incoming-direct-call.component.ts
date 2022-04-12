import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatManager } from "../../../../utils/controller";
import { INCOMING_CALL_ALERT } from "../../../../resources/audio/incomingCallAlert";
import { trigger, style, transition, animate } from "@angular/animations";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";


@Component({
  selector: "cometchat-incoming-direct-call",
  templateUrl: "./cometchat-incoming-direct-call.component.html",
  styleUrls: ["./cometchat-incoming-direct-call.component.css"],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateY(-100%)" }),
        animate("250ms ease-in", style({ transform: "translateY(0%)" })),
      ]),
    ]),
  ],
})
export class CometChatIncomingDirectCallComponent implements OnInit,OnChanges,OnDestroy {
  @ViewChild("callScreen", { static: false }) callScreen!: ElementRef;
   item: any = null;
   type: string = '';
  incomingDirectCall: any = null;
   outgoingDirectCall: any = null;
   joinCall: any = null
  callListenerId = enums.CALL_SCREEN_ + new Date().getTime();
  outgoingCallScreen: boolean = false;
  errorScreen: boolean = false;
  errorMessage: String = "";
  incomingCall: any = null;
  callInProgress:boolean | null= null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  msgListenerId = enums.MESSAGE_ + new Date().getTime();

  user: any;
  name: any;
  audio: any;
  currentTime: any;

  directCall = COMETCHAT_CONSTANTS.INCOMING_VIDEO_CALL
  IGNORE: String = COMETCHAT_CONSTANTS.IGNORE;
  ACCEPT: String = COMETCHAT_CONSTANTS.ACCEPT;


  CALL_TYPE_DIRECT: String = enums.CALL_TYPE_DIRECT;

  constructor(private ref : ChangeDetectorRef) {}
  ngOnChanges(changes: SimpleChanges) {  
   if(this.incomingDirectCall && this.incomingDirectCall.type == enums.CALL_TYPE_DIRECT && localStorage.getItem("isIncomingCall") != "accepted" ){
    //  this.ref.detectChanges()

   }
  }
  ngOnDestroy(){
    CometChat.removeMessageListener(this.msgListenerId)
  }
  ngDoCheck(){
    if(this.incomingCall && localStorage.getItem("isIncomingCall") == "accepted" ){
      this.incomingCall = null
      this.pauseAudio()
    }
  }

  /**
   * Listener To Receive Messages in Real Time
   * @param
   */
   addMessageEventListeners() {

    try {
      CometChat.addMessageListener(
        this.msgListenerId,
        new CometChat.MessageListener({
          onCustomMessageReceived: (textMessage: any) => {
            if(textMessage && textMessage.type == enums.CALL_TYPE_DIRECT && localStorage.getItem("isIncomingCall") != "accepted" ){
              this.incomingDirectCall = textMessage
             this.showIncomingCall()
              this.ref.detectChanges()
         
            }
    
          },
       
      
        })
      );

     
    } catch (error) {
      logger(error);
    }
  }
  joinDirectCall() {
    localStorage.setItem("isIncomingCall","accepted")
    let sessionID = this.incomingDirectCall.data.customData.sessionId || this.incomingDirectCall.data.customData.sessionID;
    let audioOnly = false;
    let defaultLayout = true;
    let callSettings = new CometChat.CallSettingsBuilder()
      .enableDefaultLayout(defaultLayout)
      .setSessionID(sessionID)
      .setIsAudioOnlyCall(audioOnly)
      .build();


    CometChat.startCall(
      callSettings,
      this.callScreen.nativeElement,
      new CometChat.OngoingCallListener({

        onUserListUpdated: (userList:object) => {
          

          // console.log("user list:", userList);
        },
        onCallEnded: (call:object) => {
        this.callInProgress = false;
        localStorage.removeItem("isIncomingCall");
          this.ref.detectChanges()
          // console.log("Call ended:", call);
        },
        onError: (error:object) => {
          this.callInProgress = false
          console.log("Error :", error);
        },
        onMediaDeviceListUpdated: (deviceList:object) => {
          // console.log("Device List:", deviceList);
        },
        onUserMuted: (userMuted:object, userMutedBy:object) => {
          // This event will work in JS SDK v3.0.2-beta1 & later.
          // console.log("Listener => onUserMuted:", userMuted, userMutedBy);
        },
        onScreenShareStarted: () => {
          // This event will work in JS SDK v3.0.3 & later.
          console.log("Screen sharing started.");
        },
        onScreenShareStopped: () => {
          // This event will work in JS SDK v3.0.3 & later.
          console.log("Screen sharing stopped.");
        }
      })

    )
  }
  showIncomingCall():any{
    localStorage.setItem("isIncomingCall","true")
    this.incomingCall = true
    this.playAudio()
  }

  ngOnInit() {

    this.addMessageEventListeners()
    window.addEventListener('storage', () => {
   

      if( (localStorage.getItem("isIncomingCall") == "ignored" || localStorage.getItem("isIncomingCall") == "accepted") && this.incomingCall){
        this.incomingCall = null;
        this.pauseAudio()
        this.ref.detectChanges()

        
      }
      
    });
    try {
      this.loadAudio();
    } catch (error) {
      logger(error);
    }
  }

 
  ignoreCall(){
    try{
      localStorage.setItem("isIncomingCall","ignored")
      // localStorage.removeItem("isActiveCall")
      this.pauseAudio()
      this.incomingCall = null
      this.callInProgress = false
      this.ref.detectChanges()
   

    }
    catch(err){

    }
   
   
  }

  /**
   * When user clicks on button to accept call it emits data about the incoming call that was accepted
   */
  acceptCall() {
    try {
      localStorage.setItem("isIncomingCall","accepted")
      // localStorage.setItem("isActiveCall","true")
      this.pauseAudio();
      this.callInProgress = true
      this.ref.detectChanges()
      setTimeout(() => {
        this.joinDirectCall()
        this.ref.detectChanges()
        
      }, 1000);
    

      // this.actionGenerated.emit({
      //   type: enums.SESSION_ID,
      //   payLoad: this.incomingDirectCall.data.customData.sessionId,
      // });
      this.incomingCall = null;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Loads the audio
   */
  loadAudio() {
    try {
      this.audio = new Audio();
      this.audio.src = INCOMING_CALL_ALERT;
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Plays Audio in loop
   */
  playAudio() {
    try {
      this.audio.currentTime = 0;
      if (typeof this.audio.loop == enums.Boolean) {
        this.audio.loop = true;
        this.ref.detectChanges()
      } else {
        this.audio.addEventListener(
          enums.ENDED,
          () => {
            this.currentTime = 0;
            this.playAudio();
          },
          false
        );
      }
      this.audio.play();
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Pauses audio
   */
  pauseAudio() {
    try {
      this.audio.pause();
    } catch (error) {
      logger(error);
    }
  }
}
