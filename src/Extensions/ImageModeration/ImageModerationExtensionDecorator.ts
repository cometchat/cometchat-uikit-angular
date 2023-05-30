import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export class ImageModerationExtensionDecorator extends DataSourceDecorator {
  constructor(dataSource:DataSource){
    super(dataSource)
  }

  override getId(): string {
    return "imagemoderation";
  }

}
