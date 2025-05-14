import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable, of, switchMap, throwError, map, tap } from 'rxjs';
import { StorageService} from '../../../auth/services/storage/storage.service';
import { Game } from '../models/Game';
import { Grid } from '../models/Grid';
import { GameRules } from '../models/GameRules';
import { environment } from '../../../../environments/environment.prod';


const BASE_URL = `${environment.apiUrl}/api/games`;

@Injectable({
  providedIn: 'root'
})
export class GameService {  
  private readonly apiUrl = `${environment.apiUrl}/api/games`;

  constructor(private http: HttpClient) { }

  getActiveGames(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}/active`, { headers });
  }

  joinGame(gameId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`
    });

    return this.http.get<any>(`${BASE_URL}/${gameId}`, { headers }).pipe(
      switchMap(game => {
        const currentPlayerName = StorageService.getUser().nickname;

        if (!game.player1) {
          game.player1 = currentPlayerName;
        } else if (!game.player2) {
          game.player2 = currentPlayerName;
        } else {
          return throwError(() => new Error('Cette partie est déjà pleine'));
        }
        return this.http.put<any>(`${BASE_URL}/${gameId}`, game, { headers });
      })
    );
  }

  watchGame(gameId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.post<any>(`${BASE_URL}/${gameId}/spectate`, {}, { headers });
  }

  createGame(gameData: any): Observable<Game> {
      console.log('[GameService] Starting game creation with data:', gameData);
      const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${StorageService.getToken()}`
      });

      return this.http.post<Game>(`${BASE_URL}`, gameData, { headers }).pipe(
          switchMap(response => {
              if (gameData.gameRules) {
                  return this.updateGameRules(response.idG, gameData.gameRules).pipe(
                      tap(updatedGame => console.log('Game created with rules:', updatedGame))
                  );
              }
              return of(response);
          })
      );
  }

  setPlayerReadyStatus(gameId: string, playerType: 'player1' | 'player2', isReady: boolean): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.post<any>(`${BASE_URL}/games/${gameId}/ready-status`,
      { player: playerType, ready: isReady },
      { headers }
    );
  }

  leaveGame(gameId: string | null): Observable<any> {
    if (!gameId) return of(null);
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.post<any>(`${BASE_URL}/games/${gameId}/leave`,
      { player: StorageService.getUser().nickname },
      { headers }
    );
  }

  updateGame(gameId: number, gameData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.put<any>(`${BASE_URL}/${gameId}`, gameData, { headers });
  }

  deleteGame(gameId: string | number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.delete<any>(`${BASE_URL}/${gameId}`, { headers });
  }

  getGame(gameId: string | number): Observable<Game> {
      const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${StorageService.getToken()}`
      });

      return this.http.get<Game>(`${BASE_URL}/${gameId}`, { headers }).pipe(
          map(game => {
              if (!game.gameRules || !game.gameRules.maxRounds) {
                  console.warn('Incomplete game rules detected, fetching rules...');

                  // Faire un appel séparé pour obtenir les règles
                  this.http.get<Game>(`${BASE_URL}/${gameId}/rules`, { headers })
                      .subscribe(rulesResponse => {
                          if (rulesResponse.gameRules) {
                              game.gameRules = rulesResponse.gameRules;
                              console.log('Updated game rules:', game.gameRules);
                          }
                      });
              }
              return game;
          }),
          tap(game => {
              console.log('Complete game data:', {
                  id: game.idG,
                  rules: game.gameRules,
                  players: {
                      player1: game.player1,
                      player2: game.player2
                  }
              });
          })
      );
  }

  getGridById(id: number): Observable<Grid> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<Grid>(`${this.apiUrl}/grids/${id}`, { headers });
  }

  updateGameRules(gameId: string | number, rules: GameRules): Observable<Game> {
      const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${StorageService.getToken()}`
      });

      return this.http.put<Game>(`${BASE_URL}/${gameId}/rules`, rules, { headers });
  }

  updateScore(gameId: number, pointForPlayer1: boolean): Observable<Game> {
      const headers = new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${StorageService.getToken()}`
      });

      return this.http.put<Game>(
          `${this.apiUrl}/games/${gameId}/score`,
          { pointForPlayer1: pointForPlayer1 },
          { headers }
      ).pipe(
          map(response => {
              return {
                  idG: response.idG,
                  winner: null,
                  player1: response.player1,
                  player2: response.player2,
                  score1: response.score1,
                  score2: response.score2,
                  grid: response.grid,
                  gameRules: response.gameRules
              } as Game;
          }),
          tap(game => console.log('Processed game update:', game))
      );
  }

  endGame(gameId: number, winner: string): Observable<Game> {
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${StorageService.getToken()}`
    });

    return this.http.put<Game>(
        `${BASE_URL}/${gameId}/end`,
        { winner },
        { headers }
    );
}

}
