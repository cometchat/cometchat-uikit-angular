import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
  constructor(dataSource:DataSource){
    super(dataSource)
  }

  override getId(): string {
    return "thumbnailgeneration";
  }

}
