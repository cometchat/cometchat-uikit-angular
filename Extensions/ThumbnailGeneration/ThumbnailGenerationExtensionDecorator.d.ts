import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
export declare class ThumbnailGenerationExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getId(): string;
}
