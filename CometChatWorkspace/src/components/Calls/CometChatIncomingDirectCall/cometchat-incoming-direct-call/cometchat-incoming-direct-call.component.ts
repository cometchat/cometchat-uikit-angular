import { Component, OnInit, Output, EventEmitter, OnChanges, SimpleChanges, Input, ComponentFactoryResolver } from "@angular/core";
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
export class CometChatIncomingDirectCallComponent implements OnInit,OnChanges {
  incomingCall: any = null;
  callInProgress = null;
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  user: any;
  name: any;
  audio: any;
  currentTime: any;

  directCall = COMETCHAT_CONSTANTS.INCOMING_VIDEO_CALL
  IGNORE: String = COMETCHAT_CONSTANTS.IGNORE;
  ACCEPT: String = COMETCHAT_CONSTANTS.ACCEPT;
  @Input() incomingDirectCall:any = null

  CALL_TYPE_DIRECT: String = enums.CALL_TYPE_DIRECT;

  constructor() {}
  ngOnChanges(changes: SimpleChanges) {    
   if(this.incomingDirectCall && this.incomingDirectCall.type == enums.CALL_TYPE_DIRECT && localStorage.getItem("isIncomingCall") != "accepted" ){
     this.showIncomingCall()

   }
  }
  showIncomingCall(){
    localStorage.setItem("isIncomingCall","true")
    this.incomingCall = true
    this.playAudio()
  }

  ngOnInit() {
    window.addEventListener('storage', () => {

      if( (localStorage.getItem("isIncomingCall") == "ignored" || localStorage.getItem("isIncomingCall") == "accepted") && this.incomingCall){
        this.incomingCall = null;
        this.pauseAudio()
        
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
    

      this.actionGenerated.emit({
        type: enums.SESSION_ID,
        payLoad: this.incomingDirectCall.data.customData.sessionId,
      });
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
