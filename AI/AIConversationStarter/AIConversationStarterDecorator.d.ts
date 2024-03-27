import { AIOptionsStyle } from "@cometchat/uikit-shared";
import { DataSourceDecorator } from "../../Shared/Framework/DataSourceDecorator";
import { DataSource } from "../../Shared/Framework/DataSource";
import { CometChatActionsView, CometChatMessageComposerAction, CometChatTheme } from "@cometchat/uikit-resources";
export declare class AIConversationStarterDecorator extends DataSourceDecorator {
    constructor(dataSource: DataSource);
    getId(): string;
    getAIOptions(theme: CometChatTheme, id?: any, aiOptionsStyles?: AIOptionsStyle): (CometChatMessageComposerAction | CometChatActionsView)[];
}
