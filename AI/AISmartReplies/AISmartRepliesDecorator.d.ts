import { CometChatActionsView, CometChatMessageComposerAction, CometChatTheme } from "@cometchat/uikit-resources";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { AIOptionsStyle } from "@cometchat/uikit-shared";
export declare class AISmartRepliesExtensionDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getId(): string;
    getAIOptions(theme: CometChatTheme, id?: any, aiOptionsStyles?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
}
