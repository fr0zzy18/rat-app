import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { PlayersComponent } from './components/players/players.component'; // Import PlayersComponent
import { RegisterComponent } from './components/register/register.component';
import { managerGuard } from './core/guards/manager.guard';
import { ManageUsersComponent } from './components/manage-users/manage-users.component';
import { BingoComponent } from './components/bingo/bingo.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'players', component: PlayersComponent, canActivate: [authGuard] }, // Protected Players route
  { path: 'bingo', component: BingoComponent, canActivate: [authGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [authGuard, managerGuard] },
  { path: 'manage-users', component: ManageUsersComponent, canActivate: [authGuard, managerGuard] },
  { path: '**', redirectTo: '/login' }
];
