import { BaseStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../Shared/Framework/ChatConfigurator";
import { DataSource } from "../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../Shared/Framework/DataSourceDecorator";
import { MessageTranslationConfiguration,MessageTranslationStyle } from "uikit-utils-lerna";

export class testExtension implements ExtensionsDataSource {
  private configuration?: MessageTranslationConfiguration;
  constructor({ configuration }: { configuration?: MessageTranslationConfiguration } = {}) {
    this.configuration = configuration;
  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new testExtensionDecorator(dataSource,this.configuration)
    );
  }
}


import { ExtensionsDataSource } from "../Shared/Framework/ExtensionDataSource";
export class testExtensionDecorator extends DataSourceDecorator {
  public configuration?:MessageTranslationConfiguration;
  constructor(dataSource:DataSource,configuration:MessageTranslationConfiguration = new MessageTranslationConfiguration({})){

    super(dataSource)
    this.configuration = configuration;

  }
    override getId(): string {
      return "new"
  }

}
