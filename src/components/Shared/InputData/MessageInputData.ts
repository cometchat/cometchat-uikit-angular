import { InputData } from "./inputData";

export interface messageInputData extends InputData {
    time?: boolean | null,
    readReceipt?: boolean | null,
}
