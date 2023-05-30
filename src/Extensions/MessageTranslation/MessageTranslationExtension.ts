import { BaseStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { MessageTranslationExtensionDecorator } from "./MessageTranslationExtensionDecorator";
import {MessageTranslationConfiguration} from 'uikit-utils-lerna'
export class MessageTranslationExtension implements ExtensionsDataSource {
  private configuration?: MessageTranslationConfiguration;
  constructor({ configuration }: { configuration?: MessageTranslationConfiguration } = {}) {
    this.configuration = configuration;
  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new MessageTranslationExtensionDecorator(dataSource,this.configuration)
    );
  }
}

