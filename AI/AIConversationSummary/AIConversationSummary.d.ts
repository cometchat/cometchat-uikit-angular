import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
export declare class AIConversationSummaryExtension extends AIExtensionDataSource {
    constructor();
    addExtension(): void;
    getExtensionId(): string;
    enable(): Promise<void>;
}
