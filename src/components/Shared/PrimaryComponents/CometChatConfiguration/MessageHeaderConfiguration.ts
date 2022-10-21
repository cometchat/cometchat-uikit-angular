import { inputData } from "../../SDKDerivedComponents/CometChatDataItem/DataItemInterface";
import { AvatarConfiguration } from "./AvatarConfiguration";
import { DataItemConfiguration } from "./DataItemConfiguration";
import { StatusIndicatorConfiguration } from "./StatusIndicatorConfiguration";
/**
 * @class MessageHeaderConfiguration
 * @param {array} options
 * @param {boolean} showBackButton
 * @param {boolean} isMobileView
 * @param {string} backButtonIconURL
 * @param {boolean} enableTypingIndicator
 * @param {object} avatarConfiguration
 * @param {object} statusIndicatorConfiguration
 * @param {object} dataItemConfiguration
 * @param {object} inputData
 */
class MessageHeaderConfiguration {
  options: object | null = {};
  showBackButton: boolean = false;
  isMobileView: boolean = false;
  backButtonIconURL: string = "assets/resources/backbutton.svg";
  enableTypingIndicator: boolean = true;
  avatarConfiguration: AvatarConfiguration = new AvatarConfiguration({})
  statusIndicatorConfiguration: StatusIndicatorConfiguration = new StatusIndicatorConfiguration({})
  dataItemConfiguration: DataItemConfiguration = new DataItemConfiguration({})

  inputData: inputData = {
    thumbnail: true,
    title: true,
    subtitle: "",
    status: true
  };

  constructor(
    {
      options = {},
      showBackButton = false,
      backButtonIconURL = "assets/resources/backbutton.svg",
      avatarConfiguration = new AvatarConfiguration({}),
      statusIndicatorConfiguration = new StatusIndicatorConfiguration({}),
      dataItemConfiguration = new DataItemConfiguration({}),

      inputData = {
        thumbnail: true,
        title: true,
        subtitle: "",
        status: true
      },
      
      enableTypingIndicator = true

    }
  ) {
    this.options = options;
    this.showBackButton = showBackButton;
    this.backButtonIconURL = backButtonIconURL;
    this.enableTypingIndicator = enableTypingIndicator;
    this.avatarConfiguration = avatarConfiguration;
    this.statusIndicatorConfiguration = statusIndicatorConfiguration;
    this.dataItemConfiguration = dataItemConfiguration;

    this.inputData = inputData;
  }
}

export { MessageHeaderConfiguration };
