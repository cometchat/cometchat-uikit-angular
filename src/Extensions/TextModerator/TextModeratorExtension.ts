import { BaseStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { TextModeratorExtensionDecorator } from "./TextModeratorExtensionDecorator";
import {MessageTranslationConfiguration} from 'uikit-utils-lerna'
export class TextModeratorExtension implements ExtensionsDataSource {
  constructor() {

  }
  enable(): void {
    ChatConfigurator.enable((dataSource) =>
      new TextModeratorExtensionDecorator(dataSource)
    );
  }
}

