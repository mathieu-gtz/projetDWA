import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  signup(signupRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/signup`, signupRequest);
  }

  login(loginRequest: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/auth/login`, loginRequest);
  }
}