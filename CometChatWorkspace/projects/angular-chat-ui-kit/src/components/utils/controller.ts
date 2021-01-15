import { CometChat } from "@cometchat-pro/chat";

export class CometChatManager {
  loggedInUser;
  isUserLoggedIn;

  /**
   * Gets LoggedIn Information of User
   */
  getLoggedInUser() {
    let timerCounter = 10000;
    let timer = 0;

    return new Promise((resolve, reject) => {
      if (timerCounter === timer) reject(`timer reached ${timerCounter}`);

      if (this.loggedInUser) resolve(this.loggedInUser);

      if (!CometChat.isInitialized()) reject("CometChat not initialized");

      this.isUserLoggedIn = setInterval(() => {
        CometChat.getLoggedinUser().then(
          (user) => {
            this.loggedInUser = user;
            clearInterval(this.isUserLoggedIn);
            resolve(user);
          },
          (error) => {
            console.log(error);
            reject(error);
          }
        );

        timer += 100;
      }, 100);
    });
  }

  /**
   * Blocks the User
   * @param
   */
  static blockUsers(userList) {
    let promise = new Promise((resolve, reject) => {
      CometChat.blockUsers(userList).then(
        (list) => resolve(list),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * Unblocks the User
   * @param
   */
  static unblockUsers(userList) {
    let promise = new Promise((resolve, reject) => {
      CometChat.unblockUsers(userList).then(
        (list) => resolve(list),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * Starts audio call
   * @param
   */
  static audioCall(receiverID, receiverType, callType) {
    let promise = new Promise((resolve, reject) => {
      const call = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(call).then(
        (call) => resolve(call),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * Rejectes the call
   * @param
   */
  static rejectCall(sessionId, rejectStatus) {
    let promise = new Promise((resolve, reject) => {
      CometChat.rejectCall(sessionId, rejectStatus).then(
        (call) => resolve(call),
        (error) => reject(error)
      );
    });

    return promise;
  }

  static call(receiverID, receiverType, callType) {
    let promise = new Promise((resolve, reject) => {
      const call = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(call).then(
        (call) => resolve(call),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * Accepts a call
   * @param
   */
  static acceptCall(sessionId) {
    let promise = new Promise((resolve, reject) => {
      CometChat.acceptCall(sessionId).then(
        (call) => resolve(call),
        (error) => reject(error)
      );
    });

    return promise;
  }

  /**
   * Starts a video call
   * @param
   */
  static videoCall(receiverID, receiverType, callType) {
    let promise = new Promise((resolve, reject) => {
      const call = new CometChat.Call(receiverID, callType, receiverType);
      CometChat.initiateCall(call).then(
        (call) => resolve(call),
        (error) => reject(error)
      );
    });

    return promise;
  }
}

export default CometChatManager;
