import { CometChat } from "@cometchat-pro/chat";
import { logger } from "./common";

export class CometChatManager {
  /**
   * Blocks the User
   * @param
   */
  static blockUsers(userList: any) {
    //try {
      let promise = new Promise((resolve, reject) => {
        CometChat.blockUsers(userList).then(
          (list) => resolve(list),
          (error) => reject(error)
        );
      });

      return promise;
    //} catch (error) {
    //  logger(error);
    //}
  }

  /**
   * Unblocks the User
   * @param
   */
  static unblockUsers(userList: any) {
    //try {
      let promise = new Promise((resolve, reject) => {
        CometChat.unblockUsers(userList).then(
          (list) => resolve(list),
          (error) => reject(error)
        );
      });

      return promise;
    //} catch (error) {
    //  logger(error);
    //}
  }

  /**
   * Rejectes the call
   * @param
   */
  static rejectCall(sessionId: any, rejectStatus: any) {
    //try {
      let promise = new Promise((resolve, reject) => {
        CometChat.rejectCall(sessionId, rejectStatus).then(
          (call) => resolve(call),
          (error) => reject(error)
        );
      });

      return promise;
    //} catch (error) {
    //  logger(error);
    //}
  }

  static call(receiverID: any, receiverType: any, callType: any) {
    //try {
      let promise = new Promise((resolve, reject) => {
        const call = new CometChat.Call(receiverID, callType, receiverType);
        CometChat.initiateCall(call).then(
          (call) => resolve(call),
          (error) => reject(error)
        );
      });

      return promise;
    //} catch (error) {
    //  logger(error);
    //}
  }
 
  /**
   * Accepts a call
   * @param
   */
  static acceptCall(sessionId: any) {
    //try {
      let promise = new Promise((resolve, reject) => {
        CometChat.acceptCall(sessionId).then(
          (call) => resolve(call),
          (error) => reject(error)
        );
      });

      return promise;
    //} catch (error) {
    //  logger(error);
    //}
  }
}

export default CometChatManager;
