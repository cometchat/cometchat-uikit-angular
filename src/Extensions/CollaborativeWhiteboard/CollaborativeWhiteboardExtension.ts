import {  CollaborativeWhiteboardConfiguration, CollaborativeWhiteboardStyle } from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { CollaborativeWhiteBoardExtensionDecorator } from "./CollaborativeWhiteboardExtensionDecorator";

export class CollaborativeWhiteBoardExtension implements ExtensionsDataSource {
    configuration?: CollaborativeWhiteboardConfiguration;

    constructor({ configuration }: { configuration?: CollaborativeWhiteboardConfiguration } = {}) {
      this.configuration = configuration;
    }

    enable(): void {
      ChatConfigurator.enable((dataSource) => new CollaborativeWhiteBoardExtensionDecorator(dataSource, this.configuration));
    }
  }
