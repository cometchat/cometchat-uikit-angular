import { MessageHeaderConfiguration } from "./MessageHeaderConfiguration";

export class JoinProtectedGroupConfiguration {
  messageHeaderConfiguration:MessageHeaderConfiguration = new MessageHeaderConfiguration({})
    constructor({
        messageHeaderConfiguration = new MessageHeaderConfiguration({}) 
    }){
        this.messageHeaderConfiguration = messageHeaderConfiguration
    }
}