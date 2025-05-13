import { Injectable } from '@angular/core';
import { GameRules } from '../../../modules/player/models/GameRules';

const TOKEN = "token";
const USER = "user";

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  static saveToken(token:string): void {
    window.localStorage.removeItem(TOKEN);
    window.localStorage.setItem(TOKEN, token);
  }

  static saveUser(user:any): void {
    window.localStorage.removeItem(USER);
    window.localStorage.setItem(USER, JSON.stringify(user));

  }

  static saveGameRules(gameId: string | number, rules: GameRules): void {
    window.localStorage.setItem(`game_rules_${gameId}`, JSON.stringify(rules));
  }

  static getToken():string{
    return window.localStorage.getItem(TOKEN);
  }

  static getUser(): any {
    return JSON.parse(localStorage.getItem(USER));
  }

  static isUserLoggedIn(): boolean {
    if(this.getToken() === null)
      return false;
    else
      return true;
  }


  static getUserId(): string {
    const user = this.getUser();
    if (user == null)
      return "";
    return user.id;
  }

  static getGameRules(gameId: string | number): GameRules | null {
    const rulesJson = window.localStorage.getItem(`game_rules_${gameId}`);
    if (!rulesJson) return null;

    try {
      return JSON.parse(rulesJson) as GameRules;
    } catch (error) {
      console.error('Error parsing game rules:', error);
      return null;
    }
  }

  static removeGameRules(gameId: string | number): void {
    window.localStorage.removeItem(`game_rules_${gameId}`);
  }

  static logout(): void {
    window.localStorage.removeItem(TOKEN);
    window.localStorage.removeItem(USER);
  }

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}
