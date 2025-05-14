import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StorageService } from '../../../auth/services/storage/storage.service';
import {PlayerStats} from '../models/PlayerStats';
import {Player} from '../models/Player';
import {PlayerRanking} from '../models/PlayerRanking';
import { environment } from '../../../../environments/environment.prod';

const BASE_URL = `${environment.apiUrl}/api/players/`;

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  constructor(private http: HttpClient, private storageService: StorageService) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`
    });
  }

  getGridsByPlayerNickname(nickname: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any>(`${BASE_URL}grids/${nickname}`, { headers });
  }

  getUserStats(playerNickname: string): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(`${BASE_URL}${playerNickname}/stats`, { headers: this.getHeaders() });
  }

  updateUser(player : Player): Observable<Player> {
    return this.http.put<Player>(`${BASE_URL}${player.nickname}`, player, { headers: this.getHeaders() });
  }

  changePassword(playerNickname: string, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${BASE_URL}${playerNickname}/change-password`, {
      currentPassword,
      newPassword
    }, { headers: this.getHeaders() });
  }

  getPlayerByNickname(nickname: string): Observable<Player> {
    return this.http.get<Player>(`${BASE_URL}${nickname}`, { headers: this.getHeaders() });
  }

  getPlayerRankings() {
    return this.http.get<PlayerRanking[]>(`${BASE_URL}rankings`, { headers: this.getHeaders() });
  }


}
