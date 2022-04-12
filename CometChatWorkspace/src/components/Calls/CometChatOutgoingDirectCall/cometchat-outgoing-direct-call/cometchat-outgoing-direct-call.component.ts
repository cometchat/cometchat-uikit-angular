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

} from "@angular/core";
import { ID, getUnixTimestamp } from "../../../../utils/common";
import { CometChat } from "@cometchat-pro/chat";
import * as enums from "../../../../utils/enums";
import { OUTGOING_CALL_ALERT } from "../../../../resources/audio/outgoingCallAlert";
import { COMETCHAT_CONSTANTS } from "../../../../utils/messageConstants";
import { logger } from "../../../../utils/common";

@Component({
  selector: "cometchat-outgoing-direct-call",
  templateUrl: "./cometchat-outgoing-direct-call.component.html",
  styleUrls: ["./cometchat-outgoing-direct-call.component.css"],
})
export class CometChatOutgoingDirectCallComponent
  implements OnInit, OnChanges {
  @Input() item: any = null;
  @Input() type: string | null= '';
  @Input() incomingDirectCall: any = null;
  @Input() outgoingDirectCall: any = null;
  @Input() joinCall: any = null

  @Input() callInProgress: any = null;
  callListenerId = enums.CALL_SCREEN_ + new Date().getTime();
  outgoingCallScreen: boolean = false;
  errorScreen: boolean = false;
  errorMessage: String = "";

  @Output() actionGenerated: EventEmitter<any> = new EventEmitter();
  @ViewChild("callScreen", { static: false }) callScreen!: ElementRef;


  loggedInUser: any = null;
  audio: any;
  currentTime: any;
  sessionID: any;

  CALLING: String = COMETCHAT_CONSTANTS.CALLING;

  constructor() { }

  ngOnChanges(change: SimpleChanges) {
    if (this.type == enums.DIRECT_CALL) {
      this.callInProgress = true
      setTimeout(() => {
        this.startCall()
      }, 10);
    }
    if (this.type == enums.SESSION_ID && !this.callInProgress) {
      this.callInProgress = true
      setTimeout(() => {
        this.joinDirectCall(this.joinCall)
      }, 100);


    }

    try {

      if (change[enums.OUTGOING_DIRECT_CALL]) {
        
        let prevProps:any = { outgoingDirectCall: null };
        let props:any = { outgoingDirectCall: null };

        prevProps[enums.OUTGOING_DIRECT_CALL] =
          change[enums.OUTGOING_DIRECT_CALL].previousValue;
        props[enums.OUTGOING_DIRECT_CALL] = change[enums.OUTGOING_DIRECT_CALL].currentValue;

        if (
          prevProps.outgoingDirectCall !== props.outgoingDirectCall &&
          props.outgoingDirectCall
        ) {
          this.playAudio();

          let call = props.outgoingDirectCall;
          this.outgoingCallScreen = true;
          this.callInProgress = call;
          this.errorScreen = false;
          this.errorMessage = "";
        }
      }

      if (change[enums.INCOMING_DIRECT_CALL]) {
        let prevProps = { incominDirectCall: null };
        let props = { incominDirectCall: null };

        prevProps = {
          ...prevProps,
          ...change[enums.INCOMING_DIRECT_CALL].previousValue,
        };
        props = { ...props, ...change[enums.INCOMING_DIRECT_CALL].currentValue };

        if (prevProps.incominDirectCall !== this.incomingDirectCall && this.incomingDirectCall) {

        }
      }
    } catch (error) {
      logger(error);
    }
  }
  ngAfterContentInit() {

  }

  ngOnInit() {
  

    try {
      this.setLoggedInUser();


      this.loadAudio();
    } catch (error) {
      logger(error);
    }
  }
  joinDirectCall(session:string) {
    localStorage.setItem("isIncomingCall","accepted")
    let sessionID = session;
    let audioOnly = false;
    let defaultLayout = true;
    let callSettings = new CometChat.CallSettingsBuilder()
      .enableDefaultLayout(defaultLayout)
      // .setMode(CometChat.CALL_MODE.DEFAULT)
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
          localStorage.removeItem("isIncomingCall")
          // console.log("Call ended:", call);
          this.stopDirectCall()
        },
        onError: (error:object) => {
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


  stopDirectCall() {
    
    this.actionGenerated.emit({
      type: enums.DIRECT_CALL_ENDED
    })
    this.callInProgress = null
    this.type = null

    if(localStorage.getItem("isIncomingCall")){
      localStorage.removeItem("isIncomingCall")
    }
  }

  startCall() {
    try {
      let sessionID = this.item.guid;
      this.sessionID = sessionID
      let audioOnly = false;
      let defaultLayout = true;
      if (sessionID && this.callScreen) {
        localStorage.setItem("isIncomingCall","accepted")
        this.actionGenerated.emit({
          type: enums.OUTGOING_DIRECT_CALL,
          sessionid: sessionID,
          guid: this.item.guid,
          initiator: this.loggedInUser.uid

        })
      }
      

      let callSettings = new CometChat.CallSettingsBuilder()
        .enableDefaultLayout(defaultLayout)
        .setSessionID(sessionID)
        // .setMode(CometChat.CALL_MODE.DEFAULT)
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
            // console.log("Call ended:", call);
            this.stopDirectCall()
          },
          onError: (error:object) => {
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

    catch (error) {

      logger(error);
    }
    this.sendCustomMessage()

  }
  sendCustomMessage() {
    let receiverId = this.item.guid
    const receiverType = CometChat.RECEIVER_TYPE.GROUP;
    const customData = { "sessionID": this.sessionID, "sessionId": this.sessionID, "callType": CometChat.CALL_TYPE.VIDEO };
    const customType = enums.CALL_TYPE_DIRECT;
    const conversationId = `group_${this.sessionID}`;

    const customMessage: any = new CometChat.CustomMessage(receiverId, receiverType, customType, customData);
    customMessage.setSender(this.loggedInUser);
    customMessage.setReceiver((receiverType as any));
    customMessage.setConversationId(conversationId);
    customMessage.composedAt = getUnixTimestamp();
    customMessage.id = ID();
    // custom message

    CometChat.sendCustomMessage(customMessage).then((msg) => {
      this.actionGenerated.emit({
        type: enums.DIRECT_CALL_STARTED,
        payLoad: msg

      })



    })

  }
  attachListeners() {
    try {
      CometChat.addCallListener(
        this.callListenerId,
        new CometChat.CallListener({
          onOutgoingCallAccepted: (call: any) => {
          },
          onOutgoingCallRejected: (call: any) => {

          },
          onIncomingCallCancelled: (call: any) => {
            this.callInProgress = false

          },
          onCallEnded: (call: any) => {
            console.log("cancelled")

          }
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
