/**
 * @class ConversationWithMessagesConfiguration
 * @param {string} errorText
 * @param {string} title
 * @param {callback} onClose
 * @param {callback} onCreatePoll
 * @param {number} defaultAnswers
 * @param {string} questionPlaceholderText
 * @param {string} optionPlaceholderText
 * @param {string} answerHelpText
 * @param {string} closeIconURL
 * @param {string} deleteIconURL
 * @param {string} addAnswerIconURL
 * @param {string} AddAnswerButtonText
 * @param {string} createPollButtonText
 */


export class CreatePollConfiguration {
    onClose!: any;
    onCreatePoll!: any;
    defaultAnswers: number = 2;
    closeIconURL: string = "assets/resources/close2x.svg";
    deleteIconURL: string = "assets/resources/deleteicon.svg";
    addAnswerIconURL: string = "assets/resources/Plus.svg";
    constructor({
        onClose = null,
        onCreatePoll = null,
        defaultAnswers = 2,
        closeIconURL = "assets/resources/close2x.svg",
        deleteIconURL = "assets/resources/deleteicon.svg",
        addAnswerIconURL = "assets/resources/Plus.svg",
    }) {
        this.onClose = onClose;
        this.onCreatePoll = onCreatePoll;
        this.defaultAnswers = defaultAnswers;
        this.closeIconURL = closeIconURL;
        this.deleteIconURL = deleteIconURL;
        this.addAnswerIconURL = addAnswerIconURL;

    }
}