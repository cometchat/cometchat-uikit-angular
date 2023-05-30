
import { ChatConfigurator } from '../Shared/Framework/ChatConfigurator';
import { DataSource } from '../Shared/Framework/DataSource';
import { ExtensionsDataSource } from '../Shared/Framework/ExtensionDataSource';
import { CallingExtensionDecorator } from './CallingExtensionDecorator';

export class CallingExtension implements ExtensionsDataSource {
  constructor() {
  }

  // override enable method from ExtensionsDataSource interface
  enable(): void {
    ChatConfigurator.enable((dataSource: DataSource) =>
      new CallingExtensionDecorator(dataSource)
    );
  }
}
