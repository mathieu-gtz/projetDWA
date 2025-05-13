import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {map, Observable, switchMap} from 'rxjs';
import {StorageService} from '../../../auth/services/storage/storage.service';

const BASE_URL = 'http://localhost:8080/api';

@Injectable({
  providedIn: 'root'
})
export class GridService {
  constructor(private http: HttpClient) {}

  getDefaultGrids(): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}/players/grids/default`, { headers });
  }

  getPlayerGrids(playerNickname : String): Observable<any[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}/players/${playerNickname}/grids`, { headers });
  }

  getGridDetails(gridId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.get<any[]>(`${BASE_URL}/grids/${gridId}`, { headers });
  }

  getAvailableGrids() {
    //ici on veut récupérer les grilles par défaut et celles de l'utilisateur
    return this.getDefaultGrids().pipe(
      switchMap(defaultGrids => {
        return this.getPlayerGrids(StorageService.getUser().nickname).pipe(
          map(playerGrids => [...defaultGrids, ...playerGrids])
        );
      })
    );
  }

  createGrid(gridData: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${StorageService.getToken()}`,
    });
    return this.http.post<any>(`${BASE_URL}/grids`, gridData, { headers });
  }
}
