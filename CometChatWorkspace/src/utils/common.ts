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
 * Get Time when message was composed
 */
export const getComposedAtTime = (message:any) => {
  try {
    let msgComposedAt = message._composedAt;
    msgComposedAt = msgComposedAt * 1000;

    return msgComposedAt;
  } catch (error) {
    logger(error);
  }
}

/**
 * Get Time when message was sent
 */
export const logger = (...data: any) => {

  try {
    // console.log(...data);
  } catch (error) {
    logger(error);
  }
};
export const ID = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};
export const getUnixTimestamp = () => {

  return Math.round(+new Date() / 1000);
}