import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { ReactionExtensionDecorator } from "./ReactionExtensionDecorator";
export class ReactionExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new ReactionExtensionDecorator(dataSource)
    );
  }
}

