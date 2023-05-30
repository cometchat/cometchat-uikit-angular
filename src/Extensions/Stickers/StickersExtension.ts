import { ChatConfigurator } from "../../Shared/Framework/ChatConfigurator";
import {ExtensionsDataSource} from '../../Shared/Framework/ExtensionDataSource'
import {StickersExtensionDecorator} from './StickersExtensionDecorator'
import {StickersConfiguration} from 'uikit-utils-lerna'
export class StickersExtension implements ExtensionsDataSource {
  // Configuration prop taken as optional field in constructor
  private configuration?: StickersConfiguration;

  constructor({ configuration }: { configuration?: StickersConfiguration } = {}) {
    // Optional property
    this.configuration = configuration;
  }

  // Override enable method from ExtensionsDataSource interface
 enable(): void {
    ChatConfigurator.enable((dataSource) =>
    {

      return  new StickersExtensionDecorator(dataSource,this.configuration)
    }
    );
  }

}
