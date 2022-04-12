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
import * as enums from "../../../../utils/enums";
import { CometChatManager } from "../../../../utils/controller";
import { OUTGOING_CALL_ALERT } from "../../../../resources/audio/outgoingCallAlert";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";
@Component({
  selector: "cometchat-outgoing-call",
  templateUrl: "./cometchat-outgoing-call.component.html",
  styleUrls: ["./cometchat-outgoing-call.component.css"],
})
export class CometChatOutgoingCallComponent
  implements OnInit, OnChanges, OnDestroy {
  @ViewChild("callScreenFrame", { static: false }) callScreenFrame!: ElementRef;

  @Input() item: any = null;
  @Input() type: string = '';
  @Input() incomingCall: any = null;
  @Input() outgoingCall = null;

  callInProgress: any = null;
  callListenerId = enums.CALL_SCREEN_ + new Date().getTime();
  outgoingCallScreen: boolean = false;
  errorScreen: boolean = false;
  errorMessage: String = "";

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();

  loggedInUser: any = null;
  audio: any;
  currentTime: any;

  CALLING: String = COMETCHAT_CONSTANTS.CALLING;

  constructor() {}

  ngOnChanges(change: SimpleChanges) {
    try {
      if (change[enums.OUTGOING_CALL]) {
        let prevProps = { outgoingCall: null };
        let props = { outgoingCall: null };

        prevProps[enums.OUTGOING_CALL] =
          change[enums.OUTGOING_CALL].previousValue;
        props[enums.OUTGOING_CALL] = change[enums.OUTGOING_CALL].currentValue;

        if (
          prevProps.outgoingCall !== props.outgoingCall &&
          props.outgoingCall
        ) {
          this.playAudio();

          let call = props.outgoingCall;
          this.outgoingCallScreen = true;
          this.callInProgress = call;
          this.errorScreen = false;
          this.errorMessage = "";
        }
      }

      if (change[enums.INCOMING_CALL]) {
        let prevProps = { incomingCall: null };
        let props = { incomingCall: null };

        prevProps = {
          ...prevProps,
          ...change[enums.INCOMING_CALL].previousValue,
        };
        props = { ...props, ...change[enums.INCOMING_CALL].currentValue };

        if (prevProps.incomingCall !== this.incomingCall && this.incomingCall) {
          this.acceptCall();
        }
      }
    } catch (error) {
      logger(error);
    }
  }

  ngOnInit() {
    try {
      this.setLoggedInUser();

      this.attachListeners();
      this.loadAudio();
    } catch (error) {
      logger(error);
    }
  }

  ngOnDestroy() {
    this.removeListeners();
  }

  /**
   * Listener To Receive Call Actions in Real Time
   * @param function callback
   */
  attachListeners() {
    try {
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onOutgoingCallAccepted: (call: any) => {
            this.callScreenUpdated(enums.OUTGOING_CALL_ACCEPTED, call);
          },
          onOutgoingCallRejected: (call: any) => {
            
            this.callScreenUpdated(enums.OUTGOING_CALL_REJECTED, call);
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
   * Removes the call listeners
   */
  removeListeners() {
    try {
      CometChat.removeCallListener(this.callListenerId);
    } catch (error) {
      logger(error);
    }
  }

  /**
   * Updates the callScreen on basis of call actions
   */
  callScreenUpdated = (key: any, call: any) => {
    try {
      switch (key) {
        case enums.INCOMING_CALL_CANCELLED:
          this.incomingCallCancelled();
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
    } catch (error) {
      logger(error);
    }
  };

  /**
   * closes call screen when the incoming call is cancelled by the user
   * @param any call
   */
  incomingCallCancelled = () => {
    try {
      this.outgoingCallScreen = false;
      this.callInProgress = null;
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Starts the call  , if the call is accepted by the person , to whom you are calling
   * @param any call
   */
  outgoingCallAccepted = (call: any) => {
    try {
      if (this.outgoingCallScreen) {
        this.pauseAudio();
        this.outgoingCallScreen = false;
        this.callInProgress = call;

        this.startCall(call);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * closes the call screen , if the person you are calling has rejected the call or the person is busy in some other call
   * @param any call
   */
  outgoingCallRejected = (call: any) => {
    try {
      if (
        call.hasOwnProperty(enums.STATUS) &&
        call.status === CometChat.CALL_STATUS.BUSY
      ) {
        //show busy message.
        const errorMessage = `${call.sender.name} is on another call.`;
        this.errorScreen = true;
        this.errorMessage = errorMessage;
      } else {
        this.pauseAudio();
        this.actionGenerated.emit({
          type: enums.OUT_GOING_CALL_REJECTED,
          payLoad: call,
        });
        this.outgoingCallScreen = false;
        this.callInProgress = null;
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Starts the call , if the outgoing call is accepted by the person , that you are calling
   * @param any call
   */
  startCall(call: any) {
   
    try {
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
          
          onUserLeft: (user: any) => {
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
                action: enums.LEFT,
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
          onCallEnded: (endedCall: any) => {
            /* Notification received here if current ongoing call is ended. */

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
    } catch (error) {
      logger(error);
    }

   
  }

  /**
   * Marks messages as Read
   * @param any message
   */
  markMessageAsRead = (message: any) => {
    try {
      const type = message.receiverType;
      const id =
        type === CometChat.RECEIVER_TYPE.USER
          ? message.sender.uid
          : message.receiverId;

      if (message.hasOwnProperty(enums.READ_AT) === false) {
        CometChat.markAsRead(message);
      }
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Accepts the incoming call , if call is accpeted by the current user
   * @param
   */
  acceptCall() {
   
    try {
      CometChatManager.acceptCall(this.incomingCall.sessionId)
        .then((call) => {
          this.actionGenerated.emit({
            type: enums.ACCEPTED_INCOMING_CALL,
            payLoad: call,
          });

          this.outgoingCallScreen = false;
          this.callInProgress = call;
          this.errorScreen = false;
          this.errorMessage = "";
          setTimeout(() => {
            this.startCall(call);
          }, 1000);
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
   * Cancels the call , made by the current user
   * @param
   */
  cancelCall = () => {
    try {
      this.pauseAudio();
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
    } catch (error) {
      logger(error);
    }
  };

  /**
   * Gets The current loggedIn user information
   * @param
   */
  setLoggedInUser() {
    try {
      CometChat.getLoggedinUser()
        .then((user) => {
          this.loggedInUser = user;
        })
        .catch((error) => {
          logger("failed to get the loggedIn user", error);
        });
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
      this.audio.src = OUTGOING_CALL_ALERT;
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
