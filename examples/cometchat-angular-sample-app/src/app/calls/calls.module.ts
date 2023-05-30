import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CallsComponent } from './calls.component';
import { CometChatCallButtons, CometChatIncomingCall, CometChatOngoingCall, CometChatOutgoingCall } from '@cometchat-pro/angular-ui-kit';
import { CallButtonsDemoComponent } from './call-buttons-demo/call-buttons-demo.component';

@NgModule({
  declarations: [
    CallsComponent,
    CallButtonsDemoComponent,

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    FormsModule,
    CometChatCallButtons,
    CometChatIncomingCall,
    CometChatOutgoingCall,
    CometChatOngoingCall,


  ],
  providers: [],
  bootstrap: [    CallsComponent,
  ],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CallsModule { }
