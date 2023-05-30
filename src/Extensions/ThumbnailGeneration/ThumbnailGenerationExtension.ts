import { BaseStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { ThumbnailGenerationExtensionDecorator } from "./ThumbnailGenerationExtensionDecorator";
export class ThumbnailGenerationExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new ThumbnailGenerationExtensionDecorator(dataSource)
    );
  }
}

