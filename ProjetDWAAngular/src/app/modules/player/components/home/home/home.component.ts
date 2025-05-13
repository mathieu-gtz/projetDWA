import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GameService } from '../../../services/game.service';
import {WebSocketService} from '../../../services/web-socket.service';
import {StorageService} from '../../../../../auth/services/storage/storage.service';
import { Subscription } from 'rxjs';

const GameMaxPlayers = 2;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  activeGames: any[] = [];
  loading: boolean = true;
  currentUser: any;
  private subscription: Subscription;

  constructor(
    private gameService: GameService,
    private router: Router,
    private snackBar: MatSnackBar,
    private webSocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.currentUser = StorageService.getUser();
    this.subscription = this.webSocketService.getGamesList().subscribe(games => {
      this.activeGames = games;
    });
    this.loadActiveGames();
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // charge les parties actives sans utiliser les websockets
  loadActiveGames(): void {
    this.loading = true;
    this.gameService.getActiveGames().subscribe({
      next: (games) => {
        this.activeGames = games;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des parties', err);
          this.snackBar.open('Erreur lors du chargement des parties en cours', 'Fermer', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  joinGame(gameId: number): void {
    if (!gameId) return;

    const game = this.activeGames.find(g => g.idG === gameId);
    if (game && game.player1 === this.currentUser.nickname) {
      this.router.navigate(['/player/lobby', gameId]);
      return;
    }
    this.webSocketService.joinGame(gameId, this.currentUser.nickname)
      .subscribe({
        next: (response) => {
          console.log('Partie rejointe avec succès:', response);
          this.router.navigate(['/player/lobby', gameId]);
        },
        error: (err) => {
          console.error('Erreur lors de la tentative de rejoindre la partie:', err);
          this.snackBar.open('Impossible de rejoindre cette partie', 'Fermer', {
            duration: 3000
          });
        }
      });
  }

  watchGame(gameId: number): void {
    this.gameService.watchGame(gameId).subscribe({
      next: (response) => {
        this.router.navigate(['/player/game', gameId, 'spectate']);
      },
      error: (err) => {
        console.error('Erreur lors de la tentative de regarder la partie', err);
        this.snackBar.open('Impossible de regarder cette partie', 'Fermer', {
          duration: 3000
        });
      }
    });
  }

  createNewGame(): void {
    this.router.navigate(['/player/create-game']);
  }

  getCurrentPlayerCount(game: any): number {
    let count = 0;
    if (game.player1 && game.player1.trim() !== '') count++;
    if (game.player2 && game.player2.trim() !== '') count++;
    return count;
  }

  getGameMaxPlayers() {
    return GameMaxPlayers;
  }
}
