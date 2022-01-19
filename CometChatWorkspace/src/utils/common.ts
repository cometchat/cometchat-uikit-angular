import * as enums from "./enums";

export const checkMessageForExtensionsData = (message: any, extensionKey: any) => {
  try {
    let output = [];

    if (message.hasOwnProperty(enums.METADATA)) {
      const metadata = message[enums.METADATA];
      const injectedObject = metadata[enums.INJECTED];
      if (injectedObject && injectedObject.hasOwnProperty(enums.EXTENSIONS)) {
        const extensionsObject = injectedObject[enums.EXTENSIONS];
        if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
          output = extensionsObject[extensionKey];
        }
      }
    }

    return output;
  } catch (error) {
    logger(error);
  }
};

/**
 * Get Time when message was sent
 */
export const getSentAtTime = (message: any) => {
  try {
    let msgSentAt = message.sentAt;
    msgSentAt = msgSentAt * 1000;

    return msgSentAt;
  } catch (error) {
    logger(error);
  }
};

/**
 * Get Time when message was sent
 */
export const logger = (...data: any) => {
  try {
    console.log(...data);
  } catch (error) {
    logger(error);
  }
};
