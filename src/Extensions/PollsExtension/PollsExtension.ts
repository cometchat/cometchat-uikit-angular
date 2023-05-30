import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { PollsExtensionDecorator } from "./PollsExtensionDecorator";
export class PollsExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new PollsExtensionDecorator(dataSource)
    );
  }
}

