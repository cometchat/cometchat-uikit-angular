import { CometChat } from "@cometchat/chat-sdk-javascript";
import { Component, ChangeDetectionStrategy, Input, ViewChild, } from "@angular/core";
import { AvatarStyle, } from "@cometchat/uikit-elements";
import { localize, MessageListAlignment, MessageBubbleAlignment, CometChatUIKitConstants, CometChatUIEvents, fontHelper, DatePatterns, Receipts, } from "@cometchat/uikit-resources";
import { CometChatUIKitUtility, } from "@cometchat/uikit-shared";
import * as i0 from "@angular/core";
import * as i1 from "./../../../../CometChatTheme.service";
import * as i2 from "../../../../CometChatList/cometchat-list.component";
import * as i3 from "../../../../CometChatMessageBubble/cometchat-message-bubble/cometchat-message-bubble.component";
import * as i4 from "@angular/common";
export class AIAssistBotMessageListComponent {
    constructor(ref, themeService) {
        this.ref = ref;
        this.themeService = themeService;
        this.messagesList = [];
        this.botMessagesList = [];
        this.hideSearch = true;
        this.subtitleText = localize("COMETCHAT_ASK_BOT_SUBTITLE");
        this.sendIconUrl = "assets/Send.svg";
        this.waitIcon = "assets/wait.svg";
        this.errorIcon = "assets/warning-small.svg";
        this.botFirstMessageText = localize("COMETCHAT_BOT_FIRST_MESSAGE");
        this.closeButtonIconURL = "assets/close2x.svg";
        this.sendButtonIconURL = "assets/Send.svg";
        this.avatarStyle = {
            borderRadius: "16px",
            width: "28px",
            height: "28px",
        };
        this.aiBotChatHeaderStyle = {
            backGround: "rgba(20, 20, 20, 0.15)",
        };
        this.aiBotChatContainerStyle = {
            backGround: "rgba(255,255,255)",
        };
        this.datePattern = DatePatterns.time;
        this.bubbleDateStyle = {};
        this.messageTemplate = [];
        this.alignment = MessageListAlignment.standard;
        this.receipts = Receipts.wait;
        this.currentMessageObject = null;
        this.typesMap = {};
        this.messageTypesMap = {};
        this.textInputStyle = {
            width: "98%",
            dividerColor: "transparent",
            background: "transparent",
            border: "2px solid red transparent",
        };
        this.sendButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonIconTint: this.themeService.theme.palette.getPrimary(),
        };
        this.messageInputChanged = (event) => {
            const text = event?.detail?.value?.trim();
            this.inputValue = text;
        };
        this.closeButtonStyle = {
            height: "24px",
            width: "24px",
            border: "none",
            borderRadius: "0",
            background: "transparent",
            buttonIconTint: this.themeService.theme.palette.getPrimary(),
        };
        this.labelStyle = {
            textFont: "400 11px Inter",
            textColor: "grey",
        };
    }
    ngOnInit() {
        this.setAvatarStyle();
        this.setAiBotChatHeader();
        this.setAiBotChatContainerStyle();
        let receiverId = this.user
            ? this.user?.getUid()
            : this.group?.getGuid();
        let receiverType = this.user
            ? CometChatUIKitConstants.MessageReceiverType.user
            : CometChatUIKitConstants.MessageReceiverType.group;
        let firstMessage = new CometChat.TextMessage(this.currentAskAIBot?.id, this.botFirstMessageText, receiverType);
        firstMessage.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        this.botMessagesList.push(firstMessage);
        CometChat.getLoggedinUser()
            .then((user) => {
            this.loggedInUser = user;
        })
            .catch((error) => {
            if (this.onError) {
                this.onError(error);
            }
        });
        this.setMessagesStyle();
        this.subscribeToEvents();
    }
    setAvatarStyle() {
        let defaultStyle = new AvatarStyle({
            borderRadius: "24px",
            width: "28px",
            height: "28px",
            border: `1px solid ${this.themeService.theme.palette.getAccent200()}`,
            backgroundColor: this.themeService.theme.palette.getAccent700(),
            nameTextColor: this.themeService.theme.palette.getAccent900(),
            backgroundSize: "cover",
            nameTextFont: fontHelper(this.themeService.theme.typography.subtitle1),
            outerViewBorderSpacing: "",
        });
        this.avatarStyle = { ...defaultStyle, ...this.avatarStyle };
    }
    setAiBotChatHeader() {
        let defaultStyle = {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            height: "40px",
            background: this.themeService.theme?.palette.getAccent200(),
        };
        this.aiBotChatHeaderStyle = {
            ...defaultStyle,
            ...this.aiBotChatHeaderStyle,
        };
    }
    setAiBotChatContainerStyle() {
        let defaultStyle = {
            background: this.themeService.theme.palette.getBackground(),
        };
        this.aiBotChatContainerStyle = {
            ...defaultStyle,
            ...this.aiBotChatContainerStyle,
        };
    }
    ngOnDestroy() {
        this.unSubscribeToEvent();
    }
    subscribeToEvents() {
        this.ccChatChanged = CometChatUIEvents.ccActiveChatChanged.subscribe(() => {
            CometChatUIEvents.ccShowPanel.next({
                child: { showBotView: false },
            });
        });
    }
    unSubscribeToEvent() {
        this.ccChatChanged?.unsubscribe();
    }
    onError(error) {
        throw new Error("Method not implemented.");
    }
    generateRandomString(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let randomString = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            randomString += characters.charAt(randomIndex);
        }
        return randomString;
    }
    handleClick() {
        this.receipts = Receipts.wait;
        let receiverId = this.user
            ? this.user?.getUid()
            : this.group?.getGuid();
        let receiverType = this.user
            ? CometChatUIKitConstants.MessageReceiverType.user
            : CometChatUIKitConstants.MessageReceiverType.group;
        let botUid = this.currentAskAIBot?.id;
        let question = this.inputValue;
        this.inputRef?.nativeElement?.emptyInputField();
        let query = new CometChat.TextMessage(this.loggedInUser.getUid(), question, receiverType);
        // Generate a random string for the message ID
        let randomString = this.generateRandomString(10); // Specify the desired length
        // Convert the random string to a number (may not be the best practice)
        let randomStringAsNumber = parseInt(randomString, 36); // 36 is the radix for alphanumeric characters
        query.setId(randomStringAsNumber);
        query.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
        this.currentMessageObject = query;
        if (question.trim().length > 0) {
            this.botMessagesList.push(query);
            CometChat.askBot(receiverId, receiverType, botUid, question)
                .then((response) => {
                return response;
            })
                .then((messageText) => {
                this.inputValue = "";
                this.receipts = null;
                let answer = new CometChat.TextMessage(botUid, messageText, receiverType);
                answer.setSentAt(CometChatUIKitUtility.getUnixTimestamp());
                this.botMessagesList.push(answer);
                this.ref.detectChanges();
            })
                .catch((error) => {
                this.receipts = Receipts.error;
                console.error("error", error);
            });
        }
    }
    setMessageBubbleStyle(msg) {
        let style;
        if (msg.getReceiverId() !== this.loggedInUser?.getUid()) {
            style = {
                background: this.themeService.theme.palette.getAccent100(),
                borderRadius: "12px",
            };
        }
        else {
            style = {
                background: this.themeService.theme.palette.getPrimary(),
                borderRadius: "12px",
            };
        }
        return style;
    }
    getBubbleAlignment(message) {
        return message.getReceiverId() !== this.loggedInUser?.getUid()
            ? MessageBubbleAlignment.left
            : MessageBubbleAlignment.right;
    }
    onCloseDetails() {
        CometChatUIEvents.ccShowPanel.next({
            child: { showBotView: false },
        });
    }
    setMessagesStyle() {
        this.bubbleDateStyle = {
            textColor: this.themeService.theme.palette.getAccent600(),
            textFont: fontHelper(this.themeService.theme.typography.caption2),
            padding: "3px"
        };
    }
    getBotTitleStyle() {
        return {
            font: fontHelper(this.themeService.theme.typography.subtitle1),
            color: this.themeService.theme.palette.getAccent(),
        };
    }
    getBotSubtitleStyle() {
        return {
            font: fontHelper(this.themeService.theme.typography.caption2),
            color: this.themeService.theme.palette.getAccent500(),
        };
    }
}
AIAssistBotMessageListComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: AIAssistBotMessageListComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CometChatThemeService }], target: i0.ɵɵFactoryTarget.Component });
AIAssistBotMessageListComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "12.0.0", version: "13.3.12", type: AIAssistBotMessageListComponent, selector: "aiassist-bot-message-list", inputs: { hideSearch: "hideSearch", footerView: "footerView", user: "user", group: "group", currentAskAIBot: "currentAskAIBot", subtitleText: "subtitleText", sendIconUrl: "sendIconUrl", waitIcon: "waitIcon", errorIcon: "errorIcon", botFirstMessageText: "botFirstMessageText", closeButtonIconURL: "closeButtonIconURL", sendButtonIconURL: "sendButtonIconURL", avatarStyle: "avatarStyle", aiBotChatHeaderStyle: "aiBotChatHeaderStyle", aiBotChatContainerStyle: "aiBotChatContainerStyle", datePattern: "datePattern", alignment: "alignment" }, viewQueries: [{ propertyName: "inputRef", first: true, predicate: ["inputRef"], descendants: true }], ngImport: i0, template: "<div class=\"cc-ai-assist-message-list__wrapper\"\n  [ngStyle]=\"aiBotChatContainerStyle\">\n  <div class=\"cc-ai-assist-message-list__header-view\"\n    [ngStyle]=\"aiBotChatHeaderStyle\">\n    <div class=\"cc-ai-assist-message-list__header-avatar\">\n      <cometchat-avatar [image]=\"currentAskAIBot?.iconURL\"\n        [avatarStyle]=\"avatarStyle\">\n      </cometchat-avatar>\n      <div class=\"cc-ai-assist-message-list__header-bot-name\">\n\n\n        <div [ngStyle]=\"getBotTitleStyle()\">\n          {{currentAskAIBot?.title}}\n        </div>\n        <div [ngStyle]=\"getBotSubtitleStyle()\">\n          {{subtitleText}}\n        </div>\n      </div>\n\n    </div>\n\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-ai-assist-message-list\">\n    <cometchat-list [listItemView]=\"listItem\" [list]=\"botMessagesList\"\n      [hideSearch]=\"hideSearch\">\n    </cometchat-list>\n    <ng-template #listItem let-message>\n      <cometchat-message-bubble [bottomView]=\"null\"\n        [statusInfoView]=\"statusInfoView\" [threadView]=\"null\"\n        [contentView]=\"contentView\"\n        [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n        [alignment]=\"getBubbleAlignment(message)\" [leadingView]=\"leadingView\"\n        [headerView]=\"bubbleHeader\">\n        <ng-template #contentView>\n          <div class=\"cc-ai-assist-message\">\n            {{message.data.text}}\n          </div>\n        </ng-template>\n        <ng-template #leadingView>\n\n        </ng-template>\n        <ng-template #bubbleHeader>\n\n        </ng-template>\n        <ng-template #statusInfoView>\n          <div class=\"cc__assist-bot__statusinfo\">\n\n            <cometchat-date [pattern]=\"datePattern\"\n              [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"bubbleDateStyle\"></cometchat-date>\n            <cometchat-receipt\n              *ngIf=\"message?.receiverId !==currentAskAIBot.id && message?.getId()===currentMessageObject?.getId()\"\n              [receipt]=\"receipts\" [waitIcon]=\"waitIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </cometchat-message-bubble>\n      <hr>\n    </ng-template>\n  </div>\n\n  <div class=\"cc-ai-assist__input-wrapper\">\n    <div class=\"cc-ai-assist__input\">\n      <cometchat-text-input [textInputStyle]=\"textInputStyle\" #inputRef\n        (cc-text-input-changed)=\"messageInputChanged($event)\"\n        (cc-text-input-entered)=\"handleClick()\"></cometchat-text-input>\n      <cometchat-button [iconURL]=\"sendIconUrl\"\n        (cc-button-clicked)=\"handleClick()\"\n        [buttonStyle]=\"sendButtonStyle\"></cometchat-button>\n    </div>\n  </div>\n</div>\n", styles: [".cc-ai-assist-message-list__wrapper{position:absolute;right:0;top:0;background-color:#fff;width:50%;height:100%}.cc-ai-assist-message-list__header-view{display:flex;justify-content:space-between;align-items:center;height:5%;padding:5px;background-color:#14141426}.cc-ai-assist-message-list__header-avatar{display:flex;align-items:center;gap:8px}.cc-ai-assist-message-list__header-bot-name{display:flex;flex-direction:column}.cc-ai-assist-message-list__header-bot-name>small{color:#14141494;font-family:inter}.cc-ai-assist-message-list{height:85%;border-bottom:1px solid RGB(229,231,233)}.cc-ai-assist-message{padding:8px 12px}.cc-ai-assist__input-wrapper{width:100%;height:7%;position:absolute;bottom:0;padding-left:7px}.cc-ai-assist__input{display:flex;width:98%;align-items:center}cometchat-text-input{width:95%}.cc__assist-bot__statusinfo{display:flex;justify-content:flex-end;align-items:center;width:100%;padding:0 4px;box-sizing:border-box}cometchat-date{margin-top:-2px}\n"], components: [{ type: i2.CometchatListComponent, selector: "cometchat-list", inputs: ["listItemView", "onScrolledToBottom", "onScrolledToTop", "list", "onSearch", "getSectionHeader", "searchText", "searchIconURL", "listStyle", "searchPlaceholderText", "hideSearch", "hideError", "title", "titleAlignment", "errorStateView", "loadingStateView", "emptyStateView", "state", "errorStateText", "emptyStateText", "loadingIconURL", "showSectionHeader", "sectionHeaderField", "DateSeparatorPattern", "dateSeparatorStyle"] }, { type: i3.CometChatMessageBubbleComponent, selector: "cometchat-message-bubble", inputs: ["messageBubbleStyle", "alignment", "options", "id", "leadingView", "headerView", "replyView", "contentView", "threadView", "footerView", "bottomView", "statusInfoView", "moreIconURL", "topMenuSize"] }], directives: [{ type: i4.NgStyle, selector: "[ngStyle]", inputs: ["ngStyle"] }, { type: i4.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "13.3.12", ngImport: i0, type: AIAssistBotMessageListComponent, decorators: [{
            type: Component,
            args: [{ selector: "aiassist-bot-message-list", changeDetection: ChangeDetectionStrategy.OnPush, template: "<div class=\"cc-ai-assist-message-list__wrapper\"\n  [ngStyle]=\"aiBotChatContainerStyle\">\n  <div class=\"cc-ai-assist-message-list__header-view\"\n    [ngStyle]=\"aiBotChatHeaderStyle\">\n    <div class=\"cc-ai-assist-message-list__header-avatar\">\n      <cometchat-avatar [image]=\"currentAskAIBot?.iconURL\"\n        [avatarStyle]=\"avatarStyle\">\n      </cometchat-avatar>\n      <div class=\"cc-ai-assist-message-list__header-bot-name\">\n\n\n        <div [ngStyle]=\"getBotTitleStyle()\">\n          {{currentAskAIBot?.title}}\n        </div>\n        <div [ngStyle]=\"getBotSubtitleStyle()\">\n          {{subtitleText}}\n        </div>\n      </div>\n\n    </div>\n\n    <cometchat-button [iconURL]=\"closeButtonIconURL\"\n      class=\"cc-details__close-button\" [buttonStyle]=\"closeButtonStyle\"\n      (cc-button-clicked)=\"onCloseDetails()\"></cometchat-button>\n  </div>\n  <div class=\"cc-ai-assist-message-list\">\n    <cometchat-list [listItemView]=\"listItem\" [list]=\"botMessagesList\"\n      [hideSearch]=\"hideSearch\">\n    </cometchat-list>\n    <ng-template #listItem let-message>\n      <cometchat-message-bubble [bottomView]=\"null\"\n        [statusInfoView]=\"statusInfoView\" [threadView]=\"null\"\n        [contentView]=\"contentView\"\n        [messageBubbleStyle]=\"setMessageBubbleStyle(message)\"\n        [alignment]=\"getBubbleAlignment(message)\" [leadingView]=\"leadingView\"\n        [headerView]=\"bubbleHeader\">\n        <ng-template #contentView>\n          <div class=\"cc-ai-assist-message\">\n            {{message.data.text}}\n          </div>\n        </ng-template>\n        <ng-template #leadingView>\n\n        </ng-template>\n        <ng-template #bubbleHeader>\n\n        </ng-template>\n        <ng-template #statusInfoView>\n          <div class=\"cc__assist-bot__statusinfo\">\n\n            <cometchat-date [pattern]=\"datePattern\"\n              [timestamp]=\"message?.getSentAt()\"\n              [dateStyle]=\"bubbleDateStyle\"></cometchat-date>\n            <cometchat-receipt\n              *ngIf=\"message?.receiverId !==currentAskAIBot.id && message?.getId()===currentMessageObject?.getId()\"\n              [receipt]=\"receipts\" [waitIcon]=\"waitIcon\"\n              [errorIcon]=\"errorIcon\"></cometchat-receipt>\n          </div>\n        </ng-template>\n      </cometchat-message-bubble>\n      <hr>\n    </ng-template>\n  </div>\n\n  <div class=\"cc-ai-assist__input-wrapper\">\n    <div class=\"cc-ai-assist__input\">\n      <cometchat-text-input [textInputStyle]=\"textInputStyle\" #inputRef\n        (cc-text-input-changed)=\"messageInputChanged($event)\"\n        (cc-text-input-entered)=\"handleClick()\"></cometchat-text-input>\n      <cometchat-button [iconURL]=\"sendIconUrl\"\n        (cc-button-clicked)=\"handleClick()\"\n        [buttonStyle]=\"sendButtonStyle\"></cometchat-button>\n    </div>\n  </div>\n</div>\n", styles: [".cc-ai-assist-message-list__wrapper{position:absolute;right:0;top:0;background-color:#fff;width:50%;height:100%}.cc-ai-assist-message-list__header-view{display:flex;justify-content:space-between;align-items:center;height:5%;padding:5px;background-color:#14141426}.cc-ai-assist-message-list__header-avatar{display:flex;align-items:center;gap:8px}.cc-ai-assist-message-list__header-bot-name{display:flex;flex-direction:column}.cc-ai-assist-message-list__header-bot-name>small{color:#14141494;font-family:inter}.cc-ai-assist-message-list{height:85%;border-bottom:1px solid RGB(229,231,233)}.cc-ai-assist-message{padding:8px 12px}.cc-ai-assist__input-wrapper{width:100%;height:7%;position:absolute;bottom:0;padding-left:7px}.cc-ai-assist__input{display:flex;width:98%;align-items:center}cometchat-text-input{width:95%}.cc__assist-bot__statusinfo{display:flex;justify-content:flex-end;align-items:center;width:100%;padding:0 4px;box-sizing:border-box}cometchat-date{margin-top:-2px}\n"] }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CometChatThemeService }]; }, propDecorators: { hideSearch: [{
                type: Input
            }], footerView: [{
                type: Input
            }], user: [{
                type: Input
            }], group: [{
                type: Input
            }], currentAskAIBot: [{
                type: Input
            }], subtitleText: [{
                type: Input
            }], sendIconUrl: [{
                type: Input
            }], waitIcon: [{
                type: Input
            }], errorIcon: [{
                type: Input
            }], botFirstMessageText: [{
                type: Input
            }], closeButtonIconURL: [{
                type: Input
            }], sendButtonIconURL: [{
                type: Input
            }], avatarStyle: [{
                type: Input
            }], aiBotChatHeaderStyle: [{
                type: Input
            }], aiBotChatContainerStyle: [{
                type: Input
            }], datePattern: [{
                type: Input
            }], inputRef: [{
                type: ViewChild,
                args: ["inputRef", { static: false }]
            }], alignment: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWlhc3Npc3QtYm90LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9WaWV3cy9BSUFzc2lzdEJvdE1lc3NhZ2VMaXN0L2FpYXNzaXN0LWJvdC1tZXNzYWdlLWxpc3QvYWlhc3Npc3QtYm90LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wcm9qZWN0cy9jaGF0LXVpa2l0LWFuZ3VsYXIvc3JjL1NoYXJlZC9WaWV3cy9BSUFzc2lzdEJvdE1lc3NhZ2VMaXN0L2FpYXNzaXN0LWJvdC1tZXNzYWdlLWxpc3QvYWlhc3Npc3QtYm90LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFzQixNQUFNLGdDQUFnQyxDQUFDO0FBQy9FLE9BQU8sRUFDTCxTQUFTLEVBRVQsdUJBQXVCLEVBQ3ZCLEtBQUssRUFFTCxTQUFTLEdBSVYsTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUVMLFdBQVcsR0FHWixNQUFNLDJCQUEyQixDQUFDO0FBQ25DLE9BQU8sRUFFTCxRQUFRLEVBS1Isb0JBQW9CLEVBQ3BCLHNCQUFzQixFQUV0Qix1QkFBdUIsRUFDdkIsaUJBQWlCLEVBRWpCLFVBQVUsRUFDVixZQUFZLEVBQ1osUUFBUSxHQUNULE1BQU0sNEJBQTRCLENBQUM7QUFDcEMsT0FBTyxFQUlMLHFCQUFxQixHQUN0QixNQUFNLHlCQUF5QixDQUFDOzs7Ozs7QUFTakMsTUFBTSxPQUFPLCtCQUErQjtJQThDMUMsWUFDVSxHQUFzQixFQUN0QixZQUFtQztRQURuQyxRQUFHLEdBQUgsR0FBRyxDQUFtQjtRQUN0QixpQkFBWSxHQUFaLFlBQVksQ0FBdUI7UUEvQzdDLGlCQUFZLEdBQTRCLEVBQUUsQ0FBQztR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NElBS3RDLFVBQVU7c0JBQWxCLEtBQUs7Z0JBQ0csVUFBVTtzQkFBbEIsS0FBSztnQkFFRyxJQUFJO3NCQUFaLEtBQUs7Z0JBQ0csS0FBSztzQkFBYixLQUFLO2dCQUNHLGVBQWU7c0JBQXZCLEtBQUs7Z0JBQ0csWUFBWTtzQkFBcEIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUNHLFFBQVE7c0JBQWhCLEtBQUs7Z0JBQ0csU0FBUztzQkFBakIsS0FBSztnQkFDRyxtQkFBbUI7c0JBQTNCLEtBQUs7Z0JBR0csa0JBQWtCO3NCQUExQixLQUFLO2dCQUNHLGlCQUFpQjtzQkFBekIsS0FBSztnQkFDRyxXQUFXO3NCQUFuQixLQUFLO2dCQUtHLG9CQUFvQjtzQkFBNUIsS0FBSztnQkFHRyx1QkFBdUI7c0JBQS9CLEtBQUs7Z0JBR0csV0FBVztzQkFBbkIsS0FBSztnQkFHb0MsUUFBUTtzQkFBakQsU0FBUzt1QkFBQyxVQUFVLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFO2dCQUsvQixTQUFTO3NCQUFqQixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29tZXRDaGF0VGhlbWVTZXJ2aWNlIH0gZnJvbSBcIi4vLi4vLi4vLi4vLi4vQ29tZXRDaGF0VGhlbWUuc2VydmljZVwiO1xuaW1wb3J0IHsgQ29tZXRDaGF0LCBDb21ldENoYXRFeGNlcHRpb24gfSBmcm9tIFwiQGNvbWV0Y2hhdC9jaGF0LXNkay1qYXZhc2NyaXB0XCI7XG5pbXBvcnQge1xuICBDb21wb25lbnQsXG4gIE9uSW5pdCxcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIElucHV0LFxuICBUZW1wbGF0ZVJlZixcbiAgVmlld0NoaWxkLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgRWxlbWVudFJlZixcbiAgU2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSBcIkBhbmd1bGFyL2NvcmVcIjtcbmltcG9ydCB7XG4gIExpc3RJdGVtU3R5bGUsXG4gIEF2YXRhclN0eWxlLFxuICBUZXh0SW5wdXRTdHlsZSxcbiAgRGF0ZVN0eWxlLFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1lbGVtZW50c1wiO1xuaW1wb3J0IHtcbiAgQ29tZXRDaGF0T3B0aW9uLFxuICBsb2NhbGl6ZSxcbiAgU2VsZWN0aW9uTW9kZSxcbiAgVGl0bGVBbGlnbm1lbnQsXG4gIFN0YXRlcyxcbiAgQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlLFxuICBNZXNzYWdlTGlzdEFsaWdubWVudCxcbiAgTWVzc2FnZUJ1YmJsZUFsaWdubWVudCxcbiAgQ29tZXRDaGF0TWVzc2FnZU9wdGlvbixcbiAgQ29tZXRDaGF0VUlLaXRDb25zdGFudHMsXG4gIENvbWV0Q2hhdFVJRXZlbnRzLFxuICBDb21ldENoYXRHcm91cEV2ZW50cyxcbiAgZm9udEhlbHBlcixcbiAgRGF0ZVBhdHRlcm5zLFxuICBSZWNlaXB0cyxcbn0gZnJvbSBcIkBjb21ldGNoYXQvdWlraXQtcmVzb3VyY2VzXCI7XG5pbXBvcnQge1xuICBVc2Vyc1N0eWxlLFxuICBCYXNlU3R5bGUsXG4gIExpc3RTdHlsZSxcbiAgQ29tZXRDaGF0VUlLaXRVdGlsaXR5LFxufSBmcm9tIFwiQGNvbWV0Y2hhdC91aWtpdC1zaGFyZWRcIjtcbmltcG9ydCB7IFN1YnNjcmlwdGlvbiB9IGZyb20gXCJyeGpzXCI7XG5cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogXCJhaWFzc2lzdC1ib3QtbWVzc2FnZS1saXN0XCIsXG4gIHRlbXBsYXRlVXJsOiBcIi4vYWlhc3Npc3QtYm90LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuaHRtbFwiLFxuICBzdHlsZVVybHM6IFtcIi4vYWlhc3Npc3QtYm90LW1lc3NhZ2UtbGlzdC5jb21wb25lbnQuc2Nzc1wiXSxcbiAgY2hhbmdlRGV0ZWN0aW9uOiBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneS5PblB1c2gsXG59KVxuZXhwb3J0IGNsYXNzIEFJQXNzaXN0Qm90TWVzc2FnZUxpc3RDb21wb25lbnQgaW1wbGVtZW50cyBPbkluaXQge1xuICBtZXNzYWdlc0xpc3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZVtdID0gW107XG4gIGJvdE1lc3NhZ2VzTGlzdDogQ29tZXRDaGF0LkJhc2VNZXNzYWdlW10gPSBbXTtcbiAgQElucHV0KCkgaGlkZVNlYXJjaDogYm9vbGVhbiA9IHRydWU7XG4gIEBJbnB1dCgpIGZvb3RlclZpZXchOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIEBJbnB1dCgpIHVzZXIhOiBDb21ldENoYXQuVXNlcjtcbiAgQElucHV0KCkgZ3JvdXAhOiBDb21ldENoYXQuR3JvdXA7XG4gIEBJbnB1dCgpIGN1cnJlbnRBc2tBSUJvdCE6IGFueTtcbiAgQElucHV0KCkgc3VidGl0bGVUZXh0OiBzdHJpbmcgPSBsb2NhbGl6ZShcIkNPTUVUQ0hBVF9BU0tfQk9UX1NVQlRJVExFXCIpO1xuICBASW5wdXQoKSBzZW5kSWNvblVybDogc3RyaW5nID0gXCJhc3NldHMvU2VuZC5zdmdcIjtcbiAgQElucHV0KCkgd2FpdEljb246IHN0cmluZyA9IFwiYXNzZXRzL3dhaXQuc3ZnXCI7XG4gIEBJbnB1dCgpIGVycm9ySWNvbjogc3RyaW5nID0gXCJhc3NldHMvd2FybmluZy1zbWFsbC5zdmdcIjtcbiAgQElucHV0KCkgYm90Rmlyc3RNZXNzYWdlVGV4dDogc3RyaW5nID0gbG9jYWxpemUoXG4gICAgXCJDT01FVENIQVRfQk9UX0ZJUlNUX01FU1NBR0VcIlxuICApO1xuICBASW5wdXQoKSBjbG9zZUJ1dHRvbkljb25VUkw6IHN0cmluZyA9IFwiYXNzZXRzL2Nsb3NlMnguc3ZnXCI7XG4gIEBJbnB1dCgpIHNlbmRCdXR0b25JY29uVVJMOiBzdHJpbmcgPSBcImFzc2V0cy9TZW5kLnN2Z1wiO1xuICBASW5wdXQoKSBhdmF0YXJTdHlsZTogQXZhdGFyU3R5bGUgPSB7XG4gICAgYm9yZGVyUmFkaXVzOiBcIjE2cHhcIixcbiAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgaGVpZ2h0OiBcIjI4cHhcIixcbiAgfTtcbiAgQElucHV0KCkgYWlCb3RDaGF0SGVhZGVyU3R5bGU6IGFueSA9IHtcbiAgICBiYWNrR3JvdW5kOiBcInJnYmEoMjAsIDIwLCAyMCwgMC4xNSlcIixcbiAgfTtcbiAgQElucHV0KCkgYWlCb3RDaGF0Q29udGFpbmVyU3R5bGU6IGFueSA9IHtcbiAgICBiYWNrR3JvdW5kOiBcInJnYmEoMjU1LDI1NSwyNTUpXCIsXG4gIH07XG4gIEBJbnB1dCgpIGRhdGVQYXR0ZXJuOiBEYXRlUGF0dGVybnMgPSBEYXRlUGF0dGVybnMudGltZTtcbiAgYnViYmxlRGF0ZVN0eWxlOiBEYXRlU3R5bGUgPSB7fTtcblxuICBAVmlld0NoaWxkKFwiaW5wdXRSZWZcIiwgeyBzdGF0aWM6IGZhbHNlIH0pIGlucHV0UmVmITogRWxlbWVudFJlZjtcblxuICBjY0NoYXRDaGFuZ2VkITogU3Vic2NyaXB0aW9uO1xuXG4gIG1lc3NhZ2VUZW1wbGF0ZTogQ29tZXRDaGF0TWVzc2FnZVRlbXBsYXRlW10gPSBbXTtcbiAgQElucHV0KCkgYWxpZ25tZW50OiBNZXNzYWdlTGlzdEFsaWdubWVudCA9IE1lc3NhZ2VMaXN0QWxpZ25tZW50LnN0YW5kYXJkO1xuICBwdWJsaWMgbG9nZ2VkSW5Vc2VyITogQ29tZXRDaGF0LlVzZXI7XG5cbiAgcHVibGljIHJlY2VpcHRzOiBhbnkgPSBSZWNlaXB0cy53YWl0O1xuICBwdWJsaWMgY3VycmVudE1lc3NhZ2VPYmplY3Q6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSB8IG51bGwgPSBudWxsO1xuICBwdWJsaWMgdHlwZXNNYXA6IGFueSA9IHt9O1xuICBwdWJsaWMgbWVzc2FnZVR5cGVzTWFwOiBhbnkgPSB7fTtcbiAgaW5wdXRWYWx1ZSE6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlZjogQ2hhbmdlRGV0ZWN0b3JSZWYsXG4gICAgcHJpdmF0ZSB0aGVtZVNlcnZpY2U6IENvbWV0Q2hhdFRoZW1lU2VydmljZVxuICApIHsgfVxuXG4gIG5nT25Jbml0KCk6IHZvaWQge1xuXG4gICAgdGhpcy5zZXRBdmF0YXJTdHlsZSgpO1xuICAgIHRoaXMuc2V0QWlCb3RDaGF0SGVhZGVyKCk7XG4gICAgdGhpcy5zZXRBaUJvdENoYXRDb250YWluZXJTdHlsZSgpO1xuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyPy5nZXRVaWQoKSFcbiAgICAgIDogdGhpcy5ncm91cD8uZ2V0R3VpZCgpITtcblxuICAgIGxldCByZWNlaXZlclR5cGUgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG5cbiAgICBsZXQgZmlyc3RNZXNzYWdlID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgIHRoaXMuY3VycmVudEFza0FJQm90Py5pZCEsXG4gICAgICB0aGlzLmJvdEZpcnN0TWVzc2FnZVRleHQsXG4gICAgICByZWNlaXZlclR5cGVcbiAgICApO1xuICAgIGZpcnN0TWVzc2FnZS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG5cbiAgICB0aGlzLmJvdE1lc3NhZ2VzTGlzdC5wdXNoKGZpcnN0TWVzc2FnZSk7XG5cbiAgICBDb21ldENoYXQuZ2V0TG9nZ2VkaW5Vc2VyKClcbiAgICAgIC50aGVuKCh1c2VyOiBDb21ldENoYXQuVXNlciB8IG51bGwpID0+IHtcbiAgICAgICAgdGhpcy5sb2dnZWRJblVzZXIgPSB1c2VyITtcbiAgICAgIH0pXG4gICAgICAuY2F0Y2goKGVycm9yOiBDb21ldENoYXQuQ29tZXRDaGF0RXhjZXB0aW9uKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLm9uRXJyb3IpIHtcbiAgICAgICAgICB0aGlzLm9uRXJyb3IoZXJyb3IpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIHRoaXMuc2V0TWVzc2FnZXNTdHlsZSgpO1xuICAgIHRoaXMuc3Vic2NyaWJlVG9FdmVudHMoKTtcbiAgfVxuXG4gIHNldEF2YXRhclN0eWxlKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IEF2YXRhclN0eWxlID0gbmV3IEF2YXRhclN0eWxlKHtcbiAgICAgIGJvcmRlclJhZGl1czogXCIyNHB4XCIsXG4gICAgICB3aWR0aDogXCIyOHB4XCIsXG4gICAgICBoZWlnaHQ6IFwiMjhweFwiLFxuICAgICAgYm9yZGVyOiBgMXB4IHNvbGlkICR7dGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQyMDAoKX1gLFxuICAgICAgYmFja2dyb3VuZENvbG9yOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEFjY2VudDcwMCgpLFxuICAgICAgbmFtZVRleHRDb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQ5MDAoKSxcbiAgICAgIGJhY2tncm91bmRTaXplOiBcImNvdmVyXCIsXG4gICAgICBuYW1lVGV4dEZvbnQ6IGZvbnRIZWxwZXIodGhpcy50aGVtZVNlcnZpY2UudGhlbWUudHlwb2dyYXBoeS5zdWJ0aXRsZTEpLFxuXG4gICAgICBvdXRlclZpZXdCb3JkZXJTcGFjaW5nOiBcIlwiLFxuICAgIH0pO1xuICAgIHRoaXMuYXZhdGFyU3R5bGUgPSB7IC4uLmRlZmF1bHRTdHlsZSwgLi4udGhpcy5hdmF0YXJTdHlsZSB9O1xuICB9XG5cbiAgc2V0QWlCb3RDaGF0SGVhZGVyKCkge1xuICAgIGxldCBkZWZhdWx0U3R5bGU6IGFueSA9IHtcbiAgICAgIGRpc3BsYXk6IFwiZmxleFwiLFxuICAgICAganVzdGlmeUNvbnRlbnQ6IFwic3BhY2UtYmV0d2VlblwiLFxuICAgICAgYWxpZ25JdGVtczogXCJjZW50ZXJcIixcbiAgICAgIHBhZGRpbmc6IFwiMTBweFwiLFxuICAgICAgaGVpZ2h0OiBcIjQwcHhcIixcbiAgICAgIGJhY2tncm91bmQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lPy5wYWxldHRlLmdldEFjY2VudDIwMCgpLFxuICAgIH07XG4gICAgdGhpcy5haUJvdENoYXRIZWFkZXJTdHlsZSA9IHtcbiAgICAgIC4uLmRlZmF1bHRTdHlsZSxcbiAgICAgIC4uLnRoaXMuYWlCb3RDaGF0SGVhZGVyU3R5bGUsXG4gICAgfTtcbiAgfVxuICBzZXRBaUJvdENoYXRDb250YWluZXJTdHlsZSgpIHtcbiAgICBsZXQgZGVmYXVsdFN0eWxlOiBhbnkgPSB7XG4gICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldEJhY2tncm91bmQoKSxcbiAgICB9O1xuICAgIHRoaXMuYWlCb3RDaGF0Q29udGFpbmVyU3R5bGUgPSB7XG4gICAgICAuLi5kZWZhdWx0U3R5bGUsXG4gICAgICAuLi50aGlzLmFpQm90Q2hhdENvbnRhaW5lclN0eWxlLFxuICAgIH07XG4gIH1cblxuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICB0aGlzLnVuU3Vic2NyaWJlVG9FdmVudCgpO1xuICB9XG5cbiAgc3Vic2NyaWJlVG9FdmVudHMoKSB7XG4gICAgdGhpcy5jY0NoYXRDaGFuZ2VkID0gQ29tZXRDaGF0VUlFdmVudHMuY2NBY3RpdmVDaGF0Q2hhbmdlZC5zdWJzY3JpYmUoKCkgPT4ge1xuICAgICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwubmV4dCh7XG4gICAgICAgIGNoaWxkOiB7IHNob3dCb3RWaWV3OiBmYWxzZSB9LFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICB1blN1YnNjcmliZVRvRXZlbnQoKSB7XG4gICAgdGhpcy5jY0NoYXRDaGFuZ2VkPy51bnN1YnNjcmliZSgpO1xuICB9XG5cbiAgb25FcnJvcihlcnJvcjogQ29tZXRDaGF0RXhjZXB0aW9uKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTWV0aG9kIG5vdCBpbXBsZW1lbnRlZC5cIik7XG4gIH1cblxuICBnZW5lcmF0ZVJhbmRvbVN0cmluZyhsZW5ndGg6IGFueSkge1xuICAgIGNvbnN0IGNoYXJhY3RlcnMgPVxuICAgICAgXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OVwiO1xuICAgIGxldCByYW5kb21TdHJpbmcgPSBcIlwiO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcmFuZG9tSW5kZXggPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICByYW5kb21TdHJpbmcgKz0gY2hhcmFjdGVycy5jaGFyQXQocmFuZG9tSW5kZXgpO1xuICAgIH1cblxuICAgIHJldHVybiByYW5kb21TdHJpbmc7XG4gIH1cblxuICBoYW5kbGVDbGljaygpIHtcbiAgICB0aGlzLnJlY2VpcHRzID0gUmVjZWlwdHMud2FpdDtcblxuICAgIGxldCByZWNlaXZlcklkOiBzdHJpbmcgPSB0aGlzLnVzZXJcbiAgICAgID8gdGhpcy51c2VyPy5nZXRVaWQoKSFcbiAgICAgIDogdGhpcy5ncm91cD8uZ2V0R3VpZCgpITtcblxuICAgIGxldCByZWNlaXZlclR5cGUgPSB0aGlzLnVzZXJcbiAgICAgID8gQ29tZXRDaGF0VUlLaXRDb25zdGFudHMuTWVzc2FnZVJlY2VpdmVyVHlwZS51c2VyXG4gICAgICA6IENvbWV0Q2hhdFVJS2l0Q29uc3RhbnRzLk1lc3NhZ2VSZWNlaXZlclR5cGUuZ3JvdXA7XG5cbiAgICBsZXQgYm90VWlkID0gdGhpcy5jdXJyZW50QXNrQUlCb3Q/LmlkITtcbiAgICBsZXQgcXVlc3Rpb24gPSB0aGlzLmlucHV0VmFsdWU7XG4gICAgdGhpcy5pbnB1dFJlZj8ubmF0aXZlRWxlbWVudD8uZW1wdHlJbnB1dEZpZWxkKCk7XG4gICAgbGV0IHF1ZXJ5ID0gbmV3IENvbWV0Q2hhdC5UZXh0TWVzc2FnZShcbiAgICAgIHRoaXMubG9nZ2VkSW5Vc2VyLmdldFVpZCgpISxcbiAgICAgIHF1ZXN0aW9uLFxuICAgICAgcmVjZWl2ZXJUeXBlXG4gICAgKTtcblxuICAgIC8vIEdlbmVyYXRlIGEgcmFuZG9tIHN0cmluZyBmb3IgdGhlIG1lc3NhZ2UgSURcbiAgICBsZXQgcmFuZG9tU3RyaW5nID0gdGhpcy5nZW5lcmF0ZVJhbmRvbVN0cmluZygxMCk7IC8vIFNwZWNpZnkgdGhlIGRlc2lyZWQgbGVuZ3RoXG5cbiAgICAvLyBDb252ZXJ0IHRoZSByYW5kb20gc3RyaW5nIHRvIGEgbnVtYmVyIChtYXkgbm90IGJlIHRoZSBiZXN0IHByYWN0aWNlKVxuICAgIGxldCByYW5kb21TdHJpbmdBc051bWJlciA9IHBhcnNlSW50KHJhbmRvbVN0cmluZywgMzYpOyAvLyAzNiBpcyB0aGUgcmFkaXggZm9yIGFscGhhbnVtZXJpYyBjaGFyYWN0ZXJzXG5cbiAgICBxdWVyeS5zZXRJZChyYW5kb21TdHJpbmdBc051bWJlcik7XG5cbiAgICBxdWVyeS5zZXRTZW50QXQoQ29tZXRDaGF0VUlLaXRVdGlsaXR5LmdldFVuaXhUaW1lc3RhbXAoKSk7XG4gICAgdGhpcy5jdXJyZW50TWVzc2FnZU9iamVjdCA9IHF1ZXJ5O1xuICAgIGlmIChxdWVzdGlvbi50cmltKCkubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy5ib3RNZXNzYWdlc0xpc3QucHVzaChxdWVyeSk7XG5cbiAgICAgIENvbWV0Q2hhdC5hc2tCb3QocmVjZWl2ZXJJZCwgcmVjZWl2ZXJUeXBlLCBib3RVaWQsIHF1ZXN0aW9uKVxuICAgICAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKChtZXNzYWdlVGV4dCkgPT4ge1xuICAgICAgICAgIHRoaXMuaW5wdXRWYWx1ZSA9IFwiXCI7XG4gICAgICAgICAgdGhpcy5yZWNlaXB0cyA9IG51bGw7XG4gICAgICAgICAgbGV0IGFuc3dlciA9IG5ldyBDb21ldENoYXQuVGV4dE1lc3NhZ2UoXG4gICAgICAgICAgICBib3RVaWQsXG4gICAgICAgICAgICBtZXNzYWdlVGV4dCxcbiAgICAgICAgICAgIHJlY2VpdmVyVHlwZVxuICAgICAgICAgICk7XG4gICAgICAgICAgYW5zd2VyLnNldFNlbnRBdChDb21ldENoYXRVSUtpdFV0aWxpdHkuZ2V0VW5peFRpbWVzdGFtcCgpKTtcblxuICAgICAgICAgIHRoaXMuYm90TWVzc2FnZXNMaXN0LnB1c2goYW5zd2VyKTtcbiAgICAgICAgICB0aGlzLnJlZi5kZXRlY3RDaGFuZ2VzKCk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaCgoZXJyb3IpID0+IHtcbiAgICAgICAgICB0aGlzLnJlY2VpcHRzID0gUmVjZWlwdHMuZXJyb3I7XG5cbiAgICAgICAgICBjb25zb2xlLmVycm9yKFwiZXJyb3JcIiwgZXJyb3IpO1xuICAgICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBzZXRNZXNzYWdlQnViYmxlU3R5bGUobXNnOiBDb21ldENoYXQuQmFzZU1lc3NhZ2UpOiBCYXNlU3R5bGUge1xuICAgIGxldCBzdHlsZSE6IEJhc2VTdHlsZTtcbiAgICBpZiAobXNnLmdldFJlY2VpdmVySWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpKSB7XG4gICAgICBzdHlsZSA9IHtcbiAgICAgICAgYmFja2dyb3VuZDogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQxMDAoKSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0eWxlID0ge1xuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLnRoZW1lU2VydmljZS50aGVtZS5wYWxldHRlLmdldFByaW1hcnkoKSxcbiAgICAgICAgYm9yZGVyUmFkaXVzOiBcIjEycHhcIixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0eWxlO1xuICB9XG5cbiAgZ2V0QnViYmxlQWxpZ25tZW50KG1lc3NhZ2U6IENvbWV0Q2hhdC5CYXNlTWVzc2FnZSkge1xuICAgIHJldHVybiBtZXNzYWdlLmdldFJlY2VpdmVySWQoKSAhPT0gdGhpcy5sb2dnZWRJblVzZXI/LmdldFVpZCgpXG4gICAgICA/IE1lc3NhZ2VCdWJibGVBbGlnbm1lbnQubGVmdFxuICAgICAgOiBNZXNzYWdlQnViYmxlQWxpZ25tZW50LnJpZ2h0O1xuICB9XG5cbiAgdGV4dElucHV0U3R5bGU6IFRleHRJbnB1dFN0eWxlID0ge1xuICAgIHdpZHRoOiBcIjk4JVwiLFxuICAgIGRpdmlkZXJDb2xvcjogXCJ0cmFuc3BhcmVudFwiLFxuICAgIGJhY2tncm91bmQ6IFwidHJhbnNwYXJlbnRcIixcbiAgICBib3JkZXI6IFwiMnB4IHNvbGlkIHJlZCB0cmFuc3BhcmVudFwiLFxuICB9O1xuXG4gIHNlbmRCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICB9O1xuXG4gIG1lc3NhZ2VJbnB1dENoYW5nZWQgPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgIGNvbnN0IHRleHQgPSBldmVudD8uZGV0YWlsPy52YWx1ZT8udHJpbSgpO1xuICAgIHRoaXMuaW5wdXRWYWx1ZSA9IHRleHQ7XG4gIH07XG5cbiAgY2xvc2VCdXR0b25TdHlsZTogYW55ID0ge1xuICAgIGhlaWdodDogXCIyNHB4XCIsXG4gICAgd2lkdGg6IFwiMjRweFwiLFxuICAgIGJvcmRlcjogXCJub25lXCIsXG4gICAgYm9yZGVyUmFkaXVzOiBcIjBcIixcbiAgICBiYWNrZ3JvdW5kOiBcInRyYW5zcGFyZW50XCIsXG4gICAgYnV0dG9uSWNvblRpbnQ6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0UHJpbWFyeSgpLFxuICB9O1xuXG4gIGxhYmVsU3R5bGU6IGFueSA9IHtcbiAgICB0ZXh0Rm9udDogXCI0MDAgMTFweCBJbnRlclwiLFxuICAgIHRleHRDb2xvcjogXCJncmV5XCIsXG4gIH07XG5cbiAgb25DbG9zZURldGFpbHMoKSB7XG4gICAgQ29tZXRDaGF0VUlFdmVudHMuY2NTaG93UGFuZWwubmV4dCh7XG4gICAgICBjaGlsZDogeyBzaG93Qm90VmlldzogZmFsc2UgfSxcbiAgICB9KTtcbiAgfVxuXG4gIHNldE1lc3NhZ2VzU3R5bGUoKSB7XG4gICAgdGhpcy5idWJibGVEYXRlU3R5bGUgPSB7XG4gICAgICB0ZXh0Q29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NjAwKCksXG4gICAgICB0ZXh0Rm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LmNhcHRpb24yKSxcbiAgICAgIHBhZGRpbmc6IFwiM3B4XCJcbiAgICB9O1xuICB9XG5cbiAgZ2V0Qm90VGl0bGVTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZm9udDogZm9udEhlbHBlcih0aGlzLnRoZW1lU2VydmljZS50aGVtZS50eXBvZ3JhcGh5LnN1YnRpdGxlMSksXG4gICAgICBjb2xvcjogdGhpcy50aGVtZVNlcnZpY2UudGhlbWUucGFsZXR0ZS5nZXRBY2NlbnQoKSxcbiAgICB9XG4gIH1cblxuICBnZXRCb3RTdWJ0aXRsZVN0eWxlKCkge1xuICAgIHJldHVybiB7XG4gICAgICBmb250OiBmb250SGVscGVyKHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnR5cG9ncmFwaHkuY2FwdGlvbjIpLFxuICAgICAgY29sb3I6IHRoaXMudGhlbWVTZXJ2aWNlLnRoZW1lLnBhbGV0dGUuZ2V0QWNjZW50NTAwKCksXG4gICAgfVxuICB9XG5cbn1cbiIsIjxkaXYgY2xhc3M9XCJjYy1haS1hc3Npc3QtbWVzc2FnZS1saXN0X193cmFwcGVyXCJcbiAgW25nU3R5bGVdPVwiYWlCb3RDaGF0Q29udGFpbmVyU3R5bGVcIj5cbiAgPGRpdiBjbGFzcz1cImNjLWFpLWFzc2lzdC1tZXNzYWdlLWxpc3RfX2hlYWRlci12aWV3XCJcbiAgICBbbmdTdHlsZV09XCJhaUJvdENoYXRIZWFkZXJTdHlsZVwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1haS1hc3Npc3QtbWVzc2FnZS1saXN0X19oZWFkZXItYXZhdGFyXCI+XG4gICAgICA8Y29tZXRjaGF0LWF2YXRhciBbaW1hZ2VdPVwiY3VycmVudEFza0FJQm90Py5pY29uVVJMXCJcbiAgICAgICAgW2F2YXRhclN0eWxlXT1cImF2YXRhclN0eWxlXCI+XG4gICAgICA8L2NvbWV0Y2hhdC1hdmF0YXI+XG4gICAgICA8ZGl2IGNsYXNzPVwiY2MtYWktYXNzaXN0LW1lc3NhZ2UtbGlzdF9faGVhZGVyLWJvdC1uYW1lXCI+XG5cblxuICAgICAgICA8ZGl2IFtuZ1N0eWxlXT1cImdldEJvdFRpdGxlU3R5bGUoKVwiPlxuICAgICAgICAgIHt7Y3VycmVudEFza0FJQm90Py50aXRsZX19XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8ZGl2IFtuZ1N0eWxlXT1cImdldEJvdFN1YnRpdGxlU3R5bGUoKVwiPlxuICAgICAgICAgIHt7c3VidGl0bGVUZXh0fX1cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgIDwvZGl2PlxuXG4gICAgPGNvbWV0Y2hhdC1idXR0b24gW2ljb25VUkxdPVwiY2xvc2VCdXR0b25JY29uVVJMXCJcbiAgICAgIGNsYXNzPVwiY2MtZGV0YWlsc19fY2xvc2UtYnV0dG9uXCIgW2J1dHRvblN0eWxlXT1cImNsb3NlQnV0dG9uU3R5bGVcIlxuICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cIm9uQ2xvc2VEZXRhaWxzKClcIj48L2NvbWV0Y2hhdC1idXR0b24+XG4gIDwvZGl2PlxuICA8ZGl2IGNsYXNzPVwiY2MtYWktYXNzaXN0LW1lc3NhZ2UtbGlzdFwiPlxuICAgIDxjb21ldGNoYXQtbGlzdCBbbGlzdEl0ZW1WaWV3XT1cImxpc3RJdGVtXCIgW2xpc3RdPVwiYm90TWVzc2FnZXNMaXN0XCJcbiAgICAgIFtoaWRlU2VhcmNoXT1cImhpZGVTZWFyY2hcIj5cbiAgICA8L2NvbWV0Y2hhdC1saXN0PlxuICAgIDxuZy10ZW1wbGF0ZSAjbGlzdEl0ZW0gbGV0LW1lc3NhZ2U+XG4gICAgICA8Y29tZXRjaGF0LW1lc3NhZ2UtYnViYmxlIFtib3R0b21WaWV3XT1cIm51bGxcIlxuICAgICAgICBbc3RhdHVzSW5mb1ZpZXddPVwic3RhdHVzSW5mb1ZpZXdcIiBbdGhyZWFkVmlld109XCJudWxsXCJcbiAgICAgICAgW2NvbnRlbnRWaWV3XT1cImNvbnRlbnRWaWV3XCJcbiAgICAgICAgW21lc3NhZ2VCdWJibGVTdHlsZV09XCJzZXRNZXNzYWdlQnViYmxlU3R5bGUobWVzc2FnZSlcIlxuICAgICAgICBbYWxpZ25tZW50XT1cImdldEJ1YmJsZUFsaWdubWVudChtZXNzYWdlKVwiIFtsZWFkaW5nVmlld109XCJsZWFkaW5nVmlld1wiXG4gICAgICAgIFtoZWFkZXJWaWV3XT1cImJ1YmJsZUhlYWRlclwiPlxuICAgICAgICA8bmctdGVtcGxhdGUgI2NvbnRlbnRWaWV3PlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYy1haS1hc3Npc3QtbWVzc2FnZVwiPlxuICAgICAgICAgICAge3ttZXNzYWdlLmRhdGEudGV4dH19XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgIDxuZy10ZW1wbGF0ZSAjbGVhZGluZ1ZpZXc+XG5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNidWJibGVIZWFkZXI+XG5cbiAgICAgICAgPC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgPG5nLXRlbXBsYXRlICNzdGF0dXNJbmZvVmlldz5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiY2NfX2Fzc2lzdC1ib3RfX3N0YXR1c2luZm9cIj5cblxuICAgICAgICAgICAgPGNvbWV0Y2hhdC1kYXRlIFtwYXR0ZXJuXT1cImRhdGVQYXR0ZXJuXCJcbiAgICAgICAgICAgICAgW3RpbWVzdGFtcF09XCJtZXNzYWdlPy5nZXRTZW50QXQoKVwiXG4gICAgICAgICAgICAgIFtkYXRlU3R5bGVdPVwiYnViYmxlRGF0ZVN0eWxlXCI+PC9jb21ldGNoYXQtZGF0ZT5cbiAgICAgICAgICAgIDxjb21ldGNoYXQtcmVjZWlwdFxuICAgICAgICAgICAgICAqbmdJZj1cIm1lc3NhZ2U/LnJlY2VpdmVySWQgIT09Y3VycmVudEFza0FJQm90LmlkICYmIG1lc3NhZ2U/LmdldElkKCk9PT1jdXJyZW50TWVzc2FnZU9iamVjdD8uZ2V0SWQoKVwiXG4gICAgICAgICAgICAgIFtyZWNlaXB0XT1cInJlY2VpcHRzXCIgW3dhaXRJY29uXT1cIndhaXRJY29uXCJcbiAgICAgICAgICAgICAgW2Vycm9ySWNvbl09XCJlcnJvckljb25cIj48L2NvbWV0Y2hhdC1yZWNlaXB0PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L25nLXRlbXBsYXRlPlxuICAgICAgPC9jb21ldGNoYXQtbWVzc2FnZS1idWJibGU+XG4gICAgICA8aHI+XG4gICAgPC9uZy10ZW1wbGF0ZT5cbiAgPC9kaXY+XG5cbiAgPGRpdiBjbGFzcz1cImNjLWFpLWFzc2lzdF9faW5wdXQtd3JhcHBlclwiPlxuICAgIDxkaXYgY2xhc3M9XCJjYy1haS1hc3Npc3RfX2lucHV0XCI+XG4gICAgICA8Y29tZXRjaGF0LXRleHQtaW5wdXQgW3RleHRJbnB1dFN0eWxlXT1cInRleHRJbnB1dFN0eWxlXCIgI2lucHV0UmVmXG4gICAgICAgIChjYy10ZXh0LWlucHV0LWNoYW5nZWQpPVwibWVzc2FnZUlucHV0Q2hhbmdlZCgkZXZlbnQpXCJcbiAgICAgICAgKGNjLXRleHQtaW5wdXQtZW50ZXJlZCk9XCJoYW5kbGVDbGljaygpXCI+PC9jb21ldGNoYXQtdGV4dC1pbnB1dD5cbiAgICAgIDxjb21ldGNoYXQtYnV0dG9uIFtpY29uVVJMXT1cInNlbmRJY29uVXJsXCJcbiAgICAgICAgKGNjLWJ1dHRvbi1jbGlja2VkKT1cImhhbmRsZUNsaWNrKClcIlxuICAgICAgICBbYnV0dG9uU3R5bGVdPVwic2VuZEJ1dHRvblN0eWxlXCI+PC9jb21ldGNoYXQtYnV0dG9uPlxuICAgIDwvZGl2PlxuICA8L2Rpdj5cbjwvZGl2PlxuIl19