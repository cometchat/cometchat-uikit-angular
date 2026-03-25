/**
 * Shared Extension URL Extractor
 *
 * Extracted from cometchat-collaborative-document-bubble and
 * cometchat-collaborative-whiteboard-bubble to consolidate duplicate
 * metadata navigation logic (~46 shared lines).
 *
 * Both components navigate the same metadata path:
 *   message.getMetadata() -> @injected -> extensions -> {extensionKey} -> {urlKey}
 */

import { CometChat } from '@cometchat/chat-sdk-javascript';

/**
 * Extracts a URL from a CometChat message's extension metadata.
 *
 * Navigates the metadata path:
 *   `@injected -> extensions -> extensionKey -> urlKey`
 *
 * @param message - The CometChat message to extract from
 * @param extensionKey - The extension name (e.g. 'document', 'whiteboard')
 * @param urlKey - The URL property name (e.g. 'document_url', 'board_url')
 * @param logPrefix - Prefix for warning/error log messages
 * @returns The extracted URL string, or empty string if not found
 */
export function extractExtensionUrl(
  message: CometChat.CustomMessage | null | undefined,
  extensionKey: string,
  urlKey: string,
  logPrefix: string
): string {
  if (!message) {
    console.warn(`[${logPrefix}] Message is null or undefined`);
    return '';
  }

  try {
    const metadata = message.getMetadata?.();

    if (!metadata || typeof metadata !== 'object') {
      console.warn(`[${logPrefix}] Message has no metadata`);
      return '';
    }

    const injected = (metadata as any)['@injected'];
    if (!injected || typeof injected !== 'object') {
      console.warn(`[${logPrefix}] Missing @injected in metadata`);
      return '';
    }

    const extensions = injected['extensions'];
    if (!extensions || typeof extensions !== 'object') {
      console.warn(`[${logPrefix}] Missing extensions in metadata`);
      return '';
    }

    const extension = extensions[extensionKey];
    if (!extension || typeof extension !== 'object') {
      console.warn(`[${logPrefix}] Missing ${extensionKey} in metadata`);
      return '';
    }

    const url = extension[urlKey];
    if (!url || typeof url !== 'string') {
      console.warn(`[${logPrefix}] Missing ${urlKey} in metadata`);
      return '';
    }

    return url;
  } catch (error) {
    console.error(`[${logPrefix}] Error extracting ${extensionKey} URL:`, error);
    return '';
  }
}
