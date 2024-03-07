# CometChat Angular UI Kit: v4

![GitHub repo size](https://img.shields.io/github/repo-size/cometchat-pro/javascript-angular-chat-ui-kit)
![GitHub contributors](https://img.shields.io/github/contributors/cometchat-pro/javascript-angular-chat-ui-kit)
![GitHub stars](https://img.shields.io/github/stars/cometchat-pro/javascript-angular-chat-ui-kit?style=social)
![Twitter Follow](https://img.shields.io/twitter/follow/cometchat?style=social)
</br></br>
<div style="width:100%">
    <div style="width:50%; display:inline-block">
        <div align="center">
          <img align="left" alt="Main" src="./Screenshots/main.png">
        </div>
    </div>
</div>

</br></br>
CometChat Angular UI Kit is a collection of custom UI Components designed to build text chat and voice/video calling features in your application.

The UI Kit is developed to keep developers in mind and aims to reduce development efforts significantly.

---

## Features

- Private(1-1) & Group Conversations
- Voice & video calling & conferencing
- Rich Media Attachments
- Typing Indicators
- Text, Media and Custom messages
- Read receipts
- Online Presence Indicators
- Message History
- Users & Friends List
- Search by users and groups
- Groups List
- Conversations List
- Threaded Conversations

## Extensions

[Thumbnail Generation](https://www.cometchat.com/docs/extensions/thumbnail-generation) | [Link Preview](https://www.cometchat.com/docs/extensions/link-preview) | [Rich Media Preview](https://www.cometchat.com/docs/extensions/rich-media-preview) | [Smart Replies](https://www.cometchat.com/docs/extensions/smart-replies) | [Emojis](https://www.cometchat.com/docs/extensions/emojis) | [Polls](https://www.cometchat.com/docs/extensions/polls) | [Reactions](https://www.cometchat.com/docs/extensions/reactions) | [Stickers](https://www.cometchat.com/docs/extensions/stickers)

## Prerequisites

Before you begin, ensure you have met the following requirements:

- A text editor, to write code in. This could be a text editor (e.g. [Visual Studio Code](https://code.visualstudio.com/), [Notepad++](https://notepad-plus-plus.org/), [Sublime Text](https://www.sublimetext.com/), [Atom](https://atom.io/), or [VIM](https://www.vim.org/))

- [Node](https://nodejs.org/)

- [npm](https://www.npmjs.com/get-npm)

- Angular CLI `npm install -g @angular/cli`

---

## Installing Angular UI Kit

## 1. Setup

### i. Register on CometChat 🔧

To install Angular UI Kit, you need to first register on CometChat Dashboard. <a href="https://app.cometchat.com/signup" target="_blank">Click here to sign up</a>

### ii. Get your Application Keys :key:

- Create a new app
- Head over to the Quick Start or API & Auth Keys section and note the `App ID`, `Auth Key`, and `Region`.

### iii. Add the CometChat Dependency

```javascript
  npm install @cometchat/chat-uikit-angular
```

<br/>

## 2. Link the assets

Add the assets as shown below in the `package.json` of your project:

```json
"assets": [
"src/favicon.ico",
"src/assets",
// add this inside angular.json build/assets section
{
	"glob": "**/*",
	"input":  "./node_modules/@cometchat/chat-uikit-angular/assets/",
	"output": "assets/"
}],
```

## 3. Initialise CometChatUIKit

The `init()` method initializes the settings required for CometChat. We suggest calling the `init()` method on app startup, i.e. `main.ts` file of the application.

```javascript
//add this in our main.ts file.
import { CometChatUIKit,UIKitSettingsBuilder } from '@cometchat/chat-uikit-angular';

const COMETCHAT_CONSTANTS = {
	APP_ID: "APP_ID", // Replace with your App ID
	REGION: "REGION", // Replace with your App Region ("eu" or "us")
	AUTH_KEY: "AUTH_KEY" // Replace with your Auth Key
}

//create the builder
const uiKitSettings = new UIKitSettingsBuilder()
  .setAppId(COMETCHAT_CONSTANTS.APP_ID)
  .setRegion(COMETCHAT_CONSTANTS.REGION)
  .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
  .subscribePresenceForFriends()
  .build();

//Initialize CometChat
CometChatUIKit.init(uiKitSettings)?.then(()=>{
		//load your root module
    platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
})
```

## 4. Login User

The `login()` method returns the User object containing all the information of the logged-in user.

### i. Login using Auth Key

```javascript
const UID: string = "UID";
const authKey: string = "AUTH_KEY";

//Login user
CometChatUIKit.login(UID, authKey).then(user: CometChat.User => {

console.log("Login Successful:", { user });
//mount your app

}).catch(console.log);
```

### i. Login using Auth Token

```javascript
const authToken: string = "AUTH_TOKEN";
//Login user
CometChatUIKit.login(authToken).then(user: CometChat.User => {

console.log("Login Successful:", { user });
//mount your app

}).catch(console.log);
```

## 5. Launch UI Components

### i. Import the required components inside your project.

In `app.module.ts`

```javascript

import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }  from './app.component';
//import the component in your module.ts file
import { CometChatConversationsWithMessages } from '@cometchat/chat-uikit-angular';

@NgModule({
  imports:      [ BrowserModule, CometChatConversationsWithMessages ],
  declarations: [ AppComponent ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }

```

### ii. Launch the component.

In `app.component.html`

```html
<cometchat-conversations-with-messages></cometchat-conversations-with-messages>
```
### iii. Run the project

```cli
ng serve
```


# Checkout our sample app

Visit our [Angular sample app](https://github.com/cometchat/cometchat-uikit-angular) repo to run the Angular sample app.

---

# Troubleshooting

- To read the full documentation on UI Kit integration visit our [Documentation](https://www.cometchat.com/docs/angular-chat-ui-kit/overview).

- Facing any issues while integrating or installing the UI Kit please connect with us via real time support present in <a href="https://app.cometchat.com/" target="_blank">CometChat Dashboard.</a>

---


# Contact :mailbox:

Contact us via real time support present in [CometChat Dashboard](https://app.cometchat.com/).

---

# License

This project uses the following [license](https://github.com/cometchat/.github/blob/master/LICENSE).
