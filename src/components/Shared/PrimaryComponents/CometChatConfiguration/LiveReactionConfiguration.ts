/**
 * @class LiveReactionConfiguration
 * @param {string} liveReactionIconURL

 */
export class LiveReactionConfiguration {
    liveReactionIconURL: string = "assets/resources/heart-reaction.png"

    constructor({ liveReactionIconURL = "assets/resources/heart-reaction.png" }) {
        this.liveReactionIconURL = liveReactionIconURL

    }
}
