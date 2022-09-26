import * as types from "../Types/typesDeclairation";
import { MetadataKey } from "../Constants/UIKitConstants";
/**
 * @param  {types.messageObject} message
 * @param  {string} extensionKey
 */
export const checkMessageForExtensionsData = (message: types.messageObject | null, extensionKey: string) => {

  try {
    let output = [];
    if (message!.hasOwnProperty(MetadataKey.metadata)) {
      const metadata = (message as any)[MetadataKey.metadata];
      const injectedObject = metadata[MetadataKey.injected];
      if (injectedObject && injectedObject.hasOwnProperty(MetadataKey.extension)) {
        const extensionsObject = injectedObject[MetadataKey.extension];
        if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
          output = extensionsObject[extensionKey];

        }
      }
    }
    return output;
  } catch (error:any) {
    logger(error);
  }
};

/**
 * Get Time when message was sent
 */
/**
 * @param  {Array<any>} ...data
 */
export const logger = (...data: Array<any>) => {
  try {
  
  } catch (error:any) {
    logger(error);
  }
};
export const getUnixTimestamp = () => {
  return Math.round(+new Date() / 1000);
}
export const ID = () => {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
}
export  const checkHasOwnProperty = (obj:any = {}, key:string) => {
  return Object.prototype.hasOwnProperty.call(obj, key)
  }
