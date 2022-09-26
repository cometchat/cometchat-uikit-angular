import { CometChat } from "@cometchat-pro/chat"
export interface styles {
    height?:string,
    width?:string,
    border?:string,
    borderRadius?:string,
    background?:string,
}

export interface groupTypes {
    public: string,
    private: string,
    password: string
}


export interface customView {
    loading:any,
    error:any,
    empty:any

}