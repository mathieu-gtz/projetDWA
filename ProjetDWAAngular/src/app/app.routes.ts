import { Routes } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { SignupComponent } from './auth/components/signup/signup.component';

export const routes: Routes = [
  {path: "login", component: LoginComponent},
  {path: "signup", component: SignupComponent},
  {path: '', redirectTo: '/login', pathMatch: 'full'},
  {path: "player", loadChildren: () => import('./modules/player/player.module').then(m => m.PlayerModule)}
]
