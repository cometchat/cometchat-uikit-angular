import {  CollaborativeDocumentConfiguration} from "uikit-utils-lerna";
import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import { ExtensionsDataSource } from "../../Shared/Framework/ExtensionDataSource";
import { CollaborativeDocumentExtensionDecorator } from "./CollaborativeDocumentExtensionDecorator";

export class CollaborativeDocumentExtension implements ExtensionsDataSource {
    configuration?: CollaborativeDocumentConfiguration;

    constructor({ configuration }: { configuration?: CollaborativeDocumentConfiguration } = {}) {
      this.configuration = configuration;
    }

    enable(): void {
      ChatConfigurator.enable((dataSource) => new CollaborativeDocumentExtensionDecorator(dataSource, this.configuration));
    }
  }
