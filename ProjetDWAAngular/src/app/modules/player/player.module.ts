import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {HomeComponent} from './components/home/home/home.component';
import {AccountComponent} from './components/account/account.component';
import { GridsComponent } from './components/grids/grids.component';
import {CreateGameComponent} from './components/create-game/create-game.component';
import {LobbyComponent} from './lobby/lobby.component';
import {GameComponent} from './components/game/game.component';
import {CreateCharacComponent} from './components/create-charac/create-charac.component';
import {GridDetailsComponent} from './components/grid-details/grid-details.component';
import {CreateGridComponent} from './components/create-grid/create-grid.component';
import {ScoreboardComponent} from './components/scoreboard/scoreboard.component';

const playerRoutes: Routes = [
  { path: 'home', component: HomeComponent },
  {path: 'account', component: AccountComponent},
  {path: 'grids', component: GridsComponent},
  {path: 'grid-details/:id', component: GridDetailsComponent},
  {path: 'create-grid', component: CreateGridComponent},
  {path: 'create-game', component: CreateGameComponent},
  { path: 'lobby/:id', component: LobbyComponent },
  { path: 'game/:id', component: GameComponent },
  { path: 'create-charac', component: CreateCharacComponent },
  { path: 'scoreboard', component: ScoreboardComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(playerRoutes),
    HomeComponent
  ]
})
export class PlayerModule { }
