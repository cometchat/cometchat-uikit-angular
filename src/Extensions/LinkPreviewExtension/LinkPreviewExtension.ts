import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { LinkPreviewExtensionDecorator } from "./LinkPreviewExtensionDecorator";
export class LinkPreviewExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new LinkPreviewExtensionDecorator(dataSource)
    );
  }
}

