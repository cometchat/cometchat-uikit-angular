import { sounds } from "../interface";
import   {callConstants} from "../../../Constants/UIKitConstants";
export class CometChatSoundManager {
	static audio:string | null | HTMLAudioElement = null;
	static Sound :sounds = Object.freeze({
		incomingCall: callConstants.incomingCall,
		incomingMessage: callConstants.incomingMessage,
		incomingMessageFromOther: callConstants.incomingMessageFromOther,
		outgoingCall: callConstants.outgoingCall,
		outgoingMessage:callConstants.outgoingMessage,
	});
	/**
	 * @param  {string|null=null} customSound
	 */
	static onIncomingMessage = (customSound:string | null = null): void => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			CometChatSoundManager.audio = new Audio('/assets/resources/audio/incomingmessage.wav');
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		}
	};
	/**
	 * @param  {string|null=null} customSound
	 */
	static onIncomingOtherMessage = (customSound:string | null = null) => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			CometChatSoundManager.audio = new Audio('/assets/resources/audio/incomingothermessage.wav');
				CometChatSoundManager.audio.currentTime = 0;
				CometChatSoundManager.audio.play();
		}
	};
	/**
	 * @param  {string|null=null} customSound
	 */
	static onOutgoingMessage = (customSound:string | null = null) => {
		if (customSound) {
			CometChatSoundManager.audio = new Audio(customSound);
			CometChatSoundManager.audio.currentTime = 0;
			CometChatSoundManager.audio.play();
		} else {
			CometChatSoundManager.audio = new Audio('/assets/resources/audio/outgoingmessage.wav');
				CometChatSoundManager.audio.currentTime = 0;
				CometChatSoundManager.audio.play();
		}
	};
	/**
	 * @param  {string|null=null} customSound
	 */
	static onIncomingCall = (customSound:string | null = null) => {
		if (customSound) {
			try {
				CometChatSoundManager.audio = new Audio(customSound);
				CometChatSoundManager.audio.currentTime = 0;
				if (typeof CometChatSoundManager.audio.loop == "boolean") {
					CometChatSoundManager.audio.loop = true;
				} else {
					CometChatSoundManager.audio.addEventListener(
						"ended",
						function (this:any) {
							this.currentTime = 0;
							this.play();
						},
						false,
					);
				}
				CometChatSoundManager.audio.play();
			} catch (error:any) { }
		} else {
			try {
				CometChatSoundManager.audio = new Audio('/assets/resources/audio/incomingcall.wav');
				CometChatSoundManager.audio.currentTime = 0;
					if (typeof CometChatSoundManager.audio.loop == "boolean") {
						CometChatSoundManager.audio.loop = true;
					} else {
						CometChatSoundManager.audio.addEventListener(
							"ended",
							function (this:any) {
								this.currentTime = 0;
								this.play();
							},
							false,
						);
					}
					CometChatSoundManager.audio.play();
			} catch (error:any) { }
		}
	};
	/**
	 * @param  {string|null=null} customSound
	 */
	static onOutgoingCall = (customSound:string | null = null) => {
		if (customSound) {
			try {
				CometChatSoundManager.audio = new Audio(customSound);
				CometChatSoundManager.audio.currentTime = 0;
				if (typeof CometChatSoundManager.audio.loop == "boolean") {
					CometChatSoundManager.audio.loop = true;
				} else {
					CometChatSoundManager.audio.addEventListener(
						"ended",
						function (this:any) {
							this.currentTime = 0;
							this.play();
						},
						false,
					);
				}
				CometChatSoundManager.audio.play();
			} catch (error:any) { }
		} else {
			try {
					CometChatSoundManager.audio = new Audio('/assets/resources/audio/outgoingcall.wav');
					CometChatSoundManager.audio.currentTime = 0;
					if (typeof CometChatSoundManager.audio.loop == "boolean") {
						CometChatSoundManager.audio.loop = true;
					} else {
						CometChatSoundManager.audio.addEventListener(
							"ended",
							function (this:any) {
								this.currentTime = 0;
								this.play();
							},
							false,
						);
					}
					CometChatSoundManager.audio.play();
			} catch (error:any) { }
		}
	};
	static handlers = {
		incomingCall: CometChatSoundManager.onIncomingCall,
		outgoingCall: CometChatSoundManager.onOutgoingCall,
		incomingMessage: CometChatSoundManager.onIncomingMessage,
		incomingMessageFromOther: CometChatSoundManager.onIncomingOtherMessage,
		outgoingMessage: CometChatSoundManager.onOutgoingMessage,
	};
	/**
	 * @param  {string} sound
	 * @param  {string|null=null} customSound
	 */
	static play(sound:any, customSound:string | null = null) {
		
		const resource = (CometChatSoundManager as any).Sound[sound];
		const handler = (CometChatSoundManager as any).handlers[resource];
		if (!handler) {
			return false;
		}
		return handler(customSound);
	}
	static pause() {
		if (CometChatSoundManager.audio) {
			(CometChatSoundManager as any).audio.pause();
		}
	}
}
