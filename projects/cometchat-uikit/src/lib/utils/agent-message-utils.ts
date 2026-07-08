import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Extract copyable text from an AIAssistantMessage.
 *
 * Iterates over `getElements()`, skipping elements with type 'card',
 * and concatenates text from remaining elements.
 * Falls back to `getAssistantMessageData().getText()` when no elements exist.
 *
 * @param message - A BaseMessage expected to be an AIAssistantMessage
 * @returns Plain text suitable for clipboard copy
 */
export function getAgentMessageCopyText(message: CometChat.BaseMessage): string {
  const aiMessage = message as CometChat.AIAssistantMessage;
  let elements: CometChat.AIAssistantElement[] | undefined;

  try {
    elements = aiMessage.getElements?.();
  } catch {
    elements = undefined;
  }

  if (Array.isArray(elements) && elements.length > 0) {
    const text = elements.reduce((prev: string, element) => {
      // Skip card elements for copy
      if (element.getType?.() === 'card') return prev;
      const data = element.getData?.();
      const elementText = typeof data === 'string' ? data : (data?.text ?? '');
      if (!elementText) return prev;
      return prev + elementText + '\n';
    }, '');
    const trimmed = text.trim();
    if (trimmed) return trimmed;
  }

  // Fallback: outer text field
  try {
    return aiMessage.getAssistantMessageData?.()?.getText?.() || '';
  } catch {
    return '';
  }
}

/**
 * Extract subtitle preview text from an AIAssistantMessage.
 *
 * Iterates over `getElements()`, including card `fallbackText` and other element texts.
 * Falls back to `getAssistantMessageData().getText()` when no elements exist.
 *
 * @param message - A BaseMessage expected to be an AIAssistantMessage
 * @returns Preview text suitable for conversation list subtitle
 */
export function getAgentMessageSubtitleText(message: CometChat.BaseMessage): string {
  const aiMessage = message as CometChat.AIAssistantMessage;
  let elements: CometChat.AIAssistantElement[] | undefined;

  try {
    elements = aiMessage.getElements?.();
  } catch {
    elements = undefined;
  }

  if (Array.isArray(elements) && elements.length > 0) {
    const text = elements.reduce((prev: string, element) => {
      const data = element.getData?.();
      if (element.getType?.() === 'card') {
        const cardPayload = data?.card ?? data;
        if (!cardPayload) return prev;
        const fallback = cardPayload.fallbackText || '';
        return fallback ? prev + fallback + ' ' : prev;
      }
      const elementText = typeof data === 'string' ? data : (data?.text ?? '');
      return elementText ? prev + elementText + ' ' : prev;
    }, '');
    const trimmed = text.trim();
    if (trimmed) return trimmed;
  }

  // Fallback: outer text field
  try {
    return aiMessage.getAssistantMessageData?.()?.getText?.() || '';
  } catch {
    return '';
  }
}
