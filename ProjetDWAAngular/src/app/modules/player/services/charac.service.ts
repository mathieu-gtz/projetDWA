import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of } from 'rxjs';
import { StorageService } from '../../../auth/services/storage/storage.service';
import { environment } from '../../../../environments/environment.prod';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CharacService {
  private apiUrl = `${environment.apiUrl}/api/characs`; 

  private imageBaseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    const token = StorageService.getToken();
    console.log('Using token:', token); 
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAllCharacs(): Observable<any[]> {
    console.log('Fetching characters from:', this.apiUrl); 
    return this.http.get<any[]>(this.apiUrl, { 
      headers: this.getHeaders(),
      withCredentials: true 
    }).pipe(
      catchError(error => {
        console.error('Error loading characters:', error);
        return throwError(() => error);
      })
    );
  }

  getCharacById(idC: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${idC}`, { 
      headers: this.getHeaders(),
      withCredentials: true 
    }).pipe(
      catchError(error => {
        console.error(`Error loading character ${idC}:`, error);
        return throwError(() => error);
      })
    );
  }

  createCharac(charac: any, image?: File): Observable<any> {
    const formData = new FormData();
    formData.append('charac', new Blob([JSON.stringify(charac)], {
      type: 'application/json'
    }));

    if (image) {
      formData.append('image', image, image.name);
    }

    return this.http.post<any>(this.apiUrl, formData, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${StorageService.getToken()}`
      }),
      withCredentials: true
    }).pipe(
      catchError(error => {
        console.error('Error creating character:', error);
        return throwError(() => error);
      })
    );
  }

  getCharacImageUrl(characId: number): Observable<string> {
    console.log('Requesting image URL for character:', characId);
    
    return this.http.get(`${this.apiUrl}/${characId}/image-url`, {
      headers: this.getHeaders(),
      responseType: 'text',
      withCredentials: true
    }).pipe(
      map(url => {
        console.log('Received raw URL:', url);
        
        // If it's a path only (starts with /)
        if (url.startsWith('/')) {
          // Directly construct the full URL that we know works
          const fullUrl = `${this.imageBaseUrl}/images/charac${characId}.png`;
          console.log('Direct image URL:', fullUrl);
          return fullUrl;
        }
        
        return url;
      }),
      catchError(error => {
        console.error(`Error loading character image ${characId}:`, error);
        return of(`${this.imageBaseUrl}/images/default.png`);
      })
    );
  }
}