export const checkMessageForExtensionsData = (message, extensionKey) => {
  let output = null;

  if (message.hasOwnProperty("metadata")) {
    const metadata = message.metadata;
    const injectedObject = metadata["@injected"];
    if (injectedObject && injectedObject.hasOwnProperty("extensions")) {
      const extensionsObject = injectedObject["extensions"];
      if (extensionsObject && extensionsObject.hasOwnProperty(extensionKey)) {
        output = extensionsObject[extensionKey];
      }
    }
  }

  return output;
};
