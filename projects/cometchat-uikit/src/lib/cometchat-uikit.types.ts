/**
 * Types and interfaces for CometChatUIKit service.
 */

/**
 * Interface for the CometChat UIKit window object.
 * Registered on window.CometChatUiKit for SDK identification.
 */
export interface CometChatUiKitWindow {
  name: string;
  version: string;
}

declare global {
  interface Window {
    CometChatUiKit: CometChatUiKitWindow;
  }
}
