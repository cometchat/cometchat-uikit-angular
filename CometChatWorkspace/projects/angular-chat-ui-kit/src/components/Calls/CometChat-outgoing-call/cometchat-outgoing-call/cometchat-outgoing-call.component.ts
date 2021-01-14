import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  OnDestroy,
} from "@angular/core";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../utils/enums";
import { CometChatManager } from "../../../utils/controller";
import { OUTGOING_CALL_ALERT } from "../../../resources/audio/outgoingCallAlert";
import { STRING_MESSAGES } from "../../../utils/messageConstants";
@Component({
  selector: "cometchat-outgoing-call",
  templateUrl: "./cometchat-outgoing-call.component.html",
  styleUrls: ["./cometchat-outgoing-call.component.css"],
})
export class CometChatOutgoingCallComponent
  implements OnInit, OnChanges, OnDestroy {
  @ViewChild("callScreenFrame", { static: false }) callScreenFrame: ElementRef;

  @Input() item = null;
  @Input() type = null;
  @Input() incomingCall = null;
  @Input() outgoingCall = null;

  callInProgress = null;
  callListenerId = "callscreen_" + new Date().getTime();
  outgoingCallScreen: boolean = false;
  errorScreen: boolean = false;
  errorMessage: String = "";

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  loggedInUser = null;
  audio;

  CALLING: String = STRING_MESSAGES.CALLING;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    if (change["outgoingCall"]) {
      let prevProps = { outgoingCall: null };
      let props = { outgoingCall: null };

      prevProps["outgoingCall"] = change["outgoingCall"].previousValue;
      props["outgoingCall"] = change["outgoingCall"].currentValue;

      if (prevProps.outgoingCall !== props.outgoingCall && props.outgoingCall) {
        // this.playOutgoingAlert();
        this.playAudio();

        let call = props.outgoingCall;
        this.outgoingCallScreen = true;
        this.callInProgress = call;
        this.errorScreen = false;
        this.errorMessage = "";
      }
    }

    if (change["incomingCall"]) {
      let prevProps = { incomingCall: null };
      let props = { incomingCall: null };

      prevProps = { ...prevProps, ...change["incomingCall"].previousValue };
      props = { ...props, ...change["incomingCall"].currentValue };

      if (prevProps.incomingCall !== this.incomingCall && this.incomingCall) {
        this.acceptCall();
      }
    }
  }

  ngOnInit() {
    this.setLoggedInUser();

    this.attachListeners();
    this.loadAudio();
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  /**
   * Listener To Receive Call Actions in Real Time
   * @param function callback
   */
  attachListeners() {
    CometChat.addCallListener(
      this.callListenerId,
      new CometChat.CallListener({
        onOutgoingCallAccepted: (call) => {
          this.callScreenUpdated(enums.OUTGOING_CALL_ACCEPTED, call);
        },
        onOutgoingCallRejected: (call) => {
          this.callScreenUpdated(enums.OUTGOING_CALL_REJECTED, call);
        },
        onIncomingCallCancelled: (call) => {
          this.callScreenUpdated(enums.INCOMING_CALL_CANCELLED, call);
        },
      })
    );
  }

  /**
   * Removes the call listeners
   */
  removeListeners() {
    CometChat.removeCallListener(this.callListenerId);
  }

  /**
   * Updates the callScreen on basis of call actions
   */
  callScreenUpdated = (key, call) => {
    switch (key) {
      case enums.INCOMING_CALL_CANCELLED:
        this.incomingCallCancelled(call);
        break;
      case enums.OUTGOING_CALL_ACCEPTED: //occurs at the caller end
        this.outgoingCallAccepted(call);
        break;
      case enums.OUTGOING_CALL_REJECTED: //occurs at the caller end, callee rejects the call
        this.outgoingCallRejected(call);
        break;
      default:
        break;
    }
  };

  /**
   * closes call screen when the incoming call is cancelled by the user
   * @param any call
   */
  incomingCallCancelled = (call) => {
    this.outgoingCallScreen = false;
    this.callInProgress = null;
  };

  /**
   * Starts the call , if the call is accepted by the person , to whom you are calling
   * @param any call
   */
  outgoingCallAccepted = (call) => {
    if (this.outgoingCallScreen) {
      // this.pauseOutgoingAlert();
      this.pauseAudio();
      this.outgoingCallScreen = false;
      this.callInProgress = call;

      this.startCall(call);
    }
  };

  /**
   * closes the call screen , if the person you are calling has rejected the call or the person is busy in some other call
   * @param any call
   */
  outgoingCallRejected = (call) => {
    if (
      call.hasOwnProperty("status") &&
      call.status === CometChat.CALL_STATUS.BUSY
    ) {
      //show busy message.
      const errorMessage = `${call.sender.name} is on another call.`;
      this.errorScreen = true;
      this.errorMessage = errorMessage;
    } else {
      // this.pauseOutgoingAlert();
      this.pauseAudio();
      this.actionGenerated.emit({
        type: enums.OUT_GOING_CALL_REJECTED,
        payLoad: call,
      });
      this.outgoingCallScreen = false;
      this.callInProgress = null;
    }
  };

  /**
   * Starts the call , if the outgoing call is accepted by the person , that you are calling
   * @param any call
   */
  startCall(call) {
    const el = this.callScreenFrame.nativeElement;

    CometChat.startCall(
      call.getSessionId(),
      el,
      new CometChat.OngoingCallListener({
        onUserJoined: (user) => {
          /* Notification received here if another user joins the call. */
          /* this method can be use to display message or perform any actions if someone joining the call */

          //call initiator gets the same info in outgoingcallaccpeted event
          if (
            call.callInitiator.uid !== this.loggedInUser.uid &&
            call.callInitiator.uid !== user.uid
          ) {
            this.markMessageAsRead(call);

            const callMessage = {
              category: call.category,
              type: call.type,
              action: call.action,
              status: call.status,
              callInitiator: call.callInitiator,
              callReceiver: call.callReceiver,
              receiverId: call.receiverId,
              receiverType: call.receiverType,
              sentAt: call.sentAt,
              sender: { ...user },
            };
            this.actionGenerated.emit({
              type: enums.USER_JOINED_CALL,
              payLoad: callMessage,
            });
          }
        },
        onUserLeft: (user) => {
          /* Notification received here if another user left the call. */

          /* this method can be use to display message or perform any actions if someone leaving the call */

          //call initiator gets the same info in outgoingcallaccpeted event
          if (
            call.callInitiator.uid !== this.loggedInUser.uid &&
            call.callInitiator.uid !== user.uid
          ) {
            this.markMessageAsRead(call);

            const callMessage = {
              category: call.category,
              type: call.type,
              action: "left",
              status: call.status,
              callInitiator: call.callInitiator,
              callReceiver: call.callReceiver,
              receiverId: call.receiverId,
              receiverType: call.receiverType,
              sentAt: call.sentAt,
              sender: { ...user },
            };

            this.actionGenerated.emit({
              type: enums.USER_LEFT_CALL,
              payLoad: callMessage,
            });
          }
        },
        onCallEnded: (endedCall) => {
          /* Notification received here if current ongoing call is ended. */
          //console.log("call ended:", enums.CALL_ENDED, call);

          // this.setState({ showOutgoingScreen: false, callInProgress: null });

          // this.showOutgoingScreen = false;
          this.outgoingCallScreen = false;
          this.callInProgress = null;

          this.markMessageAsRead(endedCall);
          this.actionGenerated.emit({
            type: enums.CALL_ENDED_BY_USER,
            payLoad: endedCall,
          });
          /* hiding/closing the call screen can be done here. */
        },
      })
    );
  }

  /**
   * Marks messages as Read
   * @param any message
   */
  markMessageAsRead = (message) => {
    const type = message.receiverType;
    const id = type === "user" ? message.sender.uid : message.receiverId;

    if (message.hasOwnProperty("readAt") === false) {
      CometChat.markAsRead(message.id, id, type);
    }
  };

  /**
   * Accepts the incoming call , if call is accpeted by the current user
   * @param
   */
  acceptCall() {
    CometChatManager.acceptCall(this.incomingCall.sessionId)
      .then((call) => {
        this.actionGenerated.emit({
          type: enums.ACCEPTED_INCOMING_CALL,
          payLoad: call,
        });

        this.outgoingCallScreen = false;
        this.callInProgress = call;
        this.errorScreen = false;
        this.errorMessage = null;
        setTimeout(() => {
          this.startCall(call);
        }, 1000);
      })
      .catch((error) => {
        console.log("[CallScreen] acceptCall -- error", error);
        this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });
      });
  }

  /**
   * Cancels the call , made by the current user
   * @param
   */
  cancelCall = () => {
    this.pauseAudio();
    // this.pauseOutgoingAlert();
    CometChatManager.rejectCall(
      this.callInProgress.sessionId,
      CometChat.CALL_STATUS.CANCELLED
    )
      .then((call) => {
        this.actionGenerated.emit({
          type: enums.OUTGOING_CALL_CANCELLED,
          payLoad: call,
        });
        this.outgoingCallScreen = false;
        this.callInProgress = null;
      })
      .catch((error) => {
        this.actionGenerated.emit({ type: enums.CALL_ERROR, payLoad: error });
        this.outgoingCallScreen = false;
        this.callInProgress = null;
      });
  };

  /**
   * Gets The current loggedIn user information
   * @param
   */
  setLoggedInUser() {
    CometChat.getLoggedinUser()
      .then((user) => {
        this.loggedInUser = user;
      })
      .catch((error) => {
        console.log("failed to get the loggedIn user", error);
      });
  }
  /**
   * Loads the audio
   */
  loadAudio() {
    this.audio = new Audio();
    this.audio.src = OUTGOING_CALL_ALERT;
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
