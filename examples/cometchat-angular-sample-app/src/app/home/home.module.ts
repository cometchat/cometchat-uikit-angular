import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { HomeComponent } from './home.component';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../shared/shared.module';
import { UsersModule } from '../users/users.module';
import { GroupsModule } from '../groups/groups.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatsModule } from '../chats/chats.module';
const appRoutes: Routes = [
  { path: 'shared', component: SharedModule },
  { path: 'chats',        component: ChatsModule },
  { path: 'messages',   component: MessagesModule },
  { path: 'users', component: UsersModule },
  { path: 'groups', component: GroupsModule },
];
@NgModule({
  declarations: [
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    // RouterModule.forRoot(
    //   appRoutes,
  
    // ),
    FormsModule
  ],
  providers: [],
  bootstrap: [HomeComponent]
})
export class HomeModule { }
