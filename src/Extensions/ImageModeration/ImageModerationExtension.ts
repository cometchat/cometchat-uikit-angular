import { BaseStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { ImageModerationExtensionDecorator } from "./ImageModerationExtensionDecorator";
export class ImageModerationExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new ImageModerationExtensionDecorator(dataSource)
    );
  }
}

