import { Component, OnInit, Output, EventEmitter, OnDestroy, ElementRef, ViewChild} from "@angular/core";
import { ChangeDetectorRef } from "@angular/core";
import * as enums from "../../../../utils/enums";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatManager } from "../../../../utils/controller";
import { INCOMING_CALL_ALERT } from "../../../../resources/audio/incomingCallAlert";
import { trigger, style, transition, animate } from "@angular/animations";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-incoming-call",
  templateUrl: "./cometchat-incoming-call.component.html",
  styleUrls: ["./cometchat-incoming-call.component.css"],
  animations: [
    trigger("slideInOut", [
      transition(":enter", [
        style({ transform: "translateY(-100%)" }),
        animate("250ms ease-in", style({ transform: "translateY(0%)" })),
      ]),
    ]),
  ],
})
export class CometChatIncomingCallComponent implements OnInit,OnDestroy{
  @ViewChild("callScreenFrame", { static: false }) callScreenFrame!: ElementRef;
  public prevValue = null;
  incomingCall: any = null;
  callInProgress:boolean | null = false;
  callListenerId = enums.INCOMING_CALL_ + new Date().getTime();
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  user: any;
  name: any;
  audio: any;
  currentTime: any;

  INCOMING_AUDIO_CALL: String = COMETCHAT_CONSTANTS.INCOMING_AUDIO_CALL;
  INCOMING_VIDEO_CALL: String = COMETCHAT_CONSTANTS.INCOMING_VIDEO_CALL;
  DECLINE: String = COMETCHAT_CONSTANTS.DECLINE;
  ACCEPT: String = COMETCHAT_CONSTANTS.ACCEPT;

  CALL_TYPE_AUDIO: String = CometChat.CALL_TYPE.AUDIO;
  CALL_TYPE_VIDEO: String = CometChat.CALL_TYPE.VIDEO;
 
  loggedInUser: any;

  constructor(private ref:ChangeDetectorRef) {}


  ngOnInit() {
    try {
      CometChat.getLoggedinUser().then((user)=>{
   
        this.loggedInUser = user
      })
      this.attachListeners();
      this.loadAudio();
    } catch (error) {
      logger(error);
    }
  }
  ngOnDestroy() {
    this.pauseAudio()
    this.removeListeners()
  
  }

  /**
   * Attaches call listeners , so that user can receive / cancel real-time calls
   * @param
   */
  attachListeners() {
    try {
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onIncomingCallReceived: (call: any) => {
         
            this.callScreenUpdated(enums.INCOMING_CALL_RECEIVED, call);
  
          },
          onIncomingCallCancelled: (call: any) => {

          this.callScreenUpdated(enums.INCOMING_CALL_CANCELLED, call);
           
          },
        })
      );
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Removes call listeners when component is destroyed
   * @param
   */
  removeListeners() {
    try {
      CometChat.removeCallListener(this.callListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the call screen and opens/closes outgoing callScreen , depending on action taken by user
   * @param
   */
  callScreenUpdated(key: any, call: any):any {
    try {
      switch (key) {
        case enums.INCOMING_CALL_RECEIVED: {
          
          //occurs at the callee end
          this.incomingCallReceived(call);
          this.ref.detectChanges()
          break;
        }
        case enums.INCOMING_CALL_CANCELLED: {

          //occurs(call dismissed) at the callee end, caller cancels the call
          this.incomingCallCancelled();
          this.ref.detectChanges()
          break;
        }

        default:
          break;
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When user receives a call , the function notifies the user , if the user is not already on another call
   * If the user is on another call , it show busy to the person that is calling the current user
   * @param
   */
  incomingCallReceived(incomingCall: any) {
    try {
      this.user = incomingCall.sender;
      this.name = incomingCall.sender.name;
      const activeCall = CometChat.getActiveCall();

      //if there is another call in progress
      if (activeCall) {
        CometChat.rejectCall(incomingCall.sessionId, CometChat.CALL_STATUS.BUSY)
          .then((rejectedCall) => {
            //mark as read incoming call message
            this.markMessageAsRead(incomingCall);
            this.actionGenerated.emit({
              type: enums.REJECTED_INCOMING_CALL,
              payLoad: { incomingCall, rejectedCall: rejectedCall },
            });
          })
          .catch((error) => {
            this.actionGenerated.emit({
              type: enums.CALL_ERROR,
              payLoad: error,
            });

            logger("Call rejection failed with error:", error);
          });
      } else if (this.incomingCall === null) {
     
        this.incomingCall = incomingCall;
       

        if (this.incomingCall !== null) {
          this.playAudio();
          this.ref.detectChanges()
         
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * marks the message as read by the current loggedInUser
   * @param
   */
  markMessageAsRead(message: any) {
    try {
      const receiverType = message.receiverType;
      const receiverId =
        receiverType === CometChat.RECEIVER_TYPE.USER
          ? message.sender.uid
          : message.receiverId;

      if (message.hasOwnProperty(enums.READ_AT) === false) {
        CometChat.markAsRead(message);
      }
    } catch (error) {
      logger(error);
    }
  }

  /**
   * When call is cancelled
   * @param
   */
  incomingCallCancelled() {
    //we are not marking this as read as it will done in messagelist component
    this.pauseAudio();
    this.incomingCall = null;
    this.ref.detectChanges()
  }

  /**
   * Rejects call when user click reject
   */
  rejectCall() {
    try {
     
      this.pauseAudio();
      CometChatManager.rejectCall(
        this.incomingCall.sessionId,
        CometChat.CALL_STATUS.REJECTED
      )
        .then((rejectedCall) => {
         
          this.pauseAudio();
          this.actionGenerated.emit({
            type: enums.REJECTED_INCOMING_CALL,
            payLoad: {
              incomingCall: this.incomingCall,
              rejectedCall: rejectedCall,
            },
          });
          this.incomingCall = null;
          this.ref.detectChanges()
        
        })
        .catch((error) => {
          this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });
          this.incomingCall = null;
          this.ref.detectChanges()
        });
    } catch (error) {
      logger(error);
    }
    
  }

  /**
   * When user clicks on button to accept call it emits data about the incoming call that was accepted
   */
  acceptCall() {
    try {
      this.pauseAudio();
     this.acceptIncomingCall()

      // this.actionGenerated.emit({
      //   type: enums.ACCEPT_INCOMING_CALL,
      //   payLoad: this.incomingCall,
      // });
     
    } catch (error) {
      logger(error);
    }
  }
  /**
   * Accepts the incoming call , if call is accpeted by the current user
   * @param
   */
   acceptIncomingCall() {
   
    try {
      CometChatManager.acceptCall(this.incomingCall.sessionId)
        .then((call) => {
          this.actionGenerated.emit({
            type: enums.ACCEPTED_INCOMING_CALL,
            payLoad: call,
          });

          this.callInProgress = true;
          this.ref.detectChanges()

          setTimeout(() => {
            this.startCall(call);
            
          }, 100);
        
        })
        .catch((error) => {
          logger("[CallScreen] acceptCall -- error", error);
          this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });
        });
    } catch (error) {
      logger(error);
    }
  }
    /**
   * Starts the call , if the outgoing call is accepted by the person , that you are calling
   * @param any call
   */
     startCall(call: any) {
   
      try {
        this.incomingCall = null;
        const el = (this.callScreenFrame.nativeElement) ? this.callScreenFrame.nativeElement : null;
        const sessionId = call.getSessionId();
        const callType = call.type;
  
        const callSettings = new CometChat.CallSettingsBuilder()
          .setSessionID(sessionId)
          .enableDefaultLayout(true)
          .setMode(CometChat.CALL_MODE.DEFAULT)
          .setIsAudioOnlyCall(
            callType === CometChat.CALL_TYPE.AUDIO ? true : false
          )
          .build();
  
        CometChat.startCall(
          callSettings,
          el,
          new CometChat.OngoingCallListener({
            onUserJoined: (user: any) => {
              /* Notification received here if another user joins the call. */
              /* this method can be use to display message or perform any actions if someone joining the call */
  
              //call initiator gets the same info in outgoingcallaccpeted event
              if (
                call.callInitiator.uid !== this.loggedInUser.uid &&
                call.callInitiator.uid !== user.uid
              ) {
             
              }
            },
            
            onUserLeft: (user: any) => {
              /* Notification received here if another user left the call. */
  
              /* this method can be use to display message or perform any actions if someone leaving the call */
  
              //call initiator gets the same info in outgoingcallaccpeted event
              if (
                call.callInitiator.uid !== this.loggedInUser.uid &&
                call.callInitiator.uid !== user.uid
              ) {
          
              }
            },
            onCallEnded: (endedCall: any) => {
              /* Notification received here if current ongoing call is ended. */
             this.callInProgress = null
             this.actionGenerated.emit({
              type: enums.CALL_ENDED_BY_USER,
              payLoad: endedCall,
            });
              this.ref.detectChanges()
             
  
              /* hiding/closing the call screen can be done here. */
            },
            
          })
        );
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
