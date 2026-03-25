import { Routes } from '@angular/router';
import { authGuard, credentialsGuard, loginGuard } from './guards';

export const routes: Routes = [
  {
    path: 'credentials',
    data: { title: 'credentials_page_title' },
    loadComponent: () =>
      import('./pages/credentials/credentials-page.component').then(
        (m) => m.CredentialsPageComponent
      ),
  },
  {
    path: 'login',
    data: { title: 'login_page_title' },
    canActivate: [ loginGuard],
    loadComponent: () =>
      import('./pages/login/login-page.component').then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: 'home',
    data: { title: 'home_page_title' },
    canActivate: [ authGuard],
    loadComponent: () =>
      import('./pages/home/cometchat-home.component').then(
        (m) => m.CometChatHomeComponent
      ),
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
