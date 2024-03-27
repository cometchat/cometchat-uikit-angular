import { AIExtensionDataSource } from "../../Shared/Framework/AIExtensionDataSource";
export declare class AIAssistBotExtension extends AIExtensionDataSource {
    constructor();
    addExtension(): void;
    getExtensionId(): string;
    enable(): Promise<void>;
}
