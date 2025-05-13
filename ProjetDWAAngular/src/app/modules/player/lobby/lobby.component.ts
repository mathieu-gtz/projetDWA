import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { GameService } from '../services/game.service';
import { WebSocketService } from '../services/web-socket.service';
import { StorageService } from '../../../auth/services/storage/storage.service';
import {MatCardModule} from '@angular/material/card';
import {MatDividerModule} from '@angular/material/divider';
import {MatIconModule} from '@angular/material/icon';
import {MatChip} from '@angular/material/chips';
import {CommonModule} from '@angular/common';
import {MatButtonModule} from '@angular/material/button';
import { GameRules } from '../models/GameRules';

interface GameData {
  idG: number;
  player1: string;
  player2: string | null;
  gameRules?: GameRules;
  password?: string;
}


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  imports: [
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatChip,
    CommonModule,
    MatButtonModule
  ],
  styleUrls: ['./lobby.component.css']
})



export class LobbyComponent implements OnInit, OnDestroy {

    
  gameData: GameData | null = null;
  gameId: string | null = null;
  currentUser: any;
  isCreator: boolean = false;
  player1Ready: boolean = false;
  player2Ready: boolean = false;
  player2Present: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private webSocketService: WebSocketService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.currentUser = StorageService.getUser();
    this.gameId = this.route.snapshot.paramMap.get('id');

    if (this.gameId) {
      this.loadGameDetails();

const readyStatusSub = this.webSocketService.getPlayerReadyUpdates(this.gameId)
  .subscribe(update => {
    console.log('=== READY STATUS UPDATE ===');
    console.log('Received update:', update);
    console.log('Current state:', {
      player1Ready: this.player1Ready,
      player2Ready: this.player2Ready,
      player2Present: this.player2Present,
      isCreator: this.isCreator,
      currentUser: this.currentUser.nickname
    });

    if (update && typeof update === 'object') {
      // Handle ready status map updates (from readystatus endpoint)
      if (!(update.event || update.type)) {
        if (this.gameData?.player1 && update[this.gameData.player1] !== undefined) {
          this.player1Ready = !!update[this.gameData.player1];
          console.log(`Updated player1 (${this.gameData.player1}) ready from map:`, this.player1Ready);
        }
        if (this.gameData?.player2 && update[this.gameData.player2] !== undefined) {
          this.player2Ready = !!update[this.gameData.player2];
          console.log(`Updated player2 (${this.gameData.player2}) ready from map:`, this.player2Ready);
        }
      } 
      // Handle individual ready updates (from ready endpoint)
      else if (update.playerNickname && update.ready !== undefined) {
        console.log('Processing individual ready update:', update);
        
        // Update player ready states based on nickname
        if (update.playerNickname === this.gameData?.player1) {
          this.player1Ready = update.ready;
          console.log(`Updated player1 ready state:`, this.player1Ready);
        }
        if (update.playerNickname === this.gameData?.player2) {
          this.player2Ready = update.ready;
          console.log(`Updated player2 ready state:`, this.player2Ready);
        }

        // Show notification for other player's status change
        if (update.playerNickname !== this.currentUser.nickname) {
          this.snackBar.open(
            `${update.playerNickname} est ${update.ready ? 'prêt' : 'pas prêt'}`,
            'Fermer',
            { duration: 2000 }
          );
        }
      }

      console.log('Updated game state:', {
        player1Ready: this.player1Ready,
        player2Ready: this.player2Ready,
        player2Present: this.player2Present
      });

      // Check if game can start after state update
      this.checkGameCanStart();
    }
  });

      const gameStartSub = this.webSocketService.getGameStartNotification(this.gameId)
        .subscribe(notification => {
          console.log('Game start notification:', notification);

          if (notification.status === 'GAME_STARTED') {
            this.snackBar.open('La partie va commencer !', 'Fermer', { duration: 2000 });
            setTimeout(() => {
              this.router.navigate(['/player/game', this.gameId]);
            }, 2000);
          }
        });

      const playerJoinSub = this.webSocketService.getPlayerJoinUpdates(this.gameId)
  .subscribe(update => {
    console.log('Player join update received:', update);

    // Update player2 status only if it's a new join
    if (update.status === 'JOINED' && update.player2) {
      const player2Nickname = update.player2;
      
      // Only update if player2 is different
      if (!this.gameData?.player2 || this.gameData.player2 !== player2Nickname) {
        console.log('Updating player2 status:', {
          previous: this.gameData?.player2,
          new: player2Nickname
        });

        this.player2Present = true;
        this.gameData = {
          ...this.gameData,
          player2: player2Nickname
        };

        // Reset ready states when new player joins
        if (!this.isCreator) {
          this.player1Ready = false;
        } else {
          this.player2Ready = false;
        }

        this.snackBar.open(`${player2Nickname} a rejoint le lobby`, 'Fermer', { duration: 3000 });
        
        // Request ready status update after player joins
        setTimeout(() => {
          this.webSocketService.requestReadyStatus(this.gameId);
        }, 500);
      }
    }
  });

      const playerLeaveSub = this.webSocketService.getPlayerLeaveUpdates(this.gameId)
        .subscribe(update => {
          console.log('Player leave update:', update);

          if (update.isCreator) {
            this.gameService.deleteGame(this.gameId).subscribe({
              next: () => {
                this.snackBar.open('Partie annulée', 'Fermer', { duration: 3000 });
                this.router.navigate(['/player/home']);
              },
              error: (err) => {
                console.error('Erreur lors de l\'annulation de la partie', err);
                this.snackBar.open('Erreur lors de l\'annulation de la partie', 'Fermer', { duration: 3000 });
              }
            });
          } else if (update.playerNickname !== this.currentUser.nickname) {
            this.player2Present = false;
            this.gameData.player2 = null;
            this.player2Ready = false;
            this.snackBar.open(`${update.playerNickname} a quitté le lobby`, 'Fermer', { duration: 3000 });
          }
        });

      this.subscriptions.push(readyStatusSub, playerJoinSub, gameStartSub, playerLeaveSub);
      setTimeout(() => {
        this.webSocketService.requestReadyStatus(this.gameId);
      }, 500);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

private checkGameCanStart(): void {
  const gameState = {
    player1Ready: this.player1Ready,
    player2Ready: this.player2Ready,
    player2Present: this.player2Present,
    isCreator: this.isCreator,
    currentUser: this.currentUser.nickname,
    gameData: {
      player1: this.gameData?.player1,
      player2: this.gameData?.player2
    }
  };

  console.log('=== GAME START CHECK ===');
  console.log('Current game state:', JSON.stringify(gameState, null, 2));

  // Vérification des conditions
  const conditions = {
    player1Ready: this.player1Ready === true,
    player2Ready: this.player2Ready === true,
    player2Present: this.player2Present === true,
    hasGameData: !!this.gameData,
    player1Exists: !!this.gameData?.player1,
    player2Exists: !!this.gameData?.player2
  };

  const allConditionsMet = Object.values(conditions).every(value => value === true);

  if (allConditionsMet) {
    console.log('Toutes les conditions sont remplies!');
    
    if (this.isCreator) {
      console.log('Le créateur démarre la partie...', {
        gameId: this.gameId,
        creator: this.currentUser.nickname
      });
      
      this.webSocketService.setGameStarted(this.gameId);
    }
    
    // Afficher le message et rediriger
    this.snackBar.open('La partie va commencer!', 'Fermer', { duration: 2000 });
    
    // Attendre 2 secondes avant la redirection
    setTimeout(() => {
      this.router.navigate(['/player/game', this.gameId]);
    }, 2000);
  } else {
    const failedConditions = Object.entries(conditions)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    console.log('Impossible de démarrer. Conditions manquantes:', failedConditions);
  }
}


loadGameDetails(): void {
  if (!this.gameId) return;

  this.gameService.getGame(this.gameId).subscribe({
    next: (game) => {
      console.log('Game details loaded:', game);
      
      this.gameData = game;
      console.log('Game rules:', this.gameData.gameRules); 
      this.isCreator = game.player1 === this.currentUser.nickname;
      this.player2Present = !!game.player2;

      console.log('Initial game state:', {
        isCreator: this.isCreator,
        player2Present: this.player2Present,
        currentUser: this.currentUser.nickname,
        player1: game.player1,
        player2: game.player2
      });

      if (this.player2Present && !this.isCreator) {
        this.snackBar.open('Vous avez rejoint le lobby', 'Fermer', { duration: 3000 });
      }
    },
    error: (err) => {
      console.error('Erreur lors du chargement des détails de la partie', err);
      this.snackBar.open('Impossible de charger les détails de la partie', 'Fermer', { duration: 3000 });
    }
  });
}

toggleReady(): void {
  if (!this.gameId || !this.gameData) return;

  const currentStatus = this.isCreator ? this.player1Ready : this.player2Ready;
  const newReadyStatus = !currentStatus;

  // Mise à jour locale immédiate pour le retour utilisateur
  if (this.isCreator) {
    this.player1Ready = newReadyStatus;
  } else {
    this.player2Ready = newReadyStatus;
  }

  // Envoyer au serveur
  this.webSocketService.setPlayerReady(
    this.gameId,
    this.currentUser.nickname,
    newReadyStatus
  );

  console.log('Ready status updated:', {
    player: this.currentUser.nickname,
    newStatus: newReadyStatus,
    currentState: {
      player1Ready: this.player1Ready,
      player2Ready: this.player2Ready,
      isCreator: this.isCreator
    }
  });
}

  leaveLobby(): void {
    const isCreator = this.gameData && this.gameData.player1 === this.currentUser.nickname;

    this.webSocketService.leaveLobby(
      this.gameId,
      this.currentUser.nickname,
      isCreator
    );

    if (isCreator) {
      this.gameService.deleteGame(this.gameId).subscribe({
        next: () => {
          console.log('Partie supprimée avec succès');
          this.snackBar.open('Vous avez annulé la partie', 'Fermer', { duration: 3000 });
        },
        error: (err) => {
          console.error('Erreur lors de la suppression de la partie:', err);
          this.snackBar.open('Erreur lors de l\'annulation de la partie', 'Fermer', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Vous avez quitté le lobby', 'Fermer', { duration: 3000 });
    }

    this.router.navigate(['/player/home']);
  }

}
