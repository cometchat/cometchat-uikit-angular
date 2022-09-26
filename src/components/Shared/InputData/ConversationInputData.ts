
import { InputData } from "./inputData"

export interface ConversationInputData extends InputData {
    time?: boolean,
    unreadCount?: boolean,
    readReceipt?: boolean
}