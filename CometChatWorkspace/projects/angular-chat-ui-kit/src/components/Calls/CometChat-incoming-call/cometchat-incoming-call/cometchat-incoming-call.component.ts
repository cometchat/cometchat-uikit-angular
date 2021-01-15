import { Component, OnInit, Output, EventEmitter } from "@angular/core";
import * as enums from "../../../utils/enums";
import { CometChat } from "@cometchat-pro/chat";
import { CometChatManager } from "../../../utils/controller";
import { INCOMING_CALL_ALERT } from "../../../resources/audio/incomingCallAlert";
import { trigger, style, transition, animate } from "@angular/animations";
import { STRING_MESSAGES } from "../../../utils/messageConstants";

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
export class CometChatIncomingCallComponent implements OnInit {
  incomingCall = null;
  callInProgress = null;
  callListenerId = "incoming_call_" + new Date().getTime();
  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  user;
  name: string;
  audio;

  INCOMING_AUDIO_CALL: String = STRING_MESSAGES.INCOMING_AUDIO_CALL;
  INCOMING_VIDEO_CALL: String = STRING_MESSAGES.INCOMING_VIDEO_CALL;
  DECLINE: String = STRING_MESSAGES.DECLINE;
  ACCEPT: String = STRING_MESSAGES.ACCEPT;

  constructor() {}
  // ngOnDestroy() {
  //   this.removeListeners();
  // }

  ngOnInit() {
    this.attachListeners();
    this.loadAudio();
  }

  attachListeners() {
    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onIncomingCallReceived: (call) => {
          this.callScreenUpdated(enums.INCOMING_CALL_RECEIVED, call);
        },
        onIncomingCallCancelled: (call) => {
          this.callScreenUpdated(enums.INCOMING_CALL_CANCELLED, call);
        },
      })
    );
  }

  removeListeners() {
    CometChat.removeCallListener(this.callListenerId);
  }

  callScreenUpdated(key, call) {
    switch (key) {
      case enums.INCOMING_CALL_RECEIVED: {
        //occurs at the callee end
        this.incomingCallReceived(call);
        break;
      }
      case enums.INCOMING_CALL_CANCELLED: {
        //occurs(call dismissed) at the callee end, caller cancels the call
        this.incomingCallCancelled(call);
        break;
      }

      default:
        break;
    }
  }

  /**
   * When user receives a call
   * @param
   */
  incomingCallReceived(incomingCall) {
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
          this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });

          console.log("Call rejection failed with error:", error);
        });
    } else if (this.incomingCall === null) {
      this.incomingCall = incomingCall;
      if (this.incomingCall !== null) {
        this.playAudio();
      }
    }
  }

  markMessageAsRead(message) {
    const receiverType = message.receiverType;
    const receiverId =
      receiverType === "user" ? message.sender.uid : message.receiverId;

    if (message.hasOwnProperty("readAt") === false) {
      CometChat.markAsRead(message.id, receiverId, receiverType);
    }
  }

  /**
   * When call is cancelled
   * @param
   */
  incomingCallCancelled(call) {
    //we are not marking this as read as it will done in messagelist component
    this.pauseAudio();
    this.incomingCall = null;
  }

  /**
   * Rejects call when user click reject
   */
  rejectCall() {
    this.pauseAudio();
    CometChatManager.rejectCall(
      this.incomingCall.sessionId,
      CometChat.CALL_STATUS.REJECTED
    )
      .then((rejectedCall) => {
        this.actionGenerated.emit({
          type: enums.REJECTED_INCOMING_CALL,
          payLoad: {
            incomingCall: this.incomingCall,
            rejectedCall: rejectedCall,
          },
        });
        this.incomingCall = null;
      })
      .catch((error) => {
        this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });
        this.incomingCall = null;
      });
  }

  /**
   * When user clicks on button to accept call it emits data
   */
  acceptCall() {
    //this.pauseIncomingAlert();
    this.pauseAudio();

    this.actionGenerated.emit({
      type: enums.ACCEPT_INCOMING_CALL,
      payLoad: this.incomingCall,
    });
    this.incomingCall = null;
    //     this.callInProgress=this.callInProgress
  }

  /**
   * Loads the audio
   */
  loadAudio() {
    this.audio = new Audio();
    this.audio.src = INCOMING_CALL_ALERT;
  }

  /**
   * Plays Audio in loop
   */
  playAudio() {
    this.audio.currentTime = 0;
    if (typeof this.audio.loop == "boolean") {
      this.audio.loop = true;
    } else {
      this.audio.addEventListener(
        "ended",
        function () {
          this.currentTime = 0;
          this.play();
        },
        false
      );
    }
    this.audio.play();
  }

  /**
   * Pauses audio
   */
  pauseAudio() {
    this.audio.pause();
  }
}
