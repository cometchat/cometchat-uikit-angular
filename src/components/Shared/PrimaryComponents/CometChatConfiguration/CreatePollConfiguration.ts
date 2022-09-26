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
    errorText: string = "";
    title: string = "Create Poll";
    onClose!: any;
    onCreatePoll!: any;
    defaultAnswers: number = 2;
    questionPlaceholderText: string = "Question";
    optionPlaceholderText: string = "Answer";
    answerHelpText: string = "Set Answers";
    closeIconURL: string = "assets/resources/close2x.svg";
    deleteIconURL: string = "assets/resources/deleteicon.svg";
    addAnswerIconURL: string = "assets/resources/Plus.svg";
    AddAnswerButtonText: string = "Add Answer";
    createPollButtonText: string = "Send";
    constructor({
        errorText = "Something Went Wrong",
        title = "Create Poll",
        onClose = null,
        onCreatePoll = null,
        defaultAnswers = 2,
        questionPlaceholderText = "Question",
        optionPlaceholderText = "Answer",
        answerHelpText = "Set Answers",
        closeIconURL = "assets/resources/close2x.svg",
        deleteIconURL = "assets/resources/deleteicon.svg",
        addAnswerIconURL = "assets/resources/Plus.svg",
        AddAnswerButtonText = "Add Answer",
        createPollButtonText = "Send",
    }) {
        this.errorText = errorText;
        this.title = title;
        this.onClose = onClose;
        this.onCreatePoll = onCreatePoll;
        this.defaultAnswers = defaultAnswers;
        this.questionPlaceholderText = questionPlaceholderText;
        this.optionPlaceholderText = optionPlaceholderText;
        this.answerHelpText = answerHelpText;
        this.closeIconURL = closeIconURL;
        this.deleteIconURL = deleteIconURL;
        this.addAnswerIconURL = addAnswerIconURL;
        this.AddAnswerButtonText = AddAnswerButtonText;
        this.createPollButtonText = createPollButtonText;

    }
}