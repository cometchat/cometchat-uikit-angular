import { Component, OnInit, Input, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CallScreenManager } from './CometChatManager';
import { CometChat } from '@cometchat-pro/chat';
import { CALL_SCREEN_ACTIONS } from '../string_constants';
import { Helper } from '../helpers/helper';
import { DomSanitizer } from '@angular/platform-browser';


@Component({
  selector: 'app-calling-screen',
  templateUrl: './calling-screen.component.html',
  styleUrls: ['./calling-screen.component.scss']
})
export class CallingScreenComponent implements OnInit, OnChanges {

  callingScreenManager: CallScreenManager = new CallScreenManager();

  toUser?: CometChat.User;
  toGroup?: CometChat.Group;
  @Input() inProgressCall;
  name?: string;
  image?: any;
  callInProgress: boolean = false;
  outgoingScreen = false;
  @Input() incomingScreen?;

  @Output() actionPerformed = new EventEmitter<{ action: string, payload?: object | any }>();
  json = JSON;

  constructor(private sanitizer: DomSanitizer, private cdRef: ChangeDetectorRef) {

  }


  ngOnInit() {
    this.callingScreenManager.isLoggedIn(this.isChatReady);
    let tempCall = new CometChat.Call("", "", "");
  }
  ngOnChanges() {

    let tempCall = new CometChat.Call("", "", "");
    if (this.inProgressCall && !(typeof (this.inProgressCall) === 'object')) {
      this.inProgressCall = Object.assign(tempCall, JSON.parse(this.inProgressCall)) as CometChat.Call;
      if ((this.inProgressCall as CometChat.Call).getReceiverType() === 'group') {
        let tempGroup = new CometChat.Group('', '', '');
        this.toGroup = Object.assign(tempGroup, (this.inProgressCall as CometChat.Call).getReceiver() as CometChat.Group)
        this.name = this.toGroup.getName();
        this.image = this.sanitizer.bypassSecurityTrustResourceUrl((this.toGroup.getIcon() ? this.toGroup.getIcon() : Helper.getSVGAvatar(this.toGroup.getGuid(), '#' + this.toGroup.getName().substr(0, 1))));

      } else {

        let tempUser = new CometChat.User({});

        if (this.incomingScreen) {
          this.toUser = Object.assign(tempUser, (this.inProgressCall as CometChat.Call).getSender() as CometChat.User);
          this.name = this.toUser.getName();
          this.image = this.sanitizer.bypassSecurityTrustResourceUrl(this.toUser.getAvatar() ? this.toUser.getAvatar() : Helper.getSVGAvatar(this.toUser.getUid(), this.toUser.getName().substr(0, 1)));
        } else {
          this.toUser = Object.assign(tempUser, (this.inProgressCall as CometChat.Call).getReceiver() as CometChat.User);
          this.name = this.toUser.getName();
          this.image = this.sanitizer.bypassSecurityTrustResourceUrl(this.toUser.getAvatar() ? this.toUser.getAvatar() : Helper.getSVGAvatar(this.toUser.getUid(), this.toUser.getName().substr(0, 1)));
        }

      }
      this.callInProgress = true;
      if (this.incomingScreen) {
        this.incomingScreen = true;
      } else {
        this.outgoingScreen = true;
      }

    }
  }
  endIncomingCall($evenet) {
    try {
      let sessionID = (this.inProgressCall as CometChat.Call).getSessionId();
      CometChat.rejectCall(sessionID, CometChat.CALL_STATUS.REJECTED).then(call => {
        this.hideCallScreen();
      }, error => {
        this.hideCallScreen();
      });
    } catch (e) {
      this.hideCallScreen();
    }

  }
  acceptIncomingCall($event) {
    try {
      let sessionID = (this.inProgressCall as CometChat.Call).getSessionId();
      CometChat.acceptCall(sessionID).then(
        call => {
          // start the call using the startCall() method
          let sessionID = call.getSessionId();
          this.outgoingScreen = false;
          this.incomingScreen = false;
          this.cdRef.detectChanges();
          CometChat.startCall(
            sessionID,
            document.getElementById("callScreen"),
            new CometChat.OngoingCallListener({
              onUserJoined: user => {
                /* Notification received here if another user joins the call. */

                /* this method can be use to display message or perform any actions if someone joining the call */
              },
              onUserLeft: user => {
                /* Notification received here if another user left the call. */

                /* this method can be use to display message or perform any actions if someone leaving the call */
              },
              onCallEnded: call => {
                /* Notification received here if current ongoing call is ended. */
                this.endIncomingCall(call);
                /* hiding/closing the call screen can be done here. */
              }
            })
          );
        },
        error => {

          this.hideCallScreen();

        }
      );
    } catch (e) {
      this.hideCallScreen();
    }

  }
  endOutGoingCall($event) {
    CometChat.rejectCall(this.inProgressCall.getSessionId(), CometChat.CALL_STATUS.CANCELLED).then(rejectedCall => {
      this.inProgressCall = rejectedCall
      this.callInProgress = false;
      this.hideCallScreen();
    }, error => {
      //TODO handle errr on rejected call
    })
  }
  callback = (event: { action: string, payload?: object | any }) => {
    switch (event.action) {
      case CALL_SCREEN_ACTIONS.INCOMING_CALL_RECEIVED: {
        this.inProgressCall = event.payload.call;
        this.callInProgress = true;
        let sessionID = (this.inProgressCall as CometChat.Call).getSessionId();

        let tempUser = new CometChat.User({});
        this.toUser = Object.assign(tempUser, (this.inProgressCall as CometChat.Call).getSender() as CometChat.User);
        this.name = this.toUser.getName();
        this.image = this.sanitizer.bypassSecurityTrustResourceUrl(this.toUser.getAvatar() ? this.toUser.getAvatar() : Helper.getSVGAvatar(this.toUser.getUid(), this.toUser.getName().substr(0, 1)))
        this.incomingScreen = true;
        this.outgoingScreen = false;
        this.cdRef.detectChanges();

        break;
      }
      case CALL_SCREEN_ACTIONS.OUTGOING_CALL_REJECTED: {
        this.inProgressCall = event.payload.call;
        this.callInProgress = false;
        this.hideCallScreen();
        break;
      }
      case CALL_SCREEN_ACTIONS.INCOMING_CALL_CANCELLED: {
        this.inProgressCall = event.payload.call;
        this.hideCallScreen();
        break;
      }
      case CALL_SCREEN_ACTIONS.OUTGOING_CALL_ACCEPTED: {
        this.outgoingScreen = false;
        this.incomingScreen = false;
        this.cdRef.detectChanges();
        CometChat.startCall(
          (this.inProgressCall as CometChat.Call).getSessionId(),
          document.getElementById("callScreen"),
          new CometChat.OngoingCallListener({
            onUserJoined: user => {
              /* Notification received here if another user joins the call. */

              /* this method can be use to display message or perform any actions if someone joining the call */
            },
            onUserLeft: user => {
              /* Notification received here if another user left the call. */

              /* this method can be use to display message or perform any actions if someone leaving the call */
            },
            onCallEnded: call => {
              /* Notification received here if current ongoing call is ended. */

              this.hideCallScreen();
              /* hiding/closing the call screen can be done here. */
            }
          })
        );
        break;
      }
    }
  }

  hideCallScreen() {
    this.toGroup = undefined;
    this.toUser = undefined;
    this.outgoingScreen = false;
    this.incomingScreen = false;
    this.callInProgress = false;
    this.inProgressCall = undefined;
    this.cdRef.detectChanges();
    this.actionPerformed.emit({ action: CALL_SCREEN_ACTIONS.HIDE_SCREEN, payload: {} });
  }
  isChatReady = (user?: CometChat.User, error?) => {
    if (user) {
      this.callingScreenManager.attachListener(this.callback);
      // TODO set the current logged in user.
    } else {
      // TODO show error that cometchat user log in is failed.
    }
  }
}
