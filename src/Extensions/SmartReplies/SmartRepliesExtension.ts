import { SmartRepliesConfiguration } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { SmartReplyExtensionDecorator } from "./SmartRepliesExtensionDecorator";

export class SmartReplyExtension implements ExtensionsDataSource {
  private configuration?: SmartRepliesConfiguration;
  constructor({ configuration }: { configuration?: SmartRepliesConfiguration } = {}) {
    this.configuration = configuration;
  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new SmartReplyExtensionDecorator(dataSource,this.configuration)
    );
  }
}