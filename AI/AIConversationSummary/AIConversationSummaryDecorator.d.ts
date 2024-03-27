import { AIOptionsStyle } from "@cometchat/uikit-shared";
import { DataSource } from "../../Shared/Framework/DataSource";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { CometChatActionsView, CometChatMessageComposerAction, CometChatTheme } from "@cometchat/uikit-resources";
export declare class AIConversationSummaryDecorator extends DataSourceDecorator {
    newDataSource: DataSource;
    constructor(dataSource: DataSource);
    getId(): string;
    getAIOptions(theme: CometChatTheme, id?: any, aiOptionsStyles?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
}
