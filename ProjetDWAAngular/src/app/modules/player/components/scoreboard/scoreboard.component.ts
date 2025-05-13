import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PlayerService } from '../../services/player.service';
import { PlayerRanking } from '../../models/PlayerRanking';
import { WebSocketService } from '../../services/web-socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatBadgeModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './scoreboard.component.html',
  styleUrls: ['./scoreboard.component.css']
})
export class ScoreboardComponent implements OnInit {
  players: PlayerRanking[] = [];
  loading = true;
  displayedColumns: string[] = ['rank', 'status', 'nickname', 'victories'];
  private wsSubscription: Subscription | null = null;

  constructor(private playerService: PlayerService,private wsService: WebSocketService) {}

  ngOnInit(): void {
    this.loadPlayerRankings();
    this.wsService.connect();this.wsSubscription = this.wsService.getOnlinePlayers().subscribe(
      (onlinePlayers) => {
        this.updatePlayerStatus(onlinePlayers);
      }
    );

  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadPlayerRankings(): void {
    this.loading = true;
    this.playerService.getPlayerRankings().subscribe({
      next: (data) => {
        this.players = data.map((player, index) => ({
          ...player,
          rank: index + 1
        }));
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement du classement des joueurs', error);
        this.loading = false;
      }
    });
  }

  updatePlayerStatus(onlinePlayers: string[]): void {
    this.players = this.players.map(player => ({
      ...player,
      online: onlinePlayers.includes(player.nickname)
    }));
  }

  refreshRankings(): void {
    this.loadPlayerRankings();
  }
}
